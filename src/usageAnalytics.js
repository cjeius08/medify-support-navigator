export const USAGE_TOOLS = [
  "Call Notes",
  "Swapped Filter Subscription",
  "Order Codes / Replacement",
  "UPS Claim",
  "Email / General Case Notes"
];

export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
export const HEARTBEAT_MS = 45 * 1000;
export const ACTIVE_NOW_MS = 90 * 1000;

export function isUsageActive({ visible = true, lastInteraction = 0, now = Date.now() } = {}) {
  return visible && now - lastInteraction < IDLE_TIMEOUT_MS;
}

export function usagePeriodKey(session, period) {
  const date = new Date(session.first_opened || session.started_at || session.last_seen);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (period === "Daily") return date.toISOString().slice(0, 10);
  if (period === "Weekly") { const monday = new Date(date); monday.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return monday.toISOString().slice(0, 10); }
  if (period === "Monthly") return `${year}-${String(month).padStart(2, "0")}`;
  return period === "Quarterly" ? `${year} Q${Math.floor((month - 1) / 3) + 1}` : `${year}`;
}

export function summarizeUsage(sessions = [], initials = [], period = "Monthly") {
  const selected = [...new Set(sessions.map((session) => usagePeriodKey(session, period)))].sort().at(-1) || "";
  const inPeriod = selected ? sessions.filter((session) => usagePeriodKey(session, period) === selected) : [];
  const initialList = [...new Set([...initials.map((item) => typeof item === "string" ? item : item.initials), ...inPeriod.map((session) => session.medify_profiles?.initials || session.initials).filter(Boolean)])].filter(Boolean).sort();
  const rows = initialList.map((initial) => {
    const own = inPeriod.filter((session) => (session.medify_profiles?.initials || session.initials) === initial); const toolCounts = Object.fromEntries(USAGE_TOOLS.map((tool) => [tool, 0]));
    own.forEach((session) => Object.entries(session.tool_counts || {}).forEach(([tool, count]) => { if (tool in toolCounts) toolCounts[tool] += Number(count) || 0; }));
    const latest = own.slice().sort((a, b) => new Date(b.last_activity || b.last_seen || 0) - new Date(a.last_activity || a.last_seen || 0))[0]; const mostUsedTool = Object.entries(toolCounts).sort(([, a], [, b]) => b - a)[0];
    return { initial, firstOpened: own.length ? new Date(Math.min(...own.map((session) => new Date(session.first_opened || session.started_at).getTime()))).toISOString() : null, lastActivity: latest?.last_activity || null, lastSeen: latest?.last_seen || null, activeSeconds: own.reduce((sum, session) => sum + (Number(session.active_seconds) || 0), 0), sessions: own.length, toolCounts, mostUsedTool: mostUsedTool?.[1] ? mostUsedTool[0] : "—", lastToolUsed: latest?.last_tool_used || "—" };
  });
  return { selected, sessions: inPeriod, rows };
}

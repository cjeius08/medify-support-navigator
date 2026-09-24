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

function usageDate(value) {
  const source = value instanceof Date || typeof value === "number" || typeof value === "string"
    ? value
    : value?.first_opened || value?.started_at || value?.last_seen;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function usageDayKey(value = new Date()) {
  const date = usageDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function usagePeriodKey(session, period) {
  const date = usageDate(session);
  if (!date) return "";
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (period === "Daily") return usageDayKey(date);
  if (period === "Weekly") {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - ((date.getDay() + 6) % 7));
    return usageDayKey(monday);
  }
  if (period === "Monthly") return `${year}-${String(month).padStart(2, "0")}`;
  return period === "Quarterly" ? `${year} Q${Math.floor((month - 1) / 3) + 1}` : `${year}`;
}

export function summarizeUsage(sessions = [], initials = [], period = "Monthly", now = new Date()) {
  const selected = usagePeriodKey(now, period);
  const inPeriod = selected ? sessions.filter((session) => usagePeriodKey(session, period) === selected) : [];
  const initialList = [...new Set([...initials.map((item) => typeof item === "string" ? item : item.initials), ...inPeriod.map((session) => session.medify_profiles?.initials || session.initials).filter(Boolean)])].filter(Boolean).sort();
  const rows = initialList.map((initial) => {
    const own = inPeriod.filter((session) => (session.medify_profiles?.initials || session.initials) === initial);
    const toolCounts = Object.fromEntries(USAGE_TOOLS.map((tool) => [tool, 0]));
    own.forEach((session) => Object.entries(session.tool_counts || {}).forEach(([tool, count]) => { if (tool in toolCounts) toolCounts[tool] += Number(count) || 0; }));
    const latest = own.slice().sort((a, b) => new Date(b.last_activity || b.last_seen || 0) - new Date(a.last_activity || a.last_seen || 0))[0];
    const mostUsedTool = Object.entries(toolCounts).sort(([, a], [, b]) => b - a)[0];
    const openedTimes = own.map((session) => usageDate(session)?.getTime()).filter(Number.isFinite);
    return {
      initial,
      firstOpened: openedTimes.length ? new Date(Math.min(...openedTimes)).toISOString() : null,
      lastActivity: latest?.last_activity || null,
      lastSeen: latest?.last_seen || null,
      activeSeconds: own.reduce((sum, session) => sum + (Number(session.active_seconds) || 0), 0),
      sessions: own.length,
      toolCounts,
      mostUsedTool: mostUsedTool?.[1] ? mostUsedTool[0] : "—",
      lastToolUsed: latest?.last_tool_used || "—"
    };
  });
  return { selected, sessions: inPeriod, rows };
}

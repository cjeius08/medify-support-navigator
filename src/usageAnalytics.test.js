import { describe, expect, it } from "vitest";
import { IDLE_TIMEOUT_MS, isUsageActive, summarizeUsage, usagePeriodKey } from "./usageAnalytics";

const time = "2026-09-17T02:00:00.000Z";

describe("website usage summaries", () => {
  it("counts visible recent interaction but stops after five idle minutes", () => {
    const now = new Date(time).getTime();
    expect(isUsageActive({ visible: true, lastInteraction: now - IDLE_TIMEOUT_MS + 1, now })).toBe(true);
    expect(isUsageActive({ visible: true, lastInteraction: now - IDLE_TIMEOUT_MS, now })).toBe(false);
    expect(isUsageActive({ visible: false, lastInteraction: now, now })).toBe(false);
  });

  it("keeps users with zero Call Notes and summarizes multiple sessions, tools, and last tool", () => {
    const sessions = [
      { first_opened: "2026-09-17T00:00:00.000Z", last_activity: "2026-09-17T01:00:00.000Z", last_seen: "2026-09-17T01:00:00.000Z", active_seconds: 1800, last_tool_used: "Order Codes / Replacement", tool_counts: { "Order Codes / Replacement": 18 }, medify_profiles: { initials: "CB" } },
      { first_opened: "2026-09-17T01:10:00.000Z", last_activity: "2026-09-17T02:00:00.000Z", last_seen: "2026-09-17T02:00:00.000Z", active_seconds: 1200, last_tool_used: "Email / General Case Notes", tool_counts: { "Order Codes / Replacement": 2, "Email / General Case Notes": 7 }, medify_profiles: { initials: "CB" } }
    ];
    const { rows } = summarizeUsage(sessions, [{ initials: "JA" }, { initials: "CB" }], "Daily");
    const cb = rows.find((row) => row.initial === "CB");
    expect(cb.sessions).toBe(2); expect(cb.activeSeconds).toBe(3000); expect(cb.toolCounts["Call Notes"]).toBe(0); expect(cb.toolCounts["Order Codes / Replacement"]).toBe(20); expect(cb.mostUsedTool).toBe("Order Codes / Replacement"); expect(cb.lastToolUsed).toBe("Email / General Case Notes");
  });

  it("uses the selected session period rather than Call Report data", () => {
    const session = { first_opened: "2026-09-17T00:00:00.000Z" };
    expect(usagePeriodKey(session, "Daily")).toBe("2026-09-17"); expect(usagePeriodKey(session, "Monthly")).toBe("2026-09");
  });
});

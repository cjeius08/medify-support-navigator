import { describe, expect, it } from "vitest";
import { IDLE_TIMEOUT_MS, isUsageActive, summarizeUsage, usageDayKey, usagePeriodKey } from "./usageAnalytics";

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
    const { rows } = summarizeUsage(sessions, [{ initials: "JA" }, { initials: "CB" }], "Daily", new Date(time));
    const cb = rows.find((row) => row.initial === "CB");
    expect(cb.sessions).toBe(2); expect(cb.activeSeconds).toBe(3000); expect(cb.toolCounts["Call Notes"]).toBe(0); expect(cb.toolCounts["Order Codes / Replacement"]).toBe(20); expect(cb.mostUsedTool).toBe("Order Codes / Replacement"); expect(cb.lastToolUsed).toBe("Email / General Case Notes");
  });

  it("groups usage by the browser local calendar date and Monday-based week", () => {
    const originalTz = process.env.TZ;
    process.env.TZ = "Asia/Manila";
    try {
      const afterMidnight = { first_opened: "2026-09-18T16:30:00.000Z" };
      const previousEvening = { first_opened: "2026-09-18T15:30:00.000Z" };
      expect(usageDayKey(afterMidnight)).toBe("2026-09-19");
      expect(usagePeriodKey(afterMidnight, "Daily")).toBe("2026-09-19");
      expect(usagePeriodKey(previousEvening, "Daily")).toBe("2026-09-18");
      expect(usagePeriodKey(afterMidnight, "Weekly")).toBe("2026-09-14");
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });

  it("shows the current selected period instead of silently falling back to the latest historical period", () => {
    const sessions = [{ first_opened: "2026-09-16T01:00:00.000Z", medify_profiles: { initials: "JA" }, active_seconds: 300 }];
    const summary = summarizeUsage(sessions, [{ initials: "JA" }], "Daily", new Date("2026-09-17T02:00:00.000Z"));
    expect(summary.selected).toBe(usagePeriodKey(new Date("2026-09-17T02:00:00.000Z"), "Daily"));
    expect(summary.sessions).toHaveLength(0);
    expect(summary.rows.find((row) => row.initial === "JA").activeSeconds).toBe(0);
  });

  it("uses the selected session period rather than Call Report data", () => {
    const session = { first_opened: "2026-09-17T00:00:00.000Z" };
    expect(usagePeriodKey(session, "Daily")).toBe(usageDayKey(session)); expect(usagePeriodKey(session, "Monthly")).toBe("2026-09");
  });
});

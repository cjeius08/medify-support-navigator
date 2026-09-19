import { describe, expect, it } from "vitest";
import { appendSnippet, buildCallNote, detectCallDriver, followupState, periodKey, replacementCode } from "./workdeskData";

describe("WorkDesk helpers", () => {
  it("creates a copyable replacement code with order number", () => {
    expect(replacementCode("Warranty Replacement", "WR-01", "12345")).toBe("Warranty Replacement | WR-01 | 12345");
    expect(replacementCode("UPS", "UPS | Lost | XXXXXX", "12345")).toBe("UPS | Lost | 12345");
  });

  it("keeps quick inserts and does not overwrite the action", () => {
    expect(appendSnippet("Customer updated.", "Photos requested")).toBe("Customer updated.\nPhotos requested");
  });

  it("detects a driver from the manual call text", () => {
    expect(detectCallDriver({ "Reason for Calling": "Customer wants warranty replacement", "ACTION TAKEN": "Replacement processed" })).toBe("Warranty / Replacement");
  });

  it("identifies follow-ups due today", () => {
    expect(followupState({ followUpNeeded: true, followUpDate: "2026-09-10" }, new Date("2026-09-10T09:00:00"))).toBe("today");
  });

  it("groups call reports by the browser's local calendar date and Monday-based week", () => {
    const originalTz = process.env.TZ;
    process.env.TZ = "Asia/Manila";
    try {
      const afterMidnight = { stop: new Date("2026-09-18T16:30:00.000Z").getTime() };
      const previousEvening = { stop: new Date("2026-09-18T15:30:00.000Z").getTime() };
      expect(periodKey(afterMidnight, "Daily")).toBe("2026-09-19");
      expect(periodKey(previousEvening, "Daily")).toBe("2026-09-18");
      expect(periodKey(afterMidnight, "Weekly")).toBe("2026-09-14");
      expect(periodKey(previousEvening, "Weekly")).toBe("2026-09-14");
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });

  it("always copies call fields in the fixed support-note order", () => {
    const text = buildCallNote({ "ACTION TAKEN": "Updated subscription", "Spoke With": "Shirley", "Agent Initials": "JA" }, "JA");
    expect(text).toBe([
      "Spoke With: Shirley", "Name on the Account: Not provided", "Order Num: Not provided", "Email Address: Not provided",
      "Contact #: Not provided", "Reason for Calling: Not provided", "ACTION TAKEN: Updated subscription",
      "Offered FC/Cross Sell: Not provided", "AC Call ID: Not provided", "JA"
    ].join("\n"));
  });
});

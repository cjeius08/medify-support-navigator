import { describe, expect, it } from "vitest";
import { appendSnippet, buildCallNote, detectCallDriver, followupState, replacementCode } from "./workdeskData";

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

  it("always copies call fields in the fixed support-note order", () => {
    const text = buildCallNote({ "ACTION TAKEN": "Updated subscription", "Spoke With": "Shirley", "Agent Initials": "JA" }, "JA");
    expect(text).toBe([
      "Spoke With: Shirley", "Name on the Account: Not provided", "Order Num: Not provided", "Email Address: Not provided",
      "Contact #: Not provided", "Reason for Calling: Not provided", "ACTION TAKEN: Updated subscription",
      "Offered FC/Cross Sell: Not provided", "AC Call ID: Not provided", "JA"
    ].join("\n"));
  });
});

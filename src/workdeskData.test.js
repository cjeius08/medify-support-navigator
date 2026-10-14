import { describe, expect, it } from "vitest";
import { appendSnippet, buildCallNote, buildFilterNote, buildFraudEmail, detectCallDriver, FILTER_SKUS, FILTER_VARIANT_IDS, followupState, MASTER_SKUS, parseFraudOrderNumbers, periodKey, replacementCode } from "./workdeskData";

describe("WorkDesk helpers", () => {
  it("partially converts two of four MA-50 filters while preserving both variant IDs", () => {
    const note = buildFilterNote({
      reason: "Variant Error",
      selected: { "MA-50R-1": 4 },
      conversions: { "MA-50R-1": { sku: "MA-50R-2", sourceQuantity: 2, quantity: 2 } }
    }, "JA");
    expect(note).toBe([
      "Swapped Filter Subscription",
      "Filter(s):",
      "MA-50R-1 x2 (Unchanged)",
      "MA-50R-2 x2 (Converted)",
      "Reason: Variant Error",
      "Original Variant ID#:",
      "MA-50R-1: 43720696922179",
      "New Variant ID#:",
      "MA-50R-2: 43720696987715",
      "Additional Notes:",
      "Converted MA-50R-1 x2 to MA-50R-2 x2",
      "Remaining MA-50R-1 x2 unchanged",
      "JA"
    ].join("\n"));
  });

  it("handles full conversion without a false remaining count and keeps original variant ID", () => {
    const note = buildFilterNote({
      reason: "Filter Variant Request",
      selected: { "MA-50R-1": 4 },
      conversions: { "MA-50R-1": { sku: "MA-50R-2", sourceQuantity: 4, quantity: 1 } }
    }, "JA");
    expect(note).toContain("Filter(s):\nMA-50R-2 x1 (Converted)\nReason: Filter Variant Request");
    expect(note).toContain("Original Variant ID#:\nMA-50R-1: 43720696922179\nNew Variant ID#:\nMA-50R-2: 43720696987715");
    expect(note).toContain("Converted MA-50R-1 x4 to MA-50R-2 x1");
    expect(note).not.toContain("Remaining MA-50R-1");
  });

  it("keeps unrelated filter SKUs, clamps partial quantities and ignores incomplete conversions", () => {
    const partial = buildFilterNote({
      reason: "Variant Error",
      selected: { "MA-50R-1": 4, "MA-15R-1": 1 },
      conversions: { "MA-50R-1": { sku: "MA-50R-2", sourceQuantity: 99, quantity: 2 } }
    }, "JA");
    expect(partial).toContain("MA-50R-2 x2 (Converted)\nMA-15R-1 x1 (Unchanged)");
    expect(partial).toContain("Converted MA-50R-1 x4 to MA-50R-2 x2");
    expect(partial).not.toContain("Remaining MA-50R-1");
    expect(partial).toContain("MA-15R-1: 43720703475779");

    const incomplete = buildFilterNote({
      reason: "Variant Error",
      selected: { "MA-50R-1": 4 },
      conversions: { "MA-50R-1": { sku: "MA-50", sourceQuantity: 2, quantity: 2 } }
    }, "JA");
    expect(incomplete).toContain("MA-50R-1 x4\nReason: Variant Error\nNew Variant ID#: 43720696922179");
    expect(incomplete).not.toContain("Converted MA-50R-1");
  });

  it("uses MA-SMARTR-1 Variant ID in selected and converted filter notes", () => {
    expect(FILTER_SKUS).toContain("MA-SMARTR-1");
    expect(MASTER_SKUS).toContain("MA-SMARTR-1");
    expect(FILTER_VARIANT_IDS["MA-SMARTR-1"]).toBe("32288811188291");
    expect(buildFilterNote({ reason: "Variant Error", selected: { "MA-SMARTR-1": 1 } }, "JA"))
      .toContain("MA-SMARTR-1 x1\nReason: Variant Error\nNew Variant ID#: 32288811188291");
    expect(buildFilterNote({ reason: "Variant Error", selected: { "MA-15R-1": 1 }, conversions: { "MA-15R-1": { sku: "MA-SMARTR-1", quantity: 1 } } }, "JA"))
      .toContain("MA-SMARTR-1 x1 (Converted)\nReason: Variant Error\nOriginal Variant ID#:\nMA-15R-1: 43720703475779\nNew Variant ID#:\nMA-SMARTR-1: 32288811188291");
  });

  it("maps MA-40E-4 across all SKU pickers and the filter note", () => {
    expect(FILTER_SKUS).toContain("MA-40E-4");
    expect(MASTER_SKUS).toContain("MA-40E-4");
    expect(FILTER_VARIANT_IDS["MA-40E-4"]).toBe("31987508740163");
    expect(buildFilterNote({ reason: "Variant Error", selected: { "MA-40E-4": 1 } }, "JA")).toContain("MA-40E-4 x1\nReason: Variant Error\nNew Variant ID#: 31987508740163");
    expect(buildFilterNote({ reason: "Variant Error", selected: { "MA-40E-1": 1 }, conversions: { "MA-40E-1": { sku: "MA-40E-4", quantity: 1 } } }, "JA")).toContain("MA-40E-4 x1 (Converted)\nReason: Variant Error\nOriginal Variant ID#:\nMA-40E-1: 31576825987139\nNew Variant ID#:\nMA-40E-4: 31987508740163");
  });


  it("generates a first fraud notice with the recipient and single order number", () => {
    const email = buildFraudEmail("initial", "Ronald", "730889");
    expect(email).toContain("Hi Ronald,");
    expect(email).toContain("your recent order #730889 has been flagged");
    expect(email).toContain("cancel it as a precautionary measure");
    expect(email).toContain("info@medifyair.com | 888-258-1008");
    expect(email).not.toContain("#730923");
  });

  it("generates repeat-order follow-up emails and pluralizes multiple order numbers", () => {
    expect(parseFraudOrderNumbers("#730889, 730923; 730923\n730924")).toEqual(["730889", "730923", "730924"]);
    const email = buildFraudEmail("repeat", "Ronald", "#730889, 730923, 730924");
    expect(email).toContain("Your recent orders #730889, #730923, and #730924 were unfortunately identified again");
    expect(email).toContain("these orders were cancelled");
    expect(email).toContain("Amazon or Walmart");
    expect(buildFraudEmail("repeat", "", "")).toContain("Hi [Customer Name],");
    expect(buildFraudEmail("repeat", "", "")).toContain("[Order Number(s)]");
  });

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
      const afterMidnight = { start: new Date("2026-09-18T16:30:00.000Z").getTime() };
      const previousEvening = { start: new Date("2026-09-18T15:30:00.000Z").getTime() };
      expect(periodKey(afterMidnight, "Daily")).toBe("2026-09-19");
      expect(periodKey(previousEvening, "Daily")).toBe("2026-09-18");
      expect(periodKey(afterMidnight, "Weekly")).toBe("2026-09-14");
      expect(periodKey(previousEvening, "Weekly")).toBe("2026-09-14");
    } finally {
      if (originalTz === undefined) delete process.env.TZ;
      else process.env.TZ = originalTz;
    }
  });

  it("keeps a cross-midnight call in the day and week where the call started", () => {
    const originalTz = process.env.TZ;
    process.env.TZ = "Asia/Manila";
    try {
      const report = {
        start: new Date("2026-09-18T15:58:00.000Z").getTime(),
        stop: new Date("2026-09-18T16:04:00.000Z").getTime()
      };
      expect(periodKey(report, "Daily")).toBe("2026-09-18");
      expect(periodKey(report, "Weekly")).toBe("2026-09-14");
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

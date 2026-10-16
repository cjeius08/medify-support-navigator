import { describe, expect, it } from "vitest";
import { appendSnippet, buildCallNote, buildFilterNote, buildFraudEmail, buildSmartCaseNote, buildWarrantyReply, canCopyWarrantyReply, caseQuickOptions, detectCallDriver, FILTER_SKUS, FILTER_VARIANT_IDS, followupState, MASTER_SKUS, parseFraudOrderNumbers, periodKey, replacementCode } from "./workdeskData";

describe("WorkDesk helpers", () => {
  it("keeps the pending warranty reply simple and never claims an unprocessed replacement", () => {
    const reply = buildWarrantyReply({ "Customer Name": "Kim", "Product Model": "MA-35" });
    expect(reply).toContain("Hi Kim,");
    expect(reply).toContain("Thank you so much for your patience while we worked on the issue with your MA-35.");
    expect(reply).toContain("keep you updated on the next steps");
    for (const absent of [
      "troubleshooting steps", "sending us the video", "updated shipping address",
      "I was able to process", "replacement order number", "1–3 business days",
      "today's fulfillment batch", "no need to send", "warranty will be transferred"
    ]) expect(reply.toLowerCase()).not.toContain(absent.toLowerCase());
    expect(reply).toContain("Warm regards,");
    expect(reply).not.toContain("Medify Air Customer Service Team");
    expect(reply).not.toContain("info@medifyair.com");
    expect(caseQuickOptions("Warranty Replacement").actions).toEqual([
      "Video received", "Troubleshooting completed", "Address updated", "Priority fulfillment requested"
    ]);
    expect(canCopyWarrantyReply({})).toBe(false);
    expect(canCopyWarrantyReply({ "Customer Name": "Kim" })).toBe(true);
  });

  it("shows video, troubleshooting and changed address only when confirmed", () => {
    const base = { "Customer Name": "Kim", "Product Model": "MA-35" };
    const video = buildWarrantyReply({ ...base, "Action Taken": "Video received" });
    expect(video).toContain("Thank you for sending us the video.");
    expect(video).not.toContain("complete the troubleshooting");
    const trouble = buildWarrantyReply({ ...base, "Action Taken": "Troubleshooting completed" });
    expect(trouble).toContain("complete the troubleshooting steps");
    expect(trouble).not.toContain("sending us the video");
    const addressUnselected = buildWarrantyReply({ ...base, "Updated Shipping Address": "123 Sample St." });
    expect(addressUnselected).not.toContain("123 Sample St.");
    const pendingAddress = { ...base, "Action Taken": "Address updated" };
    expect(canCopyWarrantyReply(pendingAddress)).toBe(false);
    expect(buildWarrantyReply(pendingAddress)).toContain("[Updated Shipping Address]");
    expect(canCopyWarrantyReply({ ...pendingAddress, "Updated Shipping Address": "123 Sample St." })).toBe(true);
  });

  it("uses requested replacement, delivery, warranty, no-return wording without signature", () => {
    const fields = {
      "Customer Name": "Kim",
      "Product Model": "MA-35",
      "Replacement Order ID": "#811370",
      "Updated Shipping Address": "16350 S Harbor Blvd, Apt 1408\nSanta Ana, CA 92704",
      "Action Taken": "Video received\nTroubleshooting completed\nAddress updated",
      Resolution: "Processed replacement"
    };
    const reply = buildWarrantyReply(fields);
    expect(reply).toContain("Hi Kim,");
    expect(reply).toContain("Thank you so much for your patience");
    expect(reply).toContain("taking the time to complete the troubleshooting steps");
    expect(reply).toContain("Thank you for sending us the video");
    expect(reply).toContain("I was able to process your replacement order, and your new order number is #811370.");
    expect(reply).toContain("16350 S Harbor Blvd, Apt 1408\nSanta Ana, CA 92704");
    expect(reply).toContain("Once your order has been processed, it will be fulfilled and shipped in 1–3 business days and delivered within 3–7 business days after.");
    expect(reply).toContain("An email confirmation will be sent once the order ships and the tracking information is available.");
    expect(reply).toContain("The warranty will be transferred to the replacement unit we're sending you");
    expect(reply).toContain("There's no need to send the defective unit back. You may properly dispose of it as you see fit.");
    expect(reply).not.toContain("today's fulfillment batch");
    expect(reply).not.toContain("Medify Air Customer Service Team");
    expect(reply).not.toContain("info@medifyair.com");
    expect(reply.trimEnd().endsWith("Warm regards,")).toBe(true);
    expect(canCopyWarrantyReply(fields)).toBe(true);
    expect(canCopyWarrantyReply({ ...fields, "Replacement Order ID": "" })).toBe(false);
    expect(canCopyWarrantyReply({ ...fields, "Updated Shipping Address": "" })).toBe(false);

    const priorityReply = buildWarrantyReply({
      ...fields, "Action Taken": fields["Action Taken"] + "\nPriority fulfillment requested"
    });
    expect(priorityReply).toContain("I've also made a special request to include your order in today's fulfillment batch so we can try to get it out sooner than the standard timeframe, if possible.");
    const note = buildSmartCaseNote({ ...fields, caseType: "Warranty Replacement", Issue: "Power Issue" }, "JA");
    expect(note).toContain("Action Taken: Video received\nTroubleshooting completed\nAddress updated");
    expect(note).toContain("Replacement Order ID: #811370");
  });

  it("keeps UPS Lost/Damaged claim actions separate and gates refund versus replacement resolutions", () => {
    const lost = caseQuickOptions("UPS Lost Claim", "Replacement");
    expect(lost.issues).toContain("Lost");
    expect(lost.actions).toContain("Filed UPS Lost Claim");
    expect(lost.actions).not.toContain("Filed UPS Damaged Claim");
    expect(lost.resolutions).toContain("Processed replacement");
    expect(lost.resolutions).not.toContain("Processed refund");
    const damaged = caseQuickOptions("UPS Damaged Claim", "Refund");
    expect(damaged.actions).toContain("Filed UPS Damaged Claim");
    expect(damaged.resolutions).toContain("Processed refund");
    expect(damaged.resolutions).not.toContain("Processed replacement");
    expect(caseQuickOptions("UPS Damaged Claim", "").resolutions).toEqual([]);
    expect(caseQuickOptions("Fraud / High Risk").issues).toEqual(["Flagged for Fraud", "Repeated fraudulent order"]);
  });

  it("builds clear UPS claim notes with independent customer resolution, claim status and existing code", () => {
    const note = buildSmartCaseNote({
      caseType: "UPS Lost Claim", "Order ID": "QA-UPS", "Order Date": "", SKU: "MA-50-W1",
      Issue: "Lost", "Tracking Number": "1ZTEST", "Claim Number": "CLM-22",
      "Claim Status": "Package Search In Progress", "Action Taken": "Filed UPS Lost Claim",
      customerResolution: "Replacement", Resolution: "Processed replacement"
    }, "JA", ["UPS | Lost | XXXXXX", "Tracking Shows No Movement"]);
    expect(note).toBe([
      "Case Type: UPS Lost Claim", "Order ID: QA-UPS", "Order Date: Not provided",
      "SKU: MA-50-W1", "Issue: Lost", "Tracking Number: 1ZTEST", "Claim Number: CLM-22",
      "Claim Status: Package Search In Progress", "Action Taken: Filed UPS Lost Claim",
      "Customer Resolution: Replacement", "Category: UPS",
      "Reason Code: UPS | Lost | QA-UPS", "Description: Tracking Shows No Movement",
      "Resolution: Processed replacement", "JA"
    ].join("\n"));
    const refunded = buildSmartCaseNote({caseType:"UPS Damaged Claim", Issue:"Damaged", customerResolution:"Refund", Resolution:"Processed refund"}, "JA");
    expect(refunded).toContain("Customer Resolution: Refund\nResolution: Processed refund");
    expect(refunded).not.toContain("Reason Code:");
  });

  it("retains special return label tracking and standard case-note details", () => {
    const note = buildSmartCaseNote({
      caseType: "Return / Refund", "Order ID": "123",
      Issue: "Sent RL for return", "Tracking Number": "1Z-RETURN", Resolution: "Processed refund"
    }, "JA");
    expect(note).toContain("Case Type: Return / Refund");
    expect(note).toContain("Tracking Number: 1Z-RETURN");
    expect(note).toContain("Resolution: Processed refund\nJA");
  });

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

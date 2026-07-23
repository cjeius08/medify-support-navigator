import { describe, expect, it } from "vitest";
import { guidedFlows, processPlaybooks, workflows } from "./data";
import { buildWorkflowResponse } from "./responseEngine";

const build = (workflowId, answers, details = {}) => buildWorkflowResponse({
  workflowId,
  flow: guidedFlows[workflowId],
  answers,
  details
});

describe("advanced guided-process structure", () => {
  it("preserves every process while removing the generic intake wording", () => {
    expect(workflows).toHaveLength(30);
    expect(processPlaybooks).toHaveLength(30);

    for (const process of workflows) {
      const current = guidedFlows[process.id];
      expect(current).toBeTruthy();
      expect(current.steps[0].question).not.toMatch(/customer.?s exact situation|present outcome/i);
      expect(current.steps.flatMap((step) => step.choices)).not.toContain("Confirmed");
      expect(current.steps.flatMap((step) => step.choices)).not.toContain("Partially confirmed");
    }
  });

  it("requires exact purifier-model selection before troubleshooting", () => {
    const troubleshooting = guidedFlows["WF-013"];
    expect(troubleshooting.steps[0].id).toBe("model");
    expect(troubleshooting.steps[0].question).toMatch(/exact purifier model or revision/i);
    expect(troubleshooting.steps[0].choices).toContain("MA-25");
    expect(troubleshooting.steps[0].choices).toContain("MA-50 older revision");

    const response = build("WF-013", {
      model: "Model label is not available yet",
      symptom: "No power or unit will not turn on",
      "troubleshooting-result": "Issue persists; short video or other evidence is still required",
      communication: "The troubleshooting case response is waiting for customer information"
    });
    expect(response.readiness).toBe("Awaiting Customer");
    expect(response.missingInformation).toContain("Exact purifier model and revision");
    expect(response.outputs.Email).toContain("model label");
  });

  it("changes evidence requirements with the selected process branch", () => {
    const missingItem = build("WF-004", {
      "missing-state": "One item is missing and no separate shipment is found",
      communication: "The missing item response is waiting for customer information"
    });
    const refund = build("WF-011", {
      "refund-stage": "Refund was requested but is still under review",
      communication: "The refund status response requires authorized review"
    });

    expect(missingItem.evidenceRequired.join(" ")).toMatch(/shipping label|package/i);
    expect(refund.evidenceReceived.join(" ")).toMatch(/processor|authorized/i);
    expect(refund.outputs.Email).toContain("refund was requested");
    expect(refund.outputs.Email).not.toMatch(/refund (?:is|was) completed/i);
  });

  it("blocks a source conflict as Needs Confirmation", () => {
    const response = build("WF-003", {
      "delivery-checks": "Delivery scan, address, photo/location, household, neighbor, and safe-location checks are complete",
      "waiting-rule": "Three-day versus five-day rule is unresolved — Needs Confirmation",
      communication: "The delivered-not-received case response is blocked by a source conflict"
    });

    expect(response.readiness).toBe("Needs Confirmation");
    expect(response.missingInformation.join(" ")).toMatch(/waiting rule|policy decision/i);
    expect(response.outputs.Email).not.toMatch(/claim (?:was|has been) filed/i);
  });

  it("provides decision coaching for every advanced choice", () => {
    for (const process of processPlaybooks) {
      for (const step of process.steps) {
        for (const choice of step.choices) {
          const coach = step.coaching?.[choice];
          if (!coach) continue;
          expect(coach.chooseWhen).toBeTruthy();
          expect(coach.doNotChoose).toBeTruthy();
          expect(coach.evidence).toBeTruthy();
          expect(coach.customerSafe).toBeTruthy();
          expect(coach.neverPromise).toBeTruthy();
          expect(coach.next).toBeTruthy();
        }
      }
    }
  });

  it("writes a natural paperless-manual response", () => {
    const response = build("WF-018", {
      "manual-state": "Exact model confirmed; customer only needs the official manual",
      communication: "The verified manual or setup request facts are ready to send"
    }, { model: "MA-40", customer: "Sherry" });

    expect(response.outputs.Email).toContain("paperless approach");
    expect(response.outputs.Email).toContain("https://medifyair.com/pages/product-manuals");
    expect(response.outputs.Email).not.toMatch(/exact model and manual with|contact us about your manual/i);
    expect(response.outputs["Call Script"]).toMatch(/I can send you the PDF|download it/i);
  });

  it("does not describe a pending cancellation as completed", () => {
    const response = build("WF-007", {
      "cancellation-state": "Cancellation was requested and is still pending",
      communication: "The order cancellation response requires authorized review"
    });

    expect(response.outputs.Email).toContain("still being reviewed");
    expect(response.outputs.Email).toContain("not confirmed as canceled");
    expect(response.outputs.Email).not.toMatch(/cancellation has been completed/i);
  });
});

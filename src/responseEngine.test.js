import { describe, expect, it } from "vitest";
import { guidedFlows, products } from "./data";
import {
  buildFinderResponse,
  buildWorkflowResponse,
  CHOICE_SEMANTICS,
  NOTE_HEADINGS
} from "./responseEngine";

const build = (workflowId, answers, details = {}) => buildWorkflowResponse({
  workflowId,
  flow: guidedFlows[workflowId],
  answers,
  details
});

const warrantyBase = {
  unit: "Exact model and revision confirmed",
  purchase: "Medify direct",
  proof: "Proof of purchase verified",
  registration: "Warranty registration confirmed",
  diagnosis: "Issue persists and evidence is complete",
  eligibility: "Awaiting L2 / policy owner",
  outcome: "Still awaiting approval / customer evidence"
};

const damagedBase = {
  "shipment-state": "Arrived damaged",
  evidence: "Complete",
  "claim-gate": "Not yet eligible / waiting",
  remedy: "No remedy authorized yet"
};

const returnBase = {
  "return-intake": "Medify direct",
  condition: "Unused / complete packaging",
  eligibility: "Eligible — label not created",
  "return-state": "Inspection / authorization pending",
  "refund-state": "Not yet authorized"
};

describe("pinned workflow semantic coverage", () => {
  for (const workflowId of ["WF-012", "WF-005", "WF-009"]) {
    it(`${workflowId} explicitly maps every available choice`, () => {
      for (const step of guidedFlows[workflowId].steps) {
        for (const choice of step.choices) {
          expect(CHOICE_SEMANTICS[workflowId]?.[step.id]?.[choice]).toBeTruthy();
        }
      }
    });
  }
});

describe("warranty response composer", () => {
  it("requests missing evidence without claiming a replacement", () => {
    const response = build("WF-012", {
      ...warrantyBase,
      diagnosis: "Issue persists but evidence is missing"
    }, { model: "MA-40 standard non-UV", order: "1234" });

    expect(response.readiness).toBe("Awaiting Customer");
    expect(response.outputs.Email).toContain("5–8 second video");
    expect(response.outputs.Email).not.toContain("replacement has been created");
    expect(response.outputs.Email).not.toContain("replacement has shipped");
  });

  it("separates replacement approval from creation and shipment", () => {
    const response = build("WF-012", {
      ...warrantyBase,
      eligibility: "Eligible decision documented",
      outcome: "Replacement approved — creation still pending"
    }, { model: "MA-40 standard non-UV", order: "1234" });

    expect(response.outputs.Email).toContain("replacement has been approved");
    expect(response.outputs.Email).toContain("has not been created");
    expect(response.outputs.Email).not.toContain("has shipped");
  });

  it("requires a reference before a created replacement is ready", () => {
    const response = build("WF-012", {
      ...warrantyBase,
      eligibility: "Eligible decision documented",
      outcome: "Replacement created and reference confirmed"
    }, { model: "MA-40 standard non-UV", order: "1234" });

    expect(response.readiness).toBe("Draft — Review Required");
    expect(response.missingInformation).toContain("Replacement reference");
    expect(response.outputs.Email).toContain("[replacement reference]");
    expect(response.outputs.Email).not.toContain("has shipped");
  });
});

describe("damaged shipment response composer", () => {
  it("requests the full damage evidence set without claiming a filed claim", () => {
    const response = build("WF-005", {
      ...damagedBase,
      evidence: "Partially complete"
    }, { order: "5678" });

    expect(response.outputs.Email).toContain("shipping label");
    expect(response.outputs.Email).toContain("packaging materials");
    expect(response.outputs.Email).not.toContain("claim has been submitted");
    expect(response.outputs.Email).not.toContain("claim was filed");
  });

  it("describes a submitted claim as pending and does not promise a remedy", () => {
    const response = build("WF-005", {
      ...damagedBase,
      "claim-gate": "Claim submitted — decision pending"
    }, { order: "5678", reference: "UPS-CASE-1" });

    expect(response.outputs.Email).toContain("claim has been submitted");
    expect(response.outputs.Email).toContain("decision is still pending");
    expect(response.outputs.Email).toContain("replacement or refund is not yet confirmed");
  });
});

describe("return response composer", () => {
  it("does not turn a return label into a completed return or refund", () => {
    const response = build("WF-009", {
      ...returnBase,
      eligibility: "Label created",
      "return-state": "Label created — no carrier movement"
    }, { order: "9012", reference: "1ZRETURN" });

    expect(response.outputs.Email).toContain("return label has been created");
    expect(response.outputs.Email).toContain("return and refund are not complete");
  });

  it("does not describe a requested refund as completed", () => {
    const response = build("WF-009", {
      ...returnBase,
      "refund-state": "Refund requested"
    }, { order: "9012" });

    expect(response.outputs.Email).toContain("refund has been requested");
    expect(response.outputs.Email).toContain("has not been authorized or completed");
    expect(response.outputs.Email).not.toContain("refund was completed by the processor");
  });

  it("keeps owner and checkpoint out of customer channels", () => {
    const response = build("WF-009", returnBase, {
      order: "9012",
      owner: "L2 Warranty Team",
      checkpoint: "Friday at 3 PM"
    });

    for (const channel of ["Email", "Chat", "Call Script"]) {
      expect(response.outputs[channel]).not.toContain("L2 Warranty Team");
      expect(response.outputs[channel]).not.toContain("Friday at 3 PM");
      expect(response.outputs[channel]).not.toMatch(/owner|checkpoint/i);
    }
    expect(response.outputs["Internal Notes"]).toContain("Owner: L2 Warranty Team");
  });

  it("uses the exact internal note headings", () => {
    const response = build("WF-009", returnBase);
    const headings = response.outputs["Internal Notes"]
      .split("\n")
      .map((line) => line.split(":")[0]);
    expect(headings).toEqual(NOTE_HEADINGS);
  });
});

describe("purifier recommendation composer", () => {
  it("creates a concise response with model and room size but no specification dump", () => {
    const product = products.find((item) => item.id === "ma-25");
    const response = buildFinderResponse({
      result: {
        squareFeet: 400,
        effective: 400,
        connectedRooms: 1,
        concern: "Pets"
      },
      product,
      openPlan: false,
      customer: "Chris"
    });

    const email = response.outputs.Email;
    const wordCount = email.split(/\s+/).filter(Boolean).length;
    expect(email).toContain("400 sq ft");
    expect(email).toContain("MA-25");
    expect(email).not.toContain("Subject:");
    expect(email).not.toContain("Key specifications:");
    expect(wordCount).toBeGreaterThanOrEqual(90);
    expect(wordCount).toBeLessThanOrEqual(160);
    expect(response.outputs.Chat.split(/[.!?]+/).filter((item) => item.trim())).toHaveLength(4);
  });
});

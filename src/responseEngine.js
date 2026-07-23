export const OUTPUT_CHANNELS = ["Email", "Chat", "Call Script", "Internal Notes"];

export const NOTE_HEADINGS = [
  "Spoke With",
  "Name on the Account",
  "Order Num",
  "Email Address",
  "Contact #",
  "Reason for Calling",
  "ACTION TAKEN",
  "Offered FC/Cross Sell",
  "AC Call ID",
  "JA"
];

const semantic = ({
  status,
  fact,
  missing,
  completed,
  pending,
  customerAction,
  internal,
  required = []
}) => ({
  status,
  fact,
  missing,
  completed,
  pending,
  customerAction,
  internal,
  required
});

export const CHOICE_SEMANTICS = {
  "WF-012": {
    unit: {
      "Exact model and revision confirmed": semantic({
        status: "verified_fact",
        fact: "The exact model and revision were confirmed.",
        internal: "Exact model and revision confirmed",
        required: [{ field: "model", label: "Exact model and revision", kind: "customer" }]
      }),
      "Model known, revision unclear": semantic({
        status: "awaiting_customer",
        missing: "Exact product revision or variant",
        pending: "Exact product revision must be confirmed before model-specific guidance.",
        customerAction: "Please send a clear photo of the complete model label.",
        internal: "Model family known; exact revision remains unconfirmed"
      }),
      "Customer cannot access the label": semantic({
        status: "awaiting_customer",
        missing: "Model-label photo or complete label wording",
        pending: "Unit identity is blocked until the complete label can be reviewed.",
        customerAction: "Please send a clear photo of the model label when it is safe and accessible.",
        internal: "Customer cannot currently access the model label"
      })
    },
    purchase: {
      "Medify direct": semantic({
        status: "verified_fact",
        fact: "The purchase source was confirmed as Medify Air.",
        internal: "Purchase source confirmed: Medify Air direct",
        required: [{ field: "order", label: "Order number or purchase record", kind: "customer" }]
      }),
      Amazon: semantic({
        status: "verified_fact",
        fact: "The purchase source was confirmed as Amazon.",
        internal: "Purchase source confirmed: Amazon",
        required: [{ field: "order", label: "Amazon order number or invoice", kind: "customer" }]
      }),
      "Authorized reseller / other": semantic({
        status: "verified_fact",
        fact: "The purchase source was confirmed as an authorized reseller or another seller.",
        internal: "Purchase source confirmed: authorized reseller / other",
        required: [{ field: "order", label: "Invoice or proof of purchase", kind: "customer" }]
      }),
      "Purchase source not yet verified": semantic({
        status: "awaiting_customer",
        missing: "Purchase source and purchase record",
        pending: "Purchase ownership and the applicable support path are not yet verified.",
        customerAction: "Please confirm where and when the unit was purchased and send the order confirmation or invoice.",
        internal: "Purchase source not verified"
      })
    },
    proof: {
      "Proof of purchase verified": semantic({
        status: "verified_fact",
        fact: "Proof of purchase was verified.",
        internal: "Proof of purchase verified"
      }),
      "Proof of purchase requested — awaiting customer": semantic({
        status: "awaiting_customer",
        missing: "Proof of purchase",
        pending: "Proof of purchase is still needed for the warranty assessment.",
        customerAction: "Please reply with the order confirmation, receipt, or invoice.",
        internal: "Proof of purchase requested; awaiting customer"
      }),
      "Proof of purchase unavailable — review required": semantic({
        status: "blocked",
        missing: "Acceptable proof of purchase or an approved exception",
        pending: "The case requires review because proof of purchase is unavailable.",
        internal: "Proof of purchase unavailable; exception review required"
      })
    },
    registration: {
      "Warranty registration confirmed": semantic({
        status: "verified_fact",
        fact: "Warranty registration was confirmed.",
        internal: "Warranty registration confirmed"
      }),
      "Registration not confirmed — verification pending": semantic({
        status: "awaiting_internal_review",
        pending: "Warranty registration still needs to be verified.",
        internal: "Warranty registration verification pending"
      }),
      "Registration not found — eligibility review required": semantic({
        status: "blocked",
        missing: "A current registration decision or approved eligibility exception",
        pending: "Eligibility review is required because registration was not found.",
        internal: "Registration not found; eligibility decision required"
      })
    },
    diagnosis: {
      "Issue resolved during troubleshooting": semantic({
        status: "resolved",
        fact: "The issue was resolved during troubleshooting.",
        completed: "Model-appropriate troubleshooting resolved the reported issue.",
        internal: "Issue resolved during troubleshooting"
      }),
      "Issue persists and evidence is complete": semantic({
        status: "awaiting_internal_review",
        fact: "The issue still occurs and the requested evidence is complete.",
        pending: "The completed evidence packet is ready for warranty review.",
        internal: "Issue persists; troubleshooting and evidence packet complete"
      }),
      "Issue persists but evidence is missing": semantic({
        status: "awaiting_customer",
        missing: "A clear 5–8 second video showing the issue",
        pending: "The issue remains unresolved, but the evidence packet is incomplete.",
        customerAction: "Please send a clear 5–8 second video showing the issue.",
        internal: "Issue persists; required video evidence missing"
      }),
      "Potential safety issue": semantic({
        status: "escalated",
        fact: "A potential safety concern was identified.",
        completed: "Customer was directed to stop using the unit pending safety review.",
        pending: "Safety escalation and current-policy review are required.",
        customerAction: "Please stop using and unplug the unit if it is safe to do so. Do not perform additional troubleshooting.",
        internal: "Potential safety issue; stop-use guidance and escalation required"
      })
    },
    eligibility: {
      "Eligible decision documented": semantic({
        status: "approved_not_completed",
        fact: "Warranty eligibility was documented.",
        pending: "The authorized resolution still needs to be confirmed or completed.",
        internal: "Eligibility decision documented: eligible"
      }),
      "Not eligible decision documented": semantic({
        status: "declined",
        fact: "A not-eligible decision was documented.",
        completed: "Eligibility review was completed with a not-eligible decision.",
        internal: "Eligibility decision documented: not eligible",
        required: [{ field: "caseDetail", label: "Approved customer-facing explanation", kind: "internal" }]
      }),
      "Awaiting L2 / policy owner": semantic({
        status: "awaiting_internal_review",
        pending: "The warranty decision is awaiting an authorized internal review.",
        internal: "Warranty decision awaiting L2 / policy owner"
      }),
      "Current rule conflicts with source material": semantic({
        status: "blocked",
        missing: "A dated policy-owner decision",
        pending: "The case is blocked by conflicting source material.",
        internal: "Policy conflict preserved; dated owner decision required"
      })
    },
    outcome: {
      "Troubleshooting resolved the issue": semantic({
        status: "resolved",
        completed: "Troubleshooting resolved the reported issue.",
        internal: "Final outcome: troubleshooting resolved issue"
      }),
      "Replacement approved — creation still pending": semantic({
        status: "approved_not_completed",
        completed: "A replacement was approved.",
        pending: "The replacement still needs to be created.",
        internal: "Replacement approved; creation pending"
      }),
      "Replacement created and reference confirmed": semantic({
        status: "completed",
        completed: "The replacement was created.",
        pending: "Shipment and tracking are not confirmed yet.",
        internal: "Replacement created; shipment not confirmed",
        required: [{ field: "reference", label: "Replacement reference", kind: "internal" }]
      }),
      "Replacement shipped — tracking confirmed": semantic({
        status: "completed",
        completed: "The replacement shipment and tracking were confirmed.",
        internal: "Replacement shipped; tracking confirmed",
        required: [{ field: "reference", label: "Confirmed tracking or replacement reference", kind: "internal" }]
      }),
      "Not eligible — approved explanation ready": semantic({
        status: "declined",
        completed: "The warranty review was completed with an approved not-eligible explanation.",
        internal: "Final outcome: not eligible; approved explanation available",
        required: [{ field: "caseDetail", label: "Approved customer-facing explanation", kind: "internal" }]
      }),
      "Still awaiting approval / customer evidence": semantic({
        status: "awaiting_internal_review",
        pending: "A final warranty outcome has not been confirmed.",
        internal: "Final outcome pending approval or customer evidence"
      }),
      "Safety escalation documented": semantic({
        status: "escalated",
        completed: "The safety concern was documented and escalated.",
        pending: "An authorized safety decision is still required.",
        internal: "Safety escalation documented; authorized decision pending"
      })
    }
  },
  "WF-005": {
    "shipment-state": {
      "In transit with current movement": semantic({
        status: "verified_fact",
        fact: "The shipment is in transit with current carrier movement.",
        internal: "Shipment state confirmed: in transit with movement"
      }),
      "Stuck / delayed / carrier exception": semantic({
        status: "awaiting_internal_review",
        fact: "The latest carrier record shows a delay or exception.",
        pending: "The carrier status requires review before a remedy can be promised.",
        internal: "Shipment delayed / stuck / carrier exception"
      }),
      "Marked delivered but not received": semantic({
        status: "awaiting_internal_review",
        fact: "The carrier record shows delivered, but the customer reports the package was not received.",
        pending: "Delivery-location checks and the current carrier waiting rule must be completed.",
        internal: "Delivered-not-received report"
      }),
      "Arrived damaged": semantic({
        status: "verified_fact",
        fact: "The shipment arrived damaged.",
        internal: "Shipment state confirmed: arrived damaged"
      }),
      "Missing item / partial shipment": semantic({
        status: "awaiting_internal_review",
        fact: "The customer reports a missing item or partial shipment.",
        pending: "All package and tracking records must be checked before a claim decision.",
        internal: "Missing item / partial shipment reported"
      })
    },
    evidence: {
      Complete: semantic({
        status: "verified_fact",
        fact: "The required evidence packet is complete.",
        completed: "The relevant shipment evidence was collected.",
        internal: "Shipment evidence packet complete"
      }),
      "Partially complete": semantic({
        status: "awaiting_customer",
        missing: "The remaining required shipment photos or delivery evidence",
        pending: "The evidence packet is only partially complete.",
        customerAction: "Please send the remaining required photos or delivery details.",
        internal: "Shipment evidence packet partially complete"
      }),
      "Awaiting customer": semantic({
        status: "awaiting_customer",
        missing: "Required shipment evidence",
        pending: "The shipment review is waiting for customer evidence.",
        customerAction: "Please send the requested shipment evidence.",
        internal: "Awaiting customer shipment evidence"
      }),
      "Evidence unavailable — escalation needed": semantic({
        status: "escalated",
        missing: "An approved evidence exception or escalation decision",
        pending: "The case requires escalation because the standard evidence is unavailable.",
        internal: "Shipment evidence unavailable; escalation needed"
      })
    },
    "claim-gate": {
      "Not yet eligible / waiting": semantic({
        status: "awaiting_internal_review",
        pending: "The case is not yet eligible for claim submission under the confirmed state.",
        internal: "Claim not yet eligible / waiting"
      }),
      "Eligible and ready to submit": semantic({
        status: "verified_fact",
        fact: "The case is eligible and ready for claim submission.",
        pending: "The claim has not been submitted yet.",
        internal: "Claim eligible and ready to submit"
      }),
      "Claim submitted — decision pending": semantic({
        status: "completed",
        completed: "The claim was submitted for review.",
        pending: "The carrier or operations decision is still pending.",
        internal: "Claim submitted; decision pending",
        required: [{ field: "reference", label: "Claim reference", kind: "internal" }]
      }),
      "Claim approved": semantic({
        status: "approved_not_completed",
        completed: "The claim was approved.",
        pending: "The authorized remedy still needs to be confirmed or completed.",
        internal: "Claim approved; remedy state pending"
      }),
      "Claim declined / exception": semantic({
        status: "declined",
        completed: "The claim decision was recorded as declined or exception-based.",
        internal: "Claim declined / exception",
        required: [{ field: "caseDetail", label: "Approved explanation or exception detail", kind: "internal" }]
      })
    },
    remedy: {
      "No remedy authorized yet": semantic({
        status: "awaiting_internal_review",
        pending: "No replacement, refund, or other remedy has been authorized.",
        internal: "No remedy authorized"
      }),
      "Replacement approved — not created": semantic({
        status: "approved_not_completed",
        completed: "A replacement was approved.",
        pending: "The replacement still needs to be created.",
        internal: "Replacement approved; not created"
      }),
      "Replacement created": semantic({
        status: "completed",
        completed: "The replacement was created.",
        pending: "Shipment and tracking are not confirmed yet.",
        internal: "Replacement created; shipment not confirmed",
        required: [{ field: "reference", label: "Replacement reference", kind: "internal" }]
      }),
      "Refund authorized — processing": semantic({
        status: "approved_not_completed",
        completed: "The refund was authorized.",
        pending: "The refund is still processing and is not complete.",
        internal: "Refund authorized; processor pending"
      }),
      "Other approved resolution": semantic({
        status: "completed",
        completed: "Another authorized resolution was completed or documented.",
        internal: "Other approved resolution",
        required: [{ field: "caseDetail", label: "Approved resolution detail", kind: "internal" }]
      })
    }
  },
  "WF-009": {
    "return-intake": {
      "Medify direct": semantic({
        status: "verified_fact",
        fact: "The purchase was confirmed as Medify Air direct.",
        internal: "Return purchase source: Medify Air direct",
        required: [{ field: "order", label: "Order number", kind: "customer" }]
      }),
      Amazon: semantic({
        status: "verified_fact",
        fact: "The purchase was confirmed as Amazon.",
        internal: "Return purchase source: Amazon",
        required: [{ field: "order", label: "Amazon order number or invoice", kind: "customer" }]
      }),
      "Authorized reseller / other": semantic({
        status: "verified_fact",
        fact: "The purchase was confirmed as an authorized reseller or another seller.",
        internal: "Return purchase source: authorized reseller / other",
        required: [{ field: "order", label: "Seller invoice or order record", kind: "customer" }]
      }),
      "Purchase source unclear": semantic({
        status: "awaiting_customer",
        missing: "Purchase source and order record",
        pending: "The transaction owner and return path are not yet confirmed.",
        customerAction: "Please confirm where the item was purchased and provide the order number or invoice.",
        internal: "Return purchase source unclear"
      })
    },
    condition: {
      "Unused / complete packaging": semantic({
        status: "verified_fact",
        fact: "The item is unused and the original packaging is complete.",
        internal: "Item condition: unused / complete packaging"
      }),
      "Used but complete": semantic({
        status: "awaiting_internal_review",
        fact: "The item was used and the packaging is reported complete.",
        pending: "Current return eligibility must be confirmed for the verified condition.",
        internal: "Item condition: used but complete"
      }),
      "Damaged or defective": semantic({
        status: "blocked",
        fact: "The item is reported damaged or defective.",
        pending: "The case must be routed to the appropriate damage or warranty process.",
        internal: "Damaged / defective item identified during return intake"
      }),
      "Filter seal or packaging state unclear": semantic({
        status: "awaiting_customer",
        missing: "Photos confirming the product, packaging, and filter-seal condition",
        pending: "Condition eligibility cannot be confirmed from the current information.",
        customerAction: "Please send clear photos of the item, original packaging, filter or seal state, and shipping label.",
        internal: "Filter-seal or packaging state unclear"
      })
    },
    eligibility: {
      "Eligible — label not created": semantic({
        status: "approved_not_completed",
        fact: "The return was confirmed eligible.",
        pending: "The return label has not been created yet.",
        internal: "Return eligible; label not created"
      }),
      "Label created": semantic({
        status: "completed",
        completed: "The return label was created.",
        pending: "Carrier movement, warehouse receipt, and refund completion are not confirmed.",
        internal: "Return label created",
        required: [{ field: "reference", label: "Return label or tracking reference", kind: "internal" }]
      }),
      "Outside standard window — approval pending": semantic({
        status: "awaiting_internal_review",
        pending: "An exception decision is pending because the request is outside the standard window.",
        internal: "Outside standard return window; exception approval pending"
      }),
      "Not eligible — approved explanation available": semantic({
        status: "declined",
        completed: "The return eligibility review was completed with a not-eligible decision.",
        internal: "Return not eligible; approved explanation available",
        required: [{ field: "caseDetail", label: "Approved customer-facing explanation", kind: "internal" }]
      }),
      "Needs Confirmation": semantic({
        status: "blocked",
        missing: "A current eligibility decision",
        pending: "Return eligibility is not yet confirmed.",
        internal: "Return eligibility needs confirmation"
      })
    },
    "return-state": {
      "Label created — no carrier movement": semantic({
        status: "completed",
        fact: "The return label was created, but no carrier movement is confirmed.",
        pending: "The package must receive a carrier scan before it can be tracked in transit.",
        internal: "Return label created; no carrier movement",
        required: [{ field: "reference", label: "Return tracking reference", kind: "internal" }]
      }),
      "In carrier movement": semantic({
        status: "completed",
        fact: "The return is moving through the carrier network.",
        pending: "Warehouse receipt and refund authorization are not confirmed.",
        internal: "Return in carrier movement",
        required: [{ field: "reference", label: "Return tracking reference", kind: "internal" }]
      }),
      "Warehouse received": semantic({
        status: "completed",
        fact: "Warehouse receipt of the return was confirmed.",
        pending: "Inspection, authorization, or refund completion may still be pending.",
        internal: "Return received by warehouse",
        required: [{ field: "reference", label: "Return or warehouse reference", kind: "internal" }]
      }),
      "Inspection / authorization pending": semantic({
        status: "awaiting_internal_review",
        fact: "The return is pending inspection or authorization.",
        pending: "The refund cannot be described as complete until the responsible system confirms it.",
        internal: "Return inspection / authorization pending"
      }),
      "Return exception": semantic({
        status: "escalated",
        pending: "A return exception requires an authorized decision.",
        internal: "Return exception escalated",
        required: [{ field: "caseDetail", label: "Return exception detail", kind: "internal" }]
      })
    },
    "refund-state": {
      "Not yet authorized": semantic({
        status: "awaiting_internal_review",
        pending: "The refund has not been authorized.",
        internal: "Refund not yet authorized"
      }),
      "Refund requested": semantic({
        status: "awaiting_internal_review",
        completed: "A refund was requested.",
        pending: "The refund is not authorized or completed yet.",
        internal: "Refund requested; not completed"
      }),
      "Refund authorized / processor pending": semantic({
        status: "approved_not_completed",
        completed: "The refund was authorized.",
        pending: "Processor completion is still pending.",
        internal: "Refund authorized; processor pending"
      }),
      "Refund completed by processor": semantic({
        status: "completed",
        completed: "The refund was completed by the processor.",
        pending: "The customer’s financial institution may still need to post the credit.",
        internal: "Refund completed by processor",
        required: [{ field: "reference", label: "Refund reference", kind: "internal" }]
      }),
      "Refund failed / requires escalation": semantic({
        status: "escalated",
        pending: "The failed refund requires escalation.",
        internal: "Refund failed; escalation required",
        required: [{ field: "caseDetail", label: "Failure or escalation detail", kind: "internal" }]
      })
    }
  }
};

const GENERAL_SEMANTICS = {
  Confirmed: semantic({
    status: "verified_fact",
    fact: "The customer’s request was confirmed.",
    internal: "Exact customer request confirmed"
  }),
  "Partially confirmed": semantic({
    status: "awaiting_customer",
    missing: "Remaining details needed to identify the exact request",
    pending: "The request is only partially confirmed.",
    customerAction: "Please provide the remaining details requested during the process.",
    internal: "Customer request partially confirmed"
  }),
  "Missing essential information": semantic({
    status: "awaiting_customer",
    missing: "Essential case information",
    pending: "The process cannot continue until the required information is received.",
    customerAction: "Please reply with the missing information requested during the process.",
    internal: "Essential information missing"
  }),
  "Different process is needed": semantic({
    status: "blocked",
    pending: "The case must be moved to the correct support process.",
    internal: "Different process required"
  }),
  "Required information verified": semantic({
    status: "verified_fact",
    fact: "The required information was verified.",
    internal: "Required information verified"
  }),
  "Awaiting customer evidence": semantic({
    status: "awaiting_customer",
    missing: "Requested customer evidence",
    pending: "The process is waiting for customer evidence.",
    customerAction: "Please send the requested evidence so the review can continue.",
    internal: "Awaiting customer evidence"
  }),
  "Live-system check required": semantic({
    status: "awaiting_internal_review",
    pending: "The responsible live system still needs to be checked.",
    internal: "Live-system verification required"
  }),
  "Policy conflict — Needs Confirmation": semantic({
    status: "blocked",
    missing: "A current approved policy decision",
    pending: "The process is blocked by a policy conflict.",
    internal: "Policy conflict; needs confirmation"
  }),
  "Information requested": semantic({
    status: "awaiting_customer",
    pending: "Requested information has not yet been received.",
    customerAction: "Please send the information requested so we can continue.",
    internal: "Information requested; awaiting response"
  }),
  "Action requested — pending": semantic({
    status: "awaiting_internal_review",
    pending: "The requested action is still pending.",
    internal: "Action requested; pending"
  }),
  "Approval granted — action not completed": semantic({
    status: "approved_not_completed",
    completed: "Approval was granted.",
    pending: "The approved action has not been completed.",
    internal: "Approval granted; action not completed"
  }),
  "Action completed and reference confirmed": semantic({
    status: "completed",
    completed: "The confirmed action was completed.",
    internal: "Action completed; reference confirmed",
    required: [{ field: "reference", label: "Completed-action reference", kind: "internal" }]
  }),
  Escalated: semantic({
    status: "escalated",
    completed: "The case was escalated.",
    pending: "An authorized decision or follow-up is pending.",
    internal: "Case escalated"
  }),
  "Resolved without further action": semantic({
    status: "resolved",
    completed: "The issue was resolved without further action.",
    internal: "Resolved without further action"
  }),
  "Ready to Send": semantic({
    status: "verified_fact",
    internal: "Communication state: ready to send"
  }),
  "Draft — Review Required": semantic({
    status: "blocked",
    pending: "The response requires review before it is sent.",
    internal: "Communication state: draft / review required"
  }),
  "Awaiting Customer": semantic({
    status: "awaiting_customer",
    pending: "The case is awaiting information or evidence from the customer.",
    internal: "Communication state: awaiting customer"
  }),
  "Awaiting Approval": semantic({
    status: "awaiting_internal_review",
    pending: "The case is awaiting an authorized approval.",
    internal: "Communication state: awaiting approval"
  }),
  "Needs Confirmation": semantic({
    status: "blocked",
    pending: "A current decision or source still needs confirmation.",
    internal: "Communication state: needs confirmation"
  }),
  Completed: semantic({
    status: "completed",
    completed: "The confirmed process action was completed.",
    internal: "Communication state: completed"
  })
};

const clean = (value) => String(value || "").trim();
const unique = (items) => [...new Set(items.filter(Boolean))];
const customerName = (details) => clean(details.customer) || "[Customer Name]";
const fieldOr = (value, placeholder) => clean(value) || `[${placeholder}]`;

export function getChoiceSemantic(workflowId, stepId, answer) {
  return CHOICE_SEMANTICS[workflowId]?.[stepId]?.[answer] || GENERAL_SEMANTICS[answer] || semantic({
    status: "blocked",
    pending: "This selection does not yet have an approved response rule.",
    internal: `Unmapped response selection: ${stepId}`,
    missing: "An approved response rule"
  });
}

function analyzeWorkflow({ workflowId, flow, answers, details }) {
  const selections = flow.steps.map((step) => {
    const answer = answers[step.id];
    return {
      step,
      answer,
      semantic: getChoiceSemantic(workflowId, step.id, answer)
    };
  });
  const required = selections.flatMap((selection) => selection.semantic.required || []);
  const missingFields = required
    .filter((requirement) => !clean(details[requirement.field]))
    .map((requirement) => ({ ...requirement }));
  return {
    selections,
    statuses: selections.map((selection) => selection.semantic.status),
    confirmedFacts: unique(selections.map((selection) => selection.semantic.fact)),
    missingInformation: unique([
      ...selections.map((selection) => selection.semantic.missing),
      ...missingFields.map((item) => item.label)
    ]),
    completedActions: unique(selections.map((selection) => selection.semantic.completed)),
    pendingActions: unique(selections.map((selection) => selection.semantic.pending)),
    customerActions: unique(selections.map((selection) => selection.semantic.customerAction)),
    internalFacts: unique(selections.map((selection) => selection.semantic.internal)),
    missingFields
  };
}

function determineReadiness(analysis) {
  const { statuses, missingInformation, pendingActions, missingFields } = analysis;
  if (statuses.includes("escalated")) return "Escalated";
  if (statuses.includes("blocked")) return "Draft — Review Required";
  if (statuses.includes("awaiting_customer") || missingFields.some((item) => item.kind === "customer")) return "Awaiting Customer";
  if (statuses.includes("approved_not_completed") || missingFields.some((item) => item.kind === "internal")) return "Draft — Review Required";
  if (statuses.includes("awaiting_internal_review")) return "Awaiting Approval";
  if (statuses.includes("resolved") && !pendingActions.length && !missingInformation.length) return "Completed";
  if (statuses.includes("completed") && !pendingActions.length && !missingInformation.length) return "Completed";
  if (missingInformation.length) return "Draft — Missing Information";
  return "Ready to Send";
}

function makeInternalNotes({ details, reason, analysis }) {
  const completed = analysis.completedActions.length
    ? `Completed: ${analysis.completedActions.join(" ")}`
    : "Completed: No operational action confirmed.";
  const pending = analysis.pendingActions.length
    ? `Pending: ${analysis.pendingActions.join(" ")}`
    : "Pending: No workflow action pending.";
  const owner = clean(details.owner) ? ` Owner: ${details.owner}.` : "";
  const checkpoint = clean(details.checkpoint) ? ` Next checkpoint: ${details.checkpoint}.` : "";
  const reference = clean(details.reference) ? ` Reference: ${details.reference}.` : "";
  return [
    `Spoke With: ${clean(details.spokeWith) || "Not provided"}`,
    `Name on the Account: ${clean(details.customer) || "Not provided"}`,
    `Order Num: ${clean(details.order) || "Not provided"}`,
    `Email Address: ${clean(details.email) || "Not provided"}`,
    `Contact #: ${clean(details.contact) || "Not provided"}`,
    `Reason for Calling: ${reason}`,
    `ACTION TAKEN: ${analysis.internalFacts.join(". ") || "No verified case action recorded."}. ${completed} ${pending}${reference}${owner}${checkpoint}`.replace(/\.\./g, "."),
    "Offered FC/Cross Sell: Not provided",
    `AC Call ID: ${clean(details.callId) || "Not provided"}`,
    "JA:"
  ].join("\n");
}

function formatCustomerActions(actions) {
  if (!actions.length) return "";
  return actions.join(" ");
}

function composeWarranty({ answers, details, analysis }) {
  const model = clean(details.model) || "your Medify Air unit";
  const outcome = answers.outcome;
  const diagnosis = answers.diagnosis;
  const lines = [];

  if (diagnosis === "Potential safety issue" || outcome === "Safety escalation documented") {
    lines.push("For safety, please stop using and unplug the unit if it is safe to do so. Please do not perform any additional troubleshooting while the concern is under review.");
  } else if (outcome === "Troubleshooting resolved the issue" || diagnosis === "Issue resolved during troubleshooting") {
    lines.push(`I’m glad the troubleshooting steps resolved the issue with ${model}. No replacement action is needed based on the confirmed outcome.`);
  } else if (outcome === "Replacement approved — creation still pending") {
    lines.push(`The warranty review for ${model} is complete, and a replacement has been approved. The replacement has not been created yet, so shipment and tracking are not available at this stage.`);
  } else if (outcome === "Replacement created and reference confirmed") {
    lines.push(`The replacement for ${model} has been created under reference ${fieldOr(details.reference, "replacement reference")}. It has not been marked as shipped, so tracking is not yet confirmed.`);
  } else if (outcome === "Replacement shipped — tracking confirmed") {
    lines.push(`The replacement for ${model} has shipped. The confirmed tracking or replacement reference is ${fieldOr(details.reference, "tracking or replacement reference")}.`);
  } else if (outcome === "Not eligible — approved explanation ready" || answers.eligibility === "Not eligible decision documented") {
    lines.push(`The warranty review for ${model} has been completed. ${fieldOr(details.caseDetail, "approved customer-facing eligibility explanation")}`);
  } else if (answers.eligibility === "Awaiting L2 / policy owner" || answers.eligibility === "Current rule conflicts with source material") {
    lines.push(`The available information for ${model} has been documented, but an authorized warranty decision is still required. No replacement has been approved or created at this time.`);
  } else if (diagnosis === "Issue persists and evidence is complete") {
    lines.push(`The troubleshooting and evidence for ${model} are complete and ready for warranty review. This does not mean a replacement has already been approved.`);
  }

  const actions = formatCustomerActions(analysis.customerActions);
  if (actions) lines.push(actions);
  if (!lines.length) {
    lines.push(`Thank you for working with us regarding ${model}. We are continuing the warranty assessment using the information that has been verified so far.`);
  }
  if (analysis.pendingActions.length && !lines.some((line) => /still|required|not yet|not been|continuing/i.test(line))) {
    lines.push("We will confirm the next appropriate action once the remaining review is complete.");
  }

  const email = `Hi ${customerName(details)},\n\nThank you for working through the warranty assessment with us.\n\n${lines.join("\n\n")}\n\nPlease let us know if you have any questions or need help providing the requested information.\n\nBest,\nMedify Air Support`;
  const chat = `Thank you for working through the warranty details with me. ${lines.slice(0, 2).join(" ")}`;
  const call = `Thank you for going through the warranty details with me. ${lines.slice(0, 2).join(" ")} ${analysis.customerActions.length ? "Once we have that information, we can continue with the correct next step." : ""}`.trim();
  return {
    outputs: {
      Email: email,
      Chat: chat,
      "Call Script": call,
      "Internal Notes": makeInternalNotes({ details, reason: `Warranty assessment${clean(details.model) ? ` for ${details.model}` : ""}`, analysis })
    },
    suggestedTitle: "Suggested warranty response"
  };
}

const DAMAGE_EVIDENCE_REQUEST = "Please send clear photos of the shipping label with the tracking number, the outside of the box including the relevant sides, the packaging materials, and close-ups of the product and packaging damage. Include the box certificate when applicable.";

function composeDamagedShipment({ answers, details, analysis }) {
  const shipmentState = answers["shipment-state"];
  const claimState = answers["claim-gate"];
  const remedy = answers.remedy;
  const lines = [];

  if (shipmentState === "Arrived damaged") {
    lines.push("I’m sorry your shipment arrived damaged. We’ll help document the condition and move it through the correct review.");
  } else if (shipmentState === "Marked delivered but not received") {
    lines.push("I understand that the carrier marked the shipment delivered, but you have not received it. The delivery details and current carrier requirements still need to be reviewed.");
  } else if (shipmentState === "Missing item / partial shipment") {
    lines.push("I’m sorry part of your shipment is missing. We first need to verify every package and tracking number connected with the order.");
  } else if (shipmentState === "Stuck / delayed / carrier exception") {
    lines.push("The latest carrier record shows a delay or exception. We are reviewing that status before confirming the appropriate resolution.");
  } else {
    lines.push("The shipment is still showing current carrier movement. No replacement or refund has been authorized based on that status alone.");
  }

  if (answers.evidence !== "Complete" && shipmentState === "Arrived damaged") {
    lines.push(DAMAGE_EVIDENCE_REQUEST);
  } else {
    const actions = formatCustomerActions(analysis.customerActions);
    if (actions) lines.push(actions);
  }

  if (claimState === "Claim submitted — decision pending") {
    lines.push(`The claim has been submitted under reference ${fieldOr(details.reference, "claim reference")}. The decision is still pending, so a replacement or refund is not yet confirmed.`);
  } else if (claimState === "Claim approved") {
    lines.push("The claim has been approved. The authorized remedy must still be confirmed or completed before we can describe it as final.");
  } else if (claimState === "Eligible and ready to submit") {
    lines.push("The evidence is ready for claim submission, but the claim has not been submitted yet.");
  } else if (claimState === "Claim declined / exception") {
    lines.push(fieldOr(details.caseDetail, "approved claim explanation or exception detail"));
  }

  if (remedy === "Replacement approved — not created") {
    lines.push("A replacement has been approved, but it has not been created or shipped yet.");
  } else if (remedy === "Replacement created") {
    lines.push(`A replacement has been created under reference ${fieldOr(details.reference, "replacement reference")}. Shipment and tracking are not yet confirmed.`);
  } else if (remedy === "Refund authorized — processing") {
    lines.push("A refund has been authorized and is still processing. It is not complete yet.");
  } else if (remedy === "No remedy authorized yet" && !lines.some((line) => /not yet|not been|still pending/i.test(line))) {
    lines.push("No replacement, refund, or other remedy has been authorized at this time.");
  }

  const email = `Hi ${customerName(details)},\n\n${lines.join("\n\n")}\n\nThank you for your patience while the confirmed next step is completed.\n\nBest,\nMedify Air Support`;
  return {
    outputs: {
      Email: email,
      Chat: lines.slice(0, 3).join(" "),
      "Call Script": `I’m sorry you’re dealing with this shipment issue. ${lines.slice(1, 3).join(" ")}`.trim(),
      "Internal Notes": makeInternalNotes({ details, reason: `Shipment issue${clean(details.order) ? ` for order ${details.order}` : ""}`, analysis })
    },
    suggestedTitle: "Suggested shipment response"
  };
}

function composeReturn({ answers, details, analysis }) {
  const eligibility = answers.eligibility;
  const returnState = answers["return-state"];
  const refundState = answers["refund-state"];
  const lines = ["Thank you for providing the details about your return request."];

  const actions = formatCustomerActions(analysis.customerActions);
  if (actions) lines.push(actions);

  if (eligibility === "Eligible — label not created") {
    lines.push("The return is eligible, but the return label has not been created yet.");
  } else if (eligibility === "Label created" || returnState === "Label created — no carrier movement") {
    lines.push(`The return label has been created under reference ${fieldOr(details.reference, "return tracking reference")}. Please remove any old shipping labels, keep the return tracking number, and wait for the first carrier scan. The return and refund are not complete yet.`);
  } else if (eligibility === "Outside standard window — approval pending") {
    lines.push("The request is outside the standard return window and is awaiting an authorized exception decision. A return label or refund has not been approved yet.");
  } else if (eligibility === "Not eligible — approved explanation available") {
    lines.push(fieldOr(details.caseDetail, "approved customer-facing return explanation"));
  }

  if (returnState === "In carrier movement") {
    lines.push("The return is moving through the carrier network. Warehouse receipt and refund completion are not confirmed yet.");
  } else if (returnState === "Warehouse received") {
    lines.push("The warehouse has received the return. Any required inspection, authorization, and refund processing are separate steps and may still be pending.");
  } else if (returnState === "Inspection / authorization pending") {
    lines.push("The return is pending inspection or authorization. The refund is not complete at this stage.");
  } else if (returnState === "Return exception") {
    lines.push(`The return requires an exception review. ${fieldOr(details.caseDetail, "return exception detail")}`);
  }

  if (refundState === "Refund requested") {
    lines.push("A refund has been requested, but it has not been authorized or completed.");
  } else if (refundState === "Refund authorized / processor pending") {
    lines.push("The refund has been authorized and is waiting for processor completion. It is not complete yet.");
  } else if (refundState === "Refund completed by processor") {
    lines.push(`The refund was completed by the processor under reference ${fieldOr(details.reference, "refund reference")}. Your financial institution may still need additional time to post the credit.`);
  } else if (refundState === "Refund failed / requires escalation") {
    lines.push(`The refund could not be completed and has been escalated. ${fieldOr(details.caseDetail, "approved failure or escalation detail")}`);
  }

  const email = `Hi ${customerName(details)},\n\n${lines.join("\n\n")}\n\nPlease let us know if you need help with the confirmed next step.\n\nBest,\nMedify Air Support`;
  return {
    outputs: {
      Email: email,
      Chat: lines.slice(0, 3).join(" "),
      "Call Script": `Thank you for confirming the return details. ${lines.slice(1, 3).join(" ")}`.trim(),
      "Internal Notes": makeInternalNotes({ details, reason: `Return and refund request${clean(details.order) ? ` for order ${details.order}` : ""}`, analysis })
    },
    suggestedTitle: "Suggested return response"
  };
}

function composeGeneral({ flow, details, analysis }) {
  const title = flow.title.toLowerCase();
  const action = formatCustomerActions(analysis.customerActions);
  let statusLine = "We have documented the verified information for your request.";
  if (analysis.statuses.includes("escalated")) {
    statusLine = "The request has been escalated for the appropriate authorized review.";
  } else if (analysis.statuses.includes("blocked")) {
    statusLine = "The next action needs an approved review before we can confirm an outcome.";
  } else if (analysis.statuses.includes("approved_not_completed")) {
    statusLine = "The request has an approval, but the approved action has not been completed yet.";
  } else if (analysis.statuses.includes("completed")) {
    statusLine = `The confirmed action has been completed${clean(details.reference) ? ` under reference ${details.reference}` : ""}.`;
  } else if (analysis.statuses.includes("resolved")) {
    statusLine = "The issue was resolved without an additional operational action.";
  } else if (analysis.statuses.includes("awaiting_internal_review")) {
    statusLine = "The request is still under review, so no unconfirmed outcome has been promised.";
  }
  const requestLine = action || "We will confirm the next safe step after the remaining information or review is complete.";
  const email = `Hi ${customerName(details)},\n\nThank you for contacting us about your ${title} request.\n\n${statusLine}\n\n${requestLine}\n\nBest,\nMedify Air Support`;
  return {
    outputs: {
      Email: email,
      Chat: `${statusLine} ${requestLine}`,
      "Call Script": `Thank you for confirming the details. ${statusLine} ${requestLine}`,
      "Internal Notes": makeInternalNotes({ details, reason: flow.title, analysis })
    },
    suggestedTitle: "Suggested customer response"
  };
}

export function buildWorkflowResponse({ workflowId, flow, answers, details = {} }) {
  const analysis = analyzeWorkflow({ workflowId, flow, answers, details });
  const readiness = determineReadiness(analysis);
  const composer = workflowId === "WF-012"
    ? composeWarranty
    : workflowId === "WF-005"
      ? composeDamagedShipment
      : workflowId === "WF-009"
        ? composeReturn
        : composeGeneral;
  return {
    ...analysis,
    ...composer({ flow, answers, details, analysis }),
    readiness
  };
}

export function buildFinderResponse({ result, product, openPlan, customer = "" }) {
  const room = Math.round(result.squareFeet * 10) / 10;
  const effective = Math.round(result.effective * 10) / 10;
  const concern = clean(result.concern);
  const connected = openPlan || result.connectedRooms > 1;
  const name = clean(customer) || "[Customer Name]";
  const concernLine = concern && concern !== "General air quality"
    ? `I’ve also noted ${concern.toLowerCase()} as your main concern.`
    : "";
  const layoutLine = connected
    ? "Because the layout is open-plan or includes connected rooms, please confirm that the entered size includes the full connected area so we can refine the recommendation if needed."
    : "This recommendation assumes one closed room with an 8-foot ceiling.";
  const email = `Hi ${name},\n\nThank you for providing the size of your space. Based on the ${room.toLocaleString()} sq ft area entered, the ${product.model} is the recommended verified fit. It has published coverage of up to ${product.coverage.toLocaleString()} sq ft every 30 minutes under the official closed-room, 8-foot-ceiling basis, so it meets the calculated requirement for this space.\n\n${concernLine ? `${concernLine}\n\n` : ""}${layoutLine}\n\nYou can review the model here:\n${product.source}\n\nPlease let us know if the room dimensions or layout differ, or if you would like help comparing another suitable model.\n\nBest,\nMedify Air Support`;
  const chat = `Based on the ${room.toLocaleString()} sq ft area entered, the ${product.model} is the recommended verified fit. It covers up to ${product.coverage.toLocaleString()} sq ft every 30 minutes under the official closed-room, 8-foot-ceiling basis. ${concernLine} ${layoutLine}`.replace(/\s+/g, " ").trim();
  const call = `Thank you for providing the room size. Based on the ${room.toLocaleString()} square foot area entered, I would recommend the ${product.model}. Its verified coverage is up to ${product.coverage.toLocaleString()} square feet every 30 minutes under the official closed-room, eight-foot-ceiling basis. ${concernLine} Before we finalize that recommendation, may I confirm whether the room is open to another area or includes any connected spaces?`.replace(/\s+/g, " ").trim();
  const notes = [
    "Spoke With: Not provided",
    `Name on the Account: ${clean(customer) || "Not provided"}`,
    "Order Num: Not provided",
    "Email Address: Not provided",
    "Contact #: Not provided",
    `Reason for Calling: Air purifier recommendation for ${room.toLocaleString()} sq ft${concern ? `; concern: ${concern}` : ""}`,
    `ACTION TAKEN: Entered room area ${room.toLocaleString()} sq ft; calculated effective area ${effective.toLocaleString()} sq ft. Selected ${product.model}; verified 30-minute coverage ${product.coverage.toLocaleString()} sq ft. ${layoutLine}`,
    "Offered FC/Cross Sell: Not provided",
    "AC Call ID: Not provided",
    "JA:"
  ].join("\n");
  return {
    outputs: {
      Email: email,
      Chat: chat,
      "Call Script": call,
      "Internal Notes": notes
    },
    moreDetails: [
      ["Smoke CADR", `${product.cadr} CFM`],
      ["Filtration", product.filtration],
      ["Fan speeds", product.speeds],
      ["Sound", product.sound],
      ["Dimensions", product.dimensions],
      ["Filter", product.filter],
      ["Filter life", product.filterLife],
      ["Controls", product.controls]
    ]
  };
}

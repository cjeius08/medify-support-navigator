const DEFAULT_SOURCE = "Current approved procedure, official model source, and responsible live system";

const option = (label, {
  status = "verified_fact",
  fact = "",
  missing = "",
  completed = "",
  pending = "",
  customerAction = "",
  internal = "",
  required = [],
  chooseWhen,
  doNotChoose,
  evidence,
  customerSafe,
  neverPromise,
  additionalFields = [],
  next
} = {}) => ({
  label,
  semantic: { status, fact, missing, completed, pending, customerAction, internal, required },
  chooseWhen: chooseWhen || `Choose this only when “${label}” is supported by the case record or the responsible live system.`,
  doNotChoose: doNotChoose || "Do not choose this from the customer’s requested outcome alone.",
  evidence: evidence || "Use the evidence and system record named in this step.",
  customerSafe: customerSafe || fact || pending || "Tell the customer only what the verified record supports.",
  neverPromise: neverPromise || "Do not promise an approval, refund, replacement, shipment, claim result, or completion that is still pending.",
  additionalFields,
  next: next || "Continue to the next relevant verification step."
});

const guidedStep = ({
  id,
  title,
  question,
  options,
  need,
  why,
  ask,
  evidence,
  check,
  action,
  notPromise,
  result,
  source = DEFAULT_SOURCE,
  verified
}) => ({
  id,
  title,
  question,
  choices: options.map((item) => item.label),
  coaching: Object.fromEntries(options.map((item) => [item.label, item])),
  need,
  why,
  ask,
  evidence,
  check,
  action,
  notPromise,
  result,
  source,
  verified
});

const flow = ({
  title,
  purpose,
  steps,
  source = DEFAULT_SOURCE,
  status = "Guided with live verification",
  scenario,
  whenToUse,
  evidenceChecklist = [],
  conflictWarnings = []
}) => ({
  title,
  purpose,
  channel: "All",
  status,
  source,
  steps,
  playbook: {
    whenToUse: whenToUse || purpose,
    evidenceChecklist,
    conflictWarnings,
    scenario
  }
});

const MODEL_OPTIONS = [
  "MA-14",
  "MA-18 legacy",
  "MA-22",
  "MA-25",
  "MA-35",
  "MA-40 standard",
  "MA-40 UV / legacy variant",
  "MA-50 V3.0",
  "MA-50 older revision",
  "MA-112",
  "MA-112 PRO",
  "MA-125 legacy",
  "MA-10 legacy",
  "MA-15 legacy / filter support",
  "Model label is not available yet"
];

function modelOptions() {
  return MODEL_OPTIONS.map((label) => label === "Model label is not available yet"
    ? option(label, {
      status: "awaiting_customer",
      missing: "Exact purifier model and revision",
      pending: "Model-specific troubleshooting is blocked until the unit label is available.",
      customerAction: "Please send a clear photo of the model label on the purifier.",
      internal: "Exact model/revision not confirmed",
      chooseWhen: "Choose this when neither the transcript nor the unit label establishes the exact model.",
      doNotChoose: "Do not guess the model from the purifier’s appearance.",
      evidence: "A clear unit-label photo or complete label wording.",
      customerSafe: "We need the exact model information before providing model-specific steps.",
      next: "Wait for the model label; do not display a reset or button combination."
    })
    : option(label, {
      fact: `Purifier model selected: ${label}.`,
      internal: `Model selected for troubleshooting: ${label}`,
      chooseWhen: `Choose this only when the label or verified order record identifies ${label}.`,
      doNotChoose: "Do not choose by appearance or by assuming all revisions use the same controls.",
      evidence: "Unit label, exact manual, or verified order SKU.",
      customerSafe: `The troubleshooting path will use the verified ${label} instructions.`,
      next: "Continue to the exact symptom and previously completed checks."
    }));
}

function shipmentIssueOptions() {
  return [
    option("One item is missing, but other package tracking is still moving", {
      fact: "The order may be split across multiple packages.",
      pending: "The remaining package tracking still needs to complete or be reviewed.",
      internal: "Possible split shipment; separate tracking moving",
      chooseWhen: "Choose this when every tracking number was reviewed and another package is still in transit.",
      doNotChoose: "Do not classify the item as lost before reviewing all package records.",
      evidence: "Order line items and every tracking number.",
      customerSafe: "The remaining item appears to be traveling separately.",
      next: "Confirm the separate tracking and provide only its verified status."
    }),
    option("One item is missing and no separate shipment is found", {
      status: "awaiting_customer",
      missing: "Shipping-label and package-condition evidence",
      pending: "The missing-item evidence packet is incomplete.",
      customerAction: "Please send the shipping label and photos of the package, including any visible damage or tampering.",
      internal: "Missing item; no separate shipment located",
      chooseWhen: "Choose this after checking all order lines and tracking numbers.",
      evidence: "Order record, shipping label, package photos, and tampering/damage report.",
      customerSafe: "We need the package evidence before determining the appropriate claim path.",
      next: "Collect only the missing evidence, then review claim eligibility."
    }),
    option("Package appears opened, damaged, or tampered with", {
      status: "awaiting_customer",
      missing: "Package damage or tampering evidence",
      pending: "A carrier/operations review is required after evidence is complete.",
      customerAction: "Please keep the box and packaging and send the shipping label plus clear photos of the box and affected contents.",
      internal: "Possible package tampering or damage",
      evidence: "Shipping label, packaging, relevant box sides, and close-ups of damage/tampering.",
      customerSafe: "The condition needs to be documented before a claim or remedy can be confirmed.",
      next: "Route to the damaged-shipment evidence path."
    }),
    option("Missing item evidence is complete and claim review is pending", {
      status: "awaiting_internal_review",
      completed: "The missing-item evidence packet was completed.",
      pending: "Claim submission or an authorized remedy decision is still pending.",
      internal: "Missing-item evidence complete; review pending",
      evidence: "Complete order, package, label, and item evidence.",
      customerSafe: "The documentation is complete and ready for review; no remedy is confirmed yet.",
      next: "Verify whether a claim was actually submitted."
    })
  ];
}

export function createAdvancedFlows(verified) {
  return {
    "WF-001": flow({
      title: "Order status — processing or awaiting fulfillment",
      purpose: "Explain the exact order stage without confusing processing, fulfillment, tracking creation, and carrier transit.",
      whenToUse: "Use when an order has not yet entered confirmed carrier movement.",
      evidenceChecklist: ["Order number", "Order date", "Current fulfillment state", "Stock or backorder state", "Tracking record when available"],
      scenario: "A customer asks where the order is while the order record still shows processing.",
      steps: [
        guidedStep({
          id: "order-stage",
          title: "Verify the fulfillment stage",
          question: "What does the current order record specifically show?",
          options: [
            option("Order is within the verified processing stage", { fact: "The order is still processing.", pending: "Fulfillment is not complete.", internal: "Order processing", customerSafe: "The order is still in the verified processing stage." }),
            option("Order is awaiting confirmed stock or backorder review", { status: "awaiting_internal_review", pending: "Stock availability or backorder timing needs confirmation.", internal: "Awaiting stock/backorder confirmation", customerSafe: "The order is waiting for an availability update; no unsupported date should be given." }),
            option("Order is fulfilled and tracking was created, but carrier possession is not confirmed", { status: "approved_not_completed", completed: "The order was marked fulfilled and a tracking record was created.", pending: "The first carrier movement is not confirmed.", internal: "Fulfilled; label created; no carrier possession", customerSafe: "Tracking was created, but carrier movement is not yet confirmed." }),
            option("The live order state cannot be verified", { status: "blocked", missing: "Current order-system status", pending: "The order state requires a live-system check.", internal: "Order state unavailable", customerSafe: "The current order status still needs verification." })
          ],
          need: "Order number, order date, line items, fulfillment state, stock state, and tracking record.",
          why: "Processing, fulfillment, label creation, and carrier possession are separate events.",
          ask: "May I confirm the order number so I can check its exact fulfillment stage?",
          evidence: "Responsible order-system record.",
          check: "Use the current status and do not infer movement from a tracking number alone.",
          action: "Record the exact stage and the next uncompleted event.",
          notPromise: "Do not promise shipment or delivery while fulfillment or carrier possession is unconfirmed.",
          result: "A specific order-stage update.",
          verified
        }),
        standardCommunicationStep("order status", verified)
      ]
    }),
    "WF-002": flow({
      title: "Order status — carrier transit",
      purpose: "Separate label creation, carrier possession, movement, delay, exception, delivery, and return-to-sender.",
      evidenceChecklist: ["Tracking number", "Latest carrier scan", "Destination match", "Exception or delay message"],
      scenario: "Tracking exists, but the customer needs an accurate interpretation of the latest carrier scan.",
      steps: [
        guidedStep({
          id: "transit-state",
          title: "Read the latest carrier event",
          question: "Which carrier state is shown by the latest verified scan?",
          options: [
            option("Carrier possession confirmed and package is moving", { fact: "Carrier possession and current movement are confirmed.", pending: "Delivery is still pending.", internal: "In carrier movement", customerSafe: "The carrier has the package and it is currently moving." }),
            option("Tracking exists but no carrier movement is confirmed", { status: "approved_not_completed", completed: "A tracking record was created.", pending: "Carrier possession or movement is not confirmed.", internal: "Label created; no carrier movement", customerSafe: "Tracking exists, but the first carrier movement is not confirmed." }),
            option("Carrier delay or exception is displayed", { status: "awaiting_internal_review", fact: "The carrier record shows a delay or exception.", pending: "The updated carrier outcome is pending.", internal: "Carrier delay/exception", customerSafe: "The carrier is reporting a delay or exception; the next scan is still pending." }),
            option("Package is returning to sender", { status: "awaiting_internal_review", fact: "The carrier record shows return-to-sender movement.", pending: "Warehouse receipt and the authorized resolution are pending.", internal: "Return to sender in progress", customerSafe: "The package is returning to sender; the resolution is not complete yet." })
          ],
          need: "Latest carrier scan, event date, destination, and any exception details.",
          why: "A label does not prove carrier possession, and a delay does not prove loss.",
          ask: "I’m checking the latest carrier scan so I can explain the exact shipment stage.",
          evidence: "Current carrier tracking record.",
          check: "Read the latest event, not only the estimated-delivery field.",
          action: "State the latest confirmed scan and the next pending event.",
          notPromise: "Do not guarantee a delivery date or remedy from a moving or delayed scan.",
          result: "An accurate carrier-status update.",
          verified
        }),
        standardCommunicationStep("carrier transit", verified)
      ]
    }),
    "WF-007": cancellationFlow(verified),
    "WF-003": flow({
      title: "Delivered but not received",
      purpose: "Document delivery-location checks, preserve the unresolved waiting-period conflict, and avoid promising a carrier-claim remedy.",
      status: "Needs confirmation",
      evidenceChecklist: ["Tracking marked delivered", "Delivery photo/location", "Address match", "Household/neighbor/safe-location checks", "Current waiting-period decision"],
      conflictWarnings: ["Delivered-not-received guidance conflicts between three and five business days."],
      scenario: "The carrier says delivered, but the customer cannot locate the package.",
      steps: [
        guidedStep({
          id: "delivery-checks",
          title: "Verify delivery and location checks",
          question: "Which delivered-not-received checks have actually been completed?",
          options: [
            option("Delivery scan, address, photo/location, household, neighbor, and safe-location checks are complete", { fact: "The delivered-not-received location checks were completed.", internal: "Delivery/location checks complete", customerSafe: "The delivery details and location checks have been completed." }),
            option("Delivery scan is available, but customer location checks are incomplete", { status: "awaiting_customer", missing: "Household, neighbor, and safe-location checks", pending: "Customer delivery-location checks are incomplete.", customerAction: "Please check with household members and neighbors and review entrances or safe delivery locations.", internal: "Awaiting customer location checks", customerSafe: "Please complete the delivery-location checks before the carrier path is finalized." }),
            option("Delivery address or proof-of-delivery location does not match", { status: "escalated", fact: "The delivery record contains an address or location discrepancy.", pending: "The discrepancy requires carrier/operations review.", internal: "Delivery address/location discrepancy", customerSafe: "The delivery record shows a discrepancy that requires review." })
          ],
          need: "Delivery scan, delivery image/location, address match, and completed customer checks.",
          why: "A delivered scan alone does not establish the package’s physical location.",
          ask: "Please check with household members and neighbors and review entrances or other safe delivery locations shown in the delivery record.",
          evidence: "Tracking, proof of delivery, destination match, and customer confirmation of location checks.",
          check: "Avoid reproducing unnecessary address details in customer-facing output.",
          action: "Document each completed check and discrepancy.",
          notPromise: "Do not promise a replacement or refund because the package cannot yet be located.",
          result: "A complete delivery-location packet or an exact missing-check request.",
          verified
        }),
        guidedStep({
          id: "waiting-rule",
          title: "Apply the approved waiting rule",
          question: "Is the current delivered-not-received waiting rule verified for this case?",
          options: [
            option("Current waiting requirement is documented for this case", { status: "awaiting_internal_review", fact: "The applicable waiting requirement was documented.", pending: "The waiting period or carrier review is still in progress.", internal: "Applicable waiting rule documented", customerSafe: "The case is following the verified waiting requirement before the next review." }),
            option("Three-day versus five-day rule is unresolved — Needs Confirmation", { status: "blocked", missing: "Approved delivered-not-received waiting rule", pending: "The next claim step is blocked by a source conflict.", internal: "Waiting-period conflict; Needs Confirmation", customerSafe: "The applicable waiting requirement must be confirmed before the next claim step." })
          ],
          need: "A dated, approved waiting rule that applies to the case.",
          why: "Current source material contains conflicting waiting periods.",
          ask: "We are confirming the applicable carrier waiting requirement before stating the next claim step.",
          evidence: "Approved current procedure or documented authorized exception.",
          check: "Do not choose three or five business days from memory.",
          action: "Use the approved rule or block the case as Needs Confirmation.",
          notPromise: "Do not say a claim is eligible or filed until the waiting gate and claim record are verified.",
          result: "An approved waiting path or a visible policy blocker.",
          verified
        }),
        standardCommunicationStep("delivered-not-received case", verified)
      ]
    }),
    "WF-004": flow({
      title: "Missing item or split shipment",
      purpose: "Review every package before classifying an item as missing and collect precise package evidence when no separate shipment exists.",
      evidenceChecklist: ["Order line items", "Every tracking number", "Shipping label", "Package photos", "Damage/tampering report"],
      scenario: "One item is missing from a multi-item order, but another tracking number may still be moving.",
      steps: [
        guidedStep({
          id: "missing-state",
          title: "Determine whether the order was split",
          question: "After checking every order line and tracking number, what is the verified missing-item state?",
          options: shipmentIssueOptions(),
          need: "Every ordered item, package count, tracking number, received item, and package condition.",
          why: "Multi-package orders can arrive separately and should not automatically become lost-item claims.",
          ask: "Please confirm which item arrived and share the shipping label and package condition if no separate shipment is shown.",
          evidence: "Order lines, every tracking record, label, and relevant package photos.",
          check: "Review all tracking numbers before declaring an item missing.",
          action: "Record the missing SKU and the exact separate-shipment or evidence state.",
          notPromise: "Do not promise a replacement or refund until the authorized review confirms it.",
          result: "A verified split-shipment update or complete missing-item packet.",
          verified
        }),
        standardCommunicationStep("missing item", verified)
      ]
    }),
    "WF-010": wrongItemFlow(verified),
    "WF-011": refundFlow(verified),
    "WF-013": troubleshootingFlow(verified),
    "WF-018": manualFlow(verified),
    "WF-021": compatibilityFlow(verified),
    "WF-022": subscriptionFlow("Cancel or deactivate Filter Club", "cancel", verified),
    "WF-023": subscriptionFlow("Change Filter Club", "change", verified),
    "WF-024": subscriptionFlow("Filter Club payment or account access", "payment", verified),
    "WF-031": replacementFlow(verified),
    "WF-032": safetyFlow(verified),
    "WF-033": compatibilityFlow(verified)
  };
}

function standardCommunicationStep(topic, verified) {
  return guidedStep({
    id: "communication",
    title: "Confirm the communication state",
    question: `What is the safe communication state for this ${topic}?`,
    options: [
      option(`The verified ${topic} facts are ready to send`, { fact: `The verified ${topic} facts are ready for customer communication.`, internal: `${topic} communication ready` }),
      option(`The ${topic} response is waiting for customer information`, { status: "awaiting_customer", missing: `Required ${topic} information`, pending: `The ${topic} process is awaiting customer information.`, customerAction: "Please provide the specific missing information shown in the checklist.", internal: `${topic} awaiting customer` }),
      option(`The ${topic} response requires authorized review`, { status: "awaiting_internal_review", pending: `The ${topic} outcome requires authorized review.`, internal: `${topic} awaiting authorized review` }),
      option(`The ${topic} response is blocked by a source conflict`, { status: "blocked", missing: `Approved ${topic} policy decision`, pending: `The ${topic} response is blocked by a source conflict.`, internal: `${topic} Needs Confirmation` })
    ],
    need: "Verified facts, exact missing item, completed action, pending action, and safe customer wording.",
    why: "The customer response and internal notes must represent the same operational state.",
    ask: "I’ll summarize what is confirmed, anything still needed, and the accurate next step.",
    evidence: "No additional evidence beyond the requirements selected earlier.",
    check: "Review every completion claim and remove unresolved placeholders before sending.",
    action: "Generate Email, Chat, Call Script, and Internal Notes from verified selections.",
    notPromise: "Do not select ready-to-send while a required fact, evidence item, approval, or source decision is unresolved.",
    result: "A safe response or a clearly labeled draft with blockers.",
    source: "Approved communication safeguards",
    verified
  });
}

function wrongItemFlow(verified) {
  return flow({
    title: "Wrong product or wrong filter ordered",
    purpose: "Verify the purifier, ordered SKU, correct compatibility, product condition, purchase type, and any linked Filter Club subscription.",
    evidenceChecklist: ["Purifier model/revision", "Ordered SKU", "Order record", "Item condition", "Subscription record when applicable"],
    scenario: "The customer ordered the wrong filter and may also have a recurring subscription for that filter.",
    steps: [
      guidedStep({
        id: "wrong-item-state",
        title: "Identify the exact mismatch",
        question: "Which wrong-item situation is supported by the order and product records?",
        options: [
          option("Wrong one-time filter ordered; purifier and ordered SKU are confirmed", { fact: "The wrong one-time filter SKU was identified.", internal: "Wrong one-time filter confirmed" }),
          option("Wrong filter is also attached to an active Filter Club subscription", { fact: "The wrong filter SKU and linked subscription were identified.", pending: "The order resolution and subscription correction must be handled separately.", internal: "Wrong filter plus subscription", customerSafe: "We need to address both the incorrect filter order and the recurring subscription." }),
          option("Wrong purifier or product was received", { status: "awaiting_customer", missing: "Ordered-versus-received item evidence", pending: "The ordered and received products must be verified.", customerAction: "Please send the shipping label and clear photos of the item received.", internal: "Wrong product received; evidence pending" }),
          option("Purifier model or correct filter compatibility is not confirmed", { status: "awaiting_customer", missing: "Exact purifier model/revision", pending: "The correct filter cannot be confirmed yet.", customerAction: "Please send a clear photo of the purifier model label.", internal: "Compatibility blocked; model unknown" })
        ],
        need: "Exact purifier model, ordered SKU, correct filter, order type, item condition, and subscription status.",
        why: "A return and a subscription correction are separate actions, and compatibility must be verified first.",
        ask: "Please confirm the purifier model and the filter SKU shown on the order or packaging.",
        evidence: "Unit label, order record, filter packaging, and subscription record when applicable.",
        check: "Verify compatibility from the official model/filter source.",
        action: "Document the mismatch and split one-time-order and subscription actions.",
        notPromise: "Do not promise an exchange, refund, or subscription change until each action is confirmed.",
        result: "The exact mismatch and both required action paths are clear.",
        verified
      }),
      standardCommunicationStep("wrong-item request", verified)
    ]
  });
}

function refundFlow(verified) {
  return flow({
    title: "Refund status",
    purpose: "Separate refund request, review, authorization, processor completion, bank posting, failure, and escalation.",
    evidenceChecklist: ["Order and amount", "Authorized resolution", "Processor record", "Refund reference when completed"],
    scenario: "A refund was requested, but the customer has not received the credit in their bank account.",
    steps: [
      guidedStep({
        id: "refund-stage",
        title: "Verify the refund stage",
        question: "Which refund event is confirmed by the responsible record?",
        options: [
          option("Refund was requested but is still under review", { status: "awaiting_internal_review", completed: "A refund was requested.", pending: "Authorization is still pending.", internal: "Refund requested; under review", customerSafe: "The refund request is still under review and is not complete." }),
          option("Refund was authorized but has not completed processing", { status: "approved_not_completed", completed: "The refund was authorized.", pending: "Processor completion is pending.", internal: "Refund authorized; processor pending", customerSafe: "The refund is authorized but has not completed processing." }),
          option("Refund was submitted to the processor", { status: "approved_not_completed", completed: "The refund was submitted to the processor.", pending: "Processor completion and bank posting remain pending.", internal: "Refund submitted to processor", customerSafe: "The refund was submitted for processing; the bank credit is not yet confirmed." }),
          option("Processor completed the refund; bank posting may still be pending", { status: "completed", completed: "The processor completed the refund.", pending: "The customer’s financial institution may still need to post the credit.", internal: "Processor completed refund; bank posting may be pending", required: [{ field: "reference", label: "Refund reference", kind: "internal" }], customerSafe: "The processor completed the refund; your bank may still need time to post the credit." }),
          option("Refund failed or requires escalation", { status: "escalated", pending: "The failed refund requires authorized follow-up.", internal: "Refund failed/escalated", required: [{ field: "caseDetail", label: "Refund failure or escalation detail", kind: "internal" }], customerSafe: "The refund requires additional review because processing did not complete." })
        ],
        need: "Authorized amount, processor state, reference, and accurate pending event.",
        why: "Requested, authorized, submitted, processor-completed, and bank-posted are different states.",
        ask: "I’m checking whether the refund was requested, authorized, submitted, or completed by the processor.",
        evidence: "Authorized finance/processor record.",
        check: "Do not use the customer’s bank balance as proof of the internal processor event.",
        action: "Record the latest verified refund event and next pending event.",
        notPromise: "Do not guarantee when the customer’s bank will post the credit.",
        result: "One precise refund status with no false completion claim.",
        verified
      }),
      standardCommunicationStep("refund status", verified)
    ]
  });
}

function troubleshootingFlow(verified) {
  return flow({
    title: "Model-specific purifier troubleshooting",
    purpose: "Require the exact model/revision first, then present only verified symptom-specific checks and stop unsafe testing.",
    evidenceChecklist: ["Unit model label", "Exact symptom", "Recent filter/change history", "Steps already attempted", "Observable result", "Short video when unresolved"],
    scenario: "A purifier has no power, unusual noise, a light/reset issue, low airflow, panel behavior, or another model-specific symptom.",
    steps: [
      guidedStep({
        id: "model",
        title: "Select the exact purifier",
        question: "Which exact purifier model or revision is verified from the unit label or order record?",
        options: modelOptions(),
        need: "Exact model, revision/variant, and label evidence when uncertain.",
        why: "Power checks, panels, filters, reset controls, UV, ionizer, and Auto mode vary by model and revision.",
        ask: "Please read the complete model information from the unit label or send a clear photo.",
        evidence: "Unit label, verified SKU, or exact official manual.",
        check: "Do not infer the model from appearance.",
        action: "Lock troubleshooting to the selected model/revision.",
        notPromise: "Do not display a button combination or reset procedure until the exact model is confirmed.",
        result: "A verified model path or an Awaiting Customer blocker.",
        source: "SRC-106 · Technical Troubleshooting and exact official manual",
        verified
      }),
      guidedStep({
        id: "symptom",
        title: "Identify the observable symptom",
        question: "What is the purifier doing right now?",
        options: [
          option("No power or unit will not turn on", { fact: "Reported symptom: no power.", internal: "No-power symptom selected" }),
          option("Filter light, timer, or reset concern", { fact: "Reported symptom: filter indicator/timer/reset concern.", internal: "Indicator/reset symptom selected", customerSafe: "The filter indicator is a usage timer, not a direct measurement of filter condition." }),
          option("Unusual noise, squeaking, rattling, or beep concern", { fact: "Reported symptom: unusual sound.", internal: "Noise/beep symptom selected" }),
          option("Low airflow or airflow changed", { fact: "Reported symptom: low or changed airflow.", internal: "Airflow symptom selected" }),
          option("Panel, door, sensor, UV, ionizer, or Auto-mode concern", { fact: "Reported symptom: control/panel/feature concern.", internal: "Panel/feature symptom selected" }),
          option("Burning smell, smoke, sparking, damaged cord, or excessive heat", { status: "escalated", fact: "A potential safety symptom was reported.", pending: "Normal troubleshooting must stop for safety review.", internal: "Safety symptom; stop-use escalation", customerSafe: "For safety, stop using and unplug the unit if it is safe to do so." })
        ],
        need: "The customer’s exact observable symptom and when it began.",
        why: "The safest next check depends on the symptom and exact hardware.",
        ask: "What exactly do you see, hear, or feel when the issue occurs?",
        evidence: "Customer description and a short video when writing cannot show the symptom.",
        check: "Stop for heat, smoke, sparking, burning odor, exposed wiring, or unsafe cord damage.",
        action: "Select the smallest model-appropriate check group.",
        notPromise: "Do not diagnose a defect or warranty eligibility from the symptom alone.",
        result: "A precise symptom branch or immediate safety escalation.",
        verified
      }),
      guidedStep({
        id: "troubleshooting-result",
        title: "Record checks and results",
        question: "What is the verified result after the approved model-specific checks?",
        options: [
          option("Issue resolved during the approved checks", { status: "resolved", completed: "The issue was resolved during troubleshooting.", internal: "Troubleshooting resolved issue", customerSafe: "The approved troubleshooting steps resolved the issue." }),
          option("Issue persists; required video/evidence is complete", { status: "awaiting_internal_review", completed: "Approved troubleshooting was completed and evidence was received.", pending: "Warranty or technical review is pending.", internal: "Troubleshooting complete; evidence complete" }),
          option("Issue persists; short video or other evidence is still required", { status: "awaiting_customer", missing: "Clear 5–8 second issue video or specified evidence", pending: "The technical review is waiting for customer evidence.", customerAction: "Please send a clear 5–8 second video showing the issue.", internal: "Troubleshooting complete; evidence missing" }),
          option("Approved model/revision instructions are not available — Needs Confirmation", { status: "blocked", missing: "Verified model/revision troubleshooting source", pending: "Troubleshooting is blocked by a source or revision conflict.", internal: "Model/revision instructions need confirmation" }),
          option("Safety concern identified; stop troubleshooting and escalate", { status: "escalated", completed: "Normal troubleshooting was stopped for safety.", pending: "Safety review is pending.", internal: "Safety escalation initiated" })
        ],
        need: "Exact steps attempted, observable result, and evidence state.",
        why: "A troubleshooting request is not evidence that the issue persists, and evidence is not warranty approval.",
        ask: "What happened after completing that exact step?",
        evidence: "Troubleshooting chronology and relevant short video/photo.",
        check: "Confirm the step belongs to the selected model/revision.",
        action: "Record each completed check separately from the pending review.",
        notPromise: "Do not promise a replacement because troubleshooting or evidence collection was completed.",
        result: "Resolved, evidence-ready, awaiting-customer, blocked, or escalated state.",
        verified
      }),
      standardCommunicationStep("troubleshooting case", verified)
    ]
  });
}

function manualFlow(verified) {
  return flow({
    title: "Manual and setup assistance",
    purpose: "Send the exact official manual and distinguish a manual request from a setup or troubleshooting problem.",
    evidenceChecklist: ["Exact model/revision", "Requested manual or setup topic", "Official manual link"],
    scenario: "A customer did not receive a paper manual and needs the correct digital manual or basic setup assistance.",
    steps: [
      guidedStep({
        id: "manual-state",
        title: "Identify the manual or setup need",
        question: "What exact manual or setup help does the customer need?",
        options: [
          option("Exact model confirmed; customer only needs the official manual", { fact: "The exact model and manual request are confirmed.", internal: "Official manual request" }),
          option("Exact model confirmed; customer also needs setup guidance", { fact: "The model and setup topic are confirmed.", pending: "Only verified setup guidance should be provided.", internal: "Manual plus setup assistance" }),
          option("Model or revision is not confirmed", { status: "awaiting_customer", missing: "Exact model/revision", pending: "The correct manual cannot be selected.", customerAction: "Please send the complete model information from the unit label.", internal: "Manual blocked; model unknown" }),
          option("The request is actually a troubleshooting issue", { status: "blocked", pending: "The case should move to model-specific troubleshooting.", internal: "Route to troubleshooting" })
        ],
        need: "Exact model/revision and the specific manual/setup topic.",
        why: "Manuals and setup details can differ by revision.",
        ask: "Which model is shown on the unit label, and are you looking for the manual or help with a specific setup step?",
        evidence: "Unit label and official manual page.",
        check: "Use only the exact public manual.",
        action: "Provide the official manual link or route to troubleshooting.",
        notPromise: "Do not use another model’s setup instructions.",
        result: "Correct manual/setup response or model-information request.",
        source: "SRC-200 · Official Product Manuals",
        verified
      }),
      standardCommunicationStep("manual or setup request", verified)
    ]
  });
}

function cancellationFlow(verified) {
  return flow({
    title: "Order cancellation",
    purpose: "Check whether the order can still be canceled and clearly separate a request from a completed cancellation.",
    evidenceChecklist: ["Order number", "Current fulfillment status", "Cancellation request", "Confirmed cancellation result"],
    scenario: "A customer asks to cancel an order, but the cancellation has not yet been confirmed.",
    steps: [
      guidedStep({
        id: "cancellation-state",
        title: "Check what has actually happened",
        question: "What is the current cancellation status?",
        options: [
          option("Customer asked to cancel, but the request has not been submitted", {
            status: "awaiting_internal_review",
            pending: "The cancellation request still needs to be submitted.",
            internal: "Customer requested cancellation; request not submitted"
          }),
          option("Cancellation was requested and is still pending", {
            status: "awaiting_internal_review",
            completed: "The cancellation request was submitted.",
            pending: "The cancellation result has not been confirmed.",
            internal: "Cancellation requested; result pending"
          }),
          option("Cancellation was completed and confirmed in the order system", {
            status: "completed",
            completed: "The order cancellation was completed.",
            internal: "Cancellation completed",
            required: [{ field: "reference", label: "Cancellation confirmation or order reference", kind: "internal" }]
          }),
          option("The order is already in fulfillment and cannot be canceled in the order system", {
            status: "blocked",
            fact: "The order has already entered fulfillment and cannot be canceled in the order system.",
            pending: "The available delivery or return option still needs to be explained.",
            internal: "Cancellation unavailable after fulfillment"
          }),
          option("The order status cannot be checked yet", {
            status: "blocked",
            missing: "Current order status",
            pending: "The cancellation request cannot be confirmed until the order is checked.",
            internal: "Order lookup required before cancellation update"
          })
        ],
        need: "Order number, current fulfillment status, and the confirmed result of any cancellation attempt.",
        why: "A customer request does not mean the order was canceled.",
        ask: "May I have the order number so I can check whether it can still be canceled?",
        evidence: "Current order-system status and cancellation confirmation.",
        check: "Confirm the final result in the order system.",
        action: "Tell the customer whether the request is pending, completed, or no longer available.",
        notPromise: "Do not say the order is canceled until the order system confirms it.",
        result: "A clear cancellation update and next step.",
        verified
      }),
      standardCommunicationStep("order cancellation", verified)
    ]
  });
}

function compatibilityFlow(verified) {
  return flow({
    title: "Product and filter compatibility",
    purpose: "Verify the purifier model, hardware revision, installed filter, intended filter, and current official compatibility before advising the customer.",
    evidenceChecklist: ["Model/revision label", "Current filter SKU", "Intended filter SKU", "Official compatibility source"],
    conflictWarnings: ["H13/H14 availability and model lifecycle can change.", "MA-50 revisions use different filters and controls.", "MA-112 PRO coverage remains excluded from automatic sizing."],
    scenario: "A customer wants to know whether a replacement filter fits a current or legacy purifier.",
    steps: [
      guidedStep({
        id: "compatibility-state",
        title: "Verify both sides of the compatibility check",
        question: "Which product-and-filter compatibility state is verified?",
        options: [
          option("Purifier revision and intended filter SKU are an official match", { fact: "The purifier revision and intended filter were verified as compatible.", internal: "Official compatibility confirmed" }),
          option("Purifier model is known, but hardware revision is unclear", { status: "awaiting_customer", missing: "Hardware revision or complete unit label", pending: "Compatibility cannot be finalized.", customerAction: "Please send a clear photo of the complete purifier label.", internal: "Compatibility pending revision" }),
          option("Filter SKU is unknown or packaging information is incomplete", { status: "awaiting_customer", missing: "Exact filter SKU", pending: "Compatibility cannot be finalized.", customerAction: "Please send the filter SKU or a clear photo of the packaging label.", internal: "Compatibility pending filter SKU" }),
          option("Official sources conflict — Needs Confirmation", { status: "blocked", missing: "Approved compatibility decision", pending: "The recommendation is blocked by conflicting sources.", internal: "Compatibility conflict" }),
          option("Filter is confirmed incompatible with the verified purifier revision", { status: "verified_fact", fact: "The intended filter is not compatible with the verified purifier revision.", internal: "Incompatible filter confirmed", customerSafe: "The intended filter is not compatible with the verified purifier revision." })
        ],
        need: "Complete purifier label, current/intended filter SKUs, and official compatibility source.",
        why: "Similar model names and legacy revisions may use different filters.",
        ask: "Please share the complete purifier model/revision and the filter SKU shown on the packaging.",
        evidence: "Unit label, filter package label, and official model/filter source.",
        check: "Preserve active, legacy, and discontinued status without using it as the sole compatibility test.",
        action: "State compatibility only when both model revision and filter SKU are verified.",
        notPromise: "Do not invent an unsupported date cutoff or assume an H13/H14 filter fits every revision.",
        result: "Verified match, verified mismatch, exact missing information, or Needs Confirmation.",
        verified
      }),
      standardCommunicationStep("compatibility request", verified)
    ]
  });
}

function subscriptionFlow(title, mode, verified) {
  const scenario = mode === "payment"
    ? "The customer cannot find the subscription through Shop Pay or needs secure payment-account guidance."
    : mode === "cancel"
      ? "The customer wants to stop future Filter Club charges or shipments."
      : "The customer needs to skip, pause, reschedule, change cadence/filter, consolidate, or reactivate a subscription.";
  return flow({
    title,
    purpose: "Verify the correct subscription and distinguish a requested change from a confirmed account action.",
    evidenceChecklist: ["Subscription email/account", "Affected filter SKU", "Cadence", "Next charge date", "Confirmed live-system result"],
    scenario,
    steps: [
      guidedStep({
        id: "subscription-state",
        title: "Identify the subscription and requested action",
        question: "What exact Filter Club situation is verified?",
        options: [
          option("Subscription found under the correct account and requested action is clear", { fact: "The subscription and requested action were identified.", internal: "Subscription/action verified" }),
          option("Customer is using Shop Pay instead of the approved subscription portal", { status: "awaiting_customer", pending: "The customer needs to access the approved Filter Club portal.", customerAction: "Please use https://medifyair.com/tools/recurring/login to access the Filter Club subscription.", internal: "Customer routed from Shop Pay to subscription portal" }),
          option("Subscription is not found under the email provided", { status: "awaiting_customer", missing: "Email or account connected with the subscription", pending: "The correct subscription account is not identified.", customerAction: "Please confirm the email address used when the Filter Club subscription was created.", internal: "Subscription not found; account verification pending" }),
          option("Wrong filter is attached to the subscription", { status: "awaiting_internal_review", fact: "The subscription filter does not match the verified purifier.", pending: "The subscription correction must be completed and confirmed.", internal: "Wrong subscription filter" }),
          option("Subscription change was requested but is not confirmed", { status: "awaiting_internal_review", completed: "The subscription change was requested.", pending: "The live-system result is not confirmed.", internal: "Subscription change requested; pending" }),
          option("Subscription change is complete and resulting cadence/next charge are confirmed", { status: "completed", completed: "The subscription change was completed.", internal: "Subscription change completed", required: [{ field: "caseDetail", label: "Resulting cadence and next charge date", kind: "internal" }] })
        ],
        need: "Correct account, subscription SKU, cadence, next charge, requested action, and live-system outcome.",
        why: "Cancel, skip, pause, reschedule, filter change, payment change, consolidation, and reactivation are different actions.",
        ask: "Which filter subscription are you trying to manage, and what exact change would you like to make?",
        evidence: "Approved subscription portal or responsible live-system record.",
        check: "Never collect full payment-card details; use the secure flow.",
        action: "Record the requested action and confirm the resulting subscription state separately.",
        notPromise: "Do not say a subscription was changed or canceled until the live system confirms it.",
        result: "Correct portal guidance, exact missing-account request, pending change, or confirmed result.",
        source: "Official Filter Club portal and approved account procedure",
        verified
      }),
      standardCommunicationStep("Filter Club request", verified)
    ]
  });
}

function replacementFlow(verified) {
  return flow({
    title: "Replacement request and fulfillment status",
    purpose: "Separate replacement request, evidence review, approval, order creation, fulfillment, shipment, decline, and escalation.",
    evidenceChecklist: ["Resolution authority", "Approval record", "Replacement order number", "Fulfillment state", "Confirmed tracking"],
    scenario: "A replacement is approved, but the replacement order has not yet been created or shipped.",
    steps: [
      guidedStep({
        id: "replacement-stage",
        title: "Verify the replacement event",
        question: "Which replacement event has actually occurred?",
        options: [
          option("Replacement requested; evidence or approval is still pending", { status: "awaiting_internal_review", completed: "A replacement was requested.", pending: "Evidence review or approval is pending.", internal: "Replacement requested; not approved" }),
          option("Replacement approved, but no replacement order exists", { status: "approved_not_completed", completed: "The replacement was approved.", pending: "Replacement-order creation is pending.", internal: "Replacement approved; not created", customerSafe: "The replacement is approved but the order has not been created yet." }),
          option("Replacement order created; fulfillment is pending", { status: "approved_not_completed", completed: "The replacement order was created.", pending: "Fulfillment and shipment are pending.", internal: "Replacement created; fulfillment pending", required: [{ field: "reference", label: "Replacement order number", kind: "internal" }] }),
          option("Replacement fulfilled; shipment tracking is not confirmed", { status: "approved_not_completed", completed: "The replacement was marked fulfilled.", pending: "Confirmed tracking or carrier movement is pending.", internal: "Replacement fulfilled; tracking pending" }),
          option("Replacement shipped with confirmed tracking", { status: "completed", completed: "The replacement shipped with confirmed tracking.", internal: "Replacement shipped", required: [{ field: "reference", label: "Confirmed replacement tracking", kind: "internal" }] }),
          option("Replacement declined with an approved explanation", { status: "completed", completed: "The replacement decision was declined.", internal: "Replacement declined", required: [{ field: "caseDetail", label: "Approved decline explanation", kind: "internal" }] }),
          option("Replacement requires escalation", { status: "escalated", pending: "An authorized replacement decision is pending.", internal: "Replacement escalated" })
        ],
        need: "Authorized decision, replacement order, fulfillment status, and tracking as applicable.",
        why: "Requested, approved, created, fulfilled, and shipped are different operational events.",
        ask: "I’m confirming the latest completed replacement step before providing an update.",
        evidence: "Responsible approval, order, fulfillment, and tracking records.",
        check: "Require the corresponding reference before describing creation or shipment.",
        action: "Record the last completed event and the exact next pending event.",
        notPromise: "Do not say a replacement was created or shipped based only on approval.",
        result: "One exact replacement status with safe wording.",
        verified
      }),
      standardCommunicationStep("replacement", verified)
    ]
  });
}

function safetyFlow(verified) {
  return flow({
    title: "Purifier safety escalation",
    purpose: "Stop routine troubleshooting for potential electrical or physical safety concerns and create a complete escalation packet.",
    status: "Immediate action",
    evidenceChecklist: ["Exact model/revision", "Safety symptom", "When it occurred", "Safe photo/video only if appropriate", "Contact details", "Escalation owner"],
    scenario: "The customer reports smoke, sparking, burning odor, excessive heat, or a damaged cord.",
    steps: [
      guidedStep({
        id: "safety-state",
        title: "Identify the safety concern",
        question: "Which potential safety condition did the customer report?",
        options: [
          option("Burning smell or excessive heat", { status: "escalated", fact: "The customer reported burning odor or excessive heat.", completed: "Routine troubleshooting was stopped.", pending: "Safety review is pending.", internal: "Burning odor/heat safety escalation" }),
          option("Smoke or sparking", { status: "escalated", fact: "The customer reported smoke or sparking.", completed: "Routine troubleshooting was stopped.", pending: "Immediate safety review is pending.", internal: "Smoke/sparking safety escalation" }),
          option("Damaged plug, cord, or exposed electrical part", { status: "escalated", fact: "The customer reported electrical hardware damage.", completed: "Routine troubleshooting was stopped.", pending: "Safety review is pending.", internal: "Electrical hardware damage escalation" }),
          option("Physical damage with uncertain safety risk", { status: "escalated", fact: "Physical damage with possible safety risk was reported.", pending: "Authorized safety assessment is pending.", internal: "Physical-damage safety assessment" }),
          option("No safety symptom; return to model-specific troubleshooting", { status: "blocked", pending: "The case should return to the correct symptom-specific troubleshooting process.", internal: "No safety condition; reroute to troubleshooting" })
        ],
        need: "Exact symptom, model/revision, event timing, and whether the unit is still connected or operating.",
        why: "Potential electrical or heat events should not continue through routine troubleshooting.",
        ask: "For safety, please stop using the unit and unplug it if it is safe to do so. Please do not perform additional troubleshooting.",
        evidence: "Only safe, necessary evidence; never ask the customer to recreate the event.",
        check: "Follow the current approved safety escalation route.",
        action: "Stop normal troubleshooting and document the exact reported condition.",
        notPromise: "Do not promise a warranty outcome or ask the customer to reproduce smoke, sparks, heat, or electrical damage.",
        result: "A complete safety escalation or correct reroute.",
        verified
      }),
      standardCommunicationStep("safety escalation", verified)
    ]
  });
}

function fallbackFlow(process, verified) {
  const topic = process.title.toLowerCase();
  return flow({
    title: process.title,
    purpose: `${process.summary} Verify the exact ${topic} state without converting a request or approval into a completed action.`,
    status: process.status,
    whenToUse: `Use when the customer’s request specifically matches ${process.title}.`,
    evidenceChecklist: [`Information required for ${process.title}`, "Responsible live-system record", "Confirmed reference for any completed action"],
    scenario: `An anonymized ${process.title} case requiring exact facts, evidence, and next-step wording.`,
    steps: [
      guidedStep({
        id: "intake",
        title: `Verify the ${process.title} request`,
        question: `Which ${process.title} intake state is supported by the available case information?`,
        options: [
          option(`Required ${process.title} details are complete`, { fact: `The required ${topic} details were verified.`, internal: `${process.title} intake complete` }),
          option(`Required ${process.title} details are still missing`, { status: "awaiting_customer", missing: `Required ${process.title} details`, pending: `The ${topic} process is waiting for customer information.`, customerAction: "Please provide the exact missing items shown in the process checklist.", internal: `${process.title} details missing` }),
          option(`${process.title} requires a live-system verification`, { status: "awaiting_internal_review", pending: `The ${topic} state requires a live-system check.`, internal: `${process.title} live-system check required` }),
          option(`This case belongs in a different guided process`, { status: "blocked", pending: "The case must be moved to the matching process.", internal: `Reroute from ${process.title}` })
        ],
        need: `Customer request and only the order, product, account, date, or evidence details required by ${process.title}.`,
        why: `The correct action depends on the exact ${topic} facts and live operational state.`,
        ask: `To follow the correct ${process.title} process, may I confirm the affected item and what has happened so far?`,
        evidence: `Only the evidence required by the current approved ${process.title} procedure.`,
        check: "Use the current official source and responsible live system.",
        action: "Record verified facts and list each missing item separately.",
        notPromise: "Do not promise the requested outcome before the applicable evidence, decision, and system event are verified.",
        result: `A complete ${process.title} intake or an exact blocker.`,
        verified
      }),
      guidedStep({
        id: "operational-state",
        title: `Confirm the ${process.title} action state`,
        question: `What is the latest verified operational state for ${process.title}?`,
        options: [
          option(`${process.title} information was requested and is still pending`, { status: "awaiting_customer", pending: `Requested ${topic} information has not been received.`, customerAction: "Please provide the missing information shown in the checklist.", internal: `${process.title} awaiting customer` }),
          option(`${process.title} action was requested but is not complete`, { status: "awaiting_internal_review", completed: `The ${topic} action was requested.`, pending: `The ${topic} action is still pending.`, internal: `${process.title} action requested` }),
          option(`${process.title} was approved, but the approved action is not complete`, { status: "approved_not_completed", completed: `The ${topic} action was approved.`, pending: `The approved ${topic} action is not complete.`, internal: `${process.title} approved; incomplete` }),
          option(`${process.title} action is complete and a reference is confirmed`, { status: "completed", completed: `The ${topic} action was completed.`, internal: `${process.title} completed`, required: [{ field: "reference", label: `${process.title} completion reference`, kind: "internal" }] }),
          option(`${process.title} requires escalation or policy confirmation`, { status: "blocked", pending: `The ${topic} process requires an authorized decision.`, internal: `${process.title} escalated/Needs Confirmation` })
        ],
        need: "The last completed event, exact pending event, responsible owner, and confirmed reference.",
        why: "Requested, approved, processed, created, shipped, received, and completed are not interchangeable.",
        ask: "I’m confirming what has already been completed and what is still pending.",
        evidence: "Responsible live-system record or dated authorized decision.",
        check: "Require a reference before marking the action complete.",
        action: "Record completed and pending events separately.",
        notPromise: "Do not turn a request or approval into a completed action.",
        result: `One exact ${process.title} status.`,
        verified
      }),
      standardCommunicationStep(topic, verified)
    ]
  });
}

export function buildGuidedFlows(processes, existingFlows, verified) {
  const advanced = createAdvancedFlows(verified);
  return Object.fromEntries(processes.map((process) => {
    const selected = advanced[process.id] || existingFlows[process.id] || fallbackFlow(process, verified);
    return [process.id, selected];
  }));
}

export function buildProcessPlaybooks(guidedFlows, processes) {
  return processes.map((process) => {
    const current = guidedFlows[process.id];
    const evidence = current.playbook?.evidenceChecklist?.length
      ? current.playbook.evidenceChecklist
      : [...new Set(current.steps.map((step) => step.evidence).filter(Boolean))];
    return {
      id: process.id,
      title: current.title,
      category: process.category,
      status: current.status,
      whenToUse: current.playbook?.whenToUse || current.purpose,
      overview: current.purpose,
      evidence,
      conflictWarnings: current.playbook?.conflictWarnings || [],
      scenario: current.playbook?.scenario || `An anonymized ${process.title} example.`,
      steps: current.steps
    };
  });
}

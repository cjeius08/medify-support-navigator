export const CALL_FIELDS = [
  "Spoke With", "Name on the Account", "Order Num", "Email Address", "Contact #",
  "Reason for Calling", "ACTION TAKEN", "Offered FC/Cross Sell", "AC Call ID"
];

export const CASE_FIELDS = ["Order ID", "Order Date", "SKU", "Issue", "Resolution"];

export const BLANK_CALL = Object.fromEntries(CALL_FIELDS.map((field) => [field, ""]));
export const BLANK_CASE = Object.fromEntries(CASE_FIELDS.map((field) => [field, ""]));

export const FILTER_SKUS = [
  "MA-10R-2", "MA-12PROPR-1", "MA-12PROUR-1", "MA-14R-1", "MA-14R-2", "MA-15R-1", "MA-15R-2",
  "MA-18R-1", "MA-18R-2", "MA-22R-1", "MA-25R-1", "MA-25R-2", "MA-35R-B1", "MA-35R-B2", "MA-35R-W1", "MA-35R-W2",
  "MA-40E-1", "MA-40E-2", "MA-40E-4", "MA-40UR-1", "MA-40UR-2", "MA-45R-1", "MA-45R-2", "MA-50R-1", "MA-50R-2", "MA-50UR-1",
  "MA-50UR-2", "MA-112PROR-1", "MA-112PROUR-1", "MA-112R-1", "MA-112R-2", "MA-112UR-1", "MA-125R-1", "MA-125UR-1", "MA-125UR-2",
  "MA-1000UR-1", "MA-1400UR-1", "MA-CARR-2", "MA-SMARTR-1", "MA-SmartR-2"
];

export const FILTER_VARIANT_IDS = {
  "MA-10R-2": "43720697348163",
  "MA-112PROR-1": "43720703180867",
  "MA-112PROUR-1": "43720703213635",
  "MA-112R-1": "31576748982339",
  "MA-112R-2": "31576749015107",
  "MA-112UR-1": "39674158383171",
  "MA-125UR-1": "43720703311939",
  "MA-125UR-2": "43720703344707",
  "MA-12PROPR-1": "43720700690499",
  "MA-12PROUR-1": "43720700657731",
  "MA-14R-1": "43720703410243",
  "MA-14R-2": "43720703443011",
  "MA-15R-1": "43720703475779",
  "MA-15R-2": "43720703508547",
  "MA-18R-1": "43720703541315",
  "MA-18R-2": "43720703574083",
  "MA-22R-1": "43720703770691",
  "MA-25R-1": "43720705409091",
  "MA-25R-2": "43720705441859",
  "MA-35R-B1": "43720705736771",
  "MA-35R-B2": "43720705769539",
  "MA-35R-W1": "43720705671235",
  "MA-40E-1": "31576825987139",
  "MA-40E-2": "31576826019907",
  "MA-40E-4": "31987508740163",
  "MA-40UR-1": "39674100252739",
  "MA-40UR-2": "39674100285507",
  "MA-45R-1": "43720705835075",
  "MA-50R-1": "43720696922179",
  "MA-50R-2": "43720696987715",
  "MA-50UR-1": "43720696954947",
  "MA-50UR-2": "43720697020483",
  "MA-SMARTR-1": "32288811188291"
};

export const MASTER_SKUS = [
  "MA-10-B1", "MA-10-B2-VP", "MA-10R-2", "MA-12PROPR-1", "MA-12PROUR-1", "MA-14-B1", "MA-14-B2", "MA-14-W1", "MA-14-W2", "MA-14-W2-VP", "MA-14R-1", "MA-14R-2",
  "MA-15-S1", "MA-15-S2", "MA-15-SMART-W1", "MA-15-W1", "MA-15-W1-VP", "MA-15-W2", "MA-15R-1", "MA-15R-2", "MA-18-B1", "MA-18-B2", "MA-18-W1", "MA-18-W2", "MA-18R-1", "MA-18R-2",
  "MA-22-B1", "MA-22-B2", "MA-22-W1", "MA-22-W1-T", "MA-22-W2", "MA-22R-1", "MA-25-B1", "MA-25-B2", "MA-25-S1", "MA-25-S2", "MA-25-W1", "MA-25-W1-VP", "MA-25-W2", "MA-25-W2-VP", "MA-25PR-1", "MA-25R-1", "MA-25R-2",
  "MA-35-B1", "MA-35-S1", "MA-35-W1", "MA-35R-B1", "MA-35R-B2", "MA-35R-W1", "MA-35R-W2", "MA-35S-B1", "MA-35S-S1", "MA-35S-W1",
  "MA-40-B1", "MA-40-B2", "MA-40-W1", "MA-40-W1-VP", "MA-40-W1-V3.0", "MA-40-W2", "MA-40-W2-V3.0", "MA-40E-1", "MA-40E-2", "MA-40E-4", "MA-40PR-1", "MA-40UR-1", "MA-40UR-2", "MA-40UV-B1", "MA-40UV-B2", "MA-40UV-W1", "MA-40UV-W1-VP", "MA-40UV-W2",
  "MA-45-W1", "MA-45R-1", "MA-45R-2", "MA-50-B1", "MA-50-S1", "MA-50-W1", "MA-50-W1-T", "MA-50R-1", "MA-50R-2", "MA-50UR-1", "MA-50UR-2",
  "MA-112-B1", "MA-112-W1", "MA-112-W1-PRO", "MA-112-W1PRO", "MA-112PRO-W1", "MA-112PROR-1", "MA-112PROUR-1", "MA-112R-1", "MA-112R-2", "MA-112UR-1", "MA-112UV-B1", "MA-112UV-W1",
  "MA-125-B1", "MA-125-W1", "MA-125R-1", "MA-125UR-1", "MA-125UR-2", "MA-1000-W1", "MA-1000UR-1", "MA-1400-W1", "MA-1400UR-1", "MA-CAR-B1", "MA-CARR-2", "MA-PWRCRD-B1", "MA-PWRCRD-G1", "MA-SMARTR-1", "MA-SmartR-2"
];

export const ORDER_CODES = {
  "Warranty Replacement": [
    ["WR-01", "Noise / Sound"], ["WR-02", "Smell / Odor"], ["WR-03", "LED / Light / Control Panel Issue"],
    ["WR-04", "Power / Cord Issue"], ["WR-05", "Damaged Upon Delivery"], ["WR-06", "Damaged / Defective Filter"],
    ["WR-07", "Fan Issue (Fan not turning)"], ["WR-08", "Other Issue / Defect"]
  ],
  "Free Order": [
    ["PR/Influencer Request", "PR/Influencer Orders"], ["Sample Request", ""], ["Free Order | Goodwill |", "Donation"],
    ["Compensation", "Service Failure or Inconvenience"]
  ],
  "Reprocessed Order": [
    ["Missed Promotion", "Promotion was Not Applied at Checkout"], ["Rebuy | XXXXXX", "Order Was Not Captured by Extensiv"],
    ["Stuck Order | XXXXXX", "Tracking Number is Generated, but No Movement"], ["Missing Item | XXXXXX", "Incomplete Order Fulfillment"],
    ["Unfulfilled | XXXXXX", "The entire order has not been fulfilled"]
  ],
  UPS: [
    ["UPS | Lost | XXXXXX", "Tracking Shows No Movement"], ["UPS | Damaged | XXXXXX", "Physical Damage to the Package"],
    ["UPS | Failed Delivery | XXXXXX", "Failed Delivery"]
  ],
  Amazon: [
    ["Amazon | Lost | XXXXXX", "Tracking Shows No Movement"], ["Amazon | Damaged | XXXXXX", "Physical Damage to the Package"],
    ["Amazon | Stuck Order | XXXXXX", "Unshipped / Unfulfilled order/item in Amazon"]
  ]
};

export const ACTION_SNIPPETS = [
  "Photos requested", "Replacement processed", "UPS claim submitted", "Return label sent",
  "Troubleshooting completed", "Filter Club offered", "Address updated", "Subscription updated"
];

export const ISSUE_SNIPPETS = ["Lost", "Damaged", "Warranty Replacement", "Sent RL for return", "Not satisfied with the order", "Power Issue", "LED Issue", "Noise Issue"];
export const RESOLUTION_SNIPPETS = ["Processed replacement", "Processed refund", "Returned to the warehouse", "Processed advance replacement", "Cancelled Filter Club as customer requested", "Processed order as customer requested", "Moved Filter Club charge date as customer requested"];

export const GENERAL_ISSUE_SNIPPETS = [...ISSUE_SNIPPETS, "Flagged for Fraud"];
export const GENERAL_RESOLUTION_SNIPPETS = [...RESOLUTION_SNIPPETS, "Order Cancelled", "Order Refunded", "Sent Email for Fraud"];

export const FRAUD_REVIEW_STATUSES = ["Under Review", "Passed", "Failed"];

export const CASE_TYPES = [
  "General Inquiry", "Warranty Replacement", "Free Order", "Reprocessed Order",
  "UPS Lost Claim", "UPS Damaged Claim", "Return / Refund",
  "Fraud / High Risk", "Flagged for Fraud Review", "Subscription / Filter Club", "Amazon Order"
];

export const CASE_CODE_CATEGORIES = {
  "Warranty Replacement": "Warranty Replacement",
  "Free Order": "Free Order",
  "Reprocessed Order": "Reprocessed Order",
  "Amazon Order": "Amazon"
};

const CASE_SNIPPETS = {
  "Warranty Replacement": {
    issues: ["Noise Issue", "Power Issue", "LED Issue", "Fan Issue", "Damaged / Defective Filter", "Warranty Replacement"],
    resolutions: ["Processed replacement", "Processed advance replacement", "Photos requested"],
    actions: ["Video received", "Troubleshooting completed", "Address updated", "Priority fulfillment requested"]
  },
  "Free Order": {
    issues: ["PR/Influencer Request", "Sample Request", "Goodwill / Donation", "Service Failure or Inconvenience"],
    resolutions: ["Processed order as customer requested", "Replacement processed"]
  },
  "Reprocessed Order": {
    issues: ["Missing Item", "Unfulfilled Order", "Missed Promotion", "Stuck Order", "Order Was Not Captured"],
    resolutions: ["Processed order as customer requested", "Processed replacement", "Order reprocessed"]
  },
  "UPS Lost Claim": {
    issues: ["Lost", "Tracking shows no movement", "Package not received"],
    actions: ["Filed UPS Lost Claim", "Package Search In Progress", "Claim Under Review", "Claim Approved for Payment", "Disputed Claim"]
  },
  "UPS Damaged Claim": {
    issues: ["Damaged", "Damaged packaging", "Item damaged in transit"],
    actions: ["Filed UPS Damaged Claim", "Claim Under Review", "Claim Approved for Payment", "Disputed Claim"]
  },
  "Return / Refund": {
    issues: ["Not satisfied with the order", "Wrong Filter Received", "Return / Refund", "Sent RL for return"],
    resolutions: ["Returned to the warehouse", "Processed refund", "Return instructions provided"]
  },
  "Fraud / High Risk": {
    issues: ["Flagged for Fraud", "Repeated fraudulent order"],
    resolutions: ["Order Cancelled", "Order Refunded", "Sent Email for Fraud"]
  },
  "Subscription / Filter Club": {
    issues: ["Subscription cancellation", "Filter Club change", "Address update", "Charge date change"],
    resolutions: ["Cancelled Filter Club as customer requested", "Moved Filter Club charge date as customer requested", "Subscription updated", "Address updated"]
  },
  "Amazon Order": {
    issues: ["Lost", "Damaged", "Amazon Stuck Order", "Unfulfilled order"],
    resolutions: ["Processed replacement", "Processed refund", "Processed order as customer requested"]
  }
};

export function caseQuickOptions(caseType = "General Inquiry", customerResolution = "") {
  const entry = CASE_SNIPPETS[caseType];
  if (!entry) return { issues: GENERAL_ISSUE_SNIPPETS, resolutions: GENERAL_RESOLUTION_SNIPPETS, actions: [] };
  if (caseType === "UPS Lost Claim" || caseType === "UPS Damaged Claim") {
    const resolutions = customerResolution === "Refund"
      ? ["Processed refund", "Refund pending", "Customer advised"]
      : customerResolution === "Replacement"
        ? ["Processed replacement", "Processed advance replacement", "Replacement pending", "Customer advised"]
        : [];
    return { issues: entry.issues, resolutions, actions: entry.actions };
  }
  return { issues: entry.issues, resolutions: entry.resolutions, actions: entry.actions || [] };
}

export function buildSmartCaseNote(fields = {}, agentInitials, orderCode = null) {
  const caseType = CASE_TYPES.includes(fields.caseType) ? fields.caseType : "General Inquiry";
  const val = (key) => fields[key] || "Not provided";
  if (caseType === "Flagged for Fraud Review") {
    return [
      "Case Type: Flagged for Fraud Review",
      `Order Number: ${val("Order ID")}`,
      `Order Date: ${val("Order Date")}`,
      `Status: ${FRAUD_REVIEW_STATUSES.includes(fields.fraudReviewStatus) ? fields.fraudReviewStatus : "Under Review"}`,
      agentInitials || "Not provided"
    ].join("\n");
  }
  const ups = caseType === "UPS Lost Claim" || caseType === "UPS Damaged Claim";
  const codeCategory = CASE_CODE_CATEGORIES[caseType] || (ups && fields.customerResolution === "Replacement" ? "UPS" : "");
  const base = [
    `Case Type: ${caseType}`,
    `Order ID: ${val("Order ID")}`,
    `Order Date: ${val("Order Date")}`,
    `SKU: ${val("SKU")}`,
    `Issue: ${val("Issue")}`
  ];
  const tracking = String(fields["Tracking Number"] || "").trim();
  if (tracking || String(fields.Issue || "").split("\n").some(line => line.trim() === "Sent RL for return") || ups) {
    base.push(`Tracking Number: ${tracking || "Not provided"}`);
  }
  if (ups) {
    if (String(fields["Claim Number"] || "").trim()) base.push(`Claim Number: ${fields["Claim Number"]}`);
    if (String(fields["Claim Status"] || "").trim()) base.push(`Claim Status: ${fields["Claim Status"]}`);
    base.push(`Action Taken: ${val("Action Taken")}`);
    base.push(`Customer Resolution: ${val("customerResolution")}`);
  }
  if (caseType === "Warranty Replacement" && String(fields["Action Taken"] || "").trim()) base.push(`Action Taken: ${fields["Action Taken"]}`);
  if (codeCategory && orderCode?.[0]) {
    const codeText = replacementCode(codeCategory, orderCode[0], fields["Order ID"] || "");
    base.push(`Category: ${codeCategory}`, `Reason Code: ${codeText}`);
    if (orderCode[1]) base.push(`Description: ${orderCode[1]}`);
  }
  base.push(`Resolution: ${val("Resolution")}`);
  const known = new Set([
    "caseType", "Order ID", "Order Date", "SKU", "Issue", "Tracking Number",
    "Claim Number", "Claim Status", "Action Taken", "customerResolution", "Resolution", "fraudReviewStatus"
  ]);
  for (const [key, value] of Object.entries(fields)) {
    if (!known.has(key) && String(value || "").trim()) base.push(`${key}: ${value}`);
  }
  return [...base, agentInitials || "Not provided"].join("\n");
}


export function hasCaseAction(value, action) {
  return String(value || "").split("\n").some(line => line.trim().toLowerCase() === action.toLowerCase());
}

export function buildWarrantyReply(fields = {}) {
  const name = String(fields["Customer Name"] || "").trim() || "[Customer Name]";
  const model = String(fields["Product Model"] || "").trim();
  const order = String(fields["Replacement Order ID"] || "").trim().replace(/^#\s*/, "");
  const address = String(fields["Updated Shipping Address"] || "").trim();
  const actions = fields["Action Taken"] || "";
  const resolution = fields.Resolution || "";
  const video = hasCaseAction(actions, "Video received");
  const troubleshooting = hasCaseAction(actions, "Troubleshooting completed");
  const addressUpdated = hasCaseAction(actions, "Address updated");
  const priority = hasCaseAction(actions, "Priority fulfillment requested");
  const processed = ["Processed replacement", "Processed advance replacement"].some(action => hasCaseAction(resolution, action));

  const paragraphs = [
    `Hi ${name},`,
    "",
    `Thank you so much for your patience${model ? ` while we worked on the issue with your ${model}` : ""}.`
  ];

  if (troubleshooting) paragraphs.push("", "We appreciate you taking the time to complete the troubleshooting steps.");
  if (video) paragraphs.push("", "Thank you for sending us the video.");
  if (addressUpdated) paragraphs.push("", "Thank you for confirming your updated shipping address.");

  if (processed) {
    paragraphs.push(
      "",
      `I was able to process your replacement order, and your new order number is ${order ? `#${order}` : "[Replacement Order Number]"}.`
    );
  } else {
    paragraphs.push("", "We're here to assist you with your warranty replacement and will keep you updated on the next steps.");
  }

  if (addressUpdated) {
    paragraphs.push("", "We've updated the shipping address for your replacement to:", address || "[Updated Shipping Address]");
  }

  if (processed) {
    paragraphs.push(
      "",
      "Once your order has been processed, it will be fulfilled and shipped in 1–3 business days and delivered within 3–7 business days after.",
      "An email confirmation will be sent once the order ships and the tracking information is available."
    );
  }

  if (processed && priority) {
    paragraphs.push(
      "",
      "I've also made a special request to include your order in today's fulfillment batch so we can try to get it out sooner than the standard timeframe, if possible."
    );
  }

  if (processed) {
    paragraphs.push(
      "",
      "The warranty will be transferred to the replacement unit we're sending you, so there's no need to register it again.",
      "",
      "There's no need to send the defective unit back. You may properly dispose of it as you see fit."
    );
  }

  paragraphs.push("", "Thank you again for your patience.", "", "Warm regards,");
  return paragraphs.join("\n");
}

export function canCopyWarrantyReply(fields = {}) {
  if (!String(fields["Customer Name"] || "").trim()) return false;
  if (hasCaseAction(fields["Action Taken"], "Address updated") && !String(fields["Updated Shipping Address"] || "").trim()) return false;
  const processed = ["Processed replacement", "Processed advance replacement"].some(action => hasCaseAction(fields.Resolution, action));
  if (processed && !String(fields["Replacement Order ID"] || "").trim().replace(/^#\s*/, "")) return false;
  return true;
}

export const FRAUD_EMAIL_TYPES = {
  "Fraud - Initial Cancellation Email": "initial",
  "Fraud - Repeat Order Follow-Up Email": "repeat"
};

export const EMAIL_TEMPLATES = {
  "Warranty Replacement Reply": { Issue: "Warranty Replacement", Resolution: "" },
  "High Risk of Fraud Detected": { Issue: "Flagged for Fraud", Resolution: "" },
  "Fraud - Initial Cancellation Email": { Issue: "Flagged for Fraud", Resolution: "" },
  "Fraud - Repeat Order Follow-Up Email": { Issue: "Flagged for Fraud", Resolution: "" },
  "Return / Refund": { Issue: "Return / Refund", Resolution: "" },
  "Delivered — Not Received": { Issue: "Delivered — Not Received", Resolution: "" },
  "Warranty Photo Request": { Issue: "Warranty photo request", Resolution: "Photos requested for warranty review." },
  "Cancellation Confirmation": { Issue: "Cancellation request", Resolution: "Cancellation confirmed." },
  "Wrong Filter Return": { Issue: "Wrong filter received", Resolution: "Return instructions provided." },
  "Address Update": { Issue: "Address update", Resolution: "Address updated." },
  "Subscription Cancellation": { Issue: "Subscription cancellation", Resolution: "Subscription cancellation processed." }
};

export function parseFraudOrderNumbers(value = "") {
  return [...new Set(String(value).split(/[,;\n]+/).map((part) => part.trim().replace(/^#+\s*/, "")).filter(Boolean))];
}

export function buildFraudEmail(kind, customerName = "", orderNumbers = "") {
  const name = String(customerName).trim() || "[Customer Name]";
  const orders = parseFraudOrderNumbers(orderNumbers);
  const formatted = orders.map((number) => `#${number}`);
  const joined = formatted.length <= 2 ? formatted.join(" and ") : `${formatted.slice(0, -1).join(", ")}, and ${formatted.at(-1)}`;
  const orderText = joined || "[Order Number(s)]";
  const plural = orders.length > 1;

  const signature = [
    "Best regards,",
    "",
    "Medify Air Customer Service Team",
    "info@medifyair.com | 888-258-1008"
  ];
  if (kind === "initial") {
    return [
      `Hi ${name},`,
      "",
      "We hope this message finds you well. We regret to inform you that your recent " +
        `${plural ? "orders" : "order"} ${orderText} ${plural ? "have" : "has"} been flagged as ${plural ? "potentially fraudulent transactions" : "a potentially fraudulent transaction"}.`,
      "",
      "Our fraud analysis team has detected several high-risk indicators associated with " +
        `${plural ? "these orders" : "this order"}, leading us to cancel ${plural ? "them" : "it"} as a precautionary measure. ` +
        "If you believe this action was taken in error, we kindly ask you to consider reviewing and updating your shipping and billing details, ensuring the accuracy of all information provided, including credit card details, before placing a new order.",
      "",
      "Should you require further assistance or wish to discuss this matter, please feel free to reply to this email or contact us at (888) 258-1008.",
      "",
      "Thank you for your understanding.",
      "",
      ...signature
    ].join("\n");
  }
  if (kind === "repeat") {
    return [
      `Hi ${name},`,
      "",
      `We hope this email finds you well. Your recent ${plural ? "orders" : "order"} ${orderText} ${plural ? "were" : "was"} unfortunately identified again as potentially fraudulent.`,
      "",
      "According to our fraud analysis team, there were high-risk indicators of fraudulent activity, so " +
        `${plural ? "these orders were" : "this order was"} cancelled as a precautionary measure. ` +
        "If this was in error, please try to place a new order after carefully reviewing your shipping and billing information, spelling, and credit card details.",
      "",
      "Alternatively, you may try placing an order from a different platform, such as Amazon or Walmart.",
      "",
      "Thank you for your understanding. Please don't hesitate to reach out to us if you have any other questions.",
      "",
      ...signature
    ].join("\n");
  }
  return "";
}

export const CLAIM_STATUSES = ["Claim Issued", "Package Search In Progress", "On Going", "Disputed Claim", "Claim Approved for Payment"];
export const PERIODS = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

export function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function formatClock(seconds) {
  const value = Math.max(0, Math.floor(seconds || 0));
  return new Date(value * 1000).toISOString().slice(11, 19);
}

export function formatDuration(seconds) {
  const value = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = value % 60;
  return hours ? `${hours}h ${minutes}m ${rest}s` : `${minutes}m ${rest}s`;
}

export function detectCallDriver(fields = {}) {
  const text = `${fields["Reason for Calling"] || ""} ${fields["ACTION TAKEN"] || ""}`.toLowerCase();
  if (/(filter club|subscription|filter\b).*(cancel|stop|skip)|(?:cancel|stop|skip).*(filter club|subscription|filter\b)/.test(text)) return "Filter Club Cancellation";
  if (/filter club|subscription|subscribe|filter\b/.test(text)) return "Filter Club";
  if (/return|refund/.test(text)) return "Return / Refund";
  if (/cancel/.test(text)) return "Order Cancellation";
  if (/warranty|replacement|defective/.test(text)) return "Warranty / Replacement";
  if (/not working|noise|smell|odor|power|troubleshoot|reset/.test(text)) return "Troubleshooting";
  if (/(ups|package|shipment|delivery).*(lost|missing)|(?:lost|missing).*(ups|package|shipment|delivery)/.test(text)) return "UPS Lost";
  if (/(ups|package|shipment|delivery).*(damaged|damage|broken)/.test(text)) return "UPS Damaged";
  if (/discount|coupon|promo/.test(text)) return "Discount";
  if (/hsa|fsa/.test(text)) return "HSA/FSA";
  if (/tracking|shipping|delivery|address|carrier|ups|order status/.test(text)) return "Order / Shipping";
  return "General Inquiry";
}

export function buildNote(fields = {}, agentInitials) {
  const baseOrder = ["Order ID", "Order Date", "SKU", "Issue"];
  const withTracking = Object.prototype.hasOwnProperty.call(fields, "Tracking Number")
    ? [...baseOrder, "Tracking Number", "Resolution"]
    : [...baseOrder, "Resolution"];
  const known = new Set(withTracking);
  const extras = Object.keys(fields).filter((key) => !known.has(key));
  return [...withTracking, ...extras]
    .map((key) => `${key}: ${fields[key] || "Not provided"}`)
    .concat(agentInitials || "Not provided")
    .join("\n");
}

export function buildCallNote(fields = {}, agentInitials) {
  const orderedFields = [
    "Spoke With", "Name on the Account", "Order Num", "Email Address", "Contact #",
    "Reason for Calling", "ACTION TAKEN", "Offered FC/Cross Sell", "AC Call ID"
  ];
  return [...orderedFields.map((key) => `${key}: ${fields[key] || "Not provided"}`), agentInitials || "Not provided"].join("\n");
}

export function filterConversionDetails(filter = {}) {
  return Object.entries(filter.selected || {}).flatMap(([originalSku, totalValue]) => {
    const originalQuantity = Math.floor(Number(totalValue) || 0);
    const conversion = filter.conversions?.[originalSku];
    const targetSku = String(conversion?.sku || "").trim();
    if (originalQuantity <= 0 || targetSku === originalSku || !FILTER_SKUS.includes(targetSku)) return [];

    // Existing saved drafts that do not have sourceQuantity safely default to one.
    const sourceQuantity = Math.min(originalQuantity, Math.max(1, Math.floor(Number(conversion.sourceQuantity) || 1)));
    const targetQuantity = Math.max(1, Math.floor(Number(conversion.quantity) || 1));
    return [{ originalSku, originalQuantity, sourceQuantity, targetSku, targetQuantity, remaining: originalQuantity - sourceQuantity }];
  });
}

export function effectiveFilterRows(filter = {}) {
  const conversions = new Map(filterConversionDetails(filter).map((entry) => [entry.originalSku, entry]));
  const grouped = new Map();
  const addRow = (sku, quantity, status) => {
    if (quantity <= 0) return;
    const key = `${sku}|${status}`;
    const existing = grouped.get(key);
    if (existing) existing.quantity += quantity;
    else grouped.set(key, { sku, quantity, status });
  };
  for (const [originalSku, totalValue] of Object.entries(filter.selected || {})) {
    const total = Math.floor(Number(totalValue) || 0);
    if (total <= 0) continue;
    const entry = conversions.get(originalSku);
    if (entry) {
      addRow(originalSku, entry.remaining, "Unchanged");
      addRow(entry.targetSku, entry.targetQuantity, "Converted");
    } else addRow(originalSku, total, "Unchanged");
  }
  return [...grouped.values()];
}

export function buildFilterNote(filter = {}, agentInitials, variantIds = FILTER_VARIANT_IDS) {
  const effective = effectiveFilterRows(filter);
  const conversions = filterConversionDetails(filter);
  const converted = conversions.length > 0;
  const convertedSources = new Set(conversions.map(({ originalSku }) => originalSku));
  const skuIdLine = (sku) => `${sku}: ${variantIds[sku] || ""}`;

  const variantLines = !converted
    ? effective.length === 1
      ? [`New Variant ID#: ${variantIds[effective[0].sku] || ""}`]
      : effective.length > 1
        ? ["New Variant ID#:", ...effective.map(({ sku }) => skuIdLine(sku))]
        : ["New Variant ID#:"]
    : [
        "Original Variant ID#:",
        ...[...convertedSources].map(skuIdLine),
        "New Variant ID#:",
        ...[...new Set(effective
          .filter(({ sku, status }) => status === "Converted" || !convertedSources.has(sku))
          .map(({ sku }) => sku))].map(skuIdLine)
      ];

  const conversionNotes = conversions.flatMap(({ originalSku, sourceQuantity, targetSku, targetQuantity, remaining }) => [
    `Converted ${originalSku} x${sourceQuantity} to ${targetSku} x${targetQuantity}`,
    ...(remaining > 0 ? [`Remaining ${originalSku} x${remaining} unchanged`] : [])
  ]);

  const manualNotes = String(filter.notes || "").trim();
  const additional = [...conversionNotes, ...(manualNotes ? [manualNotes] : [])];
  const additionalLines = !additional.length
    ? []
    : converted
      ? ["Additional Notes:", ...additional]
      : [`Additional Notes: ${manualNotes}`];

  return [
    "Swapped Filter Subscription",
    "Filter(s):",
    ...(effective.length
      ? effective.map(({ sku, quantity, status }) => `${sku} x${quantity}${converted ? ` (${status})` : ""}`)
      : ["Not provided"]),
    `Reason: ${filter.reason || "Not provided"}`,
    ...variantLines,
    ...additionalLines,
    agentInitials || "Not provided"
  ].join("\n");
}

export function replacementCode(category, reasonCode, orderId) {
  const id = orderId?.trim() || "XXXXXX";
  const resolved = (reasonCode || "").replaceAll("XXXXXX", id).trim();
  if (!resolved) return [category, id].filter(Boolean).join(" | ");
  const labelled = resolved.startsWith(`${category} | `) ? resolved : [category, resolved].join(" | ");
  return labelled.includes(id) ? labelled : `${labelled} | ${id}`;
}

export function buildOrderNote(order, code, agentInitials) {
  const displayCode = (code?.[0] || "").replaceAll("XXXXXX", order["Order ID"] || "XXXXXX");
  return [
    ...CASE_FIELDS.map((field) => `${field}: ${order[field] || "Not provided"}`), `Category: ${order.category || "Not provided"}`,
    `Reason Code: ${displayCode || "Not provided"}`, `Description: ${code?.[1] || "Not provided"}`, agentInitials || "Not provided"
  ].join("\n");
}

export function buildClaimNote(claim, agentInitials, number) {
  return [
    ...(number ? [`Claim ${number} — ${claim.type || "Damaged"}`] : []), `Claim Number: ${claim["Claim Number"] || "Not provided"}`, `Tracking Number: ${claim["Tracking Number"] || "Not provided"}`,
    `Claim Status: ${claim["Claim Status"] || "Not provided"}`, ...(claim.invoice ? ["Uploaded Invoice"] : []), agentInitials || "Not provided"
  ].join("\n");
}

export function appendSnippet(current, snippet) {
  return current.trim() ? `${current.trim()}\n${snippet}` : snippet;
}

export function reportDate(report) { return new Date(report.start || report.stop); }

export function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function followupState(report, now = new Date()) {
  const fields = report.fields || {};
  const needed = report.followUpNeeded ?? fields["Follow-up Needed"] === "Yes";
  const date = report.followUpDate ?? fields["Follow-up Date"];
  if (!needed || !date) return "none";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${date}T00:00:00`);
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "upcoming";
}

export function periodKey(report, period) {
  const date = reportDate(report);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (period === "Daily") return localDateKey(date);
  if (period === "Weekly") {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - ((date.getDay() + 6) % 7));
    return localDateKey(monday);
  }
  if (period === "Monthly") return `${year}-${String(month).padStart(2, "0")}`;
  return period === "Quarterly" ? `${year} Q${Math.floor((month - 1) / 3) + 1}` : `${year}`;
}

export function trendPoints(reports, period) {
  const labels = period === "Daily" ? Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, "0")}:00`) : period === "Weekly" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : period === "Monthly" ? Array.from({ length: 31 }, (_, index) => String(index + 1)) : period === "Quarterly" ? ["Q1", "Q2", "Q3", "Q4"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const counts = labels.map(() => 0);
  reports.forEach((report) => {
    const date = reportDate(report);
    let index = 0;
    if (period === "Daily") index = date.getHours();
    if (period === "Weekly") index = (date.getDay() + 6) % 7;
    if (period === "Monthly") index = date.getDate() - 1;
    if (period === "Quarterly") index = Math.floor(date.getMonth() / 3);
    if (period === "Yearly") index = date.getMonth();
    counts[index] += 1;
  });
  return labels.map((label, index) => ({ label, value: counts[index] }));
}


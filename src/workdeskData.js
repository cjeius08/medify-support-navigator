export const CALL_FIELDS = [
  "Spoke With", "Name on the Account", "Order Num", "Email Address", "Contact #",
  "Reason for Calling", "ACTION TAKEN", "Offered FC/Cross Sell", "AC Call ID"
];

export const CASE_FIELDS = ["Order ID", "Order Date", "SKU", "Issue", "Resolution"];

export const BLANK_CALL = Object.fromEntries(CALL_FIELDS.map((field) => [field, ""]));
export const BLANK_CASE = Object.fromEntries(CASE_FIELDS.map((field) => [field, ""]));

export const FILTER_SKUS = [
  "MA-10R-2", "MA-12PROPR-1", "MA-12PROUR-1", "MA-14R-1", "MA-14R-2", "MA-15R-1", "MA-15R-2",
  "MA-18R-1", "MA-18R-2", "MA-22R-1", "MA-25R-1", "MA-25R-2", "MA-35R-B1", "MA-35R-B2",
  "MA-40E-1", "MA-40E-2", "MA-40UR-1", "MA-45R-1", "MA-50R-1", "MA-50R-2", "MA-50UR-1",
  "MA-50UR-2", "MA-112PROR-1", "MA-112PROUR-1", "MA-112UR-1", "MA-125UR-1", "MA-125UR-2"
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

export const EMAIL_TEMPLATES = {
  "Delivered — Not Received": { Issue: "Delivered — Not Received", Resolution: "" },
  "Warranty Photo Request": { Issue: "Warranty photo request", Resolution: "Photos requested for warranty review." },
  "Cancellation Confirmation": { Issue: "Cancellation request", Resolution: "Cancellation confirmed." },
  "Wrong Filter Return": { Issue: "Wrong filter received", Resolution: "Return instructions provided." },
  "Address Update": { Issue: "Address update", Resolution: "Address updated." },
  "Subscription Cancellation": { Issue: "Subscription cancellation", Resolution: "Subscription cancellation processed." }
};

export const CLAIM_STATUSES = ["Claim Issued", "Package Search In Progress", "On Going"];
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

export function buildNote(fields, agentInitials) {
  return [...Object.entries(fields).map(([key, value]) => `${key}: ${value || "Not provided"}`), `Agent Initials: ${agentInitials || "Not provided"}`].join("\n");
}

export function buildFilterNote(filter, agentInitials) {
  const selected = Object.entries(filter.selected || {}).filter(([, quantity]) => quantity > 0);
  return [
    "Swapped Filter Subscription", "Filter(s):", ...(selected.length ? selected.map(([sku, quantity]) => `${sku} x${quantity}`) : ["Not provided"]),
    `Reason: ${filter.reason || "Not provided"}`, ...(filter.notes ? [`Additional Notes: ${filter.notes}`] : []), `Agent Initials: ${agentInitials || "Not provided"}`
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
    `Reason Code: ${displayCode || "Not provided"}`, `Description: ${code?.[1] || "Not provided"}`, `Agent Initials: ${agentInitials || "Not provided"}`
  ].join("\n");
}

export function buildClaimNote(claim, agentInitials) {
  return [
    `Claim Number: ${claim["Claim Number"] || "Not provided"}`, `Tracking Number: ${claim["Tracking Number"] || "Not provided"}`,
    `Claim Status: ${claim["Claim Status"] || "Not provided"}`, ...(claim.invoice ? ["Uploaded Invoice"] : []), `Agent Initials: ${agentInitials || "Not provided"}`
  ].join("\n");
}

export function appendSnippet(current, snippet) {
  return current.trim() ? `${current.trim()}\n${snippet}` : snippet;
}

export function reportDate(report) { return new Date(report.stop || report.start); }

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
  if (period === "Daily") return date.toISOString().slice(0, 10);
  if (period === "Weekly") {
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return monday.toISOString().slice(0, 10);
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

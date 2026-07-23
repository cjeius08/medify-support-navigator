import {
  guidedFlows,
  noteHeadings,
  products,
  supportOnlyProducts,
  workflows
} from "../src/data.js";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const recommend = (area, ceiling = 8) => {
  if (!Number.isFinite(area) || area <= 0 || !Number.isFinite(ceiling) || ceiling <= 0) return null;
  const effectiveArea = area * (ceiling / 8);
  return products
    .filter((product) => product.finderEligible && product.coverage >= effectiveArea)
    .sort((a, b) => a.coverage - b.coverage)[0] || null;
};

const cases = [
  [0, 8, null],
  [-1, 8, null],
  [1, 8, "MA-14"],
  [213, 8, "MA-14"],
  [213.01, 8, "MA-22"],
  [278, 8, "MA-22"],
  [278.01, 8, "MA-25"],
  [413, 8, "MA-25"],
  [413.01, 8, "MA-35"],
  [656, 8, "MA-35"],
  [656.01, 8, "MA-40"],
  [896, 8, "MA-40"],
  [896.01, 8, "MA-50"],
  [1320, 8, "MA-50"],
  [1320.01, 8, "MA-112"],
  [2228, 8, "MA-112"],
  [2228.01, 8, null],
  [500, 16, "MA-50"]
];

for (const [area, ceiling, expected] of cases) {
  const actual = recommend(area, ceiling)?.model || null;
  assert(actual === expected, `Expected ${expected} for ${area} sq ft at ${ceiling} ft; received ${actual}`);
}

const squareMetres = 38.36895552003465;
assert(recommend(squareMetres * 10.7639104167)?.model === "MA-25", "Square-metre conversion boundary must select MA-25");
assert(products.filter((product) => product.finderEligible).every((product) => product.status === "Active"), "Only active models may enter automatic sizing");
assert(!products.find((product) => product.id === "ma-112-pro").finderEligible, "MA-112 PRO must remain excluded while coverage conflicts");
assert(new Set(products.map((product) => product.id)).size === products.length, "Product IDs must be unique");
assert(new Set(workflows.map((workflow) => workflow.id)).size === workflows.length, "Workflow IDs must be unique");
assert(workflows.length === 30, "Exactly 30 workflow records are expected");
assert(Object.keys(guidedFlows).length === 30, "Every workflow must have a guided process");
assert(Object.keys(guidedFlows).every((id) => workflows.some((workflow) => workflow.id === id)), "Every full guide needs a workflow record");
assert(noteHeadings.join(" / ") === "Spoke With / Name on the Account / Order Num / Email Address / Contact # / Reason for Calling / ACTION TAKEN / Offered FC/Cross Sell / AC Call ID / JA", "Call-note headings changed");
assert(supportOnlyProducts.some(([model]) => model === "MA-125"), "MA-125 must remain support-only");
assert(!supportOnlyProducts.some(([model]) => model === "MA-14"), "MA-14 must not be support-only or discontinued");

console.log(`Validated ${cases.length} sizing boundaries, ${products.length} product profiles, and ${workflows.length} workflows.`);

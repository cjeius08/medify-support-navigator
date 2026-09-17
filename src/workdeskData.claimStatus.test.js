import { describe, expect, it } from "vitest";
import { CLAIM_STATUSES } from "./workdeskData";

describe("UPS claim statuses", () => {
  it("includes Claim Approved for Payment", () => {
    expect(CLAIM_STATUSES).toContain("Claim Approved for Payment");
  });
});

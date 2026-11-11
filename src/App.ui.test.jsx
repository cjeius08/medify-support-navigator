// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSupabase, sampleReports } from "../qa/mockSupabase";
import { BLANK_CALL, buildCallNote, periodKey, formatDuration } from "./workdeskData";
import App from "./App";

const mock = vi.hoisted(() => ({ client: null }));
vi.mock("./supabase", () => ({ get supabase() { return mock.client; }, usernameEmail: (name) => `${name.toLowerCase().trim()}@medify.local` }));
const copyText = vi.fn().mockResolvedValue(undefined);
const change = (label, value, root = screen) => fireEvent.change(root.getByLabelText(label, { exact: true }), { target: { value } });
const button = (name, root = screen) => root.getByRole("button", { name, exact: true });
const click = (name, root = screen) => fireEvent.click(button(name, root));
const tool = (title) => within(button(title).closest("section"));
const openApp = async () => { render(<App/>); await screen.findByRole("button", { name: "WorkDesk", exact: true }); await waitFor(() => expect(JSON.parse(localStorage.getItem("medify-call-reports"))).toHaveLength(9)); };

beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks(); mock.client = createMockSupabase();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: copyText } });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("preserved workspace workflows", () => {
  it("navigates all destinations and keeps entered drafts and each tool's independent fold state", async () => {
    await openApp(); change("Spoke With", "QA Caller");
    for (const title of ["Call Notes", "Swapped Filter Subscription", "UPS Claim", "Smart Case Notes"]) {
      click(title); expect(button(title).getAttribute("aria-expanded")).toBe("false");
      click(title); expect(button(title).getAttribute("aria-expanded")).toBe("true");
    }
    click("Call Notes"); click("Reports"); expect(screen.getByRole("heading", {name:"Call Reports"})).toBeTruthy();
    click("Call Drivers"); expect(screen.getByRole("heading", {name:"Call Drivers"})).toBeTruthy();
    click("WorkDesk"); expect(button("Call Notes").getAttribute("aria-expanded")).toBe("false");
    click("Call Notes"); expect(screen.getByLabelText("Spoke With").value).toBe("QA Caller");
    expect(JSON.parse(localStorage.getItem("medify-active-call-draft")).fields["Spoke With"]).toBe("QA Caller");
  });

  it("preserves call note output, quick insert, follow-up, copy and reset", async () => {
    await openApp(); change("Spoke With", "QA Caller"); change("Reason for Calling", "Warranty question"); change("ACTION TAKEN", "Checked order.");
    click("Photos requested"); expect(screen.getByLabelText("ACTION TAKEN").value).toBe("Checked order.\nPhotos requested");
    fireEvent.click(screen.getByLabelText("Follow-up needed")); change("Follow-up Date", "2026-09-20"); change("Follow-up Note", "Review photos");
    fireEvent.click(tool("Call Notes").getAllByRole("button", {name:"Copy Note"})[0]);
    await waitFor(() => expect(copyText).toHaveBeenCalledWith(buildCallNote({...BLANK_CALL, "Spoke With":"QA Caller", "Reason for Calling":"Warranty question", "ACTION TAKEN":"Checked order.\nPhotos requested"}, "JA")));
    expect(JSON.parse(localStorage.getItem("medify-active-call-draft")).followup).toEqual({needed:true,date:"2026-09-20",note:"Review photos"});
    click("Reset", tool("Call Notes")); expect(screen.getByLabelText("Spoke With").value).toBe(""); expect(screen.getByLabelText("Follow-up needed").checked).toBe(false);
  });

  it("handles SKU searching, no matches, quantities, removal, variant and copied utility history", async () => {
    await openApp(); change("Reason", "Variant Error"); change("Filter Model(s)", "MA-50R-1"); click("Add MA-50R-1");
    click("Increase MA-50R-1"); expect(screen.getByLabelText("MA-50R-1 quantity").textContent).toBe("2");
    click("Decrease MA-50R-1"); change("Additional Notes", "Different variant received"); click("Copy Note", tool("Swapped Filter Subscription"));
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("Swapped Filter Subscription\nFilter(s):\nMA-50R-1 x1\nReason: Variant Error\nNew Variant ID#: 43720696922179\nAdditional Notes: Different variant received\nJA"));
    click("Recent"); expect(screen.getByRole("dialog",{name:"Recent utility notes"})).toBeTruthy(); click("Close recent notes");
    click("Remove MA-50R-1"); expect(screen.queryByLabelText("MA-50R-1 quantity")).toBeNull();
    change("Filter Model(s)", "ZZZZ"); expect(screen.getByText("No matching SKU. Try a model like MA-50.")).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText("Filter Model(s)"), {key:"Escape"}); expect(screen.queryByText("No matching SKU. Try a model like MA-50.")).toBeNull();
    click("Reset", tool("Swapped Filter Subscription")); expect(screen.getByLabelText("Reason").value).toBe("Variant Error");
  });

  it("shows missing Smart Case Notes SKUs and selects them using arrow keys or Enter", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("SKU", "MA-35", smart);
    expect(smart.getByRole("button", { name: "Select MA-35-W2" })).toBeTruthy();
    expect(smart.getByRole("button", { name: "Select MA-35-S2" })).toBeTruthy();

    change("SKU", "MA-35-S2", smart);
    const search = smart.getByLabelText("SKU");
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(document.activeElement).toBe(smart.getByRole("button", { name: "Select MA-35-S2" }));
    fireEvent.keyDown(document.activeElement, { key: "Enter" });
    expect(smart.getByText("MA-35-S2")).toBeTruthy();

    change("SKU", "MA-35-W2", smart);
    fireEvent.keyDown(search, { key: "Enter" });
    expect(smart.getByText("MA-35-W2")).toBeTruthy();

    change("SKU", "MA-40-B", smart);
    fireEvent.keyDown(search, { key: "ArrowDown" });
    expect(document.activeElement).toBe(smart.getByRole("button", { name: "Select MA-40-B1" }));
    fireEvent.keyDown(document.activeElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(smart.getByRole("button", { name: "Select MA-40-B2" }));
    fireEvent.keyDown(document.activeElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(smart.getByRole("button", { name: "Select MA-40-B1" }));
    fireEvent.keyDown(document.activeElement, { key: "End" });
    expect(document.activeElement).toBe(smart.getByRole("button", { name: "Select MA-40-B2" }));
    fireEvent.keyDown(document.activeElement, { key: "Enter" });
    expect(smart.getByText("MA-40-B2")).toBeTruthy();
    expect(smart.queryByRole("button", { name: "Select MA-40-B2" })).toBeNull();
  });

  it("supports ↑ ↓ Home End and Escape in filter and conversion SKU suggestions", async () => {
    await openApp();
    const filter = tool("Swapped Filter Subscription");
    change("Filter Model(s)", "MA-45R", filter);
    const filterSearch = filter.getByLabelText("Filter Model(s)");
    fireEvent.keyDown(filterSearch, { key: "ArrowUp" });
    expect(document.activeElement).toBe(filter.getByRole("button", { name: "Add MA-45R-2" }));
    fireEvent.keyDown(document.activeElement, { key: "Home" });
    expect(document.activeElement).toBe(filter.getByRole("button", { name: "Add MA-45R-1" }));
    fireEvent.keyDown(document.activeElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(filterSearch);
    fireEvent.keyDown(filterSearch, { key: "ArrowDown" });
    const first = filter.getByRole("button", { name: "Add MA-45R-1" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "Escape" });
    expect(document.activeElement).toBe(filterSearch);
    expect(filter.queryByRole("button", { name: "Add MA-45R-1" })).toBeNull();

    change("Filter Model(s)", "MA-45R-2", filter);
    fireEvent.keyDown(filterSearch, { key: "Enter" });
    expect(filter.getByText("Original Variant ID#: 43720705867843")).toBeTruthy();
    click("Convert", filter);
    change("Convert MA-45R-2 to", "MA-45R-1", filter);
    fireEvent.keyDown(filter.getByLabelText("Convert MA-45R-2 to"), { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement, { key: "Enter" });
    expect(filter.getByText("New Variant ID#: 43720705835075")).toBeTruthy();
  });

  it("defaults a converted filter quantity to one even when the original quantity is higher", async () => {
    await openApp(); const filterTool = tool("Swapped Filter Subscription");
    change("Filter Model(s)", "MA-50R-1"); click("Add MA-50R-1");
    click("Increase MA-50R-1"); expect(screen.getByLabelText("MA-50R-1 quantity").textContent).toBe("2");
    click("Convert", filterTool); change("Convert MA-50R-1 to", "MA-50R-2", filterTool); click("Use MA-50R-2", filterTool);
    expect(filterTool.queryByRole("button", {name:"Use MA-50R-2"})).toBeNull();
    expect(filterTool.getByLabelText("Converted quantity for MA-50R-1").value).toBe("1");
    click("Copy Note", filterTool);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Filter(s):\nMA-50R-1 x1 (Unchanged)\nMA-50R-2 x1 (Converted)"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Converted MA-50R-1 x1 to MA-50R-2 x1\nRemaining MA-50R-1 x1 unchanged");
  });

  it("converts only two of four MA-50 filters and leaves original/new Variant IDs visible", async () => {
    await openApp(); const filter = tool("Swapped Filter Subscription");
    change("Filter Model(s)", "MA-50R-1", filter);
    click("Add MA-50R-1", filter);
    for (let i = 0; i < 3; i++) click("Increase MA-50R-1", filter);
    expect(filter.getByLabelText("MA-50R-1 quantity").textContent).toBe("4");

    click("Convert", filter);
    change("Convert MA-50R-1 to", "MA-50R-2", filter);
    click("Use MA-50R-2", filter);
    change("Original quantity to convert for MA-50R-1", "2", filter);
    change("Converted quantity for MA-50R-1", "2", filter);

    expect(filter.getAllByText("Original Variant ID#: 43720696922179").length).toBeGreaterThan(0);
    expect(filter.getByText("New Variant ID#: 43720696987715")).toBeTruthy();
    const summary = filter.getByLabelText("Conversion summary for MA-50R-1");
    expect(summary.textContent).toContain("Original filters converted");
    expect(summary.textContent).toContain("Original filters unchanged");
    click("Copy Note", filter);
    const note = copyText.mock.calls.at(-1)[0];
    expect(note).toContain("MA-50R-1 x2 (Unchanged)\nMA-50R-2 x2 (Converted)");
    expect(note).toContain("Original Variant ID#:\nMA-50R-1: 43720696922179");
    expect(note).toContain("New Variant ID#:\nMA-50R-2: 43720696987715");
    expect(note).toContain("Converted MA-50R-1 x2 to MA-50R-2 x2\nRemaining MA-50R-1 x2 unchanged");
  });

  it("uses the converted SKU as the final filter and variant ID while supporting multiple filters", async () => {
    await openApp(); const filterTool = tool("Swapped Filter Subscription");
    expect(screen.getByLabelText("Reason").value).toBe("Variant Error");
    change("Filter Model(s)", "MA-50R-1"); click("Add MA-50R-1");
    click("Convert", filterTool); change("Convert MA-50R-1 to", "MA-50R-2", filterTool); click("Use MA-50R-2", filterTool);
    change("Converted quantity for MA-50R-1", "2", filterTool);
    change("Filter Model(s)", "MA-15R-1"); click("Add MA-15R-1");
    expect(filterTool.getByText("New Variant ID#: 43720696987715")).toBeTruthy();
    click("Copy Note", filterTool);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Swapped Filter Subscription\nFilter(s):\nMA-50R-2 x2 (Converted)\nMA-15R-1 x1 (Unchanged)\nReason: Variant Error\nOriginal Variant ID#:\nMA-50R-1: 43720696922179\nNew Variant ID#:\nMA-50R-2: 43720696987715\nMA-15R-1: 43720703475779\nAdditional Notes:\nConverted MA-50R-1 x1 to MA-50R-2 x2\nJA"));
  });

  it("uses one Smart Case Notes card for SKU, replacement code and specific quick inserts", async () => {
    await openApp();
    expect(tool("Call Notes").getByLabelText("Call Notes actions").className).toContain("call-notes-actions");
    const smart = tool("Smart Case Notes");
    expect(screen.queryByRole("button", { name: "Order Codes / Replacement", exact: true })).toBeNull();
    expect(screen.queryByRole("button", { name: "Email / General Case Notes", exact: true })).toBeNull();

    change("Case Type", "Warranty Replacement", smart);
    change("Order ID", "QA-112", smart);
    change("SKU", "ma-112", smart); click("Select MA-112-B1", smart);
    change("SKU", "ma-112", smart); click("Select MA-112-W1", smart);
    expect(smart.getByText("MA-112-W1")).toBeTruthy();
    expect(smart.queryByRole("button", { name: "Flagged for Fraud", exact: true })).toBeNull();
    click("Noise Issue", smart);
    click("Processed replacement", smart);
    expect(smart.getByLabelText("Issue").value).toBe("Noise Issue");
    expect(smart.getByLabelText("Resolution").value).toBe("Processed replacement");
    expect(smart.getByLabelText("Reason Code").value).toBe("WR-01");
    click("Copy Code", smart);
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("Warranty Replacement | WR-01 | QA-112"));
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Case Type: Warranty Replacement"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Reason Code: Warranty Replacement | WR-01 | QA-112");
  });

  it("makes Smart Case quick actions reversible and automatically switches UPS Damaged email stages", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Case Type", "UPS Damaged Claim", smart);
    const workflow = smart.getByLabelText("Smart Case workflow guidance");
    expect(workflow.textContent).toContain("UPS damaged claim");
    click("Photos requested", smart);
    expect(smart.getByRole("button", { name: "Photos requested" }).getAttribute("aria-pressed")).toBe("true");
    expect(workflow.textContent).toContain("Photos requested");
    expect(smart.getByLabelText("Generated UPS Email").value).toContain("packaging material");
    let checklist = smart.getByLabelText("UPS Email copy checklist");
    expect(checklist.textContent).toContain("Customer Name");
    click("Photos requested", smart);
    expect(smart.getByRole("button", { name: "Photos requested" }).getAttribute("aria-pressed")).toBe("false");
    expect(smart.queryByLabelText("Generated UPS Email")).toBeNull();
    expect(smart.getByLabelText("Action Taken").value).toBe("");
    click("Photos Sent", smart);
    expect(workflow.textContent).toContain("Photos received");
    expect(smart.getByLabelText("Generated UPS Email").value).toContain("Thank you so much for sending the photos");
    change("Customer Name", "Alex", smart);
    change("Customer Resolution", "Replacement", smart);
    checklist = smart.getByLabelText("UPS Email copy checklist");
    expect(checklist.textContent).toContain("Processed replacement");
    expect(checklist.textContent).toContain("New Replacement Order Number");
    click("Processed replacement", smart);
    change("New Replacement Order Number", "811371", smart);
    expect(checklist.textContent).toContain("Ready to copy");
    expect(smart.getByRole("button", { name: "Copy UPS Email" }).disabled).toBe(false);
    click("Priority fulfillment requested", smart);
    expect(smart.getByLabelText("Generated UPS Email").value).toContain("today's fulfillment batch");
    click("Priority fulfillment requested", smart);
    expect(smart.getByLabelText("Generated UPS Email").value).not.toContain("today's fulfillment batch");
    click("Processed replacement", smart);
    expect(smart.getByRole("button", { name: "Processed replacement" }).getAttribute("aria-pressed")).toBe("false");
    expect(smart.getByRole("button", { name: "Copy UPS Email" }).disabled).toBe(true);
    expect(checklist.textContent).toContain("Processed replacement");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Photos Sent"));
    expect(copyText.mock.calls.at(-1)[0]).not.toContain("Priority fulfillment requested");
    expect(copyText.mock.calls.at(-1)[0]).not.toContain("Resolution: Processed replacement");
  });

  it("guides return/refund and warranty cases with clear copy requirements", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Case Type", "Return / Refund", smart);
    click("Not satisfied with the order", smart);
    expect(smart.getByLabelText("Smart Case workflow guidance").textContent).toContain("Not Satisfied remains notes-only");
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    click("Not satisfied with the order", smart);
    click("Wrong Filter Received", smart);
    click("Sent RL for return", smart);
    const checklist = smart.getByLabelText("Return / Refund Email copy checklist");
    expect(checklist.textContent).toContain("Customer Name");
    expect(checklist.textContent).toContain("Return Outcome: Refund or Replacement");
    expect(checklist.textContent).toContain("Return Tracking Number");
    expect(smart.getByRole("button", { name: "Copy Return/Refund Email" }).disabled).toBe(true);
    change("Customer Name", "Kim", smart);
    change("Return Outcome", "Replacement", smart);
    change("Tracking Number", "1ZRETURN", smart);
    expect(checklist.textContent).toContain("Ready to copy");
    expect(smart.getByRole("button", { name: "Copy Return/Refund Email" }).disabled).toBe(false);
    click("Sent RL for return", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    expect(smart.getByLabelText("Issue").value).toBe("Wrong Filter Received");
    change("Case Type", "Warranty Replacement", smart);
    expect(smart.getByLabelText("Warranty Email copy checklist").textContent).toContain("Customer Name");
    change("Customer Name", "Kim", smart);
    expect(smart.getByLabelText("Warranty Email copy checklist").textContent).toContain("Ready to copy");
    click("Processed replacement", smart);
    expect(smart.getByLabelText("Warranty Email copy checklist").textContent).toContain("Replacement Order Number");
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(true);
    change("Replacement Order Number", "811370", smart);
    expect(smart.getByLabelText("Warranty Email copy checklist").textContent).toContain("Ready to copy");
  });

  it("shows fraud email missing fields without changing fraud email generation", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Saved template", "Fraud - Initial Cancellation Email", smart);
    const checklist = smart.getByLabelText("Fraud Email copy checklist");
    expect(checklist.textContent).toContain("Customer Name");
    expect(checklist.textContent).toContain("Order Number(s)");
    change("Customer Name", "Kim", smart);
    change("Order Number(s)", "811370", smart);
    expect(checklist.textContent).toContain("Ready to copy");
    expect(smart.getByRole("button", { name: "Copy Email" }).disabled).toBe(false);
    expect(smart.getByLabelText("Email draft").value).toContain("Hi Kim");
  });

  it("shows only UPS Lost Claim actions and a separate Replacement customer resolution", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Case Type", "UPS Lost Claim", smart);
    expect(smart.getByLabelText("Issue")).toBeTruthy();
    expect(smart.getByLabelText("Customer Resolution").value).toBe("");
    expect(smart.queryByRole("button", { name: "Filed UPS Damaged Claim", exact: true })).toBeNull();
    expect(smart.queryByRole("button", { name: "Processed refund", exact: true })).toBeNull();
    change("Customer Resolution", "Replacement", smart);
    change("Order ID", "QA-UPS-1", smart);
    change("Tracking Number", "1Z-UPS-LOST", smart);
    click("Lost", smart); click("Filed UPS Lost Claim", smart); click("Processed replacement", smart);
    expect(smart.getByLabelText("Action Taken").value).toBe("Filed UPS Lost Claim");
    expect(smart.queryByRole("button", { name: "Processed refund", exact: true })).toBeNull();
    expect(smart.getByText("Existing UPS Code")).toBeTruthy();
    click("Copy Code", smart);
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("UPS | Lost | QA-UPS-1"));
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Case Type: UPS Lost Claim"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Tracking Number: 1Z-UPS-LOST");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Filed UPS Lost Claim");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Customer Resolution: Replacement");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Resolution: Processed replacement");
  });

  it("handles UPS Damaged Claim with Refund and excludes replacement quick options and code", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Case Type", "UPS Damaged Claim", smart);
    change("Customer Resolution", "Refund", smart);
    click("Damaged", smart); click("Filed UPS Damaged Claim", smart); click("Processed refund", smart);
    change("Claim Number", "CLM-9", smart);
    change("Claim Status", "Claim Approved for Payment", smart);
    expect(smart.queryByRole("button", { name: "Processed replacement", exact: true })).toBeNull();
    expect(smart.queryByRole("button", { name: "Copy Code", exact: true })).toBeNull();
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Case Type: UPS Damaged Claim"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Filed UPS Damaged Claim");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Customer Resolution: Refund");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Resolution: Processed refund");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Claim Number: CLM-9");
  });

  it("supports optional UPS Lost subcategories and personalized replacement email after Claim Issued", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Saved template", "UPS Lost", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("UPS Lost Claim");
    expect(smart.getByLabelText("UPS Lost Subcategory (optional)").value).toBe("");
    expect(smart.queryByLabelText("UPS customer email generator")).toBeNull();
    change("UPS Lost Subcategory (optional)", "Delivered to Wrong Address", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("UPS Lost Subcategory: Delivered to Wrong Address"));
    change("UPS Lost Subcategory (optional)", "", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).not.toContain("UPS Lost Subcategory:"));
    change("Claim Status", "Claim Issued", smart);
    expect(smart.getByLabelText("UPS customer email generator")).toBeTruthy();
    const email = () => smart.getByLabelText("Generated UPS Email").value;
    const copyButton = () => smart.getByRole("button", { name: "Copy UPS Email" });
    expect(email()).toContain("Hi [Customer Name],");
    expect(copyButton().disabled).toBe(true);
    change("Customer Name", "Kim", smart);
    change("New Replacement Order Number", "811370", smart);
    expect(email()).not.toContain("processed your replacement");
    expect(copyButton().disabled).toBe(true);
    change("Customer Resolution", "Replacement", smart);
    click("Processed replacement", smart);
    expect(email()).toContain("Hi Kim,");
    expect(email()).toContain("claim we filed has been approved");
    expect(email()).toContain("Your new order number is #811370");
    expect(email()).toContain("1–3 business days");
    expect(copyButton().disabled).toBe(false);
    expect(email()).not.toContain("today's fulfillment batch");
    click("Priority fulfillment requested", smart);
    expect(email()).toContain("today's fulfillment batch");
    click("Copy UPS Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Your new order number is #811370"));
    change("Generated UPS Email", "Personalized UPS email", smart);
    click("Copy UPS Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Personalized UPS email"));
    click("Restore UPS Template", smart);
    expect(email()).toContain("claim we filed has been approved");
    change("Customer Resolution", "Refund", smart);
    expect(copyButton().disabled).toBe(true);
    expect(email()).not.toContain("processed your replacement");
    change("Case Type", "UPS Damaged Claim", smart);
    expect(smart.queryByLabelText("UPS Lost Subcategory (optional)")).toBeNull();
    expect(smart.queryByLabelText("UPS customer email generator")).toBeNull();
  });

  it("switches UPS Damaged photo-request and photos-sent emails while preserving claim notes", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Saved template", "UPS Damaged", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("UPS Damaged Claim");
    expect(smart.getByLabelText("Issue").value).toBe("Damaged");
    expect(smart.queryByLabelText("UPS customer email generator")).toBeNull();
    click("Photos requested", smart);
    expect(smart.getByLabelText("UPS customer email generator")).toBeTruthy();
    const email = () => smart.getByLabelText("Generated UPS Email").value;
    const copyButton = () => smart.getByRole("button", { name: "Copy UPS Email" });
    expect(email()).toContain("box manufacturer's certificate");
    expect(email()).toContain("all six sides of the package");
    expect(email()).not.toContain("processed your replacement");
    expect(copyButton().disabled).toBe(true);
    change("Customer Name", "Alex", smart);
    expect(copyButton().disabled).toBe(false);
    click("Copy UPS Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Hi Alex,"));
    click("Photos Sent", smart);
    expect(email()).toContain("Thank you so much for sending the photos we requested");
    expect(email()).not.toContain("box manufacturer's certificate");
    expect(copyButton().disabled).toBe(true);
    change("Customer Resolution", "Replacement", smart);
    click("Processed replacement", smart);
    expect(copyButton().disabled).toBe(true);
    change("New Replacement Order Number", "811371", smart);
    expect(email()).toContain("new order number is #811371");
    expect(email()).toContain("1–3 business days");
    expect(email()).not.toContain("today's fulfillment batch");
    expect(copyButton().disabled).toBe(false);
    click("Priority fulfillment requested", smart);
    expect(email()).toContain("today's fulfillment batch");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Photos requested\nPhotos Sent\nPriority fulfillment requested"));
    click("Copy UPS Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("new order number is #811371"));
    change("Saved template", "Return / Refund", smart);
    expect(smart.queryByLabelText("UPS customer email generator")).toBeNull();
    expect(smart.queryByLabelText("UPS Lost Subcategory (optional)")).toBeNull();
  });

  it("creates a safe warranty reply and adds video/troubleshooting only when selected", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Case Type", "Warranty Replacement", smart);
    expect(smart.getByLabelText("Warranty reply generator")).toBeTruthy();
    const reply = () => smart.getByLabelText("Generated Warranty Reply").value;
    expect(reply()).toContain("Hi [Customer Name],");
    expect(reply()).not.toContain("troubleshooting");
    expect(reply()).not.toContain("video.");
    expect(reply()).not.toContain("I was able to process");
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(true);

    change("Customer Name", "Kim", smart);
    change("Product Model", "MA-35", smart);
    expect(reply()).toContain("Hi Kim,");
    expect(reply()).toContain("your MA-35");

    click("Video received", smart);
    expect(reply()).toContain("Thank you for sending us the video");
    expect(reply()).not.toContain("complete the troubleshooting steps");
    click("Troubleshooting completed", smart);
    expect(reply()).toContain("complete the troubleshooting steps");
    click("Address updated", smart);
    expect(smart.getByLabelText("Updated Shipping Address")).toBeTruthy();
    expect(reply()).toContain("[Updated Shipping Address]");
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(true);
    change("Updated Shipping Address", "16350 S Harbor Blvd, Apt 1408\nSanta Ana, CA 92704", smart);

    expect(reply()).toContain("Santa Ana, CA 92704");
    expect(reply()).not.toContain("I was able to process");
    click("Processed replacement", smart);
    expect(smart.getByLabelText("Replacement Order Number")).toBeTruthy();
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(true);
    change("Replacement Order Number", "811370", smart);
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(false);
    expect(reply()).toContain("I was able to process your replacement order, and your new order number is #811370.");
    click("Copy Warranty Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("I was able to process your replacement order, and your new order number is #811370."));
    expect(copyText.mock.calls.at(-1)[0]).toContain("no need to send the defective unit back");
    expect(copyText.mock.calls.at(-1)[0]).toContain("The warranty will be transferred to the replacement unit");
    expect(copyText.mock.calls.at(-1)[0]).not.toContain("info@medifyair.com");
    expect(copyText.mock.calls.at(-1)[0]).not.toContain("Medify Air Customer Service Team");
    expect(copyText.mock.calls.at(-1)[0]).not.toContain("today's fulfillment batch");
    click("Priority fulfillment requested", smart);
    expect(reply()).toContain("I've also made a special request to include your order in today's fulfillment batch");

    change("Generated Warranty Reply", "Edited draft text", smart);
    click("Copy Warranty Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Edited draft text"));
    click("Restore Warranty Template", smart);
    expect(reply()).toContain("I was able to process your replacement order, and your new order number is #811370.");

    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Video received\nTroubleshooting completed\nAddress updated"));
    change("Case Type", "Return / Refund", smart);
    expect(smart.queryByLabelText("Warranty reply generator")).toBeNull();
    expect(smart.getByLabelText("Issue").value).toBe("");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).not.toContain("Updated Shipping Address"));
  });

  it("keeps warranty template neutral unless a replacement was really processed", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Saved template", "Warranty Replacement Reply", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("Warranty Replacement");
    expect(smart.getByLabelText("Issue").value).toBe("Warranty Replacement");
    expect(smart.getByLabelText("Resolution").value).toBe("");
    expect(smart.getByLabelText("Generated Warranty Reply").value).not.toContain("I was able to process");
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(true);
    change("Customer Name", "Kim", smart);
    expect(smart.getByRole("button", { name: "Copy Warranty Email" }).disabled).toBe(false);
    expect(smart.getByLabelText("Generated Warranty Reply").value).toContain("keep you updated on the next steps");
  });

  it("shows Flagged for Fraud Review with Order Number, Order Date and Under Review only", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Case Type", "Flagged for Fraud Review", smart);
    expect(smart.getByLabelText("Order Number")).toBeTruthy();
    expect(smart.getByLabelText("Order Date")).toBeTruthy();
    expect(smart.getByLabelText("Status").value).toBe("Under Review");
    expect(smart.getByLabelText("Status").tagName).toBe("SELECT");
    expect(Array.from(smart.getByLabelText("Status").options, ({ value }) => value)).toEqual(["Under Review", "Passed", "Failed"]);
    expect(smart.queryByLabelText("SKU")).toBeNull();
    expect(smart.queryByLabelText("Issue")).toBeNull();
    expect(smart.queryByLabelText("Resolution")).toBeNull();
    expect(smart.queryByRole("button", { name: "Order Cancelled", exact: true })).toBeNull();
    change("Order Number", "FR-889", smart);
    change("Order Date", "2026-10-17", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe(
      "Case Type: Flagged for Fraud Review\nOrder Number: FR-889\nOrder Date: 2026-10-17\nStatus: Under Review\nJA"
    ));
    change("Status", "Passed", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Order Date: 2026-10-17\nStatus: Passed\nJA"));
    change("Status", "Failed", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Order Date: 2026-10-17\nStatus: Failed\nJA"));
    change("Case Type", "Fraud / High Risk", smart);
    expect(smart.getByLabelText("Order ID").value).toBe("FR-889");
    expect(smart.getByLabelText("Issue")).toBeTruthy();
    expect(smart.getByRole("button", { name: "Order Cancelled" })).toBeTruthy();
    expect(smart.queryByLabelText("Status")).toBeNull();
    change("Case Type", "Flagged for Fraud Review", smart);
    expect(smart.getByLabelText("Status").value).toBe("Under Review");
  });

  it("generates incorrect-filter return label instructions only after Sent RL for return", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Case Type", "Return / Refund", smart);
    click("Not satisfied with the order", smart);
    click("Sent RL for return", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    change("Issue", "Wrong Filter Received", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    expect(smart.getByLabelText("Return Outcome")).toBeTruthy();
    click("Sent RL for return", smart);
    expect(smart.getByLabelText("Return/refund email generator")).toBeTruthy();
    const email = () => smart.getByLabelText("Generated Return / Refund Email").value;
    const copyEmail = () => smart.getByRole("button", { name: "Copy Return/Refund Email" });
    expect(email()).toContain("[Return Tracking Number]");
    expect(copyEmail().disabled).toBe(true);
    change("Return Outcome", "Refund", smart);
    change("Tracking Number", "1Z123FILTER", smart);
    expect(email()).toContain("tracking number is 1Z123FILTER");
    expect(email()).toContain("we'll process your refund promptly");
    expect(email()).not.toContain("process your replacement promptly");
    expect(email()).toContain("Hi [Customer Name],");
    expect(copyEmail().disabled).toBe(true);
    change("Customer Name", "Kim", smart);
    expect(email().startsWith("Hi Kim,\n\n")).toBe(true);
    expect(copyEmail().disabled).toBe(false);
    click("Photos Sent", smart);
    expect(email()).toContain("Thank you for sending the photos we requested.");
    click("Copy Return/Refund Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("we'll process your refund promptly"));

    change("Return Outcome", "Replacement", smart);
    expect(email()).toContain("we'll process your replacement promptly");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Return Outcome: Replacement"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Photos Sent");

    change("Generated Return / Refund Email", "Edited return email", smart);
    click("Copy Return/Refund Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Edited return email"));
    click("Restore Return Template", smart);
    expect(email()).toContain("we'll process your replacement promptly");

    change("Issue", "Not satisfied with the order", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    expect(smart.queryByLabelText("Return Outcome")).toBeNull();
  });

  it("shows the processed refund confirmation only via its saved template and gates Attached Invoice wording", async () => {
    await openApp();
    const smart = tool("Smart Case Notes");
    change("Saved template", "Order Returned – Processed Refund", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("Return / Refund");
    expect(smart.getByLabelText("Issue").value).toBe("Order Returned");
    expect(smart.getByLabelText("Resolution").value).toContain("Returned to the warehouse\nProcessed refund");
    expect(smart.getByLabelText("Return/refund email generator")).toBeTruthy();
    const email = () => smart.getByLabelText("Generated Return / Refund Email").value;
    expect(email()).toContain("we went ahead and processed your refund");
    expect(email()).toContain("5–10 business days");
    expect(email()).not.toContain("attached a copy of the invoice");
    expect(email().startsWith("Hi [Customer Name],\n\n")).toBe(true);
    expect(smart.getByRole("button", { name: "Copy Return/Refund Email" }).disabled).toBe(true);
    change("Customer Name", "Kim", smart);
    expect(email().startsWith("Hi Kim,\n\n")).toBe(true);
    expect(smart.getByRole("button", { name: "Copy Return/Refund Email" }).disabled).toBe(false);
    click("Attached Invoice", smart);
    expect(email()).toContain("I've also attached a copy of the invoice showing the refund we processed today.");
    click("Copy Return/Refund Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Spam or Junk folder"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Hi Kim,");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Action Taken: Attached Invoice"));

    change("Resolution", "Returned to the warehouse", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    change("Saved template", "Wrong Filter Return", smart);
    expect(smart.getByLabelText("Issue").value.toLowerCase()).toBe("wrong filter received");
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    click("Sent RL for return", smart);
    expect(smart.getByLabelText("Return/refund email generator")).toBeTruthy();
    expect(smart.getByLabelText("Customer Name").value).toBe("Kim");
    change("Saved template", "Return / Refund", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    change("Case Type", "Warranty Replacement", smart);
    expect(smart.queryByLabelText("Return/refund email generator")).toBeNull();
    expect(smart.getByLabelText("Generated Warranty Reply")).toBeTruthy();
  });

  it("keeps fraud quick inserts limited to the Fraud case and retains fraud email templates", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Case Type", "Warranty Replacement", smart);
    expect(smart.queryByRole("button", { name: "Order Refunded", exact: true })).toBeNull();
    change("Saved template", "High Risk of Fraud Detected", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("Fraud / High Risk");
    expect(smart.getByLabelText("Issue").value).toBe("Flagged for Fraud");
    click("Order Cancelled", smart); click("Order Refunded", smart); click("Sent Email for Fraud", smart);
    expect(smart.getByLabelText("Resolution").value).toBe("Order Cancelled\nOrder Refunded\nSent Email for Fraud");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Issue: Flagged for Fraud\nResolution: Order Cancelled\nOrder Refunded\nSent Email for Fraud\nJA"));

    change("Saved template", "Fraud - Initial Cancellation Email", smart);
    expect(smart.getByRole("button", { name: "Copy Email" }).disabled).toBe(true);
    change("Customer Name", "Ronald", smart);
    change("Order Number(s)", "730889, 730890", smart);
    expect(smart.getByLabelText("Email draft").value).toContain("recent orders #730889 and #730890 have been flagged");
    click("Copy Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Hi Ronald,"));
    change("Saved template", "Fraud - Repeat Order Follow-Up Email", smart);
    change("Order Number(s)", "730923", smart);
    expect(smart.getByLabelText("Email draft").value).toContain("Your recent order #730923 was unfortunately identified again");
    change("Email draft", "Custom message", smart);
    click("Copy Email", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Custom message"));
    click("Restore template", smart);
    expect(smart.getByLabelText("Email draft").value).toContain("Amazon or Walmart");
    change("Saved template", "Warranty Photo Request", smart);
    expect(smart.queryByLabelText("Fraud email composer")).toBeNull();
    expect(smart.getByLabelText("Case Type").value).toBe("Warranty Replacement");
    expect(smart.getByLabelText("Order ID").value).toBe("730923");
    expect(smart.getByLabelText("Issue").value).toBe("Warranty photo request");
  });

  it("keeps SKU selection and filter conversions while showing MA-40E-4 in Smart Case Notes", async () => {
    await openApp();
    const filter = tool("Swapped Filter Subscription"), smart = tool("Smart Case Notes");
    change("Filter Model(s)", "MA-40E-4", filter);
    click("Add MA-40E-4", filter);
    expect(filter.getByText("Original Variant ID#: 31987508740163")).toBeTruthy();
    click("Copy Note", filter);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("New Variant ID#: 31987508740163"));
    click("Remove MA-40E-4", filter);
    change("Filter Model(s)", "MA-40E-1", filter);
    click("Add MA-40E-1", filter);
    click("Convert", filter);
    change("Convert MA-40E-1 to", "MA-40E-4", filter);
    click("Use MA-40E-4", filter);
    expect(filter.getByText("New Variant ID#: 31987508740163")).toBeTruthy();
    click("Copy Note", filter);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Converted MA-40E-1 x1 to MA-40E-4 x1"));
    change("SKU", "ma-40e-4", smart);
    click("Select MA-40E-4", smart);
    expect(smart.getByText("MA-40E-4")).toBeTruthy();
  });

  it("keeps Amazon order codes, warnings and independent code copying in Smart Case Notes", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Case Type", "Amazon Order", smart);
    change("Order ID", "QA-123", smart);
    change("Reason Code", "Amazon | Stuck Order | XXXXXX", smart);
    expect(smart.getByText(/For unfulfilled Medify Air MCF orders only/)).toBeTruthy();
    click("Copy Code", smart);
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("Amazon | Stuck Order | QA-123"));
    change("Issue", "Unfulfilled order", smart);
    change("Resolution", "Reviewed both orders", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Reason Code: Amazon | Stuck Order | QA-123"));
    click("Reset", smart);
    expect(smart.getByLabelText("Order ID").value).toBe("");
    expect(smart.getByLabelText("Case Type").value).toBe("General Inquiry");
  });

  it("recovers a previous Order Codes draft without losing its code and fields", async () => {
    localStorage.setItem("medify-workdesk-order-draft", JSON.stringify({
      "Order ID": "LEGACY-101", "Order Date": "2026-10-01", SKU: "MA-40E-4",
      Issue: "Fan Issue", Resolution: "Processed replacement",
      category: "Warranty Replacement", reason: "WR-07"
    }));
    await openApp(); const smart = tool("Smart Case Notes");
    click("Load saved Order Codes draft", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("Warranty Replacement");
    expect(smart.getByLabelText("Order ID").value).toBe("LEGACY-101");
    expect(smart.getByText("MA-40E-4")).toBeTruthy();
    expect(smart.getByLabelText("Issue").value).toBe("Fan Issue");
    expect(smart.getByLabelText("Reason Code").value).toBe("WR-07");
    click("Copy Code", smart);
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("Warranty Replacement | WR-07 | LEGACY-101"));
  });

  it("preserves separate UPS Claim tracker, invoice checkbox and saved templates in Smart Case Notes", async () => {
    await openApp(); const claim = tool("UPS Claim"), smart = tool("Smart Case Notes");
    change("Claim Number", "QA-CLAIM", claim);
    change("Tracking Number", "1Z-TEST", claim);
    change("Claim Status", "Package Search In Progress", claim);
    fireEvent.click(claim.getByLabelText("Uploaded Invoice"));
    click("Copy Note", claim);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Claim Number: QA-CLAIM\nTracking Number: 1Z-TEST\nClaim Status: Package Search In Progress\nUploaded Invoice\nJA"));
    click("Reset", claim);
    expect(claim.getByLabelText("Uploaded Invoice").checked).toBe(false);
    change("Order ID", "QA-456", smart);
    change("Saved template", "Warranty Photo Request", smart);
    expect(smart.getByLabelText("Issue").value).toBe("Warranty photo request");
    change("Resolution", "Requested a clear photo", smart);
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Order ID: QA-456\nOrder Date: Not provided\nSKU: Not provided\nIssue: Warranty photo request"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Resolution: Requested a clear photo\nJA");
    click("Reset", smart);
    expect(smart.getByLabelText("Issue").value).toBe("");
  });

  it("preserves return tracking and return/refund quick inserts in Smart Case Notes", async () => {
    await openApp(); const smart = tool("Smart Case Notes");
    change("Saved template", "Return / Refund", smart);
    expect(smart.getByLabelText("Case Type").value).toBe("Return / Refund");
    expect(smart.getByLabelText("Issue").value).toBe("Return / Refund");
    expect(smart.queryByLabelText("Tracking Number")).toBeNull();
    click("Not satisfied with the order", smart);
    click("Sent RL for return", smart);
    expect(smart.getByLabelText("Tracking Number")).toBeTruthy();
    change("Tracking Number", "1Z-RETURN-TEST", smart);
    click("Returned to the warehouse", smart);
    click("Processed refund", smart);
    expect(smart.getByLabelText("Resolution").value).toBe("Returned to the warehouse\nProcessed refund");
    click("Copy Note", smart);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Tracking Number: 1Z-RETURN-TEST"));
    expect(copyText.mock.calls.at(-1)[0]).toContain("Issue: Return / Refund\nNot satisfied with the order\nSent RL for return");
    expect(copyText.mock.calls.at(-1)[0]).toContain("Resolution: Returned to the warehouse\nProcessed refund");
  });

  it("keeps Start, Stop & Save, saved duration, New Call confirmation and persistence", async () => {
    await openApp(); change("Spoke With", "Timer Fixture"); change("Reason for Calling", "Warranty replacement");
    fireEvent.click(screen.getByLabelText("Follow-up needed")); change("Follow-up Date", "2026-09-20"); change("Follow-up Note", "Call back");
    vi.useFakeTimers({toFake:["Date","setInterval","clearInterval"]});
    click("Start"); expect(button("Start").disabled).toBe(true); expect(button("Stop & Save").disabled).toBe(false);
    act(() => vi.advanceTimersByTime(73000)); expect(screen.getByText("00:01:13")).toBeTruthy();
    click("Stop & Save"); await waitFor(() => expect(JSON.parse(localStorage.getItem("medify-call-reports"))).toHaveLength(10));
    const saved = JSON.parse(localStorage.getItem("medify-call-reports"))[0]; expect(saved.seconds).toBe(73); expect(saved.fields["Spoke With"]).toBe("Timer Fixture"); expect(saved.callDriver).toBe("Warranty / Replacement"); expect(saved.followUpNote).toBe("Call back");
    click("New Call"); expect(screen.getByLabelText("Spoke With").value).toBe("");
    click("Start"); window.confirm.mockReturnValueOnce(false); click("New Call"); expect(button("Start").disabled).toBe(true);
    click("New Call"); expect(button("Start").disabled).toBe(false);
  });
});

describe("reports and overlays", () => {
  it("updates real metrics for all five periods while preserving the existing newest-bucket logic", async () => {
    await openApp(); click("Reports");
    const reports = sampleReports().map(r=>({start:new Date(r.started_at).getTime(),stop:new Date(r.stopped_at).getTime(),seconds:r.duration_seconds}));
    for (const period of ["Daily","Weekly","Monthly","Quarterly","Yearly"]) {
      click(period); const latest = [...new Set(reports.map(r=>periodKey(r,period)))].sort().at(-1); const selected = reports.filter(r=>periodKey(r,period)===latest);
      const metrics = document.querySelectorAll(".report-kpis article > b");
      expect(metrics[0].textContent).toBe(String(selected.length)); expect(metrics[1].textContent).toBe(formatDuration(selected.reduce((n,r)=>n+r.seconds,0)));
      expect(metrics[2].textContent).toBe(formatDuration(selected.reduce((n,r)=>n+r.seconds,0)/selected.length));
      expect(document.querySelectorAll(".report-row")).toHaveLength(selected.length); expect(button(period).getAttribute("aria-pressed")).toBe("true");
    }
  });

  it("keeps search and each filter, report details and saved-report copy", async () => {
    await openApp(); click("Reports"); click("Yearly");
    change("Search reports", "taylor@example.test"); expect(document.querySelectorAll(".report-row")).toHaveLength(1);
    change("Search reports", "no-match"); expect(screen.getByText("No matching call reports")).toBeTruthy(); expect(document.querySelector(".kpi-text").textContent).toBe("—");
    change("Search reports", ""); change("Call driver", "Filter Club"); expect(document.querySelectorAll(".report-row")).toHaveLength(1);
    change("Call driver", "All"); change("Agent initials", "FA"); expect([...document.querySelectorAll(".report-avatar")].every(el=>el.textContent==="FA")).toBe(true);
    change("Agent initials", "All"); change("Follow-up", "today"); expect(document.querySelectorAll(".report-row")).toHaveLength(1);
    const row = within(document.querySelector(".report-row")); fireEvent.click(document.querySelector(".report-row summary"));
    const email = row.getByText(/@example\.test$/).textContent; expect(email).toMatch(/@example\.test$/); click("Copy", row);
    await waitFor(()=>expect(copyText.mock.calls.at(-1)[0]).toMatch(/^Spoke With: /)); expect(copyText.mock.calls.at(-1)[0]).toContain(email);
  });

  it("edits minutes AND seconds and follow-ups; confirms or cancels deletion of fictional records", async () => {
    await openApp(); click("Reports"); fireEvent.click(document.querySelector(".report-row summary")); let row=within(document.querySelector(".report-row")); click("Edit",row);
    let dialog=within(screen.getByRole("dialog",{name:"Edit call report"})); change("Minutes","12",dialog);change("Seconds","34",dialog);change("Follow-up note","Review fixture",dialog);click("Save changes",dialog);
    await waitFor(()=>expect(JSON.parse(localStorage.getItem("medify-call-reports"))[0].seconds).toBe(754));
    expect(document.querySelector(".report-duration").textContent).toBe("12m 34s");
    click("Edit",row);dialog=within(screen.getByRole("dialog",{name:"Edit call report"}));change("Minutes","99",dialog);click("Cancel",dialog);expect(document.querySelector(".report-duration").textContent).toBe("12m 34s");
    window.confirm.mockReturnValueOnce(false);click("Delete",row);expect(document.querySelectorAll(".report-row")).toHaveLength(2);
    click("Delete",row);await waitFor(()=>expect(document.querySelectorAll(".report-row")).toHaveLength(1));
  });

  it("shows all driver periods, opens follow-up editor and closes settings with Escape", async () => {
    await openApp();click("Reports");fireEvent.click(screen.getByRole("button",{name:"Edit follow-up for Alex Morgan"}));expect(screen.getByRole("dialog",{name:"Edit call report"})).toBeTruthy();click("Close Edit call report");
    click("Call Drivers");for(const name of ["Daily","Weekly","Monthly","Quarterly","Yearly"]){click(name);expect(button(name).getAttribute("aria-pressed")).toBe("true");expect(document.querySelectorAll(".driver-bar").length).toBeGreaterThan(0);}
    click("Settings");const settings=screen.getByRole("dialog",{name:"Workspace settings"});expect(within(settings).getByText("Team Management")).toBeTruthy();
    fireEvent(settings,new Event("cancel",{bubbles:false,cancelable:true}));expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("tool search keeps its routing and Enter brings the existing tool into focus", async () => {
    await openApp();click("UPS Claim");click("Reports");change("Find a workspace tool","claim");expect(button("UPS Claim").getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(screen.getByLabelText("Find a workspace tool"),{key:"Enter"});expect(Element.prototype.scrollIntoView).toHaveBeenCalled();expect(document.activeElement).toBe(screen.getByLabelText("Claim Number"));
  });
});

describe("authentication presentation", () => {
  it("retains username/passcode and activation fields without changing the auth requests", async () => {
    mock.client=createMockSupabase({signedIn:false});const signIn=vi.spyOn(mock.client.auth,"signInWithPassword");const signUp=vi.spyOn(mock.client.auth,"signUp");render(<App/>);
    await screen.findByRole("button",{name:"Sign in",exact:true});change("Username","qa-user");change("PIN / passcode","example-passcode");fireEvent.submit(button("Sign in").closest("form"));
    await screen.findByRole("alert");expect(signIn).toHaveBeenCalledWith({email:"qa-user@medify.local",password:"example-passcode"});
    click("I have an access code");expect(screen.getByLabelText("One-time access code")).toBeTruthy();change("One-time access code","qa-access-code");change("Assigned initials","FA");fireEvent.submit(button("Activate account").closest("form"));
    await waitFor(()=>expect(signUp).toHaveBeenCalledWith({email:"qa-user@medify.local",password:"example-passcode"}));
  });
});

describe("account management", () => {
  it("shows a regular user only their own Account controls", async () => {
    mock.client = createMockSupabase({ profile: { id: "agent-user", username: "agent-user", initials: "FA", role: "agent", is_active: true }, users: [{ id: "agent-user", username: "agent-user", initials: "FA", role: "agent", is_active: true }, { id: "other-user", username: "other-user", initials: "CJ", role: "agent", is_active: true }] });
    await openApp(); click("Settings"); const settings = screen.getByRole("dialog", { name: "Workspace settings" });
    expect(within(settings).getByRole("heading", { name: "Account" })).toBeTruthy(); expect(within(settings).getByText(/agent-user/)).toBeTruthy(); expect(within(settings).queryByText("User accounts")).toBeNull(); expect(within(settings).queryByRole("button", { name: "Save username" })).toBeNull(); expect(within(settings).queryByRole("button", { name: "Reset password" })).toBeNull();
    const result = await mock.client.functions.invoke("manage-account", { body: { action: "reset_password", target_user_id: "other-user", password: "temporary-pass" } }); expect(result.error.message).toContain("Only the JA creator");
  });

  it("lets JA see every registered username and marks the current account", async () => {
    await openApp(); click("Settings"); const settings = screen.getByRole("dialog", { name: "Workspace settings" });
    await waitFor(() => expect(within(settings).getByText("User accounts")).toBeTruthy()); expect(within(settings).getByText(/JA \(you\)/)).toBeTruthy(); expect(within(settings).getByText("fa-user")).toBeTruthy(); expect(within(settings).getByText("old-user")).toBeTruthy(); expect(within(settings).getAllByText("Password reset needed")).toHaveLength(3);
  });

  it("lets JA reset a non-JA user's password through the secure function", async () => {
    await openApp(); click("Settings"); const settings = within(screen.getByRole("dialog", { name: "Workspace settings" })); await waitFor(() => expect(settings.getByText("User accounts")).toBeTruthy());
    const invoke = vi.spyOn(mock.client.functions, "invoke"); fireEvent.click(settings.getAllByRole("button", { name: "Reset password" })[0]); const modal = within(screen.getByRole("dialog", { name: /Reset password for/ })); change("New temporary password", "temporary-pass", modal); change("Confirm temporary password", "temporary-pass", modal); click("Reset password", modal);
    await waitFor(() => expect(invoke).toHaveBeenCalledWith("manage-account", { body: { action: "reset_password", target_user_id: "fa-user", password: "temporary-pass" } })); await waitFor(() => expect(screen.getByText("Password reset successfully. Give this temporary password to the user and ask them to change it after signing in.")).toBeTruthy());
  });

  it("rejects reset validation errors before invoking the secure function", async () => {
    await openApp(); click("Settings"); const settings = within(screen.getByRole("dialog", { name: "Workspace settings" })); await waitFor(() => expect(settings.getByText("User accounts")).toBeTruthy()); fireEvent.click(settings.getAllByRole("button", { name: "Reset password" })[0]); const modal = within(screen.getByRole("dialog", { name: /Reset password for/ })); click("Reset password", modal); expect(modal.getByRole("alert").textContent).toContain("at least 8 characters"); change("New temporary password", "temporary-pass", modal); change("Confirm temporary password", "different-pass", modal); click("Reset password", modal); expect(modal.getByRole("alert").textContent).toContain("must match");
  });

  it.each(["Authentication update failed: auth unavailable", "Profile update failed: profile unavailable"])("shows account service errors instead of success: %s", async (errorMessage) => {
    await openApp(); mock.client.functions.invoke = vi.fn().mockResolvedValue({ data: null, error: { message: errorMessage } }); click("Settings"); const settings = within(screen.getByRole("dialog", { name: "Workspace settings" })); change("Username", "new_user", settings); click("Save account changes", settings); await waitFor(() => expect(settings.getByRole("status").textContent).toBe(errorMessage)); expect(settings.queryByText("Account details updated.")).toBeNull();
  });
});

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
    for (const title of ["Call Notes", "Swapped Filter Subscription", "Order Codes / Replacement", "UPS Claim", "Email / General Case Notes"]) {
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
    await waitFor(() => expect(copyText).toHaveBeenCalledWith(buildCallNote({...BLANK_CALL, "Spoke With":"QA Caller", "Reason for Calling":"Warranty question", "ACTION TAKEN":"Checked order.\nPhotos requested"}, "CJ")));
    expect(JSON.parse(localStorage.getItem("medify-active-call-draft")).followup).toEqual({needed:true,date:"2026-09-20",note:"Review photos"});
    click("Reset", tool("Call Notes")); expect(screen.getByLabelText("Spoke With").value).toBe(""); expect(screen.getByLabelText("Follow-up needed").checked).toBe(false);
  });

  it("handles SKU searching, no matches, quantities, removal, variant and copied utility history", async () => {
    await openApp(); change("Reason", "Variant Error"); change("Filter Model(s)", "MA-50R-1"); click("Add MA-50R-1");
    click("Increase MA-50R-1"); expect(screen.getByLabelText("MA-50R-1 quantity").textContent).toBe("2");
    click("Decrease MA-50R-1"); change("Additional Notes", "Different variant received"); click("Copy Note", tool("Swapped Filter Subscription"));
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("Swapped Filter Subscription\nFilter(s):\nMA-50R-1 x1\nReason: Variant Error\nAdditional Notes: Different variant received\nCJ"));
    click("Recent"); expect(screen.getByRole("dialog",{name:"Recent utility notes"})).toBeTruthy(); click("Close recent notes");
    click("Remove MA-50R-1"); expect(screen.queryByLabelText("MA-50R-1 quantity")).toBeNull();
    change("Filter Model(s)", "ZZZZ"); expect(screen.getByText("No matching SKU. Try a model like MA-50.")).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText("Filter Model(s)"), {key:"Escape"}); expect(screen.queryByText("No matching SKU. Try a model like MA-50.")).toBeNull();
    click("Reset", tool("Swapped Filter Subscription")); expect(screen.getByLabelText("Reason").value).toBe("Swapped Filter");
  });

  it("keeps order code categories, operational warnings, note text and code copying", async () => {
    await openApp(); const order = tool("Order Codes / Replacement");
    change("Order ID", "QA-123", order); change("Category", "Amazon", order); change("Reason Code", "Amazon | Stuck Order | XXXXXX", order);
    expect(order.getByText(/For unfulfilled Medify Air MCF orders only/)).toBeTruthy();
    click("Copy Code", order); await waitFor(() => expect(copyText).toHaveBeenCalledWith("Amazon | Stuck Order | QA-123"));
    change("Issue", "Unfulfilled order", order); change("Resolution", "Reviewed both orders", order); click("Copy Note", order);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toContain("Reason Code: Amazon | Stuck Order | QA-123"));
    click("Reset", order); expect(order.getByLabelText("Order ID").value).toBe(""); expect(order.getByLabelText("Category").value).toBe("Warranty Replacement");
  });

  it("preserves UPS claim fields and invoice flag, and editable general templates", async () => {
    await openApp(); const claim = tool("UPS Claim"), general = tool("Email / General Case Notes");
    change("Claim Number", "QA-CLAIM"); change("Tracking Number", "1Z-TEST"); change("Claim Status", "Package Search In Progress"); fireEvent.click(screen.getByLabelText("Uploaded Invoice")); click("Copy Note", claim);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Claim Number: QA-CLAIM\nTracking Number: 1Z-TEST\nClaim Status: Package Search In Progress\nUploaded Invoice\nCJ"));
    click("Reset", claim); expect(screen.getByLabelText("Uploaded Invoice").checked).toBe(false);
    change("Order ID", "QA-456", general); change("Saved template", "Warranty Photo Request"); expect(general.getByLabelText("Issue").value).toBe("Warranty photo request");
    change("Resolution", "Requested a clear photo", general); click("Copy Note", general);
    await waitFor(() => expect(copyText.mock.calls.at(-1)[0]).toBe("Order ID: QA-456\nOrder Date: Not provided\nSKU: Not provided\nIssue: Warranty photo request\nResolution: Requested a clear photo\nCJ"));
    click("Reset", general); expect(general.getByLabelText("Issue").value).toBe("");
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
    expect(row.getByText(/@example\.test$/)).toBeTruthy(); click("Copy", row); await waitFor(()=>expect(copyText.mock.calls.at(-1)[0]).toContain("Spoke With: Taylor Reed"));
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


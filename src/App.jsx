import { useEffect, useMemo, useRef, useState } from "react";
import { supabase, usernameEmail } from "./supabase";

const blank = { "Spoke With": "", "Name on the Account": "", "Order Num": "", "Email Address": "", "Contact #": "", "Reason for Calling": "", "ACTION TAKEN": "", "Offered FC/Cross Sell": "", "AC Call ID": "" };
const blankEmail = { "Order ID": "", "Order Date": "", "SKU": "", "Issue": "", "Resolution": "" };
const reportTypes = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];
const agentInitialOptions = ["JA", "FA"];
const elapsed = (seconds) => {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return h ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
};
const when = (time) => time ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(time) : "Not recorded";
const localDateTime = (time) => time ? new Date(time - new Date(time).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
const readReports = () => { try { return JSON.parse(localStorage.getItem("medify-call-reports")) || []; } catch { return []; } };
const readClearedReports = () => { try { return JSON.parse(localStorage.getItem("medify-cleared-call-reports")) || []; } catch { return []; } };
const readDeletedReport = () => { try { return JSON.parse(localStorage.getItem("medify-deleted-call-report")) || null; } catch { return null; } };
const readDraft = () => { try { return JSON.parse(localStorage.getItem("medify-active-call-draft")) || null; } catch { return null; } };
const readAgentInitials = () => { const saved = localStorage.getItem("medify-agent-initials"); return agentInitialOptions.includes(saved) ? saved : "JA"; };
const remoteToLocal = (row) => ({ id: row.id, remote: true, start: new Date(row.started_at).getTime(), stop: new Date(row.stopped_at).getTime(), seconds: row.duration_seconds, fields: row.note_fields || {}, callDriver: row.call_driver, savedAt: new Date(row.created_at).getTime() });
const detectCallDriver = (fields) => {
  const notes = `${fields["Reason for Calling"] || ""} ${fields["ACTION TAKEN"] || ""}`.toLowerCase();
  if (/(filter club|subscription|filter\b).*(cancel|cancell?ation|stop|skip)|(?:cancel|cancell?ation|stop|skip).*(filter club|subscription|filter\b)/.test(notes)) return "Filter Club Cancellation";
  if (/filter club|subscription|subscribe|filter\b|skip.*(order|shipment)|next (order|shipment)/.test(notes)) return "Filter Club";
  if (/return|refund|send.*back/.test(notes)) return "Return / Refund";
  if (/cancel|cancell?ation/.test(notes)) return "Order Cancellation";
  if (/warranty|replacement|replace.*unit|defective/.test(notes)) return "Warranty / Replacement";
  if (/not working|won't turn|will not turn|noise|rattle|squeak|smell|odor|red light|filter light|troubleshoot|troubleshooting|diagnos|reset|airflow|power/.test(notes)) return "Troubleshooting";
  if (/(ups|carrier|package|shipment|delivery).*(lost|missing)|(?:lost|missing).*(ups|carrier|package|shipment|delivery)/.test(notes)) return "UPS Lost";
  if (/(ups|carrier|package|shipment|delivery).*(damaged|damage|broken)|(?:damaged|damage|broken).*(ups|carrier|package|shipment|delivery)/.test(notes)) return "UPS Damaged";
  if (/discount|coupon|promo|promotion|price match|price adjustment/.test(notes)) return "Discount";
  if (/hsa|fsa|flex spending|medical necessity/.test(notes)) return "HSA/FSA";
  if (/tracking|track\b|shipping|shipment|delivery|delivered|package|address|carrier|ups|order status/.test(notes)) return "Order / Shipping";
  return "General Inquiry";
};
const reportDate = (record) => new Date(record.stop || record.start || record.savedAt);
const periodKey = (date, type) => {
  const year = date.getFullYear(), month = date.getMonth() + 1;
  if (type === "Daily") return `${year}-${String(month).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (type === "Weekly") { const start = new Date(date); const day = (start.getDay() + 6) % 7; start.setDate(start.getDate() - day); return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`; }
  if (type === "Monthly") return `${year}-${String(month).padStart(2, "0")}`;
  if (type === "Quarterly") return `${year} Q${Math.floor((month - 1) / 3) + 1}`;
  return String(year);
};
const periodLabel = (key, type) => {
  if (type === "Daily") return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(new Date(`${key}T12:00:00`));
  if (type === "Weekly") return `Week of ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${key}T12:00:00`))}`;
  if (type === "Monthly") return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));
  return type === "Quarterly" ? key : `${key} yearly report`;
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authFields, setAuthFields] = useState({ username: "", password: "", code: "", initials: "JA" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [newInviteCode, setNewInviteCode] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [invites, setInvites] = useState([]);
  const [view, setView] = useState("notes");
  const [fields, setFields] = useState(blank);
  const [emailFields, setEmailFields] = useState(blankEmail);
  const [start, setStart] = useState(null);
  const [stop, setStop] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [reports, setReports] = useState(readReports);
  const [reportType, setReportType] = useState("Daily");
  const [agentInitials, setAgentInitials] = useState(readAgentInitials);
  const [toast, setToast] = useState("");
  const [clearedReports, setClearedReports] = useState(readClearedReports);
  const [deletedReport, setDeletedReport] = useState(readDeletedReport);
  const [reportSearch, setReportSearch] = useState("");
  const [driverFilter, setDriverFilter] = useState("All drivers");
  const [editingReport, setEditingReport] = useState(null);
  const [editStart, setEditStart] = useState("");
  const [editTotalSeconds, setEditTotalSeconds] = useState("");
  const dialogReturnFocusRef = useRef(null);
  const pageHeadingRef = useRef(null);
  const running = Boolean(start && !stop);
  const seconds = useMemo(() => start ? Math.max(0, Math.floor(((stop || now) - start) / 1000)) : 0, [start, stop, now]);
  const noteRows = [...Object.entries(fields).map(([label, value]) => `${label}: ${value || "Not provided"}`), agentInitials];
  const report = noteRows.join("\n");
  const emailNote = [...Object.entries(emailFields).map(([label, value]) => `${label}: ${value || "Not provided"}`), agentInitials].join("\n");
  const searchedReports = useMemo(() => reports.filter((item) => { const q = reportSearch.trim().toLowerCase(); const text = `${item.fields["Spoke With"] || ""} ${item.fields["Name on the Account"] || ""} ${item.fields["Order Num"] || ""} ${item.fields["Email Address"] || ""} ${item.fields["AC Call ID"] || ""}`.toLowerCase(); const driver = item.callDriver || detectCallDriver(item.fields); return (!q || text.includes(q)) && (driverFilter === "All drivers" || driver === driverFilter); }), [reports, reportSearch, driverFilter]);
  const groupedReports = useMemo(() => {
    const groups = searchedReports.reduce((all, item) => {
      const key = periodKey(reportDate(item), reportType);
      all[key] = [...(all[key] || []), item];
      return all;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [searchedReports, reportType]);
  const groupedDriverReports = useMemo(() => groupedReports.map(([key, items]) => {
    const drivers = items.reduce((all, item) => {
      const driver = item.callDriver || detectCallDriver(item.fields);
      all[driver] = [...(all[driver] || []), item];
      return all;
    }, {});
    return [key, Object.entries(drivers).sort(([, a], [, b]) => b.length - a.length)];
  }), [groupedReports]);
  const dailySummary = useMemo(() => { const today = new Date(); const items = reports.filter((item) => { const date = reportDate(item); return date.toDateString() === today.toDateString(); }); const total = items.reduce((sum, item) => sum + item.seconds, 0); const drivers = items.reduce((all, item) => { const driver = item.callDriver || detectCallDriver(item.fields); all[driver] = (all[driver] || 0) + 1; return all; }, {}); return { items, total, average: items.length ? Math.round(total / items.length) : 0, longest: items.length ? Math.max(...items.map((item) => item.seconds)) : 0, drivers }; }, [reports]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) setSession(data.session); setAuthLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); if (!nextSession) { setProfile(null); setAuthLoading(false); } });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from("medify_profiles").select("*").eq("id", session.user.id).single().then(({ data, error }) => {
      if (error) setAuthError("Your access has not been activated with a valid access code yet.");
      else { setProfile(data); setAgentInitials(data.initials); }
    });
  }, [session]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase.from("medify_call_reports").select("*").order("stopped_at", { ascending: false }).then(async ({ data, error }) => {
      if (error) { setAuthError(error.message); return; }
      const remoteReports = (data || []).map(remoteToLocal);
      const localReports = readReports();
      const importKey = `medify-reports-imported-${profile.id}`;
      if (!remoteReports.length && localReports.length && !localStorage.getItem(importKey)) {
        const rows = localReports.map((item) => ({ agent_id: profile.id, started_at: new Date(item.start).toISOString(), stopped_at: new Date(item.stop).toISOString(), duration_seconds: item.seconds, call_driver: item.callDriver || detectCallDriver(item.fields), note_fields: item.fields, imported_from_browser: true }));
        const { error: importError } = await supabase.from("medify_call_reports").insert(rows);
        if (!importError) { localStorage.setItem(importKey, "true"); setReports(localReports); setToast(`${localReports.length} existing report${localReports.length === 1 ? "" : "s"} imported.`); return; }
      }
      setReports(remoteReports);
    });
  }, [profile]);

  useEffect(() => {
    if (profile?.role !== "creator") return;
    supabase.from("medify_invite_codes").select("id, code_value, used_at, revoked_at, deactivated_at, created_at").order("created_at", { ascending: false }).then(({ data }) => setInvites(data || []));
  }, [profile, adminMessage]);

  useEffect(() => { if (!running) return undefined; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [running]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { localStorage.setItem("medify-call-reports", JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem("medify-agent-initials", agentInitials); }, [agentInitials]);
  useEffect(() => { localStorage.setItem("medify-active-call-draft", JSON.stringify({ fields, emailFields, start, stop, now })); }, [fields, emailFields, start, stop, now]);
  useEffect(() => { const draft = readDraft(); if (draft) { if (draft.fields) setFields(draft.fields); if (draft.emailFields) setEmailFields(draft.emailFields); if (draft.start) setStart(draft.start); if (draft.stop) setStop(draft.stop); if (draft.now) setNow(draft.now); } }, []);
  useEffect(() => {
    pageHeadingRef.current?.focus();
  }, [view]);
  useEffect(() => {
    if (!editingReport) return undefined;
    dialogReturnFocusRef.current = document.activeElement;
    const dialog = document.querySelector(".edit-dialog");
    const focusable = () => [...dialog.querySelectorAll("button, input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((node) => !node.disabled);
    dialog?.querySelector("input")?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setEditingReport(null); return; }
      if (event.key !== "Tab" || !dialog) return;
      const nodes = focusable(); if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); window.setTimeout(() => dialogReturnFocusRef.current?.focus?.(), 0); };
  }, [editingReport]);

  const update = (label, value) => setFields((current) => ({ ...current, [label]: value }));
  const updateEmail = (label, value) => setEmailFields((current) => ({ ...current, [label]: value }));
  const clearEmailNotes = () => { setEmailFields(blankEmail); setToast("Email notes cleared. Ready for a new case."); };
  const startTimer = () => { const time = Date.now(); setStart(time); setStop(null); setNow(time); };
  const setDurationPreset = (preset) => { if (!running) { const time = Date.now(); setStart(time - (preset * 1000)); setStop(time); setNow(time); } };
  const undoDeleteReport = async () => { if (!deletedReport) return; const { data, error } = profile?.id ? await supabase.from("medify_call_reports").insert({ agent_id: profile.id, started_at: new Date(deletedReport.start).toISOString(), stopped_at: new Date(deletedReport.stop).toISOString(), duration_seconds: deletedReport.seconds, call_driver: deletedReport.callDriver || detectCallDriver(deletedReport.fields), note_fields: deletedReport.fields }).select().single() : { data: null, error: null }; if (error) { setToast(`Could not restore report online: ${error.message}`); return; } setReports((current) => [data ? remoteToLocal(data) : deletedReport, ...current]); setDeletedReport(null); localStorage.removeItem("medify-deleted-call-report"); setToast("Deleted report restored."); };
  const exportReports = () => { const headers = ["Date", "Spoke With", "Name on Account", "Order Number", "Email", "AC Call ID", "Call Driver", "Duration Seconds", "Duration", "Reason for Calling", "ACTION TAKEN", "Agent Initials"]; const rows = searchedReports.map((item) => [when(item.stop), item.fields["Spoke With"] || "", item.fields["Name on the Account"] || "", item.fields["Order Num"] || "", item.fields["Email Address"] || "", item.fields["AC Call ID"] || "", item.callDriver || detectCallDriver(item.fields), item.seconds, elapsed(item.seconds), item.fields["Reason for Calling"] || "", item.fields["ACTION TAKEN"] || "", item.fields["Agent Initials"] || ""]); const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `medify-call-reports-${reportType.toLowerCase()}.csv`; link.click(); URL.revokeObjectURL(url); };
  const stopTimer = () => {
    if (!running) return;
    const acCallId = fields["AC Call ID"]?.trim();
    if (acCallId && reports.some((item) => item.fields["AC Call ID"]?.trim().toLowerCase() === acCallId.toLowerCase()) && !window.confirm(`AC Call ID ${acCallId} already exists in Reports. Save this as a duplicate anyway?`)) return;
    const time = Date.now();
    const duration = Math.max(0, Math.floor((time - start) / 1000));
    const record = { id: `${start}-${time}`, start, stop: time, seconds: duration, fields: { ...fields, "Agent Initials": agentInitials }, callDriver: detectCallDriver(fields), savedAt: time };
    setStop(time);
    setNow(time);
    setReports((current) => [record, ...current]);
    supabase.from("medify_call_reports").insert({ agent_id: profile.id, started_at: new Date(start).toISOString(), stopped_at: new Date(time).toISOString(), duration_seconds: duration, call_driver: record.callDriver, note_fields: record.fields }).select().single().then(({ data, error }) => { if (error) setToast(`Saved locally, but online save failed: ${error.message}`); else if (data) setReports((current) => current.map((item) => item.id === record.id ? remoteToLocal(data) : item)); });
    setToast("Call stopped and saved to Reports.");
  };
  const clearCall = () => { const hasUnsaved = Object.values(fields).some(Boolean) || Object.values(emailFields).some(Boolean) || running; if (hasUnsaved && !window.confirm("Clear the current unsaved notes and active call? Saved reports will be kept.")) return; setFields(blank); setEmailFields(blankEmail); setStart(null); setStop(null); setNow(Date.now()); localStorage.removeItem("medify-active-call-draft"); setView("notes"); setToast("Current call cleared. Saved reports were kept."); };
  const clearHistory = async () => { if (!reports.length || !window.confirm("Clear all saved call reports? A save point will be created so you can undo this.")) return; localStorage.setItem("medify-cleared-call-reports", JSON.stringify(reports)); setClearedReports(reports); setReports([]); if (profile?.id) { const { error } = await supabase.from("medify_call_reports").delete().eq("agent_id", profile.id); if (error) setToast(`Cleared locally, but online clear failed: ${error.message}`); else setToast("Report history cleared. You can undo it below."); } else setToast("Report history cleared. You can undo it below."); };
  const undoClearHistory = async () => { if (!clearedReports.length) return; const rows = profile?.id ? clearedReports.map((item) => ({ agent_id: profile.id, started_at: new Date(item.start).toISOString(), stopped_at: new Date(item.stop).toISOString(), duration_seconds: item.seconds, call_driver: item.callDriver || detectCallDriver(item.fields), note_fields: item.fields })) : []; if (rows.length) { const { data, error } = await supabase.from("medify_call_reports").insert(rows).select(); if (error) { setToast(`Reports restored locally, but online restore failed: ${error.message}`); setReports(clearedReports); return; } setReports((data || []).map(remoteToLocal)); } else setReports(clearedReports); setClearedReports([]); localStorage.removeItem("medify-cleared-call-reports"); setToast("Cleared reports restored."); };
  const deleteReport = async (item) => {
    if (!window.confirm("Delete this saved report? This cannot be undone.")) return;
    localStorage.setItem("medify-deleted-call-report", JSON.stringify(item)); setDeletedReport(item); setReports((current) => current.filter((report) => report.id !== item.id));
    setToast("Report deleted.");
    if (profile?.id) {
      let query = supabase.from("medify_call_reports").delete().eq("agent_id", profile.id);
      query = item.remote ? query.eq("id", item.id) : query.eq("started_at", new Date(item.start).toISOString()).eq("stopped_at", new Date(item.stop).toISOString());
      const { error } = await query;
      if (error) setToast(`Deleted on this device, but online delete failed: ${error.message}`);
    }
  };
  const beginEditReport = (item) => { setEditingReport(item); setEditStart(localDateTime(item.start)); setEditTotalSeconds(String(item.seconds)); };
  const saveEditedReport = async () => {
    const nextStart = new Date(editStart).getTime();
    const nextSeconds = Number(editTotalSeconds);
    const nextStop = nextStart + (nextSeconds * 1000);
    if (!Number.isFinite(nextStart) || !Number.isInteger(nextSeconds) || nextSeconds < 0) { setToast("Please enter a valid whole number of seconds."); return; }
    const updated = { ...editingReport, start: nextStart, stop: nextStop, seconds: nextSeconds };
    setReports((current) => current.map((item) => item.id === editingReport.id ? updated : item));
    setEditingReport(null);
    setToast("Call time updated.");
    if (profile?.id) {
      let query = supabase.from("medify_call_reports").update({ started_at: new Date(nextStart).toISOString(), stopped_at: new Date(nextStop).toISOString(), duration_seconds: nextSeconds }).eq("agent_id", profile.id);
      query = editingReport.remote ? query.eq("id", editingReport.id) : query.eq("started_at", new Date(editingReport.start).toISOString()).eq("stopped_at", new Date(editingReport.stop).toISOString());
      const { error } = await query;
      if (error) setToast(`Updated on this device, but online update failed: ${error.message}`);
      else setToast("Call time updated and saved.");
    }
  };
  const copy = () => navigator.clipboard?.writeText(report).then(() => setToast("Copied to clipboard")).catch(() => setToast("Copy was blocked. Please select the text manually."));
  const submitAuth = async (event) => {
    event.preventDefault(); setAuthError(""); setAuthBusy(true);
    const username = authFields.username.toLowerCase().trim();
    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: usernameEmail(username), password: authFields.password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: usernameEmail(username), password: authFields.password });
        if (error) throw error;
        if (!data.session) throw new Error("Email confirmation is enabled. In Supabase, turn off email confirmation under Authentication > Providers > Email, then try again.");
        const { error: redeemError } = await supabase.rpc("medify_redeem_invite", { p_code: authFields.code.trim(), p_username: username, p_initials: authFields.initials });
        if (redeemError) throw redeemError;
      }
    } catch (error) { setAuthError(error.message || "Unable to continue."); }
    finally { setAuthBusy(false); }
  };
  const signOut = () => supabase.auth.signOut();
  const createInvite = async () => {
    setAdminMessage("");
    if (newInviteCode.trim().length < 8) { setAdminMessage("Use at least 8 characters for the access code."); return; }
    const { error } = await supabase.rpc("medify_create_invite", { p_code: newInviteCode.trim(), p_initials: "FA" });
    if (error) setAdminMessage(error.message); else { setAdminMessage("Access code created. Share it privately with one teammate."); setInvites((current) => [{ id: crypto.randomUUID(), code_value: newInviteCode.trim(), used_at: null, revoked_at: null, deactivated_at: null, created_at: new Date().toISOString() }, ...current]); setNewInviteCode(""); }
  };
  const revokeInvite = async (id) => {
    if (!window.confirm("Revoke this unused access code? It will no longer work.")) return;
    const { error } = await supabase.rpc("medify_revoke_invite", { p_id: id });
    if (error) setAdminMessage(error.message); else { setAdminMessage("Access code revoked."); setInvites((current) => current.map((invite) => invite.id === id ? { ...invite, revoked_at: new Date().toISOString() } : invite)); }
  };
  const deactivateInvite = async (id) => {
    if (!window.confirm("Deactivate this access code? It will no longer work.")) return;
    const { error } = await supabase.rpc("medify_deactivate_invite", { p_id: id });
    if (error) setAdminMessage(error.message); else { setAdminMessage("Access code deactivated."); setInvites((current) => current.map((invite) => invite.id === id ? { ...invite, deactivated_at: new Date().toISOString() } : invite)); }
  };
  const deleteInvite = async (id) => {
    if (!window.confirm("Permanently delete this access code? This cannot be undone.")) return;
    const { error } = await supabase.rpc("medify_delete_invite", { p_id: id });
    if (error) setAdminMessage(error.message); else { setAdminMessage("Access code deleted."); setInvites((current) => current.filter((invite) => invite.id !== id)); }
  };

  if (authLoading) return <main className="app"><section className="page auth-page"><section className="card"><p className="eyebrow">Medify Support Navigator</p><h1>Loading secure access…</h1></section></section></main>;
  if (!session || !profile) return <main className="app"><section className="page auth-page"><div className="intro"><p className="eyebrow">Secure team workspace</p><h1>Medify Support Navigator</h1><p>Sign in with your username and PIN, or activate a one-time access code.</p></div><section className="card auth-card"><div className="heading"><div><h2>{authMode === "login" ? "Sign in" : "Activate access"}</h2><p className="auth-helper">No email address is required.</p></div><span className="tag">{authMode === "login" ? "Team account" : "Invite only"}</span></div><form className="fields" onSubmit={submitAuth}><label className="field"><span>Username</span><input required autoCapitalize="none" value={authFields.username} onChange={(event) => setAuthFields({ ...authFields, username: event.target.value })} /></label><label className="field"><span>PIN / passcode</span><input required minLength="8" type="password" value={authFields.password} onChange={(event) => setAuthFields({ ...authFields, password: event.target.value })} /></label>{authMode === "signup" && <><label className="field"><span>One-time access code</span><input required value={authFields.code} onChange={(event) => setAuthFields({ ...authFields, code: event.target.value })} /></label><label className="field"><span>Initials</span><select value={authFields.initials} onChange={(event) => setAuthFields({ ...authFields, initials: event.target.value })}><option value="JA">JA</option><option value="FA">FA</option></select></label></>}<div className="bottom"><button className="report-button" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Sign in" : "Activate account"}</button></div></form>{authError && <p className="auth-error" role="alert">{authError}</p>}<button className="text-button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>{authMode === "login" ? "I have an access code → Activate account" : "Already activated? → Sign in"}</button></section></section></main>;

  const tileColors = ["purple", "blue", "mint", "orange", "pink"];
  const tileIconFor = (label) => {
    const l = label.toLowerCase();
    if (l.includes("email")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (l.includes("contact") || l.includes("phone")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v3a2 2 0 0 1-2 2C10.5 19 5 13.5 5 7a2 2 0 0 1 1-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
    if (l.includes("order") || l.includes("sku")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7 12 3 4 7v10l8 4 8-4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M4 7l8 4 8-4M12 11v10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
    if (l.includes("name") || l.includes("spoke") || l.includes("initial")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2" /><path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
    if (l.includes("reason") || l.includes("issue")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
    if (l.includes("action") || l.includes("resolution")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (l.includes("cross") || l.includes("fc")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="20" r="1.4" fill="currentColor" /><circle cx="18" cy="20" r="1.4" fill="currentColor" /><path d="M2 3h3l2.4 12.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 2-1.6L21 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    if (l.includes("date")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
    if (l.includes("id")) return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" /><circle cx="9" cy="12" r="1.6" stroke="currentColor" strokeWidth="1.6" /><path d="M13 10h6M13 14h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
  };
  const FieldTile = ({ label, index }) => <span className={`icon-tile icon-tile-${tileColors[index % tileColors.length]}`}>{tileIconFor(label)}</span>;
  const initialsFor = (name) => (name || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "?";
  const avatarColors = ["purple", "blue", "mint", "orange", "pink"];
  const avatarColorFor = (name) => avatarColors[[...(name || "")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarColors.length];
  const driverStyle = (driver) => {
    const d = (driver || "").toLowerCase();
    if (d.includes("filter")) return ["mint", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16l-6 8v5l-4 2v-7L4 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>];
    if (d.includes("return") || d.includes("refund")) return ["orange", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4v6h6M4.5 14a8 8 0 1 0 2-8.5L4 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>];
    if (d.includes("cancel")) return ["pink", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>];
    if (d.includes("warranty") || d.includes("troubleshoot")) return ["blue", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-2.9 8.2-7 9.5-4.1-1.3-7-5-7-9.5V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>];
    if (d.includes("ups") || d.includes("shipping") || d.includes("order")) return ["purple", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7l9-4 9 4-9 4-9-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M3 7v10l9 4 9-4V7M12 11v10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>];
    if (d.includes("discount") || d.includes("hsa")) return ["orange", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12 12 20 4 12l3-8h10l3 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>];
    return ["blue", <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>];
  };
  const navIcons = {
    notes: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>,
    email: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    reports: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20V10M12 20V4M20 20v-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    drivers: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    admin: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-2.9 8.2-7 9.5C7.9 19.2 5 15.5 5 11V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  };
  const navButton = (id, label, count) => <button className={view === id ? "nav-button active" : "nav-button"} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>{navIcons[id]}{label}{count !== undefined && <b aria-label={`${count} saved reports`}>{count}</b>}</button>;
  return <main className={`app view-${view}`}>
    <header className="header">
      <button className="brand" type="button" onClick={() => setView("notes")}><img src={`${import.meta.env.BASE_URL}medify-logo.svg`} alt="Medify Air" /><span>Navigator</span></button>
      <nav className="nav" aria-label="Main navigation">{navButton("notes", "Call notes")}{navButton("email", "Email notes")}{navButton("reports", "Reports", reports.length)}{navButton("drivers", "Call drivers")}{profile.role === "creator" && navButton("admin", "Admin")}</nav>
      <div className="header-actions">{view === "summary" && <button className="text-button" onClick={() => setView("notes")}>← Back to notes</button>}<button className="clear-button clear-button-gradient" onClick={clearCall}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 0 0-14-3M4 16a8 8 0 0 0 14 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Clear for next call</button><button className="text-button sign-out-button" onClick={signOut}>Sign out</button></div>
    </header>
    {view === "notes" && <section className="page page-notes">
      <div className="intro-row">
        <div className="intro"><p className="eyebrow">Single-call workspace</p><h1 ref={pageHeadingRef} tabIndex="-1">Call / Ticket Note Generator <span className="title-icon" aria-hidden="true">✨</span></h1><p>Start the timer when the call begins, add information as you go, then stop it before opening the report summary.</p></div>
        <div className="hero-illustration" aria-hidden="true">
          <svg viewBox="0 0 160 140" fill="none">
            <circle cx="80" cy="70" r="58" fill="var(--call-100)" />
            <rect x="42" y="38" width="60" height="72" rx="10" fill="#fff" stroke="var(--call-200)" strokeWidth="2" />
            <path d="M52 56h40M52 68h40M52 80h26" stroke="var(--call)" strokeWidth="4" strokeLinecap="round" opacity=".55" />
            <circle cx="112" cy="48" r="15" fill="var(--reports-100)" stroke="#cdeedb" strokeWidth="2" />
            <path d="M106 48l4 4 8-8" stroke="var(--reports)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="34" cy="100" r="11" fill="var(--drivers-100)" />
            <path d="M34 95v5l3 3" stroke="var(--drivers)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="128" cy="98" r="6" fill="#fbcfe8" />
            <circle cx="24" cy="46" r="4" fill="#bfdbfe" />
            <circle cx="140" cy="70" r="3" fill="var(--call)" opacity=".5" />
          </svg>
        </div>
      </div>
      <section className="timer-card" aria-labelledby="timer-heading"><div className="timer-icon-tile"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 7v5l3 3M12 3a9 9 0 1 0 9 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg></div><div className="timer-card-main"><p className="eyebrow" id="timer-heading">Call timer</p><strong className="timer" aria-label={`Elapsed call time: ${elapsed(seconds)}`}>{elapsed(seconds)}</strong><p className="timer-status" role="status">{running ? "Call timer is running" : stop ? "Call timer stopped" : "Timer has not started"}</p></div><div className="actions timer-actions"><button className="start-button" aria-label={start && stop ? "Start a new call timer" : "Start call timer"} disabled={running} onClick={startTimer}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7Z" /></svg>{start && stop ? "Start new timer" : "Start"}</button><button className="stop-button" aria-label="Stop call timer and save report" disabled={!running} onClick={stopTimer}><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>Stop</button><button className="clear-button" onClick={clearCall}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 12a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2L7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Clear fields</button></div></section>
      <section className="card"><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3v4M18 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Call details</p><h2>Ticket information</h2></div><span className="tag">Call notes</span></div><div className="fields">{Object.entries(fields).map(([label, value], index) => { const isNote = label === "Reason for Calling" || label === "ACTION TAKEN"; return <label className={isNote ? `field field-icon note-field ${label === "Reason for Calling" ? "note-reason" : "note-action"}` : "field field-icon"} key={label}><FieldTile label={label} index={index} /><span className="field-body"><span className="field-name">{label}</span>{isNote ? <textarea rows="2" value={value} placeholder={label === "Reason for Calling" ? "Why is the customer contacting us?" : "Write completed actions, pending actions, and next steps."} onChange={(e) => update(label, e.target.value)} /> : <input value={value} onChange={(e) => update(label, e.target.value)} />}</span></label>; })}<label className="field field-icon"><FieldTile label="Your Initials" index={9} /><span className="field-body"><span className="field-name">Your initials</span><select value={agentInitials} onChange={(e) => setAgentInitials(e.target.value)}>{agentInitialOptions.map((initials) => <option key={initials} value={initials}>{initials}</option>)}</select></span></label></div></section>
      <section className="card"><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12l2 2 4-4M12 3l8 4v5c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V7l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Copy-ready note</p><h2>Ticket note preview</h2></div><button className="secondary-button" onClick={copy}>Copy notes</button></div><pre className="preview-panel preview-panel-call">{report}</pre></section>
      <section className="card home-saved-reports"><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5h11l3 3v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 5v4h7V5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>Saved calls</p><h2>Saved Reports</h2></div><button className="secondary-button" onClick={() => setView("reports")}>View all reports</button></div><div className="call-list avatar-list">{reports.slice(0, 3).map((item) => { const name = item.fields["Spoke With"] || "Unnamed caller"; return <details key={item.id}><summary><span className="avatar-row"><span className={`avatar avatar-${avatarColorFor(name)}`}>{initialsFor(name)}</span><span><strong>{name}</strong><small>{item.fields["Order Num"] ? `Order: ${item.fields["Order Num"]}` : when(item.stop)}</small></span></span><b>{elapsed(item.seconds)}</b></summary></details>; })}</div></section>
      <div className="bottom"><button className="secondary-button" onClick={clearCall}>Clear fields</button><button className="report-button" onClick={() => setView("summary")}>Open report summary →</button></div>
    </section>}
    {view === "email" && <section className="page page-email"><div className="intro-row"><div className="intro"><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6l9 6 9-6M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Email workspace</p><h1>Email notes</h1><p>Use this separate template for email cases. These fields do not appear in Call Notes or call reports.</p></div><div className="hero-illustration hero-illustration-email" aria-hidden="true"><svg viewBox="0 0 160 140" fill="none"><circle cx="80" cy="70" r="58" fill="var(--email-100)" /><rect x="36" y="44" width="88" height="58" rx="10" fill="#fff" stroke="#bfdbfe" strokeWidth="2" /><path d="M40 50l40 28 40-28" stroke="var(--email)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="122" cy="42" r="13" fill="var(--call-100)" /><path d="M117 42h10M122 37v10" stroke="var(--call)" strokeWidth="2.2" strokeLinecap="round" /><circle cx="30" cy="96" r="8" fill="#fbcfe8" /><circle cx="140" cy="88" r="5" fill="var(--reports-100)" /></svg></div></div><section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready email case note</p><h2>Email ticket information</h2></div><span className="tag">Email notes</span></div><div className="fields email-fields">{Object.entries(emailFields).map(([label, value], index) => <label className={label === "Issue" || label === "Resolution" ? "field field-icon email-note-field" : "field field-icon"} key={label}><FieldTile label={label} index={index} /><span className="field-body"><span className="field-name">{label}</span>{label === "Issue" || label === "Resolution" ? <textarea rows="2" value={value} placeholder={label === "Issue" ? "What does the customer need help with?" : "What was explained or completed?"} onChange={(e) => updateEmail(label, e.target.value)} /> : <input value={value} onChange={(e) => updateEmail(label, e.target.value)} />}</span></label>)}</div><div className="bottom"><button className="clear-button" onClick={clearEmailNotes}>Clear email notes</button></div></section><section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready note</p><h2>Email note preview</h2></div><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(emailNote).then(() => setToast("Email notes copied to clipboard")).catch(() => setToast("Copy was blocked. Please select the text manually."))}>Copy email notes</button></div><pre className="preview-panel preview-panel-email">{emailNote}</pre></section></section>}
    {view === "summary" && <section className="page report-page page-summary"><div className="intro"><p className="eyebrow">Call report</p><h1>Summary</h1><p>Stopping the timer automatically saves this call in your local report history.</p></div><section className="card"><div className="heading"><h2>Call timing</h2><span className={running ? "status running" : stop ? "status done" : "status"}>{running ? "In progress" : stop ? "Stopped" : "Not started"}</span></div><dl className="rows"><div><dt>Call started</dt><dd>{when(start)}</dd></div><div><dt>Call ended</dt><dd>{when(stop)}</dd></div><div><dt>Total call time</dt><dd>{start ? elapsed(seconds) : "Timer was not started"}</dd></div></dl></section><section className="card"><div className="heading"><h2>Customer and ticket details</h2><button className="secondary-button" onClick={copy}>Copy full report</button></div><dl className="rows">{Object.entries(fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{label === "JA" ? value || "Not provided" : value || "Not provided"}</dd></div>)}</dl></section><div className="bottom"><button className="secondary-button" onClick={() => setView("notes")}>← Edit notes</button><button className="report-button" disabled={!stop}>{stop ? "Automatically saved" : "Stop timer to save"}</button><button className="clear-button" onClick={clearCall}>Clear for next call</button></div></section>}
    {view === "reports" && <section className="page reports-page page-reports"><div className="intro"><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19V10M10 19V4M16 19v-7M22 19H2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Saved on this device</p><h1>Call reports <span className="title-icon" aria-hidden="true">📊</span></h1><p>Review completed calls by day, week, month, quarter, or year. Clear the history whenever you need to.</p></div><div className="report-toolbar"><div className="report-tabs">{reportTypes.map((type) => <button key={type} className={reportType === type ? "active" : ""} onClick={() => setReportType(type)}>{type}</button>)}</div><button className="clear-button" disabled={!reports.length} onClick={clearHistory}>Clear all report history</button>{clearedReports.length > 0 && <button className="report-button" onClick={undoClearHistory}>Undo cleared reports</button>}</div>{groupedReports.length ? <div className="report-groups">{groupedReports.map(([key, items]) => { const total = items.reduce((sum, item) => sum + item.seconds, 0); const average = Math.round(total / items.length); return <section className="card group-card" key={key}><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>{reportType} report</p><h2>{periodLabel(key, reportType)}</h2></div><div className="metrics"><span><b>{items.length}</b> calls</span><span><b>{elapsed(total)}</b> total</span><span><b>{elapsed(average)}</b> avg / call</span></div></div><div className="call-list avatar-list">{items.map((item) => { const name = item.fields["Spoke With"] || "Unnamed caller"; return <details key={item.id}><summary><span className="avatar-row"><span className={`avatar avatar-${avatarColorFor(name)}`}>{initialsFor(name)}</span><span><strong>{name}</strong><small>{when(item.stop)}</small></span></span><b>{elapsed(item.seconds)}</b></summary><div className="call-actions"><button className="secondary-button" onClick={() => beginEditReport(item)}>Edit call time</button><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(Object.entries(item.fields).map(([label, value]) => `${label}: ${value || "Not provided"}`).join("\\n")).then(() => setToast("Report copied to clipboard"))}>Copy report</button><button className="clear-button" onClick={() => deleteReport(item)}>Delete report</button></div><dl className="rows">{Object.entries(item.fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{value || "Not provided"}</dd></div>)}</dl></details>; })}</div></section>; })}</div> : <section className="empty-state"><h2>No saved reports yet</h2><p>Start a call and press <strong>Stop</strong> when it ends. The report is saved automatically.</p></section>}{editingReport && <div className="edit-overlay"><section className="card edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-call-title"><div className="heading"><div><p className="eyebrow">Correct saved report</p><h2 id="edit-call-title">Edit call time</h2></div><button className="text-button" onClick={() => setEditingReport(null)}>Close</button></div><p className="edit-help">Enter the exact total duration in seconds. You can enter any number, such as <strong>1178</strong>, and it will automatically display as 19m 38s.</p><div className="fields"><label className="field"><span>Call started</span><input type="datetime-local" value={editStart} onChange={(event) => setEditStart(event.target.value)} /></label><label className="field"><span>Total duration in seconds</span><input type="number" min="0" step="1" inputMode="numeric" value={editTotalSeconds} onChange={(event) => setEditTotalSeconds(event.target.value)} placeholder="Example: 1178" /><small className="duration-preview">Automatically calculated: {Number.isInteger(Number(editTotalSeconds)) && Number(editTotalSeconds) >= 0 ? elapsed(Number(editTotalSeconds)) : "Enter whole seconds"}</small></label></div><div className="bottom"><button className="secondary-button" onClick={() => setEditingReport(null)}>Cancel</button><button className="report-button" onClick={saveEditedReport}>Save corrected time</button></div></section></div>}</section>}
    {view === "drivers" && <section className="page reports-page page-drivers"><div className="intro"><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12h4l3-8 4 16 3-8h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Automatic note analysis</p><h1>Call drivers</h1><p>Drivers are detected from Reason for Calling and ACTION TAKEN when you stop each call.</p></div><div className="report-toolbar"><div className="report-tabs">{reportTypes.map((type) => <button key={type} className={reportType === type ? "active" : ""} onClick={() => setReportType(type)}>{type}</button>)}</div></div>{groupedDriverReports.length ? <div className="report-groups">{groupedDriverReports.map(([key, drivers]) => <section className="card group-card" key={key}><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>{reportType} driver report</p><h2>{periodLabel(key, reportType)}</h2></div></div><div className="driver-list">{drivers.map(([driver, items]) => { const total = items.reduce((sum, item) => sum + item.seconds, 0); const [dColor, dIcon] = driverStyle(driver); return <div className={`driver-row driver-row-${dColor}`} key={driver}><div className="driver-row-main"><span className={`icon-tile icon-tile-${dColor} icon-tile-round`}>{dIcon}</span><div><strong>{driver}</strong><small>{items.length} {items.length === 1 ? "call" : "calls"}</small></div></div><div className="metrics"><span><b>{elapsed(total)}</b> total</span><span><b>{elapsed(Math.round(total / items.length))}</b> avg / call</span></div></div>; })}</div></section>)}</div> : <section className="empty-state"><h2>No call drivers yet</h2><p>Finish a call and the website will detect its driver automatically from your notes.</p></section>}</section>}
    {view === "admin" && profile.role === "creator" && <section className="page report-page page-admin"><div className="intro"><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-2.9 8.2-7 9.5C7.9 19.2 5 15.5 5 11V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Creator-only controls</p><h1>Admin <span className="title-icon" aria-hidden="true">👑</span></h1><p>Create one-time access codes for teammates. Codes are stored securely and can only be used once.</p></div><section className="card"><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>Invite a teammate</p><h2>Generate access code</h2></div><span className="tag">Creator access</span></div><label className="field wide"><span>New access code</span><div className="input-with-button"><input minLength="8" value={newInviteCode} onChange={(event) => setNewInviteCode(event.target.value)} placeholder="Create a private code (8+ characters)" /><button className="report-button" onClick={createInvite}>Create one-time code</button></div></label>{adminMessage && <p className="auth-helper" role="status">{adminMessage}</p>}</section><section className="card"><div className="heading"><div><p className="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>Access management</p><h2>Generated access codes</h2></div></div><div className="invite-list">{invites.map((invite) => { const inactive = invite.used_at || invite.revoked_at || invite.deactivated_at; return <div className="invite-row" key={invite.id}><div><strong>{invite.used_at ? "Used" : invite.revoked_at ? "Revoked" : invite.deactivated_at ? "Deactivated" : "Active"}</strong><code>{invite.code_value || "Code unavailable — run the SQL update to store new codes."}</code><small>{when(new Date(invite.created_at).getTime())}</small></div><div className="invite-actions">{!inactive && <><button className="secondary-button" onClick={() => deactivateInvite(invite.id)}>Deactivate</button><button className="clear-button" onClick={() => revokeInvite(invite.id)}>Revoke</button></>}<button className="clear-button" onClick={() => deleteInvite(invite.id)}>Delete</button></div></div>; })}</div>{!invites.length && <div className="empty-state empty-state-inline"><svg width="88" height="72" viewBox="0 0 120 100" fill="none" aria-hidden="true">
  <circle cx="90" cy="24" r="4" fill="#c4b5fd" /><circle cx="102" cy="42" r="3" fill="#93c5fd" /><circle cx="20" cy="18" r="3" fill="#fbcfe8" /><path d="M14 34l3 3 3-3-3-3-3 3Z" fill="#fde68a" />
  <path d="M46 12c15 0 27 6 27 20v14c0 16-11 26-27 30-16-4-27-14-27-30V32c0-14 12-20 27-20Z" fill="var(--reports)" />
  <path d="M46 16c12.5 0 22.5 5 22.5 17v13c0 13.5-9 22-22.5 25.5C32.5 68 23.5 59.5 23.5 46V33c0-12 10-17 22.5-17Z" fill="#34d399" />
  <rect x="34" y="38" width="24" height="18" rx="4" fill="#fff" /><path d="M38 38v-6a8 8 0 0 1 16 0v6" stroke="#fff" strokeWidth="3.4" fill="none" /><circle cx="46" cy="46" r="3" fill="var(--reports)" /><path d="M46 46v5" stroke="var(--reports)" strokeWidth="2.4" strokeLinecap="round" />
  <circle cx="88" cy="58" r="12" fill="#f6c453" /><circle cx="88" cy="58" r="5" fill="#fff" /><rect x="96" y="56" width="16" height="4.5" rx="2" fill="#f6c453" /><rect x="106" y="61" width="4.5" height="6" rx="1.5" fill="#f6c453" />
</svg><p className="auth-helper">No generated access codes found.</p></div>}</section></section>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

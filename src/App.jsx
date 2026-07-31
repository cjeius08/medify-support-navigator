import { useEffect, useMemo, useState } from "react";
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
    supabase.from("medify_invite_codes").select("id, used_at, revoked_at, created_at").order("created_at", { ascending: false }).then(({ data }) => setInvites(data || []));
  }, [profile, adminMessage]);

  useEffect(() => { if (!running) return undefined; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [running]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { localStorage.setItem("medify-call-reports", JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem("medify-agent-initials", agentInitials); }, [agentInitials]);
  useEffect(() => { localStorage.setItem("medify-active-call-draft", JSON.stringify({ fields, emailFields, start, stop, now })); }, [fields, emailFields, start, stop, now]);
  useEffect(() => { const draft = readDraft(); if (draft) { if (draft.fields) setFields(draft.fields); if (draft.emailFields) setEmailFields(draft.emailFields); if (draft.start) setStart(draft.start); if (draft.stop) setStop(draft.stop); if (draft.now) setNow(draft.now); } }, []);

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
    if (error) setAdminMessage(error.message); else { setAdminMessage("Access code created. Share it privately with one teammate."); setNewInviteCode(""); }
  };
  const revokeInvite = async (id) => {
    if (!window.confirm("Revoke this unused access code? It will no longer work.")) return;
    const { error } = await supabase.rpc("medify_revoke_invite", { p_id: id });
    if (error) setAdminMessage(error.message); else { setAdminMessage("Access code revoked."); setInvites((current) => current.map((invite) => invite.id === id ? { ...invite, revoked_at: new Date().toISOString() } : invite)); }
  };

  if (authLoading) return <main className="app"><section className="page auth-page"><section className="card"><p className="eyebrow">Medify Support Navigator</p><h1>Loading secure access…</h1></section></section></main>;
  if (!session || !profile) return <main className="app"><section className="page auth-page"><div className="intro"><p className="eyebrow">Secure team workspace</p><h1>Medify Support Navigator</h1><p>Sign in with your username and PIN, or activate a one-time access code.</p></div><section className="card auth-card"><div className="heading"><div><h2>{authMode === "login" ? "Sign in" : "Activate access"}</h2><p className="auth-helper">No email address is required.</p></div><span className="tag">{authMode === "login" ? "Team account" : "Invite only"}</span></div><form className="fields" onSubmit={submitAuth}><label className="field"><span>Username</span><input required autoCapitalize="none" value={authFields.username} onChange={(event) => setAuthFields({ ...authFields, username: event.target.value })} /></label><label className="field"><span>PIN / passcode</span><input required minLength="8" type="password" value={authFields.password} onChange={(event) => setAuthFields({ ...authFields, password: event.target.value })} /></label>{authMode === "signup" && <><label className="field"><span>One-time access code</span><input required value={authFields.code} onChange={(event) => setAuthFields({ ...authFields, code: event.target.value })} /></label><label className="field"><span>Initials</span><select value={authFields.initials} onChange={(event) => setAuthFields({ ...authFields, initials: event.target.value })}><option value="JA">JA</option><option value="FA">FA</option></select></label></>}<div className="bottom"><button className="report-button" disabled={authBusy}>{authBusy ? "Please wait…" : authMode === "login" ? "Sign in" : "Activate account"}</button></div></form>{authError && <p className="auth-error" role="alert">{authError}</p>}<button className="text-button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}>{authMode === "login" ? "I have an access code → Activate account" : "Already activated? → Sign in"}</button></section></section></main>;

  return <main className="app">
    <header className="header">
      <button className="brand" type="button" onClick={() => setView("notes")}><img src={`${import.meta.env.BASE_URL}medify-logo.svg`} alt="Medify Air" /><span>Navigator</span></button>
      <nav className="nav" aria-label="Main navigation"><button className={view === "notes" ? "nav-button active" : "nav-button"} onClick={() => setView("notes")}>Call notes</button><button className={view === "email" ? "nav-button active" : "nav-button"} onClick={() => setView("email")}>Email notes</button><button className={view === "reports" ? "nav-button active" : "nav-button"} onClick={() => setView("reports")}>Reports <b>{reports.length}</b></button><button className={view === "drivers" ? "nav-button active" : "nav-button"} onClick={() => setView("drivers")}>Call drivers</button>{profile.role === "creator" && <button className={view === "admin" ? "nav-button active" : "nav-button"} onClick={() => setView("admin")}>Admin</button>}</nav>
      <div className="header-actions">{view === "summary" && <button className="text-button" onClick={() => setView("notes")}>← Back to notes</button>}<button className="clear-button" onClick={clearCall}>Clear for next call</button><button className="text-button" onClick={signOut}>Sign out</button></div>
    </header>
    {view === "notes" && <section className="page">
      <div className="intro"><p className="eyebrow">Single-call workspace</p><h1>Call / Ticket Note Generator</h1><p>Start the timer when the call begins, add information as you go, then stop it before opening the report summary.</p></div>
      <section className="timer-card"><div><p className="eyebrow">Call timer</p><strong className="timer" aria-live="polite">{elapsed(seconds)}</strong><p>{running ? "Call timer is running" : stop ? "Call timer stopped" : "Timer has not started"}</p></div><div className="actions"><button className="start-button" disabled={running} onClick={startTimer}>{start && stop ? "Start new timer" : "Start"}</button><button className="stop-button" disabled={!running} onClick={stopTimer}>Stop</button><div className="preset-row"><span>Quick duration:</span>{[[60,"1:00"],[120,"2:00"],[300,"5:00"],[600,"10:00"]].map(([value,label]) => <button key={value} className="clear-button" disabled={running} onClick={() => setDurationPreset(value)}>{label}</button>)}</div></div></section>
      <section className="card"><div className="heading"><div><p className="eyebrow">Call details</p><h2>Ticket information</h2></div><span className="tag">Call notes</span></div><div className="fields">{Object.entries(fields).map(([label, value]) => { const isNote = label === "Reason for Calling" || label === "ACTION TAKEN"; return <label className={isNote ? `field note-field ${label === "Reason for Calling" ? "note-reason" : "note-action"}` : "field"} key={label}><span>{label}</span>{isNote ? <textarea rows="2" value={value} placeholder={label === "Reason for Calling" ? "Why is the customer contacting us?" : "Write completed actions, pending actions, and next steps."} onChange={(e) => update(label, e.target.value)} /> : <input value={value} onChange={(e) => update(label, e.target.value)} />}</label>; })}<label className="field"><span>Your initials</span><select value={agentInitials} onChange={(e) => setAgentInitials(e.target.value)}>{agentInitialOptions.map((initials) => <option key={initials} value={initials}>{initials}</option>)}</select></label></div></section>
      <section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready note</p><h2>Ticket note preview</h2></div><button className="secondary-button" onClick={copy}>Copy notes</button></div><pre>{report}</pre></section>
      <section className="card home-saved-reports"><div className="heading"><div><p className="eyebrow">Saved calls</p><h2>Saved Reports</h2></div><button className="secondary-button" onClick={() => setView("reports")}>View all reports</button></div><div className="call-list">{reports.slice(0, 3).map((item) => <details key={item.id}><summary><span><strong>{item.fields["Spoke With"] || "Unnamed caller"}</strong><small>{item.fields["Order Num"] ? `Order: ${item.fields["Order Num"]}` : when(item.stop)}</small></span><b>{elapsed(item.seconds)}</b></summary></details>)}</div></section>
      <div className="bottom"><button className="secondary-button" onClick={clearCall}>Clear fields</button><button className="report-button" onClick={() => setView("summary")}>Open report summary →</button></div>
    </section>}
    {view === "email" && <section className="page"><div className="intro"><p className="eyebrow">Email workspace</p><h1>Email notes</h1><p>Use this separate template for email cases. These fields do not appear in Call Notes or call reports.</p></div><section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready email case note</p><h2>Email ticket information</h2></div><span className="tag">Email notes</span></div><div className="fields">{Object.entries(emailFields).map(([label, value]) => <label className="field" key={label}><span>{label}</span>{label === "Issue" || label === "Resolution" ? <textarea rows="4" value={value} placeholder={label === "Issue" ? "What does the customer need help with?" : "What was explained or completed?"} onChange={(e) => updateEmail(label, e.target.value)} /> : <input value={value} onChange={(e) => updateEmail(label, e.target.value)} />}</label>)}</div><div className="bottom"><button className="clear-button" onClick={clearEmailNotes}>Clear email notes</button></div></section><section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready note</p><h2>Email note preview</h2></div><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(emailNote).then(() => setToast("Email notes copied to clipboard")).catch(() => setToast("Copy was blocked. Please select the text manually."))}>Copy email notes</button></div><pre>{emailNote}</pre></section></section>}
    {view === "summary" && <section className="page report-page"><div className="intro"><p className="eyebrow">Call report</p><h1>Summary</h1><p>Stopping the timer automatically saves this call in your local report history.</p></div><section className="card"><div className="heading"><h2>Call timing</h2><span className={running ? "status running" : stop ? "status done" : "status"}>{running ? "In progress" : stop ? "Stopped" : "Not started"}</span></div><dl className="rows"><div><dt>Call started</dt><dd>{when(start)}</dd></div><div><dt>Call ended</dt><dd>{when(stop)}</dd></div><div><dt>Total call time</dt><dd>{start ? elapsed(seconds) : "Timer was not started"}</dd></div></dl></section><section className="card"><div className="heading"><h2>Customer and ticket details</h2><button className="secondary-button" onClick={copy}>Copy full report</button></div><dl className="rows">{Object.entries(fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{label === "JA" ? value || "Not provided" : value || "Not provided"}</dd></div>)}</dl></section><div className="bottom"><button className="secondary-button" onClick={() => setView("notes")}>← Edit notes</button><button className="report-button" disabled={!stop}>{stop ? "Automatically saved" : "Stop timer to save"}</button><button className="clear-button" onClick={clearCall}>Clear for next call</button></div></section>}
    {view === "reports" && <section className="page reports-page"><div className="intro"><p className="eyebrow">Saved on this device</p><h1>Call reports</h1><p>Review completed calls by day, week, month, quarter, or year. Clear the history whenever you need to.</p></div><div className="report-toolbar"><div className="report-tabs">{reportTypes.map((type) => <button key={type} className={reportType === type ? "active" : ""} onClick={() => setReportType(type)}>{type}</button>)}</div><button className="clear-button" disabled={!reports.length} onClick={clearHistory}>Clear all report history</button>{clearedReports.length > 0 && <button className="report-button" onClick={undoClearHistory}>Undo cleared reports</button>}</div>{groupedReports.length ? <div className="report-groups">{groupedReports.map(([key, items]) => { const total = items.reduce((sum, item) => sum + item.seconds, 0); const average = Math.round(total / items.length); return <section className="card group-card" key={key}><div className="heading"><div><p className="eyebrow">{reportType} report</p><h2>{periodLabel(key, reportType)}</h2></div><div className="metrics"><span><b>{items.length}</b> calls</span><span><b>{elapsed(total)}</b> total</span><span><b>{elapsed(average)}</b> avg / call</span></div></div><div className="call-list">{items.map((item) => <details key={item.id}><summary><span><strong>{item.fields["Spoke With"] || "Unnamed caller"}</strong><small>{when(item.stop)}</small></span><b>{elapsed(item.seconds)}</b></summary><div className="call-actions"><button className="secondary-button" onClick={() => beginEditReport(item)}>Edit call time</button><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(Object.entries(item.fields).map(([label, value]) => `${label}: ${value || "Not provided"}`).join("\\n")).then(() => setToast("Report copied to clipboard"))}>Copy report</button><button className="clear-button" onClick={() => deleteReport(item)}>Delete report</button></div><dl className="rows">{Object.entries(item.fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{value || "Not provided"}</dd></div>)}</dl></details>)}</div></section>; })}</div> : <section className="empty-state"><h2>No saved reports yet</h2><p>Start a call and press <strong>Stop</strong> when it ends. The report is saved automatically.</p></section>}{editingReport && <div className="edit-overlay"><section className="card edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-call-title"><div className="heading"><div><p className="eyebrow">Correct saved report</p><h2 id="edit-call-title">Edit call time</h2></div><button className="text-button" onClick={() => setEditingReport(null)}>Close</button></div><p className="edit-help">Enter the exact total duration in seconds. You can enter any number, such as <strong>1178</strong>, and it will automatically display as 19m 38s.</p><div className="fields"><label className="field"><span>Call started</span><input type="datetime-local" value={editStart} onChange={(event) => setEditStart(event.target.value)} /></label><label className="field"><span>Total duration in seconds</span><input type="number" min="0" step="1" inputMode="numeric" value={editTotalSeconds} onChange={(event) => setEditTotalSeconds(event.target.value)} placeholder="Example: 1178" /><small className="duration-preview">Automatically calculated: {Number.isInteger(Number(editTotalSeconds)) && Number(editTotalSeconds) >= 0 ? elapsed(Number(editTotalSeconds)) : "Enter whole seconds"}</small></label></div><div className="bottom"><button className="secondary-button" onClick={() => setEditingReport(null)}>Cancel</button><button className="report-button" onClick={saveEditedReport}>Save corrected time</button></div></section></div>}</section>}
    {view === "drivers" && <section className="page reports-page"><div className="intro"><p className="eyebrow">Automatic note analysis</p><h1>Call drivers</h1><p>Drivers are detected from Reason for Calling and ACTION TAKEN when you stop each call.</p></div><div className="report-toolbar"><div className="report-tabs">{reportTypes.map((type) => <button key={type} className={reportType === type ? "active" : ""} onClick={() => setReportType(type)}>{type}</button>)}</div></div>{groupedDriverReports.length ? <div className="report-groups">{groupedDriverReports.map(([key, drivers]) => <section className="card group-card" key={key}><div className="heading"><div><p className="eyebrow">{reportType} driver report</p><h2>{periodLabel(key, reportType)}</h2></div></div><div className="driver-list">{drivers.map(([driver, items]) => { const total = items.reduce((sum, item) => sum + item.seconds, 0); return <div className="driver-row" key={driver}><div><strong>{driver}</strong><small>{items.length} {items.length === 1 ? "call" : "calls"}</small></div><div className="metrics"><span><b>{elapsed(total)}</b> total</span><span><b>{elapsed(Math.round(total / items.length))}</b> avg / call</span></div></div>; })}</div></section>)}</div> : <section className="empty-state"><h2>No call drivers yet</h2><p>Finish a call and the website will detect its driver automatically from your notes.</p></section>}</section>}
    {view === "admin" && profile.role === "creator" && <section className="page report-page"><div className="intro"><p className="eyebrow">Creator-only controls</p><h1>Admin</h1><p>Create one-time access codes for teammates. Codes are stored securely and can only be used once.</p></div><section className="card"><div className="heading"><div><p className="eyebrow">Invite a teammate</p><h2>Generate access code</h2></div><span className="tag">Creator access</span></div><label className="field"><span>New access code</span><input minLength="8" value={newInviteCode} onChange={(event) => setNewInviteCode(event.target.value)} placeholder="Create a private code (8+ characters)" /></label><div className="bottom"><button className="report-button" onClick={createInvite}>Create one-time code</button></div>{adminMessage && <p className="auth-helper" role="status">{adminMessage}</p>}</section><section className="card"><div className="heading"><div><p className="eyebrow">Access management</p><h2>Generated access codes</h2></div></div><div className="invite-list">{invites.map((invite) => <div className="invite-row" key={invite.id}><div><strong>{invite.used_at ? "Used" : invite.revoked_at ? "Revoked" : "Active"}</strong><small>{when(new Date(invite.created_at).getTime())}</small></div>{!invite.used_at && !invite.revoked_at && <button className="clear-button" onClick={() => revokeInvite(invite.id)}>Revoke / delete</button>}</div>)}</div></section></section>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

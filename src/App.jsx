import { useEffect, useMemo, useState } from "react";

const blank = { "Spoke With": "", "Name on the Account": "", "Order Num": "", "Email Address": "", "Contact #": "", "Reason for Calling": "", "ACTION TAKEN": "", "Offered FC/Cross Sell": "", "AC Call ID": "", JA: "" };
const reportTypes = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];
const elapsed = (seconds) => {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return h ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
};
const when = (time) => time ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(time) : "Not recorded";
const readReports = () => { try { return JSON.parse(localStorage.getItem("medify-call-reports")) || []; } catch { return []; } };
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
  const [view, setView] = useState("notes");
  const [fields, setFields] = useState(blank);
  const [start, setStart] = useState(null);
  const [stop, setStop] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [reports, setReports] = useState(readReports);
  const [reportType, setReportType] = useState("Daily");
  const [toast, setToast] = useState("");
  const running = Boolean(start && !stop);
  const seconds = useMemo(() => start ? Math.max(0, Math.floor(((stop || now) - start) / 1000)) : 0, [start, stop, now]);
  const noteRows = Object.entries(fields).map(([label, value]) => label === "JA" ? `JA${value ? `: ${value}` : ""}` : `${label}: ${value || "Not provided"}`);
  const report = [`Call Started: ${when(start)}`, `Call Ended: ${when(stop)}`, `Call Duration: ${elapsed(seconds)}`, "", ...noteRows].join("\n");
  const savedForCurrentCall = reports.some((item) => item.start === start && item.stop === stop);
  const groupedReports = useMemo(() => {
    const groups = reports.reduce((all, item) => {
      const key = periodKey(reportDate(item), reportType);
      all[key] = [...(all[key] || []), item];
      return all;
    }, {});
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [reports, reportType]);

  useEffect(() => { if (!running) return undefined; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [running]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(""), 2600); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { localStorage.setItem("medify-call-reports", JSON.stringify(reports)); }, [reports]);

  const update = (label, value) => setFields((current) => ({ ...current, [label]: value }));
  const startTimer = () => { const time = Date.now(); setStart(time); setStop(null); setNow(time); };
  const stopTimer = () => { if (running) { const time = Date.now(); setStop(time); setNow(time); } };
  const clearCall = () => { setFields(blank); setStart(null); setStop(null); setNow(Date.now()); setView("notes"); setToast("Current call cleared. Saved reports were kept."); };
  const saveReport = () => {
    if (!start || !stop || savedForCurrentCall) return;
    setReports((current) => [{ id: `${start}-${stop}`, start, stop, seconds, fields: { ...fields }, savedAt: Date.now() }, ...current]);
    setToast("Call report saved. Open Reports to view it.");
  };
  const clearHistory = () => { if (window.confirm("Clear all saved call reports on this device? This cannot be undone.")) { setReports([]); setToast("All saved report history was cleared."); } };
  const copy = () => navigator.clipboard?.writeText(report).then(() => setToast("Copied to clipboard")).catch(() => setToast("Copy was blocked. Please select the text manually."));

  return <main className="app">
    <header className="header">
      <button className="brand" type="button" onClick={() => setView("notes")}><img src={`${import.meta.env.BASE_URL}medify-logo.svg`} alt="Medify Air" /><span>Support tools</span></button>
      <nav className="nav" aria-label="Main navigation"><button className={view === "notes" ? "nav-button active" : "nav-button"} onClick={() => setView("notes")}>Call notes</button><button className={view === "reports" ? "nav-button active" : "nav-button"} onClick={() => setView("reports")}>Reports <b>{reports.length}</b></button></nav>
      <div className="header-actions">{view === "summary" && <button className="text-button" onClick={() => setView("notes")}>← Back to notes</button>}<button className="clear-button" onClick={clearCall}>Clear for next call</button></div>
    </header>
    {view === "notes" && <section className="page">
      <div className="intro"><p className="eyebrow">Single-call workspace</p><h1>Call / Ticket Note Generator</h1><p>Start the timer when the call begins, add information as you go, then stop it before opening the report summary.</p></div>
      <section className="timer-card"><div><p className="eyebrow">Call timer</p><strong className="timer" aria-live="polite">{elapsed(seconds)}</strong><p>{running ? "Call timer is running" : stop ? "Call timer stopped" : "Timer has not started"}</p></div><div className="actions"><button className="start-button" disabled={running} onClick={startTimer}>{start && stop ? "Start new timer" : "Start"}</button><button className="stop-button" disabled={!running} onClick={stopTimer}>Stop</button></div></section>
      <section className="card"><div className="heading"><div><p className="eyebrow">Call details</p><h2>Ticket information</h2></div><span className="tag">Current call stays in memory only</span></div><div className="fields">{Object.entries(fields).map(([label, value]) => <label className={label === "ACTION TAKEN" ? "field wide" : "field"} key={label}><span>{label}</span>{label === "ACTION TAKEN" ? <textarea rows="5" value={value} placeholder="Write completed actions, pending actions, and next steps." onChange={(e) => update(label, e.target.value)} /> : <input value={value} onChange={(e) => update(label, e.target.value)} />}</label>)}</div></section>
      <section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready note</p><h2>Ticket note preview</h2></div><button className="secondary-button" onClick={copy}>Copy notes</button></div><pre>{report}</pre></section>
      <div className="bottom"><button className="secondary-button" onClick={clearCall}>Clear fields</button><button className="report-button" onClick={() => setView("summary")}>Open report summary →</button></div>
    </section>}
    {view === "summary" && <section className="page report-page"><div className="intro"><p className="eyebrow">Call report</p><h1>Summary</h1><p>Check this before saving it to your local report history.</p></div><section className="card"><div className="heading"><h2>Call timing</h2><span className={running ? "status running" : stop ? "status done" : "status"}>{running ? "In progress" : stop ? "Stopped" : "Not started"}</span></div><dl className="rows"><div><dt>Call started</dt><dd>{when(start)}</dd></div><div><dt>Call ended</dt><dd>{when(stop)}</dd></div><div><dt>Total call time</dt><dd>{start ? elapsed(seconds) : "Timer was not started"}</dd></div></dl></section><section className="card"><div className="heading"><h2>Customer and ticket details</h2><button className="secondary-button" onClick={copy}>Copy full report</button></div><dl className="rows">{Object.entries(fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{label === "JA" ? value || "Not provided" : value || "Not provided"}</dd></div>)}</dl></section><div className="bottom"><button className="secondary-button" onClick={() => setView("notes")}>← Edit notes</button><button className="report-button" disabled={!stop || savedForCurrentCall} onClick={saveReport}>{savedForCurrentCall ? "Saved to reports" : "Save to reports"}</button><button className="clear-button" onClick={clearCall}>Clear for next call</button></div></section>}
    {view === "reports" && <section className="page reports-page"><div className="intro"><p className="eyebrow">Saved on this device</p><h1>Call reports</h1><p>Review completed calls by day, week, month, quarter, or year. Clear the history whenever you need to.</p></div><div className="report-toolbar"><div className="report-tabs">{reportTypes.map((type) => <button key={type} className={reportType === type ? "active" : ""} onClick={() => setReportType(type)}>{type}</button>)}</div><button className="clear-button" disabled={!reports.length} onClick={clearHistory}>Clear all report history</button></div>{groupedReports.length ? <div className="report-groups">{groupedReports.map(([key, items]) => { const total = items.reduce((sum, item) => sum + item.seconds, 0); return <section className="card group-card" key={key}><div className="heading"><div><p className="eyebrow">{reportType} report</p><h2>{periodLabel(key, reportType)}</h2></div><div className="metrics"><span><b>{items.length}</b> calls</span><span><b>{elapsed(total)}</b> total</span></div></div><div className="call-list">{items.map((item) => <details key={item.id}><summary><span><strong>{item.fields["Spoke With"] || "Unnamed caller"}</strong><small>{when(item.stop)}</small></span><b>{elapsed(item.seconds)}</b></summary><dl className="rows">{Object.entries(item.fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{value || "Not provided"}</dd></div>)}</dl></details>)}</div></section>; })}</div> : <section className="empty-state"><h2>No saved reports yet</h2><p>Stop a call, open its summary, then choose <strong>Save to reports</strong>.</p></section>}</section>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

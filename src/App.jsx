import { useEffect, useMemo, useState } from "react";

const blank = { "Spoke With": "", "Name on the Account": "", "Order Num": "", "Email Address": "", "Contact #": "", "Reason for Calling": "", "ACTION TAKEN": "", "Offered FC/Cross Sell": "", "AC Call ID": "" };
const elapsed = (seconds) => {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return h ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
};
const when = (time) => time ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(time) : "Not recorded";

export default function App() {
  const [view, setView] = useState("notes");
  const [fields, setFields] = useState(blank);
  const [start, setStart] = useState(null);
  const [stop, setStop] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState("");
  const running = Boolean(start && !stop);
  const seconds = useMemo(() => start ? Math.max(0, Math.floor(((stop || now) - start) / 1000)) : 0, [start, stop, now]);
  const report = [`Call Started: ${when(start)}`, `Call Ended: ${when(stop)}`, `Call Duration: ${elapsed(seconds)}`, "", ...Object.entries(fields).map(([label, value]) => `${label}: ${value || "Not provided"}`)].join("\n");

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const update = (label, value) => setFields((current) => ({ ...current, [label]: value }));
  const startTimer = () => { const time = Date.now(); setStart(time); setStop(null); setNow(time); };
  const stopTimer = () => { if (running) { const time = Date.now(); setStop(time); setNow(time); } };
  const clear = () => { setFields(blank); setStart(null); setStop(null); setNow(Date.now()); setView("notes"); setToast("Cleared and ready for the next call."); };
  const copy = () => navigator.clipboard?.writeText(report).then(() => setToast("Copied to clipboard")).catch(() => setToast("Copy was blocked. Please select the text manually."));

  return <main className="app">
    <header className="header">
      <div className="brand"><img src={`${import.meta.env.BASE_URL}medify-logo.svg`} alt="Medify Air" /><span>Support tools</span></div>
      <div className="header-actions">{view === "summary" && <button className="text-button" onClick={() => setView("notes")}>← Back to notes</button>}<button className="clear-button" onClick={clear}>Clear for next call</button></div>
    </header>
    {view === "notes" ? <section className="page">
      <div className="intro"><p className="eyebrow">Single-call workspace</p><h1>Call / Ticket Note Generator</h1><p>Start the timer when the call begins, add information as you go, then stop it before opening the report summary.</p></div>
      <section className="timer-card">
        <div><p className="eyebrow">Call timer</p><strong className="timer" aria-live="polite">{elapsed(seconds)}</strong><p>{running ? "Call timer is running" : stop ? "Call timer stopped" : "Timer has not started"}</p></div>
        <div className="actions"><button className="start-button" disabled={running} onClick={startTimer}>{start && stop ? "Start new timer" : "Start"}</button><button className="stop-button" disabled={!running} onClick={stopTimer}>Stop</button></div>
      </section>
      <section className="card"><div className="heading"><div><p className="eyebrow">Call details</p><h2>Ticket information</h2></div><span className="tag">Not saved after refresh</span></div>
        <div className="fields">{Object.entries(fields).map(([label, value]) => <label className={label === "ACTION TAKEN" ? "field wide" : "field"} key={label}><span>{label}</span>{label === "ACTION TAKEN" ? <textarea rows="5" value={value} placeholder="Write completed actions, pending actions, and next steps." onChange={(e) => update(label, e.target.value)} /> : <input value={value} onChange={(e) => update(label, e.target.value)} />}</label>)}</div>
      </section>
      <section className="card"><div className="heading"><div><p className="eyebrow">Copy-ready note</p><h2>Ticket note preview</h2></div><button className="secondary-button" onClick={copy}>Copy notes</button></div><pre>{report}</pre></section>
      <div className="bottom"><button className="secondary-button" onClick={clear}>Clear fields</button><button className="report-button" onClick={() => setView("summary")}>Open report summary →</button></div>
    </section> : <section className="page report-page">
      <div className="intro"><p className="eyebrow">Call report</p><h1>Summary</h1><p>A clear summary of this call, including the timer information and all completed fields.</p></div>
      <section className="card"><div className="heading"><h2>Call timing</h2><span className={running ? "status running" : stop ? "status done" : "status"}>{running ? "In progress" : stop ? "Stopped" : "Not started"}</span></div><dl className="rows"><div><dt>Call started</dt><dd>{when(start)}</dd></div><div><dt>Call ended</dt><dd>{when(stop)}</dd></div><div><dt>Total call time</dt><dd>{start ? elapsed(seconds) : "Timer was not started"}</dd></div></dl></section>
      <section className="card"><div className="heading"><h2>Customer and ticket details</h2><button className="secondary-button" onClick={copy}>Copy full report</button></div><dl className="rows">{Object.entries(fields).map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={value ? "" : "empty"}>{value || "Not provided"}</dd></div>)}</dl></section>
      <div className="bottom"><button className="secondary-button" onClick={() => setView("notes")}>← Edit notes</button><button className="clear-button" onClick={clear}>Clear for next call</button></div>
    </section>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </main>;
}

import { useEffect, useId, useRef } from "react";
import Icon from "./Icon";
import { PERIODS } from "./workdeskData";

export function ToolCard({ title, icon, children, open, onToggle, className = "", id }) {
  const panelId = useId();
  return <section id={id} className={`tool-card ${className} ${open ? "" : "is-collapsed"}`}>
    <h2 className="card-heading"><button type="button" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
      <span className="card-icon"><Icon name={icon}/></span><span>{title}</span>
      <Icon name="chevron" className="collapse-chevron"/>
    </button></h2>
    <div id={panelId} hidden={!open}>{children}</div>
  </section>;
}

export function NotePreview({ text, onCopy }) {
  return <aside className="note-preview" aria-label="Generated call note">
    <div className="preview-heading"><span><Icon name="note"/>Note Preview</span><span className="output-label">Generated</span></div>
    <pre tabIndex="0" aria-label="Generated call note text">{text}</pre>
    <button className="ghost-button preview-copy" onClick={onCopy}><Icon name="copy"/>Copy Note</button>
  </aside>;
}

export function CardActions({ onCopy, onReset, copyLabel = "Copy Note", extra, preview }) {
  return <footer className="card-actions">
    {preview && <details className="utility-preview"><summary><Icon name="note"/>Preview note<Icon name="chevron"/></summary><pre tabIndex="0">{preview}</pre></details>}
    <div className="action-row"><button className="ghost-button reset-button" onClick={onReset}><Icon name="reset"/>Reset</button><div>{extra}<button className="primary-button" onClick={onCopy}><Icon name="copy"/>{copyLabel}</button></div></div>
  </footer>;
}

export function PeriodTabs({ period, setPeriod, label = "Report period" }) {
  return <div className="period-tabs" role="group" aria-label={label}>{PERIODS.map((item, index) =>
    <button key={item} type="button" aria-pressed={period === item} className={period === item ? "active" : ""} onClick={() => setPeriod(item)} onKeyDown={(event) => {
      const next = event.key === "ArrowRight" ? (index + 1) % PERIODS.length : event.key === "ArrowLeft" ? (index + PERIODS.length - 1) % PERIODS.length : event.key === "Home" ? 0 : event.key === "End" ? PERIODS.length - 1 : null;
      if (next === null) return;
      event.preventDefault(); setPeriod(PERIODS[next]); event.currentTarget.parentElement.children[next].focus();
    }}>{item}</button>
  )}</div>;
}

export function Dialog({ title, eyebrow, onClose, children, footer, className = "" }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`dialog-shell ${className}`} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}>
    <header className="dialog-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div><button type="button" className="icon-button" aria-label={`Close ${title}`} onClick={onClose}><Icon name="close"/></button></header>
    <div className="dialog-body">{children}</div>
    {footer && <footer className="dialog-footer">{footer}</footer>}
  </dialog>;
}

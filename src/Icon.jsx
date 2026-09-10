const paths = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  chart: <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20V7"/></>,
  phone: <path d="M7.8 3.5 5.6 4.6c-.9.5-1.3 1.6-.9 2.6 2.7 6.8 8.1 12.2 14.9 14.9 1 .4 2.1 0 2.6-.9l1.1-2.2c.4-.9.1-1.9-.7-2.4l-3-1.7c-.8-.4-1.8-.3-2.4.4l-1.2 1.4a15.7 15.7 0 0 1-6.7-6.7l1.4-1.2c.7-.6.8-1.6.4-2.4l-1.7-3c-.5-.8-1.5-1.1-2.4-.7Z"/>,
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.2 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.05 2.05-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56v.09h-2.9v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.05-2.05.06-.06A1.7 1.7 0 0 0 7.08 15a1.7 1.7 0 0 0-1.56-1.03h-.09v-2.9h.09A1.7 1.7 0 0 0 7.08 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06L8.73 6l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.56v-.09h2.9v.09A1.7 1.7 0 0 0 15.63 6.4a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.05 2.06-.06.06A1.7 1.7 0 0 0 19.22 10a1.7 1.7 0 0 0 1.56 1.03h.09v2.9h-.09A1.7 1.7 0 0 0 19.2 15Z"/></>,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  note: <><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v4h6V3M8.5 11h7M8.5 15h7"/></>,
  package: <><path d="m12 3 8 4.3v9.4L12 21l-8-4.3V7.3L12 3Z"/><path d="m4.2 7.4 7.8 4.2 7.8-4.2M12 11.7V21"/></>,
  tag: <><path d="M4 4h7l9 9-7 7-9-9V4Z"/><circle cx="8.5" cy="8.5" r="1" fill="currentColor"/></>,
  truck: <><path d="M3 6h11v10H3zM14 9h3l3 3v4h-6z"/><circle cx="7" cy="18" r="1.7"/><circle cx="17" cy="18" r="1.7"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="1"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></>,
  reset: <><path d="M4.5 9A8 8 0 1 1 6 17.5"/><path d="M4.5 4.5V9H9"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  play: <path d="m9 6 8 6-8 6V6Z" fill="currentColor"/>,
  stop: <rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor"/>,
  chevron: <path d="m7 9 5 5 5-5"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>,
  user: <><circle cx="12" cy="8" r="3"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/></>,
  check: <path d="m5 12 4.3 4.3L19 6.7"/>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14"/><path d="M10 11v6M14 11v6"/></>,
  edit: <><path d="m4 20 4.5-1 9.7-9.7a2 2 0 0 0-2.8-2.8L5.7 16.2 4 20Z"/><path d="m13.5 8.5 2.8 2.8"/></>,
  alert: <><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v4M12 17h.01"/></>
};

export default function Icon({ name, size = 18, className = "" }) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.note}</svg>;
}

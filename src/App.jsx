import { useEffect, useMemo, useRef, useState } from "react";
import {
  VERIFIED_ON,
  conflicts,
  guidedFlows,
  noteHeadings,
  products,
  scriptLibrary,
  sources,
  supportOnlyProducts,
  synonyms,
  taskSelector,
  workflows
} from "./data";
import {
  buildFinderResponse,
  buildWorkflowResponse,
  OUTPUT_CHANNELS
} from "./responseEngine";

const ICON_PATHS = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h3a4 4 0 0 0 4-4V9a2 2 0 0 1 2-2h1" /></>,
  wind: <><path d="M4 8h9a3 3 0 1 0-3-3" /><path d="M4 12h14a2 2 0 1 1-2 2" /><path d="M4 16h7" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" /></>,
  message: <><path d="M21 14a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /><path d="M8 9h8M8 13h5" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 11.2 19a19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1Z" /></>,
  alert: <><path d="M10.3 3.7 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  back: <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  star: <path d="m12 2.8 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.4l6.2-.9Z" />,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.7 2.7L16.5 9" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
  external: <><path d="M14 3h7v7M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
  rotate: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  ruler: <><path d="m3 17 14-14 4 4L7 21 3 17Z" /><path d="m14 6 4 4M11 9l2 2M8 12l2 2M5 15l2 2" /></>,
  chevron: <path d="m9 18 6-6-6-6" />
};

function Icon({ name, size = 20 }) {
  return (
    <svg aria-hidden="true" className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  );
}

const navItems = [
  { id: "home", label: "Home", icon: "home" },
  { id: "processes", label: "Guided processes", icon: "route" },
  { id: "finder", label: "Purifier finder", icon: "wind" },
  { id: "products", label: "Products & filters", icon: "book" },
  { id: "scripts", label: "Scripts & notes", icon: "message" },
  { id: "sources", label: "Sources & review", icon: "shield" }
];

const readLocal = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = saved;
    }
  }
  return row[b.length];
}

function fuzzyScore(query, content) {
  const q = normalize(query);
  const text = normalize(content);
  if (!q) return 0;
  if (text.includes(q)) return 100 - Math.max(0, text.indexOf(q) / 10);
  const queryTokens = q.split(" ");
  const textTokens = text.split(" ");
  let score = 0;
  for (const token of queryTokens) {
    if (textTokens.some((candidate) => candidate.startsWith(token))) score += 18;
    else if (textTokens.some((candidate) => token.length > 3 && levenshtein(token, candidate) <= 2)) score += 12;
  }
  return score;
}

function StatusBadge({ status }) {
  const lower = status.toLowerCase();
  const tone = lower.includes("ready") || lower === "active" || lower.includes("approved")
    ? "success"
    : lower.includes("blocked") || lower.includes("critical") || lower.includes("immediate")
      ? "danger"
      : lower.includes("confirmation") || lower.includes("pending") || lower.includes("live")
        ? "warning"
        : "neutral";
  return <span className={`status-badge ${tone}`}><span aria-hidden="true">●</span>{status}</span>;
}

function CopyButton({ text, onCopied, label = "Copy" }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      onCopied?.();
    } catch {
      onCopied?.("Copy was blocked by the browser. Select the text manually.");
    }
  }
  return <button className="secondary-button compact" type="button" onClick={copy}><Icon name="copy" size={16} />{label}</button>;
}

export default function App() {
  const [view, setView] = useState("home");
  const [dark, setDark] = useState(() => localStorage.getItem("medify-theme") === "dark" || (!localStorage.getItem("medify-theme") && matchMedia("(prefers-color-scheme: dark)").matches));
  const [callMode, setCallMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [favorites, setFavorites] = useState(() => readLocal("medify-favorites", ["WF-012", "WF-005", "WF-009"]));
  const [recents, setRecents] = useState(() => readLocal("medify-recents", []));
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("medify-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const searchItems = useMemo(() => {
    return [
      ...workflows.map((item) => ({ id: item.id, type: "Process", title: item.title, meta: item.category, text: `${item.title} ${item.category} ${item.summary} ${item.id === "WF-019" ? "air purifier recommendation finder model" : ""}` })),
      ...products.map((item) => ({ id: item.id, type: "Product", title: `${item.model} ${item.revision}`, meta: item.status, text: `${item.model} air purifier ${item.revision} ${item.summary} ${item.coverage || ""} ${item.controls}` })),
      ...Object.entries(scriptLibrary).map(([channel, item]) => ({ id: channel, type: "Script", title: item.title, meta: channel, text: `${item.title} ${item.text}` })),
      ...sources.map(([id, title, type, status]) => ({ id, type: "Source", title, meta: `${type} · ${status}`, text: `${id} ${title} ${type} ${status}` }))
    ];
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return searchItems.slice(0, 9);
    const normalizedQuery = normalize(query);
    const expansion = Object.entries(synonyms)
      .filter(([key]) => normalizedQuery.includes(normalize(key)) || (normalizedQuery.length > 3 && levenshtein(normalizedQuery, normalize(key)) <= 2))
      .map(([, value]) => value)
      .join(" ");
    const expandedQuery = `${query} ${expansion}`.trim();
    return searchItems
      .map((item) => ({ ...item, score: fuzzyScore(expandedQuery, item.text) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [query, searchItems]);

  function navigate(nextView) {
    setView(nextView);
    if (nextView !== "processes") setActiveWorkflow(null);
    if (nextView !== "products") setActiveProduct(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remember(type, id) {
    const key = `${type}:${id}`;
    const next = [key, ...recents.filter((item) => item !== key)].slice(0, 6);
    setRecents(next);
    localStorage.setItem("medify-recents", JSON.stringify(next));
  }

  function openWorkflow(id) {
    if (id === "WF-019") {
      navigate("finder");
      remember("process", id);
      return;
    }
    if (id === "WF-021") {
      navigate("products");
      remember("process", id);
      return;
    }
    if (id === "WF-029") {
      navigate("scripts");
      remember("process", id);
      return;
    }
    setView("processes");
    setActiveWorkflow(id);
    remember("process", id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProduct(id) {
    setView("products");
    setActiveProduct(id);
    remember("product", id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("medify-favorites", JSON.stringify(next));
  }

  function chooseSearchResult(item) {
    setSearchOpen(false);
    setQuery("");
    if (item.type === "Process") openWorkflow(item.id);
    else if (item.type === "Product") openProduct(item.id);
    else if (item.type === "Script") navigate("scripts");
    else navigate("sources");
  }

  return (
    <div className={`app-shell ${callMode ? "call-mode" : ""}`}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => navigate("home")} aria-label="Go to Medify Air support home">
          <img src={`${import.meta.env.BASE_URL}medify-logo.svg`} alt="Medify Air" width="176" height="33" />
          <span>Support Knowledge Base</span>
        </button>
        <nav aria-label="Primary navigation" className="primary-nav">
          {navItems.map((item) => (
            <button
              className={view === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "sources" && <span className="nav-count" aria-label="17 high-priority review items">17</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="source-health">
            <span className="health-dot" />
            <div><strong>Source health</strong><span>Reviewed Jul 23, 2026</span></div>
          </div>
          <p>No customer information is stored. Live case fields stay in memory only.</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="global-search" type="button" onClick={() => setSearchOpen(true)} aria-label="Open global search" data-testid="global-search">
            <Icon name="search" size={19} />
            <span>Search a process, symptom, model, or script…</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="icon-button" type="button" onClick={() => setDark((value) => !value)} aria-label={dark ? "Use light theme" : "Use dark theme"} data-testid="theme-toggle">
              <Icon name={dark ? "sun" : "moon"} />
            </button>
            <button className={`call-button ${callMode ? "active" : ""}`} type="button" onClick={() => setCallMode((value) => !value)} aria-pressed={callMode} data-testid="call-mode-toggle">
              <Icon name="phone" size={18} />{callMode ? "Exit call mode" : "Call mode"}
            </button>
            <div className="avatar" aria-label="Signed in user">CJ</div>
          </div>
        </header>

        <main id="main-content" className="main" tabIndex="-1">
          {view === "home" && (
            <Home
              favorites={favorites}
              recents={recents}
              onNavigate={navigate}
              onOpenWorkflow={openWorkflow}
              onOpenProduct={openProduct}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {view === "processes" && (
            <Processes
              activeId={activeWorkflow}
              favorites={favorites}
              callMode={callMode}
              onBack={() => setActiveWorkflow(null)}
              onOpen={openWorkflow}
              onToggleFavorite={toggleFavorite}
              onCopied={(message = "Copied to clipboard") => setToast(message)}
            />
          )}
          {view === "finder" && <Finder onOpenProduct={openProduct} onCopied={(message = "Copied to clipboard") => setToast(message)} />}
          {view === "products" && (
            <ProductLibrary
              activeId={activeProduct}
              onBack={() => setActiveProduct(null)}
              onOpen={openProduct}
            />
          )}
          {view === "scripts" && <ScriptsAndNotes onCopied={(message = "Copied to clipboard") => setToast(message)} />}
          {view === "sources" && <SourcesAndReview />}
        </main>
      </div>

      {searchOpen && (
        <SearchDialog
          query={query}
          results={searchResults}
          onChange={setQuery}
          onChoose={chooseSearchResult}
          onClose={() => {
            setSearchOpen(false);
            setQuery("");
          }}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <section className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </section>
  );
}

function Home({ favorites, recents, onNavigate, onOpenWorkflow, onOpenProduct, onToggleFavorite }) {
  const favoriteWorkflows = favorites.map((id) => workflows.find((item) => item.id === id)).filter(Boolean);
  const recentItems = recents.map((key) => {
    const [type, id] = key.split(":");
    return type === "product" ? products.find((item) => item.id === id) : workflows.find((item) => item.id === id);
  }).filter(Boolean);

  return (
    <>
      <PageHeading
        eyebrow="Support workspace"
        title="What are you helping with today?"
        description="Choose a guided process or search in the customer’s own words. Required checks, evidence, sources, approvals, and pending actions stay visible."
        action={<div className="verified-pill"><Icon name="check" size={18} /><span><strong>36 sources registered</strong>Accuracy review active</span></div>}
      />

      <section className="launch-grid" aria-label="Main tools">
        <article className="launch-card">
          <div className="card-icon"><Icon name="route" size={25} /></div>
          <div>
            <span className="card-kicker">Enhanced navigator</span>
            <h2>Start a guided process</h2>
            <p>One decision at a time, with source-backed safeguards, required evidence, exact pending states, and copy-ready output.</p>
          </div>
          <button type="button" className="text-action" onClick={() => onNavigate("processes")}>Browse 30 processes <Icon name="arrow" size={18} /></button>
        </article>
        <article className="launch-card finder">
          <div className="card-icon"><Icon name="wind" size={25} /></div>
          <div>
            <span className="card-kicker">Verified room sizing</span>
            <h2>Find the right purifier</h2>
            <p>Enter the space, review every suitable current model, and open its detailed source-backed specification profile.</p>
          </div>
          <button type="button" className="text-action" onClick={() => onNavigate("finder")}>Open room-size finder <Icon name="arrow" size={18} /></button>
        </article>
      </section>

      <div className="dashboard-grid">
        <section className="panel frequent" aria-labelledby="frequent-heading">
          <div className="panel-heading">
            <div><span className="eyebrow">Quick start</span><h2 id="frequent-heading">Pinned processes</h2></div>
            <button type="button" className="plain-button" onClick={() => onNavigate("processes")}>View all</button>
          </div>
          <div className="process-list">
            {(favoriteWorkflows.length ? favoriteWorkflows : workflows.slice(0, 3)).map((process) => (
              <div className="process-row-wrap" key={process.id}>
                <button type="button" className="process-row" onClick={() => onOpenWorkflow(process.id)}>
                  <span className="mini-icon blue"><Icon name="route" size={20} /></span>
                  <span className="process-copy"><strong>{process.title}</strong><span>{process.summary}</span></span>
                  <Icon name="arrow" size={19} />
                </button>
                <button className="favorite-button active" type="button" onClick={() => onToggleFavorite(process.id)} aria-label={`Remove ${process.title} from favorites`}>
                  <Icon name="star" size={17} />
                </button>
              </div>
            ))}
          </div>
          <div className="recent-block">
            <div className="section-label"><Icon name="clock" size={16} />Recently viewed</div>
            {recentItems.length ? (
              <div className="recent-chips">
                {recentItems.slice(0, 4).map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => item.model ? onOpenProduct(item.id) : onOpenWorkflow(item.id)}
                  >
                    {item.model || item.title}
                  </button>
                ))}
              </div>
            ) : <p className="empty-hint">Processes and products you open will appear here.</p>}
          </div>
        </section>

        <aside className="panel updates" aria-labelledby="updates-heading">
          <div className="panel-heading">
            <div><span className="eyebrow">Source-backed</span><h2 id="updates-heading">Verified guidance</h2></div>
            <span className="live-badge">Current</span>
          </div>
          <div className="update-item">
            <span className="update-icon info"><Icon name="clock" size={18} /></span>
            <div><strong>Shipping expectations</strong><p>Processing: 1–3 business days. Typical delivery after shipment: 3–7 business days.</p><span>Official shipping policy · Jul 23</span></div>
          </div>
          <div className="update-item">
            <span className="update-icon success"><Icon name="check" size={18} /></span>
            <div><strong>Filter Club offer</strong><p>40% off the first filter and 10% off subsequent filters. Recheck before quoting.</p><span>Official Filter Club · Jul 23</span></div>
          </div>
          <button type="button" className="review-callout" onClick={() => onNavigate("sources")}>
            <Icon name="alert" size={20} />
            <span><strong>17 high-priority reviews remain</strong><span>Unresolved rules stay visibly blocked and never drive a completed action.</span></span>
            <Icon name="chevron" size={18} />
          </button>
        </aside>
      </div>
    </>
  );
}

function Processes({ activeId, favorites, callMode, onBack, onOpen, onToggleFavorite, onCopied }) {
  const [showCatalog, setShowCatalog] = useState(false);
  if (activeId) {
    const process = workflows.find((item) => item.id === activeId);
    const flow = guidedFlows[activeId];
    if (flow) return <WorkflowRunner key={activeId} process={process} flow={flow} callMode={callMode} onBack={onBack} onCopied={onCopied} />;
    return <ProcessBrief process={process} onBack={onBack} />;
  }
  if (showCatalog) {
    return <ProcessCatalog favorites={favorites} onOpen={onOpen} onToggleFavorite={onToggleFavorite} onUseSelector={() => setShowCatalog(false)} />;
  }
  return <TaskSelector onOpen={onOpen} onViewAll={() => setShowCatalog(true)} />;
}

function TaskSelector({ onOpen, onViewAll }) {
  const [category, setCategory] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const selectedGroup = taskSelector.find(([label]) => label === category);
  const choices = (selectedGroup?.[1] || []).map((id) => workflows.find((workflow) => workflow.id === id)).filter(Boolean);
  const selectedWorkflow = workflows.find((workflow) => workflow.id === workflowId);

  function reset() {
    setCategory("");
    setWorkflowId("");
  }

  return (
    <>
      <PageHeading
        eyebrow="Guided task selector"
        title="What do you need to do?"
        description="Start with the customer’s need. The selector narrows the 30-process catalog and confirms the exact task before the guide begins."
        action={<button className="secondary-button" type="button" onClick={onViewAll}>View all 30 processes</button>}
      />
      <section className="task-selector panel" aria-live="polite">
        <div className="selector-progress">
          <span className={category ? "complete" : "current"}>1. Customer need</span>
          <span className={workflowId ? "complete" : category ? "current" : ""}>2. Situation</span>
          <span className={selectedWorkflow ? "current" : ""}>3. Confirm</span>
        </div>
        {!category && (
          <div>
            <span className="eyebrow">Step 1 of 3</span>
            <h2>Choose the closest customer need</h2>
            <div className="task-category-grid">
              {taskSelector.map(([label, ids]) => (
                <button type="button" key={label} onClick={() => setCategory(label)}>
                  <span className="mini-icon blue"><Icon name={label.includes("Product") ? "wind" : label.includes("Security") ? "shield" : "route"} size={20} /></span>
                  <span><strong>{label}</strong><small>{ids.length} {ids.length === 1 ? "process" : "processes"}</small></span>
                  <Icon name="chevron" size={18} />
                </button>
              ))}
            </div>
          </div>
        )}
        {category && !workflowId && (
          <div>
            <button className="back-button" type="button" onClick={reset}><Icon name="back" size={17} />Choose another need</button>
            <span className="eyebrow">Step 2 of 3 · {category}</span>
            <h2>What specifically happened?</h2>
            <div className="task-choice-list">
              {choices.map((workflow) => (
                <button type="button" key={workflow.id} onClick={() => setWorkflowId(workflow.id)}>
                  <span><strong>{workflow.title}</strong><small>{workflow.summary}</small></span>
                  <Icon name="arrow" size={18} />
                </button>
              ))}
            </div>
          </div>
        )}
        {selectedWorkflow && (
          <div className="task-confirm">
            <button className="back-button" type="button" onClick={() => setWorkflowId("")}><Icon name="back" size={17} />Change situation</button>
            <span className="eyebrow">Step 3 of 3 · Confirm the task</span>
            <h2>You selected:</h2>
            <div className="selection-path"><span>{category}</span><Icon name="chevron" size={18} /><strong>{selectedWorkflow.title}</strong></div>
            <p>{selectedWorkflow.summary}</p>
            <div className="confirmation-actions">
              <button className="secondary-button" type="button" onClick={reset}>Choose a different task</button>
              <button className="primary-button" type="button" onClick={() => onOpen(selectedWorkflow.id)}>Yes, start this process <Icon name="arrow" size={17} /></button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function ProcessCatalog({ favorites, onOpen, onToggleFavorite, onUseSelector }) {
  const [category, setCategory] = useState("All");
  const [text, setText] = useState("");
  const categories = ["All", ...new Set(workflows.map((item) => item.category))];
  const filtered = workflows.filter((item) => (category === "All" || item.category === category) && normalize(`${item.title} ${item.summary}`).includes(normalize(text)));

  return (
    <>
      <PageHeading
        eyebrow="Enhanced Guided Process Navigator"
        title="Follow the work, step by step"
        description="Start with a fully guided process when available. Processes with unresolved policy or live-system dependencies show the exact reason they are not safe to automate."
        action={<button className="secondary-button" type="button" onClick={onUseSelector}>Use task selector</button>}
      />
      <section className="catalog-controls" aria-label="Filter processes">
        <label className="field search-field"><span>Find a process</span><div><Icon name="search" size={18} /><input value={text} onChange={(event) => setText(event.target.value)} placeholder="Try warranty, noise, shipment…" /></div></label>
        <label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
      </section>
      <section className="process-catalog" aria-label={`${filtered.length} processes`}>
        {filtered.map((process) => (
          <article className="catalog-card" key={process.id}>
            <div className="catalog-card-top">
              <span className="process-id">{process.id}</span>
              <button className={`favorite-button ${favorites.includes(process.id) ? "active" : ""}`} type="button" onClick={() => onToggleFavorite(process.id)} aria-label={`${favorites.includes(process.id) ? "Remove" : "Add"} ${process.title} ${favorites.includes(process.id) ? "from" : "to"} favorites`}>
                <Icon name="star" size={17} />
              </button>
            </div>
            <span className="catalog-category">{process.category}</span>
            <h2>{process.title}</h2>
            <p>{process.summary}</p>
            <div className="catalog-card-foot">
              <StatusBadge status={process.status} />
              <button className="plain-button with-icon" type="button" onClick={() => onOpen(process.id)}>
                {guidedFlows[process.id] ? "Start guide" : process.fullyGuided ? "Open process" : "Review readiness"}<Icon name="arrow" size={16} />
              </button>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}

function ProcessBrief({ process, onBack }) {
  const available = process?.fullyGuided;
  return (
    <section className="detail-page">
      <button className="back-button" type="button" onClick={onBack}><Icon name="back" size={18} />All guided processes</button>
      <div className="detail-hero">
        <div>
          <span className="eyebrow">{process?.id} · {process?.category}</span>
          <h1>{process?.title}</h1>
          <p>{process?.summary}</p>
        </div>
        <StatusBadge status={process?.status || "Needs confirmation"} />
      </div>
      <div className="brief-grid">
        <article className="panel">
          <h2>{available ? "Safe process frame" : "Why this is not automated yet"}</h2>
          <p>{available
            ? "This workflow is mapped and safe at the knowledge level, but live operational confirmation is still required before actions can be marked completed."
            : "The source audit found a policy conflict, live-system dependency, or missing owner decision. The site preserves the process and its guardrails instead of inventing a rule."}</p>
          <ol className="plain-steps">
            <li><strong>Verify</strong><span>Identity, purchase channel, model/order, and the exact customer request.</span></li>
            <li><strong>Classify</strong><span>Choose the verified state; do not infer from the customer’s desired outcome.</span></li>
            <li><strong>Decide</strong><span>Use the current approved rule or mark Needs Confirmation.</span></li>
            <li><strong>Act</strong><span>Confirm an action in the live system before recording it as complete.</span></li>
            <li><strong>Record</strong><span>Separate completed work, pending work, owner, and next checkpoint.</span></li>
          </ol>
        </article>
        <aside className="panel safeguard-panel">
          <Icon name="shield" size={26} />
          <h2>Safe next step</h2>
          <p>Gather the complete fact and evidence packet, then route the unresolved decision to the accountable owner. Use conditional customer wording.</p>
          <div className="warning-box"><strong>Do not promise</strong><span>A cancellation, refund, claim outcome, subscription change, replacement, or exception that is not confirmed in the live system.</span></div>
          <p className="source-line"><strong>Last verified:</strong> {VERIFIED_ON}</p>
        </aside>
      </div>
    </section>
  );
}

function WorkflowRunner({ process, flow, callMode, onBack, onCopied }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirmed, setConfirmed] = useState({});
  const [review, setReview] = useState(false);
  const current = flow.steps[stepIndex];
  const answer = answers[current.id] || "";
  const isConfirmed = Boolean(confirmed[current.id]);
  const completeCount = flow.steps.filter((step) => confirmed[step.id]).length;
  const progress = Math.round((completeCount / flow.steps.length) * 100);

  function selectAnswer(value) {
    setAnswers((existing) => ({ ...existing, [current.id]: value }));
    setConfirmed((existing) => ({ ...existing, [current.id]: false }));
  }

  function next() {
    if (!answer || !isConfirmed) return;
    if (stepIndex === flow.steps.length - 1) setReview(true);
    else setStepIndex((value) => value + 1);
  }

  function restart() {
    setStepIndex(0);
    setAnswers({});
    setConfirmed({});
    setReview(false);
  }

  if (review) {
    return <WorkflowReview process={process} flow={flow} answers={answers} onBack={() => setReview(false)} onRestart={restart} onCopied={onCopied} />;
  }

  return (
    <section className="workflow-page" data-testid="workflow-runner">
      <div className="workflow-toolbar">
        <button className="back-button" type="button" onClick={onBack}><Icon name="back" size={18} />All processes</button>
        <div className="workflow-actions"><StatusBadge status={flow.status} /><button className="plain-button with-icon" type="button" onClick={restart}><Icon name="rotate" size={16} />Restart</button></div>
      </div>
      <header className="workflow-header">
        <div>
          <span className="eyebrow">{process.id} · {flow.channel} channels {callMode ? "· Call mode" : ""}</span>
          <h1>{flow.title}</h1>
          <p>{flow.purpose}</p>
        </div>
        <div className="progress-card" aria-label={`${progress}% complete`}><strong>{completeCount}/{flow.steps.length}</strong><span>steps confirmed</span><div><i style={{ width: `${progress}%` }} /></div></div>
      </header>

      <ol className="workflow-stepper" aria-label="Workflow progress">
        {flow.steps.map((step, index) => {
          const state = confirmed[step.id] ? "complete" : index === stepIndex ? "current" : index < stepIndex ? "incomplete" : "upcoming";
          return (
            <li className={state} key={step.id}>
              <button type="button" onClick={() => index <= stepIndex && setStepIndex(index)} disabled={index > stepIndex}>
                <span className="step-number">{confirmed[step.id] ? <Icon name="check" size={17} /> : index + 1}</span>
                <span><strong>{step.title}</strong><small>{state === "complete" ? "Completed" : state === "current" ? "In progress" : state === "incomplete" ? "Needs confirmation" : "Upcoming"}</small></span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="runner-layout">
        <article className="decision-card">
          <div className="decision-card-heading">
            <span className="step-chip">Step {stepIndex + 1} of {flow.steps.length}</span>
            <h2>{current.question}</h2>
            <p>Select the verified state. Displaying instructions does not complete the step.</p>
          </div>
          <fieldset className="choice-list">
            <legend className="sr-only">{current.question}</legend>
            {current.choices.map((choice) => (
              <label className={answer === choice ? "choice selected" : "choice"} key={choice}>
                <input type="radio" name={current.id} checked={answer === choice} onChange={() => selectAnswer(choice)} />
                <span className="radio-dot" />
                <span>{choice}</span>
              </label>
            ))}
          </fieldset>
          <label className={`completion-check ${!answer ? "disabled" : ""}`}>
            <input type="checkbox" disabled={!answer} checked={isConfirmed} onChange={(event) => setConfirmed((existing) => ({ ...existing, [current.id]: event.target.checked }))} />
            <span><strong>I completed or verified this step</strong><small>This records the selected state as factual for this active session.</small></span>
          </label>
          <div className="decision-nav">
            <button className="secondary-button" type="button" onClick={() => setStepIndex((value) => Math.max(0, value - 1))} disabled={stepIndex === 0}><Icon name="back" size={17} />Back</button>
            <button className="primary-button" type="button" onClick={next} disabled={!answer || !isConfirmed} data-testid="workflow-next">
              {stepIndex === flow.steps.length - 1 ? "Review outputs" : "Next step"}<Icon name="arrow" size={17} />
            </button>
          </div>
        </article>

        <aside className="step-guidance">
          <GuidanceBlock title="What you need to confirm" text={current.need} />
          <GuidanceBlock title="Why it matters" text={current.why} />
          <GuidanceBlock title="What to ask the customer" text={current.ask} quote />
          <GuidanceBlock title="Evidence required" text={current.evidence} />
          <GuidanceBlock title="What to check internally" text={current.check} />
          <GuidanceBlock title="Exact action" text={current.action} />
          <div className="guidance warning"><span className="guidance-icon"><Icon name="alert" size={18} /></span><div><strong>What not to promise</strong><p>{current.notPromise}</p></div></div>
          <GuidanceBlock title="Result that moves the case forward" text={current.result} />
          <div className="source-card"><Icon name="shield" size={17} /><span><strong>{current.source}</strong><small>Last verified {current.verified}</small></span></div>
        </aside>
      </div>
      <div className="path-summary"><strong>Current path</strong><span>{flow.steps.slice(0, stepIndex + 1).map((step) => answers[step.id] || step.title).join(" → ")}</span></div>
    </section>
  );
}

function GuidanceBlock({ title, text, quote = false }) {
  return <div className={`guidance ${quote ? "quote" : ""}`}><span className="guidance-icon"><Icon name={quote ? "message" : "check"} size={18} /></span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function WorkflowReview({ process, flow, answers, onBack, onRestart, onCopied }) {
  const [tab, setTab] = useState("Email");
  const [details, setDetails] = useState({
    spokeWith: "",
    customer: "",
    order: "",
    email: "",
    contact: "",
    model: "",
    caseDetail: "",
    reference: "",
    owner: "",
    checkpoint: "",
    callId: ""
  });
  const [editedOutputs, setEditedOutputs] = useState({});
  const responsePackage = buildWorkflowResponse({
    workflowId: process.id,
    flow,
    answers,
    details
  });
  const output = editedOutputs[tab] ?? responsePackage.outputs[tab];

  useEffect(() => {
    setEditedOutputs({});
  }, [answers, details, process.id]);

  function updateDetail(field, value) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function resetCurrentOutput() {
    setEditedOutputs((current) => {
      const next = { ...current };
      delete next[tab];
      return next;
    });
  }

  const detailLabel = process.id === "WF-012"
    ? "Approved explanation or reported issue"
    : process.id === "WF-005"
      ? "Affected item or approved resolution detail"
      : process.id === "WF-009"
        ? "Returned item or approved explanation"
        : "Case detail";

  return (
    <section className="workflow-review">
      <button className="back-button" type="button" onClick={onBack}><Icon name="back" size={18} />Change last answer</button>
      <PageHeading
        eyebrow={`${process.id} · Review`}
        title="Review confirmed facts and outputs"
        description="The response engine separates verified facts, completed work, pending work, and customer requests. Internal ownership never appears in customer-facing copy."
        action={<StatusBadge status={responsePackage.readiness} />}
      />
      <div className="review-grid">
        <section className="panel">
          <h2>Case summary</h2>
          <details className="case-detail-fields" open>
            <summary>Session-only case details</summary>
            <p>These values improve the reply and notes. They are cleared when the page refreshes and are never saved to local storage.</p>
            <div className="review-fields">
              <label className="field"><span>Spoke with <small>Notes only</small></span><input value={details.spokeWith} onChange={(event) => updateDetail("spokeWith", event.target.value)} /></label>
              <label className="field"><span>Name on the account <small>Optional</small></span><input value={details.customer} onChange={(event) => updateDetail("customer", event.target.value)} /></label>
              <label className="field"><span>Order number</span><input value={details.order} onChange={(event) => updateDetail("order", event.target.value)} /></label>
              <label className="field"><span>Email address <small>Notes only</small></span><input type="email" value={details.email} onChange={(event) => updateDetail("email", event.target.value)} /></label>
              <label className="field"><span>Contact number <small>Notes only</small></span><input value={details.contact} onChange={(event) => updateDetail("contact", event.target.value)} /></label>
              {process.id === "WF-012" && <label className="field"><span>Exact model and revision</span><input value={details.model} onChange={(event) => updateDetail("model", event.target.value)} placeholder="Example: MA-40 standard non-UV" /></label>}
              <label className="field wide"><span>{detailLabel}</span><textarea rows="3" value={details.caseDetail} onChange={(event) => updateDetail("caseDetail", event.target.value)} /></label>
              <label className="field"><span>Confirmed reference or tracking</span><input value={details.reference} onChange={(event) => updateDetail("reference", event.target.value)} /></label>
              <label className="field"><span>Pending owner <small>Internal only</small></span><input value={details.owner} onChange={(event) => updateDetail("owner", event.target.value)} placeholder="Agent, L2, customer, carrier…" /></label>
              <label className="field"><span>Next checkpoint <small>Internal only</small></span><input value={details.checkpoint} onChange={(event) => updateDetail("checkpoint", event.target.value)} placeholder="Specific next action or review point" /></label>
              <label className="field"><span>AC Call ID <small>Notes only</small></span><input value={details.callId} onChange={(event) => updateDetail("callId", event.target.value)} /></label>
            </div>
          </details>

          <ResponseSummaryList title="Confirmed case facts" items={responsePackage.confirmedFacts} empty="No customer-facing fact is safe to state yet." />
          <ResponseSummaryList title="Completed actions" items={responsePackage.completedActions} empty="No operational action has been confirmed as complete." tone="success" />
          <ResponseSummaryList title="Pending actions" items={responsePackage.pendingActions} empty="No workflow action is currently pending." tone="warning" />
          <ResponseSummaryList title="Missing-information checklist" items={responsePackage.missingInformation} empty="No required information is missing from the selected path." tone="danger" />
        </section>
        <section className="panel output-panel">
          <div className="tab-row" role="tablist" aria-label="Output channel">
            {OUTPUT_CHANNELS.map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}
          </div>
          <div className="output-heading">
            <div><span className="eyebrow">{responsePackage.readiness}</span><h2>{responsePackage.suggestedTitle}</h2></div>
            <div className="output-actions">
              <button className="secondary-button compact" type="button" onClick={resetCurrentOutput}><Icon name="rotate" size={16} />Reset response</button>
              <CopyButton text={output} onCopied={onCopied} label={`Copy ${tab}`} />
            </div>
          </div>
          <label className="sr-only" htmlFor={`workflow-output-${process.id}`}>Edit {tab} output</label>
          <textarea
            id={`workflow-output-${process.id}`}
            className="output-text editable-output"
            value={output}
            onChange={(event) => setEditedOutputs((current) => ({ ...current, [tab]: event.target.value }))}
            aria-label={`Edit ${tab} output`}
          />
          <div className="output-warning"><Icon name="alert" size={17} /><span>Review placeholders and the current live-system state before sending or saving. Customer fields remain in memory only.</span></div>
        </section>
      </div>
      <div className="review-actions"><button className="secondary-button" type="button" onClick={onRestart}><Icon name="rotate" size={17} />Restart process</button><button className="primary-button" type="button" onClick={onBack}>Change an answer</button></div>
    </section>
  );
}

function ResponseSummaryList({ title, items, empty, tone = "neutral" }) {
  return (
    <section className={`response-summary ${tone}`}>
      <h3>{title}</h3>
      <div className="summary-list">
        {(items.length ? items : [empty]).map((item) => (
          <div key={item}>
            <Icon name={items.length ? (tone === "warning" || tone === "danger" ? "alert" : "check") : "info"} size={17} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Finder({ onOpenProduct, onCopied }) {
  const [mode, setMode] = useState("area");
  const [unit, setUnit] = useState("sqft");
  const [area, setArea] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [ceiling, setCeiling] = useState("8");
  const [openPlan, setOpenPlan] = useState(false);
  const [connectedRooms, setConnectedRooms] = useState("1");
  const [concern, setConcern] = useState("General air quality");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function calculate(event) {
    event.preventDefault();
    const inputArea = mode === "dimensions" ? Number(length) * Number(width) : Number(area);
    if (!Number.isFinite(inputArea) || inputArea <= 0 || (mode === "dimensions" && (!Number(length) || !Number(width)))) {
      setError("Enter a room size greater than zero. For dimensions, both length and width are required.");
      setResult(null);
      return;
    }
    const squareFeet = unit === "sqm" ? inputArea * 10.7639104167 : inputArea;
    const height = advanced ? Number(ceiling) : 8;
    if (!Number.isFinite(height) || height <= 0) {
      setError("Ceiling height must be greater than zero.");
      setResult(null);
      return;
    }
    const effective = squareFeet * (height / 8);
    const eligible = products.filter((item) => item.finderEligible && item.coverage >= effective).sort((a, b) => a.coverage - b.coverage);
    setError("");
    setResult({ inputArea, squareFeet, effective, height, eligible, concern, connectedRooms: Number(connectedRooms) || 1 });
  }

  const reset = () => {
    setArea("");
    setLength("");
    setWidth("");
    setCeiling("8");
    setOpenPlan(false);
    setConnectedRooms("1");
    setConcern("General air quality");
    setResult(null);
    setError("");
  };

  return (
    <>
      <PageHeading
        eyebrow="Air Purifier Recommendation Navigator"
        title="Find a verified fit for the space"
        description="Room size is the only required input. The finder chooses the smallest current active model whose approved 30-minute coverage meets the effective area."
        action={<div className="assumption-pill"><Icon name="shield" size={18} /><span><strong>Standard basis</strong>2 ACH · closed room · 8-ft ceiling</span></div>}
      />
      <div className="finder-layout">
        <form className="panel finder-form" onSubmit={calculate} data-testid="finder-form">
          <div className="finder-step-title"><span>1</span><div><strong>Enter the space</strong><small>Use floor area or a length × width helper.</small></div></div>
          <div className="segmented" aria-label="Input method">
            <button type="button" className={mode === "area" ? "active" : ""} onClick={() => setMode("area")}>Room area</button>
            <button type="button" className={mode === "dimensions" ? "active" : ""} onClick={() => setMode("dimensions")}>Length × width</button>
          </div>
          <div className="unit-toggle" aria-label="Unit">
            <button type="button" className={unit === "sqft" ? "active" : ""} onClick={() => setUnit("sqft")}>Square feet</button>
            <button type="button" className={unit === "sqm" ? "active" : ""} onClick={() => setUnit("sqm")}>Square metres</button>
          </div>
          {mode === "area" ? (
            <label className="field large-field"><span>Room size <em>Required</em></span><div className="input-suffix"><input data-testid="finder-area" type="number" min="0" step="any" inputMode="decimal" value={area} onChange={(event) => setArea(event.target.value)} placeholder="e.g. 425" /><b>{unit === "sqft" ? "sq ft" : "m²"}</b></div></label>
          ) : (
            <div className="dimension-grid">
              <label className="field"><span>Length <em>Required</em></span><div className="input-suffix"><input type="number" min="0" step="any" value={length} onChange={(event) => setLength(event.target.value)} /><b>{unit === "sqft" ? "ft" : "m"}</b></div></label>
              <span className="multiply">×</span>
              <label className="field"><span>Width <em>Required</em></span><div className="input-suffix"><input type="number" min="0" step="any" value={width} onChange={(event) => setWidth(event.target.value)} /><b>{unit === "sqft" ? "ft" : "m"}</b></div></label>
            </div>
          )}
          <button className="advanced-toggle" type="button" onClick={() => setAdvanced((value) => !value)} aria-expanded={advanced}><Icon name="filter" size={18} />Advanced room details <span>{advanced ? "−" : "+"}</span></button>
          {advanced && (
            <div className="advanced-fields">
              <label className="field"><span>Ceiling height</span><div className="input-suffix"><input type="number" min="0" step="any" value={ceiling} onChange={(event) => setCeiling(event.target.value)} /><b>ft</b></div><small>Planning adjustment: floor area × ceiling height ÷ 8.</small></label>
              <label className="field"><span>Connected rooms</span><div className="input-suffix"><input type="number" min="1" step="1" value={connectedRooms} onChange={(event) => setConnectedRooms(event.target.value)} /><b>rooms</b></div><small>Enter the combined floor area above; multiple connected rooms trigger assisted review.</small></label>
              <label className="field"><span>Main concern</span><select value={concern} onChange={(event) => setConcern(event.target.value)}>{["General air quality", "Smoke", "Pets", "Allergies", "Dust", "Odors"].map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="switch-row"><input type="checkbox" checked={openPlan} onChange={(event) => setOpenPlan(event.target.checked)} /><span><strong>Open-plan or connected space</strong><small>Results will be marked for assisted review.</small></span></label>
            </div>
          )}
          {error && <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div>}
          <div className="form-actions"><button className="secondary-button" type="button" onClick={reset}>Reset</button><button className="primary-button" type="submit" data-testid="finder-submit">Find suitable models <Icon name="arrow" size={17} /></button></div>
          <div className="privacy-note"><Icon name="lock" size={15} />Room values are calculated in this browser and are not saved.</div>
        </form>

        <aside className="panel finder-method">
          <span className="eyebrow">Sizing method</span>
          <h2>What the result means</h2>
          <div className="method-row"><span>01</span><div><strong>Verified coverage</strong><p>Published 30-minute coverage, based on smoke CADR at highest fan speed.</p></div></div>
          <div className="method-row"><span>02</span><div><strong>Standard room</strong><p>Closed room, 8-foot ceiling, and two air changes per hour.</p></div></div>
          <div className="method-row"><span>03</span><div><strong>Smallest suitable model</strong><p>The lowest approved active threshold at or above the effective room size.</p></div></div>
          <div className="method-warning"><Icon name="info" size={18} /><p>MA-112 PRO and discontinued models are excluded. Open-plan layouts and unusual ceilings are estimates, not lab-certified room claims.</p></div>
        </aside>
      </div>
      {result && <FinderResults result={result} openPlan={openPlan} onOpenProduct={onOpenProduct} onCopied={onCopied} />}
    </>
  );
}

function FinderResults({ result, openPlan, onOpenProduct, onCopied }) {
  const [selectedId, setSelectedId] = useState("");
  const cardsRef = useRef(null);
  const composerRef = useRef(null);
  const best = result.eligible[0];
  const inputDisplay = Math.round(result.squareFeet * 10) / 10;
  const effectiveDisplay = Math.round(result.effective * 10) / 10;

  useEffect(() => {
    if (!selectedId || !composerRef.current) return;
    composerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    composerRef.current.focus({ preventScroll: true });
  }, [selectedId]);

  function changeSelectedModel() {
    setSelectedId("");
    cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    cardsRef.current?.focus({ preventScroll: true });
  }

  if (!best) {
    return (
      <section className="no-fit" aria-live="polite">
        <span className="no-fit-icon"><Icon name="alert" size={28} /></span>
        <div><span className="eyebrow">No automatic single-unit fit</span><h2>{effectiveDisplay.toLocaleString()} effective sq ft exceeds the largest resolved threshold</h2><p>Do not force an undersized recommendation or use MA-112 PRO’s unresolved coverage. Route this space to assisted sizing or an approved multiple-unit plan.</p></div>
      </section>
    );
  }
  return (
    <section className="finder-results" aria-live="polite" data-testid="finder-results">
      <div className="results-heading">
        <div><span className="eyebrow">Sizing result</span><h2>{best.model} is the recommended best fit</h2><p>Entered area: {inputDisplay.toLocaleString()} sq ft{result.height !== 8 ? ` · adjusted to ${effectiveDisplay.toLocaleString()} sq ft for a ${result.height}-ft ceiling` : ""}.</p></div>
        <div className="result-capacity"><strong>+{Math.round(best.coverage - result.effective).toLocaleString()}</strong><span>sq ft capacity above effective area</span></div>
      </div>
      {(openPlan || result.connectedRooms > 1) && <div className="estimate-banner"><Icon name="alert" size={18} /><span><strong>Assisted review recommended.</strong> The official basis assumes one closed room; connected areas can change real-world performance.</span></div>}
      <div className="result-cards" ref={cardsRef} tabIndex="-1">
        {result.eligible.map((product, index) => (
          <article className={`result-card ${index === 0 ? "recommended" : ""} ${selectedId === product.id ? "selected" : ""}`} key={product.id}>
            <div className="result-card-label">{selectedId === product.id ? "Selected for response" : index === 0 ? "Recommended best fit" : "Suitable alternative"}</div>
            <div className="product-image"><img src={product.image} alt={`${product.model} ${product.revision} air purifier`} /></div>
            <div className="result-card-content">
              <div className="product-title-row"><div><h3>{product.model}</h3><span>{product.revision}</span></div><StatusBadge status="Active" /></div>
              <p>{index === 0 ? "Smallest approved active model that meets this effective room size." : `Offers ${Math.round(product.coverage - best.coverage).toLocaleString()} sq ft more published capacity than the best fit.`}</p>
              <dl className="mini-specs"><div><dt>30-min coverage</dt><dd>{product.coverage.toLocaleString()} sq ft</dd></div><div><dt>Smoke CADR</dt><dd>{product.cadr} CFM</dd></div><div><dt>Capacity margin</dt><dd>+{Math.round(product.coverage - result.effective).toLocaleString()} sq ft</dd></div></dl>
              <button className="secondary-button full" type="button" onClick={() => onOpenProduct(product.id)}>View detailed specifications <Icon name="arrow" size={16} /></button>
              <button
                className="primary-button full"
                type="button"
                onClick={() => setSelectedId(product.id)}
                aria-pressed={selectedId === product.id}
                data-testid={`select-response-${product.id}`}
              >
                {selectedId === product.id ? "Selected for response" : "Select for customer response"} <Icon name={selectedId === product.id ? "check" : "message"} size={16} />
              </button>
              <a className="source-link" href={product.source} target="_blank" rel="noreferrer">Official source <Icon name="external" size={14} /></a>
            </div>
          </article>
        ))}
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {selectedId ? `${products.find((item) => item.id === selectedId)?.model} customer response generated.` : ""}
      </div>
      <div className="basis-note"><Icon name="shield" size={18} /><span><strong>Basis for every card:</strong> highest-speed smoke CADR, closed room, 8-ft ceiling, 2 ACH / every 30 minutes. Last verified {VERIFIED_ON}.</span></div>
      {selectedId && (
        <div className="composer-anchor" ref={composerRef} tabIndex="-1" data-testid="finder-response-composer">
          <FinderCustomerOutput
            result={result}
            product={products.find((item) => item.id === selectedId)}
            openPlan={openPlan}
            onChangeModel={changeSelectedModel}
            onCopied={onCopied}
          />
        </div>
      )}
    </section>
  );
}

function FinderCustomerOutput({ result, product, openPlan, onChangeModel, onCopied }) {
  const [tab, setTab] = useState("Email");
  const [customerName, setCustomerName] = useState("");
  const [editedOutputs, setEditedOutputs] = useState({});
  const room = Math.round(result.squareFeet * 10) / 10;
  const effective = Math.round(result.effective * 10) / 10;
  const margin = Math.max(0, Math.round(product.coverage - result.effective));
  const responsePackage = useMemo(() => buildFinderResponse({
    result,
    product,
    openPlan,
    customer: customerName
  }), [customerName, openPlan, product, result]);
  const output = editedOutputs[tab] ?? responsePackage.outputs[tab];

  useEffect(() => {
    setEditedOutputs({});
  }, [customerName, openPlan, product, result]);

  function resetCurrentOutput() {
    setEditedOutputs((current) => {
      const next = { ...current };
      delete next[tab];
      return next;
    });
  }

  return (
    <section className="panel finder-output" aria-labelledby="finder-response-heading">
      <div className="output-heading">
        <div><span className="eyebrow">Customer-ready recommendation generated</span><h2 id="finder-response-heading">{product.model} response package</h2></div>
        <div className="output-actions">
          <button className="secondary-button compact" type="button" onClick={onChangeModel}><Icon name="back" size={16} />Change model</button>
          <button className="secondary-button compact" type="button" onClick={resetCurrentOutput}><Icon name="rotate" size={16} />Reset response</button>
          <CopyButton text={output} onCopied={onCopied} label={`Copy ${tab}`} />
        </div>
      </div>
      <label className="field output-name"><span>Customer name <small>Optional</small></span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Used only in this browser session" /></label>
      <div className="confirmed-facts"><span><strong>{room.toLocaleString()} sq ft</strong> entered area</span><span><strong>{effective.toLocaleString()} sq ft</strong> effective area</span><span><strong>{product.coverage.toLocaleString()} sq ft</strong> verified coverage</span><span><strong>+{margin.toLocaleString()} sq ft</strong> capacity margin</span></div>
      <div className="tab-row" role="tablist" aria-label="Recommendation output">{OUTPUT_CHANNELS.map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
      <label className="sr-only" htmlFor="finder-editable-output">Edit {tab} recommendation</label>
      <textarea
        id="finder-editable-output"
        className="output-text editable-output"
        value={output}
        onChange={(event) => setEditedOutputs((current) => ({ ...current, [tab]: event.target.value }))}
        aria-label={`Edit ${tab} recommendation`}
      />
      <details className="more-details">
        <summary>More product details</summary>
        <dl>
          {responsePackage.moreDetails.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </details>
      <div className="output-warning"><Icon name="alert" size={17} /><span>Confirm the room layout and review placeholders before sending. This recommendation does not guarantee medical outcomes.</span></div>
    </section>
  );
}

function ProductLibrary({ activeId, onBack, onOpen }) {
  if (activeId) {
    const product = products.find((item) => item.id === activeId);
    return <ProductProfile product={product} onBack={onBack} />;
  }
  return <ProductCatalog onOpen={onOpen} />;
}

function ProductCatalog({ onOpen }) {
  const [filter, setFilter] = useState("Active");
  const [compare, setCompare] = useState(["ma-25", "ma-40"]);
  function toggleCompare(id) {
    setCompare((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  }
  const compareProducts = compare.map((id) => products.find((item) => item.id === id)).filter(Boolean);
  return (
    <>
      <PageHeading
        eyebrow="Product & filter library"
        title="Exact models, revisions, and source state"
        description="Current and legacy profiles remain separate. Unresolved fields say Needs Confirmation instead of inheriting data from a related model."
        action={<div className="metric-card"><strong>{products.length + supportOnlyProducts.length}</strong><span>profiles & lifecycle records</span></div>}
      />
      <div className="filter-tabs" role="tablist" aria-label="Product lifecycle">
        {["Active", "Needs confirmation", "Support-only"].map((item) => <button role="tab" aria-selected={filter === item} className={filter === item ? "active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}
      </div>
      {filter !== "Support-only" ? (
        <section className="product-grid">
          {products.filter((item) => filter === "Active" ? item.status === "Active" : item.status !== "Active").map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-card-media"><img src={product.image} alt={`${product.model} ${product.revision} air purifier`} /><StatusBadge status={product.status} /></div>
              <div className="product-card-body">
                <span className="product-revision">{product.revision}</span><h2>{product.model}</h2><p>{product.summary}</p>
                <dl className="product-highlights"><div><dt>Coverage</dt><dd>{product.coverage ? `${product.coverage.toLocaleString()} sq ft` : product.coverageDisplay}</dd></div><div><dt>CADR</dt><dd>{product.cadr} CFM</dd></div><div><dt>Filter life</dt><dd>{product.filterLife.split(" (")[0]}</dd></div></dl>
                {product.flags.length > 0 && <div className="product-flag"><Icon name="alert" size={16} />{product.flags[0]}</div>}
                <div className="product-card-actions">
                  <button className="primary-button" type="button" onClick={() => onOpen(product.id)}>Open profile</button>
                  <label className="compare-check"><input type="checkbox" checked={compare.includes(product.id)} onChange={() => toggleCompare(product.id)} disabled={!compare.includes(product.id) && compare.length >= 3} />Compare</label>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="support-only-grid">
          {supportOnlyProducts.map(([model, status, note]) => <article className="support-card" key={model}><div><span className="process-id">Reference only</span><h2>{model}</h2></div><StatusBadge status={status} /><p>{note}</p></article>)}
        </section>
      )}
      {filter !== "Support-only" && compareProducts.length >= 2 && <ProductComparison items={compareProducts} />}
    </>
  );
}

function ProductComparison({ items }) {
  const rows = [
    ["Revision", (item) => item.revision],
    ["30-min coverage", (item) => item.coverage ? `${item.coverage.toLocaleString()} sq ft` : "Needs Confirmation"],
    ["Smoke CADR", (item) => `${item.cadr} CFM`],
    ["Dimensions", (item) => item.dimensions],
    ["Weight", (item) => item.weight],
    ["Power", (item) => item.wattage],
    ["Fan speeds", (item) => item.speeds],
    ["Wheels", (item) => item.wheels],
    ["Sound", (item) => item.sound]
  ];
  return (
    <section className="comparison panel">
      <div className="panel-heading"><div><span className="eyebrow">Side-by-side</span><h2>Product comparison</h2></div><span className="comparison-count">{items.length} selected</span></div>
      <div className="table-wrap"><table><thead><tr><th>Field</th>{items.map((item) => <th key={item.id}>{item.model}</th>)}</tr></thead><tbody>{rows.map(([label, getter]) => <tr key={label}><th>{label}</th>{items.map((item) => <td key={item.id}>{getter(item)}</td>)}</tr>)}</tbody></table></div>
      <p className="table-note">Fields compare exact revisions only. Pricing, promotions, and stock do not alter sizing.</p>
    </section>
  );
}

function ProductProfile({ product, onBack }) {
  if (!product) return null;
  const specGroups = [
    ["Coverage and CADR", [["30-minute coverage", product.coverage ? `${product.coverage.toLocaleString()} sq ft` : product.coverageDisplay], ["Smoke CADR", `${product.cadr} CFM / ${product.cadrMetric} m³/h`], ["Measurement basis", "Highest fan speed; smoke CADR; closed room; 8-ft ceiling; 2 ACH"]]],
    ["Filtration", [["Configuration", product.filtration], ["Filter life", product.filterLife], ["Compatibility", product.filter]]],
    ["Features and controls", [["Controls", product.controls], ["Fan speeds", product.speeds], ["Wheels", product.wheels]]],
    ["Dimensions, power, and sound", [["Dimensions", product.dimensions], ["Weight", product.weight], ["Power", product.wattage], ["Sound", product.sound]]],
    ["Troubleshooting and reset", [["Reset guidance", product.reset], ["Revision safeguard", `Use only ${product.model} ${product.revision} instructions.`]]],
    ["Warranty and registration", [["Warranty", product.warranty], ["Registration", "Verify the current model-specific agreement and active registration record."]]]
  ];
  return (
    <section className="product-profile">
      <button className="back-button" type="button" onClick={onBack}><Icon name="back" size={18} />All products</button>
      <div className="product-profile-hero">
        <div className="profile-image"><img src={product.image} alt={`${product.model} ${product.revision} air purifier`} /></div>
        <div className="profile-intro">
          <div className="profile-badges"><StatusBadge status={product.status} /><span className="revision-badge">{product.revision}</span></div>
          <span className="eyebrow">Verified product profile</span><h1>{product.model}</h1><p>{product.summary}</p>
          <div className="profile-metrics"><div><strong>{product.coverage ? product.coverage.toLocaleString() : "—"}</strong><span>sq ft / 30 min</span></div><div><strong>{product.cadr}</strong><span>smoke CADR / CFM</span></div><div><strong>{product.speeds}</strong><span>fan speeds</span></div></div>
          <a className="primary-button link-button" href={product.source} target="_blank" rel="noreferrer">Open official product source <Icon name="external" size={16} /></a>
        </div>
      </div>
      {product.flags.length > 0 && <div className="profile-alert"><Icon name="alert" size={20} /><div><strong>Review note</strong>{product.flags.map((flag) => <p key={flag}>{flag}</p>)}</div></div>}
      <div className="spec-layout">
        <section className="spec-accordions">
          {specGroups.map(([title, rows], index) => (
            <details className="spec-group" open={index < 2} key={title}>
              <summary><span>{index + 1}</span><strong>{title}</strong><b>+</b></summary>
              <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd className={String(value).includes("Needs Confirmation") ? "needs-confirmation" : ""}>{value}</dd></div>)}</dl>
            </details>
          ))}
        </section>
        <aside className="panel profile-source">
          <Icon name="shield" size={24} /><h2>Source history</h2>
          <p><strong>{product.sourceLabel}</strong></p><p>Last verified {VERIFIED_ON}</p>
          <div className="source-assumption"><strong>Coverage assumption</strong><span>Smoke CADR at highest fan speed in a closed room with an 8-foot ceiling; 2 ACH / every 30 minutes.</span></div>
          <div className="source-assumption"><strong>Manuals & reports</strong><span>Use the official manual index to choose the exact model, UV/standard variant, and revision.</span></div>
          <a className="source-link standalone" href="https://medifyair.com/pages/product-manuals" target="_blank" rel="noreferrer">Official manuals index <Icon name="external" size={14} /></a>
        </aside>
      </div>
    </section>
  );
}

function ScriptsAndNotes({ onCopied }) {
  const [channel, setChannel] = useState("Email");
  const [fields, setFields] = useState({
    "Spoke With": "",
    "Name on the Account": "",
    "Order Num": "",
    "Email Address": "",
    "Contact #": "",
    "Reason for Calling": "",
    "ACTION TAKEN": "",
    "Offered FC/Cross Sell": "",
    "AC Call ID": ""
  });
  const notes = noteHeadings.map((heading) => `${heading}: ${heading === "JA" ? "" : fields[heading] || "Not provided"}`).join("\n");
  return (
    <>
      <PageHeading eyebrow="Email, chat, voice & internal output" title="Use the right wording for the channel" description="Scripts preserve one underlying policy while changing the length and tone for Email, Chat, or Voice. Review placeholders and live status before use." />
      <div className="scripts-grid">
        <section className="panel script-panel">
          <div className="tab-row" role="tablist" aria-label="Script channel">{Object.keys(scriptLibrary).map((item) => <button role="tab" aria-selected={channel === item} className={channel === item ? "active" : ""} type="button" key={item} onClick={() => setChannel(item)}>{item}</button>)}</div>
          <div className="output-heading"><div><span className="eyebrow">Approved safe pattern</span><h2>{scriptLibrary[channel].title}</h2></div><CopyButton text={scriptLibrary[channel].text} onCopied={onCopied} /></div>
          <pre className="output-text script">{scriptLibrary[channel].text}</pre>
          <div className="output-warning"><Icon name="alert" size={17} /><span>Never replace a placeholder with a guess or say a pending action is complete.</span></div>
        </section>
        <section className="panel note-generator">
          <div className="note-heading"><div><span className="eyebrow">In-memory only</span><h2>Call / ticket note generator</h2></div><Icon name="lock" size={22} /></div>
          <p>Nothing entered here is saved to local storage. Refreshing the page clears these fields.</p>
          <div className="note-fields">
            {Object.keys(fields).map((label) => (
              <label className={`field ${label === "ACTION TAKEN" ? "wide" : ""}`} key={label}><span>{label}</span>
                {label === "ACTION TAKEN"
                  ? <textarea rows="4" value={fields[label]} onChange={(event) => setFields((current) => ({ ...current, [label]: event.target.value }))} placeholder="Completed actions in factual chronological order; then pending item and owner." />
                  : <input value={fields[label]} onChange={(event) => setFields((current) => ({ ...current, [label]: event.target.value }))} />}
              </label>
            ))}
          </div>
          <div className="note-output"><div className="output-heading"><h3>Exact note format</h3><CopyButton text={notes} onCopied={onCopied} label="Copy notes" /></div><pre className="output-text notes">{notes}</pre></div>
        </section>
      </div>
    </>
  );
}

function SourcesAndReview() {
  const [tab, setTab] = useState("Conflicts");
  return (
    <>
      <PageHeading
        eyebrow="Governance & source center"
        title="See what is verified—and what is not"
        description="No conflict is silently averaged or rewritten. High-risk items stay blocked until an accountable owner supplies a dated decision."
        action={<div className="metric-card warning"><strong>17</strong><span>high / critical reviews</span></div>}
      />
      <div className="source-stats"><div><strong>607</strong><span>content items inventoried</span></div><div><strong>36</strong><span>source groups registered</span></div><div><strong>50</strong><span>case types normalized</span></div><div><strong>29</strong><span>conflicts and gaps logged</span></div></div>
      <div className="filter-tabs" role="tablist" aria-label="Source center section">{["Conflicts", "Source register", "Change log"].map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
      {tab === "Conflicts" && (
        <section className="conflict-list">
          {conflicts.map(([severity, domain, finding, action], index) => (
            <article className="conflict-card" key={finding}>
              <div className="conflict-id">REVIEW-{String(index + 1).padStart(2, "0")}</div>
              <div><div className="conflict-badges"><StatusBadge status={severity} /><span>{domain}</span></div><h2>{finding}</h2><p><strong>Decision required:</strong> {action}</p></div>
            </article>
          ))}
          <div className="governance-note"><Icon name="shield" size={22} /><div><strong>Release safeguard</strong><p>The release data excludes customer PII, private ticket URLs, local file paths, named-person routing, and secret values. A final secret/PII scan remains part of every content release.</p></div></div>
        </section>
      )}
      {tab === "Source register" && (
        <section className="panel source-table">
          <div className="panel-heading"><div><span className="eyebrow">Key implementation sources</span><h2>Current source register</h2></div><span className="live-badge">36 total</span></div>
          <div className="table-wrap"><table><thead><tr><th>ID</th><th>Source</th><th>Type</th><th>Status</th><th>Last checked</th><th>Open</th></tr></thead><tbody>{sources.map(([id, title, type, status, date, url]) => <tr key={id}><td><code>{id}</code></td><td>{title}</td><td>{type}</td><td><StatusBadge status={status} /></td><td>{date}</td><td><a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}><Icon name="external" size={16} /></a></td></tr>)}</tbody></table></div>
          <p className="table-note">The complete Phase 1 register includes historical support workbooks, internal procedures, public policies, model pages, provided manuals, unavailable live systems, and the intentionally untouched prior website.</p>
        </section>
      )}
      {tab === "Change log" && (
        <section className="timeline">
          <article><span>Jul 23, 2026</span><div><h2>Initial implementation release</h2><p>Created the standalone Medify support application, guided workflow pilots, purifier finder, current/legacy product separation, scripts, exact call-note format, and source/conflict center.</p></div></article>
          <article><span>Jul 23, 2026</span><div><h2>Product resolutions applied</h2><p>MA-25 uses 413 sq ft and MA-35 uses 656 sq ft. MA-112 PRO remains excluded from automatic sizing because its official coverage is unresolved.</p></div></article>
          <article><span>Jul 23, 2026</span><div><h2>Security migration guard added</h2><p>Restricted credentials, private links, local paths, customer examples, and named-person routing are excluded from published content.</p></div></article>
          <article><span>Future review</span><div><h2>Mailbox and live-system delta audit</h2><p>The live mailbox and authenticated Shopify, Recharge, carrier, warehouse, and ticket systems were unavailable. Connect or export approved sources before declaring the knowledge corpus complete.</p></div></article>
        </section>
      )}
    </>
  );
}

function SearchDialog({ query, results, onChange, onChoose, onClose }) {
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  const grouped = results.reduce((groups, item) => {
    groups[item.type] = [...(groups[item.type] || []), item];
    return groups;
  }, {});
  return (
    <div className="search-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="search-dialog" role="dialog" aria-modal="true" aria-label="Search the Medify support knowledge base">
        <div className="search-input-row"><Icon name="search" size={21} /><input ref={inputRef} value={query} onChange={(event) => onChange(event.target.value)} placeholder="Search in the customer’s words…" aria-label="Search query" /><button type="button" onClick={onClose} aria-label="Close search"><Icon name="close" size={20} /></button></div>
        <div className="search-help"><span>Typo-tolerant search across processes, products, scripts, and sources</span><kbd>Esc</kbd></div>
        <div className="search-results">
          {Object.keys(grouped).length ? Object.entries(grouped).map(([type, items]) => (
            <section key={type}><h2>{type === "Process" ? "Processes" : type === "Product" ? "Products" : type === "Source" ? "Sources" : "Scripts"}</h2>{items.map((item) => <button type="button" key={`${item.type}-${item.id}`} onClick={() => onChoose(item)}><span className="search-result-icon"><Icon name={item.type === "Process" ? "route" : item.type === "Product" ? "wind" : item.type === "Script" ? "message" : "shield"} size={18} /></span><span><strong>{item.title}</strong><small>{item.meta}</small></span><Icon name="arrow" size={17} /></button>)}</section>
          )) : <div className="no-results"><Icon name="search" size={26} /><h2>No close match found</h2><p>Try a model number, symptom, case state, or action such as “refund pending.”</p></div>}
        </div>
      </section>
    </div>
  );
}

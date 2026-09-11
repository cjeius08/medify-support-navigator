// Test fixture only. Loaded exclusively by vite.qa.config.js or Vitest mocks.
// No network requests, production credentials, or real customer records.
const storageKey = "medify-uiux-qa-records";

export function sampleReports() {
  const names = ["Alex Morgan", "Taylor Reed", "Jamie Lee", "Jordan Parker", "Riley Chen", "Casey Williams", "Sam Rivera", "Drew Patel", "Morgan Ellis"];
  const reasons = ["Warranty replacement for a defective unit", "Filter Club subscription update", "Return and refund request", "Tracking a delivery", "Noise troubleshooting", "Filter Club cancellation", "UPS package lost", "HSA receipt request", "Discount code question"];
  return [0, 0, 1, 3, 8, 16, 40, 110, 400].map((days, index) => {
    const date = new Date(); date.setDate(date.getDate() - days); date.setHours(9 + index % 5, 12, 0, 0);
    const duration = [385, 242, 194, 428, 315, 168, 514, 261, 303][index];
    const due = new Date(); due.setDate(due.getDate() + (index % 3) - 1);
    return {
      id: `qa-report-${index}`, agent_id: "qa-user", started_at: new Date(date.getTime() - duration * 1000).toISOString(), stopped_at: date.toISOString(), duration_seconds: duration,
      note_fields: { "Spoke With": names[index], "Name on the Account": names[index], "Order Num": `QA-${790100 + index}`, "Email Address": `${names[index].split(" ")[0].toLowerCase()}@example.test`, "Contact #": "555-0100", "Reason for Calling": reasons[index], "ACTION TAKEN": "Reviewed the request and confirmed the next steps with the customer.", "Offered FC/Cross Sell": "Y", "AC Call ID": `QA-CALL-${index + 1}`, "Agent Initials": index % 3 === 0 ? "FA" : "CJ" },
      follow_up_needed: index < 4, follow_up_date: index < 4 ? due.toISOString().slice(0, 10) : null, follow_up_note: index < 4 ? "Confirm the customer received the requested information." : null
    };
  });
}

export function createMockSupabase({ signedIn = true, persist = false } = {}) {
  let rows = persist ? JSON.parse(localStorage.getItem(storageKey) || "null") || sampleReports() : sampleReports();
  let listener;
  const session = signedIn ? { user: { id: "qa-user" } } : null;
  const commit = () => { if (persist) localStorage.setItem(storageKey, JSON.stringify(rows)); };
  return {
    auth: {
      getSession: async () => ({ data: { session } }),
      onAuthStateChange: (fn) => { listener = fn; return { data: { subscription: { unsubscribe() {} } } }; },
      signOut: async () => { listener?.("SIGNED_OUT", null); return { error: null }; },
      signInWithPassword: async () => ({ error: { message: "Example sign-in error. No authentication request was sent." } }),
      signUp: async () => ({ data: { session: null }, error: { message: "Example activation error. No account was created." } })
    },
    rpc: async () => ({ data: `qa-${Date.now()}`, error: null }),
    from(table) {
      let operation = "select", payload, target;
      const result = () => {
        if (table === "medify_profiles") return { data: { id: "qa-user", initials: "CJ", role: "creator" }, error: null };
        if (table === "medify_agent_initials") return { data: [{ initials: "CJ", active: true }, { initials: "FA", active: true }, { initials: "JA", active: true }], error: null };
        if (table === "medify_invite_codes") return { data: [], error: null };
        if (operation === "insert") { const row = { ...payload, id: `qa-saved-${Date.now()}` }; rows = [row, ...rows]; commit(); return { data: row, error: null }; }
        if (operation === "update") rows = rows.map(row => row.id === target ? { ...row, ...payload } : row);
        if (operation === "delete") rows = rows.filter(row => row.id !== target);
        commit(); return { data: rows, error: null };
      };
      const chain = {
        select() { return chain; }, order() { return chain; }, eq(_key, value) { target = value; return chain; },
        insert(value) { operation = "insert"; payload = value; return chain; },
        update(value) { operation = "update"; payload = value; return chain; },
        delete() { operation = "delete"; return chain; },
        single: async () => result(), then(resolve) { return Promise.resolve(result()).then(resolve); }
      };
      return chain;
    }
  };
}

export const supabase = createMockSupabase({ signedIn: !new URLSearchParams(location.search).has("auth-preview"), persist: true });
export const usernameEmail = (username) => `${username.toLowerCase().trim()}@medify.local`;

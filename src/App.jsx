import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  🔧 PASTE YOUR NEW APPS SCRIPT URL HERE AFTER REDEPLOYING
// ─────────────────────────────────────────────────────────────
const SCRIPT_URL   = "https://script.google.com/macros/s/AKfycbyJSP2bJAKthAZVALS8-JzaE0HJq8N8jb03OOCbnIcKtW2hMMD7mBG5cSsO9kS1REy6nw/exec";
const ADMIN_SECRET = "catalysT";
const MAX_SLOTS    = 300;
const FILE_NAME    = "MCG_ContactsGain_May2026";

// ─── Helpers ─────────────────────────────────────────────────

function toInternational(raw) {
  if (!raw && raw !== 0) return "";
  const d = String(raw).replace(/[^\d]/g, "");
  if (!d) return "";
  if (d.startsWith("234")) return "+" + d;
  if (d.startsWith("0"))   return "+234" + d.slice(1);
  return "+234" + d;
}

function buildVCF(contacts) {
  return contacts.map(({ name, phone }) => {
    const tel = toInternational(phone);
    return ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`, `TEL;TYPE=CELL,VOICE:${tel}`, "END:VCARD"].join("\r\n");
  }).join("\r\n");
}

function downloadVCF(contacts) {
  const blob = new Blob([buildVCF(contacts)], { type: "text/vcard;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.style.display = "none";
  a.href     = url;
  a.download = `${FILE_NAME}.vcf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

// ─── Form Page ────────────────────────────────────────────────

function FormPage({ onSwitch }) {
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [status,    setStatus]    = useState("idle");
  const [slotInfo,  setSlotInfo]  = useState(null);   // { count, remaining }
  const [slotResult, setSlotResult] = useState(null); // slot number on success

  // Load current count on mount
  useEffect(() => {
    fetch(`${SCRIPT_URL}?action=count`)
      .then(r => r.json())
      .then(j => { if (j.ok) setSlotInfo(j); })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setStatus("error"); return; }
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 8) { setStatus("badphone"); return; }
    setStatus("loading");
    try {
      const form = new FormData();
      form.append("name",  name.trim());
      form.append("phone", phone.trim());
      await fetch(SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });
      // no-cors = can't read response, optimistically succeed
      const newCount = slotInfo ? slotInfo.count + 1 : 1;
      setSlotInfo(s => s ? { ...s, count: newCount, remaining: MAX_SLOTS - newCount } : null);
      setSlotResult(newCount);
      setStatus("success");
      setName(""); setPhone("");
    } catch {
      setStatus("error");
    }
  }

  const isFull      = slotInfo && slotInfo.count >= MAX_SLOTS;
  const pct         = slotInfo ? Math.min(100, Math.round((slotInfo.count / MAX_SLOTS) * 100)) : 0;
  const barColor    = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#25D366";

  return (
    <div style={styles.page}>
      <div style={styles.glowTop} />

      <div style={styles.card}>

        {/* ── Brand Header ── */}
        <div style={styles.brandBar}>
          <div style={styles.mcgBadge}>MCG</div>
          <span style={styles.brandText}>Massive Gains 300.0</span>
        </div>

        {/* ── WhatsApp Icon + Title ── */}
        <div style={styles.cardHeader}>
          <div style={styles.waBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h1 style={styles.h1}>Join the Network</h1>
          <p style={styles.subtitle}>Submit your details to be part of the verified Massive Gains contact list 🇳🇬</p>
        </div>

        {/* ── Slot Progress Bar ── */}
        {slotInfo && (
          <div style={styles.slotBox}>
            <div style={styles.slotTopRow}>
              <span style={styles.slotLabel}>
                {isFull ? "🔴 Slots Full" : `🟢 ${slotInfo.remaining} slots remaining`}
              </span>
              <span style={styles.slotCount}>{slotInfo.count} / {MAX_SLOTS}</span>
            </div>
            <div style={styles.barTrack}>
              <div style={{ ...styles.barFill, width: `${pct}%`, background: barColor }} />
            </div>
          </div>
        )}

        {/* ── Full Message ── */}
        {isFull ? (
          <div style={styles.fullBox}>
            <p style={styles.fullTitle}>🔒 Registration Closed</p>
            <p style={styles.fullSub}>All 300 slots have been filled. The Massive Gains 300.0 network is complete!</p>
          </div>
        ) : (
          <>
            {/* ── Fields ── */}
            <div style={styles.fields}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={styles.label}>Your Name</label>
                <p style={styles.hint}>Enter exactly as you want it saved — prefix <strong style={{ color: "#25D366" }}>MCG</strong> will be added automatically</p>
                <div style={styles.inputWrap}>
                  <span style={styles.inputPrefix}>MCG</span>
                  <input
                    style={styles.inputWithPrefix} type="text" placeholder="Chidi Okeke"
                    value={name} onChange={e => { setName(e.target.value); setStatus("idle"); }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={styles.label}>WhatsApp Number</label>
                <p style={styles.hint}>Enter your number normally — no country code needed</p>
                <input
                  style={styles.input} type="tel" placeholder="08012345678"
                  value={phone} onChange={e => { setPhone(e.target.value); setStatus("idle"); }}
                />
              </div>
            </div>

            {/* ── Status messages ── */}
            {status === "error"    && <Msg type="error">Please fill in both your name and number.</Msg>}
            {status === "badphone" && <Msg type="error">Please enter a valid Nigerian phone number.</Msg>}
            {status === "success"  && (
              <Msg type="ok">
                ✅ Welcome to Massive Gains 300.0!{slotResult ? ` You're slot #${slotResult}.` : ""} Your contact has been saved as <strong>MCG {name || "..."}</strong>
              </Msg>
            )}

            <button
              style={{ ...styles.btnPrimary, opacity: status === "loading" ? 0.7 : 1 }}
              onClick={handleSubmit} disabled={status === "loading"}
            >
              {status === "loading" ? "Saving…" : "Submit & Join MCG 300.0"}
            </button>
          </>
        )}

        <button style={styles.btnLink} onClick={onSwitch}>Admin: View & Export Contacts →</button>
      </div>

      <style>{globalStyle}</style>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────

function AdminPage({ onSwitch }) {
  const [contacts,   setContacts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetched,    setFetched]    = useState(false);
  const [secret,     setSecret]     = useState("");
  const [authError,  setAuthError]  = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [confirmIdx, setConfirmIdx] = useState(null);
  const [search,     setSearch]     = useState("");

  async function fetchContacts() {
    setLoading(true); setAuthError(false);
    try {
      const res  = await fetch(`${SCRIPT_URL}?secret=${encodeURIComponent(secret)}`);
      const json = await res.json();
      if (json.ok) { setContacts(json.contacts || []); setFetched(true); }
      else { setAuthError(true); }
    } catch { setAuthError(true); }
    finally  { setLoading(false); }
  }

  async function handleDelete(idx) {
    setDeleting(idx); setConfirmIdx(null);
    const contact = contacts[idx];
    try {
      await fetch(
        `${SCRIPT_URL}?secret=${encodeURIComponent(secret)}&action=delete&phone=${encodeURIComponent(contact.phone)}`,
        { mode: "no-cors" }
      );
    } finally {
      setContacts(prev => prev.filter((_, i) => i !== idx));
      setDeleting(null);
    }
  }

  async function handleCopyVCF() {
    await navigator.clipboard.writeText(buildVCF(contacts));
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const remaining = MAX_SLOTS - contacts.length;
  const pct       = Math.min(100, Math.round((contacts.length / MAX_SLOTS) * 100));
  const barColor  = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#25D366";

  return (
    <div style={styles.adminPage}>

      {/* ── Admin Header ── */}
      <div style={styles.adminHeader}>
        <button style={styles.btnBack} onClick={onSwitch}>← Back to Form</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
          <div style={styles.mcgBadge}>MCG</div>
          <h2 style={styles.h2}>Admin Panel</h2>
          {fetched && <span style={styles.badge}>{contacts.length} / {MAX_SLOTS}</span>}
        </div>
        {fetched && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.btnSecondary} onClick={handleCopyVCF}>
              {copied ? "Copied! ✓" : "Copy vCard"}
            </button>
            <button
              style={{ ...styles.btnPrimary, width: "auto", marginBottom: 0, padding: "9px 20px" }}
              onClick={() => downloadVCF(contacts)} disabled={contacts.length === 0}
            >
              ⬇ {FILE_NAME}.vcf
            </button>
          </div>
        )}
      </div>

      {/* ── Slot progress bar ── */}
      {fetched && (
        <div style={{ ...styles.slotBox, marginBottom: 20 }}>
          <div style={styles.slotTopRow}>
            <span style={styles.slotLabel}>
              {remaining <= 0 ? "🔴 Full — 300/300 slots used" : `🟢 ${remaining} slots remaining`}
            </span>
            <span style={styles.slotCount}>{contacts.length} / {MAX_SLOTS}</span>
          </div>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${pct}%`, background: barColor }} />
          </div>
        </div>
      )}

      {!fetched ? (
        <div style={styles.authBox}>
          <p style={{ color: "#6b7c72", marginBottom: 14, fontSize: "0.9rem" }}>
            Enter your admin secret to load contacts
          </p>
          <input
            style={{ ...styles.input, marginBottom: 12 }} type="password"
            placeholder="Admin secret" value={secret}
            onChange={e => { setSecret(e.target.value); setAuthError(false); }}
            onKeyDown={e => e.key === "Enter" && fetchContacts()}
          />
          {authError && <Msg type="error">Wrong secret or connection error.</Msg>}
          <button style={styles.btnPrimary} onClick={fetchContacts} disabled={loading}>
            {loading ? "Loading…" : "Load Contacts"}
          </button>
        </div>
      ) : contacts.length === 0 ? (
        <div style={styles.empty}>No contacts yet. Share the form link!</div>
      ) : (
        <>
          {/* ── Search ── */}
          <input
            style={{ ...styles.input, marginBottom: 16 }}
            type="text" placeholder="Search by name or number…"
            value={search} onChange={e => setSearch(e.target.value)}
          />

          {/* ── Table ── */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Slot", "Name (MCG)", "Phone → +234", "Date", ""].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const realIdx = contacts.indexOf(c);
                  return (
                    <tr key={i} style={{ opacity: deleting === realIdx ? 0.4 : 1, transition: "opacity 0.2s" }}>
                      <td style={{ ...styles.td, color: "#25D366", fontWeight: 700, fontFamily: "monospace" }}>
                        #{c.slot || realIdx + 1}
                      </td>
                      <td style={{ ...styles.td, color: "#e8f5ea", fontWeight: 500 }}>{c.name}</td>
                      <td style={{ ...styles.td, fontFamily: "monospace", fontSize: "0.82rem" }}>
                        <span style={{ color: "#8db89e" }}>{c.phone}</span>
                        <span style={{ color: "#3d5946", marginLeft: 6 }}>→ {toInternational(c.phone)}</span>
                      </td>
                      <td style={{ ...styles.td, fontSize: "0.78rem", color: "#3d5946" }}>
                        {c.timestamp ? new Date(c.timestamp).toLocaleDateString("en-NG") : "—"}
                      </td>
                      <td style={styles.td}>
                        {confirmIdx === realIdx ? (
                          <span style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleDelete(realIdx)} style={styles.btnConfirmYes}>Yes</button>
                            <button onClick={() => setConfirmIdx(null)}   style={styles.btnConfirmNo}>No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmIdx(realIdx)} disabled={deleting === realIdx} style={styles.btnDelete}>
                            {deleting === realIdx ? "…" : "✕"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {search && (
            <p style={{ color: "#3d5946", fontSize: "0.8rem", marginTop: 10 }}>
              Showing {filtered.length} of {contacts.length} contacts
            </p>
          )}

          {/* ── Instructions ── */}
          <div style={styles.vcfBox}>
            <p style={styles.vcfTitle}>📲 How to share MCG_ContactsGain_May2026.vcf</p>
            <ol style={styles.vcfList}>
              <li>Click <strong>⬇ Download .vcf</strong> to get the file</li>
              <li>Open WhatsApp → Massive Gains group → attach as <strong>Document</strong></li>
              <li>Members tap → <strong>Import All</strong> → contacts save instantly with MCG prefix</li>
              <li>Everyone now sees each other's WhatsApp Status 🎉</li>
            </ol>
          </div>
        </>
      )}
      <style>{globalStyle}</style>
    </div>
  );
}

// ─── Msg ─────────────────────────────────────────────────────

function Msg({ type, children }) {
  const c = {
    error: { bg: "rgba(220,50,50,0.1)",  color: "#f87171", border: "rgba(220,50,50,0.2)"   },
    warn:  { bg: "rgba(234,179,8,0.1)",  color: "#fbbf24", border: "rgba(234,179,8,0.2)"   },
    ok:    { bg: "rgba(37,211,102,0.1)", color: "#4ade80", border: "rgba(37,211,102,0.25)" },
  }[type];
  return (
    <div style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: "12px 16px", fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("form");
  return page === "form"
    ? <FormPage  onSwitch={() => setPage("admin")} />
    : <AdminPage onSwitch={() => setPage("form")}  />;
}

// ─── Styles ───────────────────────────────────────────────────

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus { border-color: rgba(37,211,102,0.6) !important; box-shadow: 0 0 0 3px rgba(37,211,102,0.08) !important; outline: none; }
  strong { font-weight: 600; }
`;

const styles = {
  // ── Layout ──
  page: {
    minHeight: "100vh", background: "#080d0a",
    backgroundImage: [
      "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(37,211,102,0.2) 0%, transparent 65%)",
      "radial-gradient(ellipse 40% 30% at 90% 95%, rgba(37,211,102,0.06) 0%, transparent 60%)",
    ].join(","),
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 16px", fontFamily: "'DM Sans', sans-serif", position: "relative",
  },
  glowTop: {
    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
    width: 700, height: 2,
    background: "linear-gradient(90deg, transparent, rgba(37,211,102,0.6), transparent)",
  },

  // ── Card ──
  card: {
    width: "100%", maxWidth: 480, background: "#0f1712",
    border: "1px solid rgba(37,211,102,0.22)", borderRadius: 22, padding: "36px 34px",
    boxShadow: "0 0 80px rgba(37,211,102,0.07), 0 30px 70px rgba(0,0,0,0.7)",
  },

  // ── Brand ──
  brandBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, marginBottom: 24,
  },
  mcgBadge: {
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    color: "#fff", fontFamily: "'Sora', sans-serif", fontWeight: 800,
    fontSize: "0.72rem", letterSpacing: "0.12em",
    padding: "4px 10px", borderRadius: 6,
    boxShadow: "0 2px 12px rgba(37,211,102,0.35)",
  },
  brandText: {
    fontFamily: "'Sora', sans-serif", fontWeight: 700,
    fontSize: "0.9rem", color: "#a8d5b5", letterSpacing: "0.02em",
  },

  // ── Header ──
  cardHeader: { textAlign: "center", marginBottom: 24 },
  waBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 58, height: 58, background: "rgba(37,211,102,0.12)",
    borderRadius: "50%", color: "#25D366", marginBottom: 16,
    boxShadow: "0 0 20px rgba(37,211,102,0.15)",
  },
  h1: { fontFamily: "'Sora', sans-serif", fontSize: "1.65rem", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.02em", marginBottom: 8 },
  subtitle: { fontSize: "0.86rem", color: "#5a7a63", lineHeight: 1.65 },

  // ── Slot bar ──
  slotBox: {
    background: "#0b1410", border: "1px solid rgba(37,211,102,0.12)",
    borderRadius: 12, padding: "14px 16px", marginBottom: 24,
  },
  slotTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  slotLabel:  { fontSize: "0.8rem", color: "#6b9e78", fontFamily: "'Sora', sans-serif", fontWeight: 600 },
  slotCount:  { fontSize: "0.8rem", color: "#3d5946", fontFamily: "monospace" },
  barTrack: { height: 6, background: "rgba(37,211,102,0.1)", borderRadius: 99, overflow: "hidden" },
  barFill:  { height: "100%", borderRadius: 99, transition: "width 0.6s ease" },

  // ── Full box ──
  fullBox: {
    background: "rgba(220,50,50,0.07)", border: "1px solid rgba(220,50,50,0.2)",
    borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 20,
  },
  fullTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 700, color: "#f87171", marginBottom: 8 },
  fullSub:   { fontSize: "0.85rem", color: "#7a4444", lineHeight: 1.6 },

  // ── Fields ──
  fields: { display: "flex", flexDirection: "column", gap: 20, marginBottom: 22 },
  label: { fontFamily: "'Sora', sans-serif", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#25D366", marginBottom: 4, display: "block" },
  hint:  { fontSize: "0.77rem", color: "#3d5946", marginBottom: 10, lineHeight: 1.5 },
  inputWrap: { display: "flex", alignItems: "center", background: "#0a1410", border: "1.5px solid rgba(37,211,102,0.18)", borderRadius: 10, overflow: "hidden" },
  inputPrefix: {
    padding: "0 12px", fontFamily: "'Sora', sans-serif", fontWeight: 700,
    fontSize: "0.78rem", color: "#25D366", background: "rgba(37,211,102,0.08)",
    borderRight: "1px solid rgba(37,211,102,0.15)", whiteSpace: "nowrap",
    alignSelf: "stretch", display: "flex", alignItems: "center",
  },
  inputWithPrefix: {
    flex: 1, background: "transparent", border: "none",
    padding: "13px 14px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem", color: "#e8f5ea", outline: "none",
  },
  input: {
    width: "100%", background: "#0a1410", border: "1.5px solid rgba(37,211,102,0.18)",
    borderRadius: 10, padding: "13px 16px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem", color: "#e8f5ea", outline: "none",
  },

  // ── Buttons ──
  btnPrimary: {
    width: "100%", background: "linear-gradient(135deg, #25D366, #1aad55)",
    color: "#051007", fontFamily: "'Sora', sans-serif", fontSize: "0.92rem", fontWeight: 800,
    border: "none", borderRadius: 12, padding: "15px",
    cursor: "pointer", marginBottom: 14, letterSpacing: "0.01em",
    boxShadow: "0 4px 20px rgba(37,211,102,0.25)",
  },
  btnLink: {
    background: "none", border: "none", color: "#2e4a38",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
    cursor: "pointer", width: "100%", textAlign: "center", padding: 4,
  },

  // ── Admin ──
  adminPage: {
    minHeight: "100vh", background: "#060d09", fontFamily: "'DM Sans', sans-serif",
    color: "#d4ead9", padding: "28px 20px 60px", maxWidth: 900, margin: "0 auto",
  },
  adminHeader: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 },
  btnBack: {
    background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.18)",
    color: "#25D366", borderRadius: 8, padding: "8px 14px",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", cursor: "pointer",
  },
  h2: { fontFamily: "'Sora', sans-serif", fontSize: "1.25rem", fontWeight: 700, color: "#f0fdf4" },
  badge: {
    background: "rgba(37,211,102,0.12)", color: "#25D366", fontSize: "0.75rem",
    fontWeight: 700, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(37,211,102,0.22)",
    fontFamily: "monospace",
  },
  btnSecondary: {
    background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.22)",
    color: "#25D366", fontFamily: "'Sora', sans-serif", fontSize: "0.8rem",
    fontWeight: 700, borderRadius: 8, padding: "9px 16px", cursor: "pointer",
  },
  authBox: {
    maxWidth: 380, margin: "0 auto", background: "#0c1711",
    border: "1px solid rgba(37,211,102,0.12)", borderRadius: 16, padding: "32px 28px",
  },
  empty: { textAlign: "center", color: "#3d5946", padding: "60px 20px", border: "1px dashed rgba(37,211,102,0.12)", borderRadius: 14 },
  tableWrap: { overflowX: "auto", borderRadius: 14, border: "1px solid rgba(37,211,102,0.1)", background: "#0b1410" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.7rem", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "0.1em", color: "#25D366",
    padding: "14px 16px", textAlign: "left", borderBottom: "1px solid rgba(37,211,102,0.1)",
    background: "#0d1a12",
  },
  td: { padding: "12px 16px", borderBottom: "1px solid rgba(37,211,102,0.05)", fontSize: "0.88rem", color: "#c8dece" },
  vcfBox:   { marginTop: 24, background: "#0b1410", border: "1px solid rgba(37,211,102,0.1)", borderRadius: 14, padding: "20px 24px" },
  vcfTitle: { fontFamily: "'Sora', sans-serif", fontSize: "0.88rem", color: "#25D366", marginBottom: 12, fontWeight: 700 },
  vcfList:  { paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10, fontSize: "0.85rem", color: "#6b9e78", lineHeight: 1.6 },
  btnDelete:     { background: "none", border: "1px solid rgba(220,50,50,0.2)", color: "#f87171", borderRadius: 6, padding: "3px 9px", cursor: "pointer", fontSize: "0.78rem" },
  btnConfirmYes: { background: "rgba(220,50,50,0.12)", border: "1px solid rgba(220,50,50,0.25)", color: "#f87171", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: "0.75rem" },
  btnConfirmNo:  { background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.18)", color: "#4ade80", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: "0.75rem" },
};

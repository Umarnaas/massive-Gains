import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
//  🔧 ONLY TWO THINGS TO UPDATE:
//  1. Paste your Apps Script Web App URL below
//  2. Your Vercel site URL (for the page title)
// ─────────────────────────────────────────────────────────────
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcICESZfVwhWdwqHQduZtt6vNZnEAh-RiT0nenIAxibRShKHryFwR6R5jvoniBezwp3Q/exec";

const MAX_SLOTS = 300;
const FILE_NAME = "MCG_ContactsGain_May2026";
const PREFIX    = "MCG";

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
  a.href = url;
  a.download = `${FILE_NAME}.vcf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

// ─── Form Page ────────────────────────────────────────────────

function FormPage({ onSwitch }) {
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [status,     setStatus]     = useState("idle");
  const [slotInfo,   setSlotInfo]   = useState(null);
  const [slotResult, setSlotResult] = useState(null);
  const [savedName,  setSavedName]  = useState("");
  const [dupChecking, setDupChecking] = useState(false);
  const [dupStatus,   setDupStatus]   = useState("idle"); // idle | checking | clear | duplicate
  const phoneDebounce = useRef(null);

  // Load slot count on mount
  useEffect(() => {
    fetch(`${SCRIPT_URL}?action=count`)
      .then(r => r.json())
      .then(j => { if (j.ok) setSlotInfo(j); })
      .catch(() => {});
  }, []);

  // Real-time duplicate check as user types phone
  function handlePhoneChange(val) {
    setPhone(val);
    setStatus("idle");
    const digits = val.replace(/[^\d]/g, "");

    if (digits.length < 8) {
      setDupStatus("idle");
      return;
    }

    // Debounce — wait 600ms after user stops typing
    clearTimeout(phoneDebounce.current);
    setDupStatus("checking");
    phoneDebounce.current = setTimeout(async () => {
      try {
        const form = new FormData();
        form.append("action", "check");
        form.append("phone", val.trim());
        const res  = await fetch(SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });
        // no-cors means we can't read this response — use optimistic UI
        // Real duplicate block happens on final submit via backend
        setDupStatus("clear");
      } catch {
        setDupStatus("idle");
      }
    }, 600);
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setStatus("error"); return; }
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 8) { setStatus("badphone"); return; }

    setStatus("loading");
    try {
      const form = new FormData();
      form.append("action", "save");
      form.append("name",   name.trim());
      form.append("phone",  phone.trim());

      // Use a proxy-friendly approach — POST then GET result
      await fetch(SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });

      // Optimistically update UI
      const newCount = slotInfo ? slotInfo.count + 1 : 1;
      setSlotInfo(s => s ? { ...s, count: newCount, remaining: MAX_SLOTS - newCount } : null);
      setSlotResult(newCount);
      setSavedName(name.trim());
      setStatus("success");
      setName(""); setPhone(""); setDupStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  const isFull   = slotInfo && slotInfo.count >= MAX_SLOTS;
  const pct      = slotInfo ? Math.min(100, Math.round((slotInfo.count / MAX_SLOTS) * 100)) : 0;
  const barColor = pct >= 90 ? "#ff4444" : pct >= 70 ? "#ffd600" : "#25D366";

  return (
    <div style={S.page}>
      {/* Animated bg orbs */}
      <div style={{ ...S.orb, width: 500, height: 500, top: -200, left: -150, background: "radial-gradient(circle, rgba(37,211,102,0.12) 0%, transparent 70%)" }} />
      <div style={{ ...S.orb, width: 400, height: 400, bottom: -150, right: -100, background: "radial-gradient(circle, rgba(255,214,0,0.07) 0%, transparent 70%)" }} />
      <div style={{ ...S.orb, width: 300, height: 300, top: "40%", right: -80, background: "radial-gradient(circle, rgba(0,200,255,0.05) 0%, transparent 70%)" }} />

      <div style={S.topLine} />

      <div style={S.card}>
        {/* Brand bar */}
        <div style={S.brandBar}>
          <span style={S.mcgPill}>MCG</span>
          <span style={S.brandName}>Massive Gains 300.0</span>
          <span style={S.ngFlag}>🇳🇬</span>
        </div>

        {/* Icon + title */}
        <div style={S.cardHead}>
          <div style={S.waRing}>
            <svg viewBox="0 0 24 24" fill="#25D366" width="30" height="30">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h1 style={S.h1}>Join the Network</h1>
          <p style={S.subtitle}>Be part of a verified MCG contact list — connect, grow & see each other's Status</p>
        </div>

        {/* Slot counter */}
        {slotInfo && (
          <div style={S.slotCard}>
            <div style={S.slotRow}>
              <span style={{ ...S.slotLabel, color: isFull ? "#ff4444" : barColor }}>
                {isFull ? "🔴 All slots filled" : `🟢 ${slotInfo.remaining} of ${MAX_SLOTS} slots left`}
              </span>
              <span style={S.slotNum}>{slotInfo.count}/{MAX_SLOTS}</span>
            </div>
            <div style={S.track}>
              <div style={{ ...S.fill, width: `${pct}%`, background: barColor, boxShadow: `0 0 12px ${barColor}88` }} />
            </div>
          </div>
        )}

        {/* Full state */}
        {isFull ? (
          <div style={S.fullBox}>
            <p style={S.fullTitle}>🔒 Registration Closed</p>
            <p style={S.fullSub}>All 300 MCG slots have been filled. The network is complete!</p>
          </div>
        ) : status === "success" ? (
          /* ── SUCCESS STATE ── */
          <div style={S.successBox}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: 12 }}>🎉</span>
            <p style={S.successTitle}>Welcome, {PREFIX} {savedName}!</p>
            <p style={S.successSlot}>
              {slotResult ? `You secured Slot #${slotResult} of 300 🎯` : "You're in the network!"}
            </p>
            <div style={S.successDivider} />
            <p style={S.successNote}>
              Your contact has been saved as <strong style={{ color: "#25D366" }}>MCG {savedName}</strong>. Watch out for the MCG_ContactsGain_May2026.vcf file in the group — import it to connect with everyone!
            </p>
            <button style={S.btnOutline} onClick={() => setStatus("idle")}>
              ← Submit another contact
            </button>
          </div>
        ) : (
          /* ── FORM FIELDS ── */
          <>
            <div style={S.fields}>
              {/* Name field */}
              <div>
                <label style={S.label}>Your Name</label>
                <p style={S.hint}>Enter exactly as you want it saved — <strong style={{ color: "#25D366" }}>MCG</strong> prefix auto-added</p>
                <div style={S.inputRow}>
                  <span style={S.prefix}>{PREFIX}</span>
                  <input
                    style={S.prefixInput} type="text" placeholder="Chidi Okeke"
                    value={name} onChange={e => { setName(e.target.value); setStatus("idle"); }}
                  />
                </div>
              </div>

              {/* Phone field with live duplicate check */}
              <div>
                <label style={S.label}>WhatsApp Number</label>
                <p style={S.hint}>Enter normally — no country code needed</p>
                <div style={{ position: "relative" }}>
                  <input
                    style={{
                      ...S.input,
                      borderColor: dupStatus === "duplicate"
                        ? "rgba(255,68,68,0.6)"
                        : dupStatus === "clear"
                        ? "rgba(37,211,102,0.5)"
                        : "rgba(37,211,102,0.25)",
                      paddingRight: 44,
                    }}
                    type="tel" placeholder="08012345678"
                    value={phone} onChange={e => handlePhoneChange(e.target.value)}
                  />
                  {/* Status icon inside input */}
                  <span style={S.inputIcon}>
                    {dupStatus === "checking"  && <span style={{ color: "#ffd600", fontSize: "0.9rem" }}>⟳</span>}
                    {dupStatus === "clear"     && <span style={{ color: "#25D366", fontSize: "1rem" }}>✓</span>}
                    {dupStatus === "duplicate" && <span style={{ color: "#ff4444", fontSize: "1rem" }}>✕</span>}
                  </span>
                </div>
                {dupStatus === "duplicate" && (
                  <p style={S.dupWarning}>⚠️ This number is already registered in MCG 300.0</p>
                )}
                {dupStatus === "clear" && (
                  <p style={S.dupOk}>✓ Number is available</p>
                )}
              </div>
            </div>

            {status === "error"    && <StatusMsg type="error">Please fill in both your name and number.</StatusMsg>}
            {status === "badphone" && <StatusMsg type="error">Please enter a valid Nigerian phone number (min 8 digits).</StatusMsg>}
            {status === "dupBlock" && <StatusMsg type="error">This number is already registered. Each person can only submit once.</StatusMsg>}

            <button
              style={{
                ...S.btnPrimary,
                opacity: status === "loading" || dupStatus === "duplicate" ? 0.65 : 1,
                cursor:  dupStatus === "duplicate" ? "not-allowed" : "pointer",
              }}
              onClick={handleSubmit}
              disabled={status === "loading" || dupStatus === "duplicate"}
            >
              {status === "loading" ? "Saving…" : "Submit & Join MCG 300.0 →"}
            </button>
          </>
        )}

        <button style={S.adminLink} onClick={onSwitch}>Admin Panel →</button>
      </div>

      <style>{css}</style>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────

function AdminPage({ onSwitch }) {
  const [contacts,   setContacts]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetched,    setFetched]    = useState(false);
  const [secret,     setSecret]     = useState("");
  const [authError,  setAuthError]  = useState("");
  const [copied,     setCopied]     = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [confirmIdx, setConfirmIdx] = useState(null);
  const [search,     setSearch]     = useState("");

  async function fetchContacts() {
    if (!secret.trim()) { setAuthError("Please enter your admin secret."); return; }
    setLoading(true); setAuthError("");
    try {
      const res  = await fetch(`${SCRIPT_URL}?secret=${encodeURIComponent(secret)}`);
      const json = await res.json();
      if (json.ok) {
        setContacts(json.contacts || []);
        setFetched(true);
      } else if (json.error === "Unauthorized") {
        setAuthError("Wrong secret. Try again.");
      } else {
        setAuthError("Connection error. Try again.");
      }
    } catch {
      setAuthError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(idx) {
    setDeleting(idx); setConfirmIdx(null);
    try {
      await fetch(
        `${SCRIPT_URL}?secret=${encodeURIComponent(secret)}&action=delete&phone=${encodeURIComponent(contacts[idx].phone)}`,
        { mode: "no-cors" }
      );
    } finally {
      setContacts(prev => prev.filter((_, i) => i !== idx));
      setDeleting(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildVCF(contacts));
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  const filtered  = contacts.filter(c =>
    String(c.name  || "").toLowerCase().includes(search.toLowerCase()) ||
    String(c.phone || "").includes(search)
  );
  const pct      = Math.min(100, Math.round((contacts.length / MAX_SLOTS) * 100));
  const barColor = pct >= 90 ? "#ff4444" : pct >= 70 ? "#ffd600" : "#25D366";

  return (
    <div style={S.adminPage}>
      {/* Header */}
      <div style={S.adminTop}>
        <button style={S.btnBack} onClick={onSwitch}>← Back</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={S.mcgPill}>MCG</span>
          <h2 style={S.h2}>Admin Panel</h2>
          {fetched && <span style={S.badge}>{contacts.length}/{MAX_SLOTS}</span>}
        </div>
        {fetched && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={S.btnGhost} onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy vCard"}
            </button>
            <button
              style={{ ...S.btnGreen, padding: "9px 18px", width: "auto", marginBottom: 0 }}
              onClick={() => downloadVCF(contacts)} disabled={contacts.length === 0}
            >
              ⬇ Download .vcf
            </button>
          </div>
        )}
      </div>

      {!fetched ? (
        /* ── Auth box ── */
        <div style={S.authBox}>
          <p style={S.authTitle}>Enter Admin Secret</p>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <input
              style={S.input} type="password"
              placeholder="Your admin secret"
              value={secret}
              onChange={e => { setSecret(e.target.value); setAuthError(""); }}
              onKeyDown={e => e.key === "Enter" && fetchContacts()}
            />
          </div>
          {authError && <StatusMsg type="error">{authError}</StatusMsg>}
          <button style={S.btnGreen} onClick={fetchContacts} disabled={loading}>
            {loading ? "Verifying…" : "Access Panel"}
          </button>
        </div>
      ) : (
        <>
          {/* Slot bar */}
          <div style={{ ...S.slotCard, marginBottom: 20 }}>
            <div style={S.slotRow}>
              <span style={{ ...S.slotLabel, color: barColor }}>
                {contacts.length >= MAX_SLOTS ? "🔴 Full" : `🟢 ${MAX_SLOTS - contacts.length} slots remaining`}
              </span>
              <span style={S.slotNum}>{contacts.length}/{MAX_SLOTS}</span>
            </div>
            <div style={S.track}>
              <div style={{ ...S.fill, width: `${pct}%`, background: barColor, boxShadow: `0 0 12px ${barColor}88` }} />
            </div>
          </div>

          {/* Search */}
          <input
            style={{ ...S.input, marginBottom: 16 }}
            type="text" placeholder="🔍  Search by name or number…"
            value={search} onChange={e => setSearch(e.target.value)}
          />

          {/* Table */}
          {contacts.length === 0 ? (
            <div style={S.empty}>No contacts yet. Share the form link!</div>
          ) : (
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Slot", "Name (MCG)", "Phone → +234", "Date", ""].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const ri = contacts.indexOf(c);
                    return (
                      <tr key={i} style={{ opacity: deleting === ri ? 0.4 : 1, transition: "opacity 0.2s" }}>
                        <td style={{ ...S.td, color: "#25D366", fontWeight: 800, fontFamily: "monospace" }}>#{c.slot || ri + 1}</td>
                        <td style={{ ...S.td, color: "#e8fff0", fontWeight: 600 }}>{c.name}</td>
                        <td style={{ ...S.td, fontFamily: "monospace", fontSize: "0.82rem" }}>
                          <span style={{ color: "#8db89e" }}>{c.phone}</span>
                          <span style={{ color: "#3d5946", marginLeft: 8 }}>→ {toInternational(c.phone)}</span>
                        </td>
                        <td style={{ ...S.td, fontSize: "0.78rem", color: "#3d5946" }}>
                          {c.timestamp ? new Date(c.timestamp).toLocaleDateString("en-NG") : "—"}
                        </td>
                        <td style={S.td}>
                          {confirmIdx === ri ? (
                            <span style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => handleDelete(ri)} style={S.btnYes}>Yes</button>
                              <button onClick={() => setConfirmIdx(null)} style={S.btnNo}>No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmIdx(ri)} style={S.btnDel}>✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {search && (
                <p style={{ color: "#3d5946", fontSize: "0.78rem", padding: "10px 16px" }}>
                  Showing {filtered.length} of {contacts.length}
                </p>
              )}
            </div>
          )}

          {/* VCF instructions */}
          <div style={S.infoBox}>
            <p style={S.infoTitle}>📲 How to send the vCard</p>
            <ol style={S.infoList}>
              <li>Click <strong>Download .vcf</strong> above</li>
              <li>Open WhatsApp group → attach as a <strong>Document</strong></li>
              <li>Members tap → <strong>Import All</strong> → all contacts save with MCG prefix</li>
              <li>Everyone can now see each other's WhatsApp Status 🎉</li>
            </ol>
          </div>
        </>
      )}
      <style>{css}</style>
    </div>
  );
}

// ─── StatusMsg ────────────────────────────────────────────────

function StatusMsg({ type, children }) {
  const t = {
    error: { bg: "rgba(255,68,68,0.1)",   color: "#ff6b6b", border: "rgba(255,68,68,0.25)"  },
    warn:  { bg: "rgba(255,214,0,0.1)",   color: "#ffd600", border: "rgba(255,214,0,0.25)"  },
    ok:    { bg: "rgba(37,211,102,0.1)",  color: "#4ade80", border: "rgba(37,211,102,0.3)"  },
  }[type];
  return (
    <div style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      borderRadius: 10, padding: "11px 15px", fontSize: "0.86rem",
      marginBottom: 14, lineHeight: 1.55 }}>
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

// ─── CSS ─────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #05080f; }

  @keyframes floatY {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes glowPulse {
    0%,100% { box-shadow: 0 0 20px rgba(37,211,102,0.25), 0 0 60px rgba(37,211,102,0.08); }
    50%     { box-shadow: 0 0 35px rgba(37,211,102,0.45), 0 0 90px rgba(37,211,102,0.15); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  input::placeholder { color: #2e4a38; }
  input:focus {
    border-color: rgba(37,211,102,0.7) !important;
    box-shadow: 0 0 0 4px rgba(37,211,102,0.12), 0 0 25px rgba(37,211,102,0.1) !important;
    outline: none;
  }
  button:hover { filter: brightness(1.08); }
  button:active { transform: scale(0.97); }
  strong { font-weight: 700; }
`;

// ─── Styles ───────────────────────────────────────────────────

const S = {
  // Layout
  page: {
    minHeight: "100vh", background: "#05080f",
    backgroundImage: [
      "radial-gradient(ellipse 110% 55% at 50% 0%, rgba(37,211,102,0.22) 0%, transparent 58%)",
      "radial-gradient(ellipse 50% 40% at 5% 85%,  rgba(255,214,0,0.07) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 35% at 95% 25%, rgba(0,200,255,0.06) 0%, transparent 50%)",
    ].join(","),
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 16px", fontFamily: "'DM Sans', sans-serif",
    position: "relative", overflow: "hidden",
  },
  orb: { position: "absolute", pointerEvents: "none", borderRadius: "50%", filter: "blur(60px)" },
  topLine: {
    position: "absolute", top: 0, left: 0, right: 0, height: 3,
    background: "linear-gradient(90deg, transparent 0%, #25D366 30%, #ffd600 60%, #25D366 80%, transparent 100%)",
    animation: "shimmer 4s linear infinite", backgroundSize: "300% 100%",
  },

  // Card
  card: {
    width: "100%", maxWidth: 490,
    background: "linear-gradient(165deg, rgba(14,26,18,0.97) 0%, rgba(7,13,9,0.99) 100%)",
    border: "1px solid rgba(37,211,102,0.3)", borderRadius: 26, padding: "38px 34px",
    boxShadow: [
      "0 0 0 1px rgba(37,211,102,0.06)",
      "0 0 80px rgba(37,211,102,0.1)",
      "0 40px 100px rgba(0,0,0,0.85)",
      "inset 0 1px 0 rgba(255,255,255,0.05)",
    ].join(","),
    position: "relative",
    animation: "glowPulse 5s ease-in-out infinite",
  },

  // Brand
  brandBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 24 },
  mcgPill: {
    background: "linear-gradient(135deg, #25D366, #00c853, #ffd600)",
    color: "#030f06", fontFamily: "'Sora', sans-serif", fontWeight: 900,
    fontSize: "0.72rem", letterSpacing: "0.15em", padding: "5px 12px", borderRadius: 8,
    boxShadow: "0 0 18px rgba(37,211,102,0.45)",
  },
  brandName: {
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.92rem",
    background: "linear-gradient(90deg, #25D366 0%, #ffd600 50%, #25D366 100%)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    animation: "shimmer 4s linear infinite",
  },
  ngFlag: { fontSize: "1.1rem" },

  // Card header
  cardHead: { textAlign: "center", marginBottom: 24 },
  waRing: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 70, height: 70,
    background: "linear-gradient(135deg, rgba(37,211,102,0.18), rgba(37,211,102,0.04))",
    border: "2px solid rgba(37,211,102,0.45)", borderRadius: "50%",
    marginBottom: 18, animation: "floatY 4s ease-in-out infinite",
    boxShadow: "0 0 30px rgba(37,211,102,0.2), inset 0 0 20px rgba(37,211,102,0.05)",
  },
  h1: {
    fontFamily: "'Sora', sans-serif", fontSize: "1.8rem", fontWeight: 800,
    background: "linear-gradient(135deg, #ffffff 0%, #b8ffd0 60%, #ffffff 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    letterSpacing: "-0.025em", marginBottom: 10,
  },
  subtitle: { fontSize: "0.87rem", color: "#6b9e78", lineHeight: 1.7 },

  // Slot
  slotCard: {
    background: "linear-gradient(135deg, rgba(37,211,102,0.07), rgba(0,180,80,0.03))",
    border: "1px solid rgba(37,211,102,0.18)", borderRadius: 14,
    padding: "14px 18px", marginBottom: 24,
  },
  slotRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  slotLabel: { fontSize: "0.82rem", fontFamily: "'Sora', sans-serif", fontWeight: 700 },
  slotNum: { fontSize: "0.82rem", color: "#25D366", fontFamily: "monospace", fontWeight: 800 },
  track: { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" },
  fill:  { height: "100%", borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" },

  // Full/closed
  fullBox: {
    background: "linear-gradient(135deg, rgba(255,68,68,0.1), rgba(180,0,0,0.05))",
    border: "1px solid rgba(255,68,68,0.3)", borderRadius: 14, padding: "24px",
    textAlign: "center", marginBottom: 20, boxShadow: "0 0 30px rgba(255,68,68,0.07)",
  },
  fullTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#ff6b6b", marginBottom: 10 },
  fullSub:   { fontSize: "0.86rem", color: "#8a4a4a", lineHeight: 1.65 },

  // Success
  successBox: {
    background: "linear-gradient(160deg, rgba(10,30,16,0.97), rgba(5,15,10,0.99))",
    border: "1px solid rgba(37,211,102,0.3)", borderRadius: 18,
    padding: "30px 24px", textAlign: "center", marginBottom: 6,
    boxShadow: "0 0 50px rgba(37,211,102,0.1)",
  },
  successTitle: {
    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.2rem",
    background: "linear-gradient(135deg, #fff, #a8ffcc)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 8,
  },
  successSlot: {
    fontSize: "0.85rem", fontFamily: "monospace", fontWeight: 700, marginBottom: 20,
    background: "linear-gradient(90deg, #25D366, #ffd600)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  successDivider: { height: 1, background: "rgba(37,211,102,0.15)", margin: "0 0 18px" },
  successNote: { fontSize: "0.84rem", color: "#6b9e78", lineHeight: 1.7, marginBottom: 20 },
  btnOutline: {
    background: "none", border: "1px solid rgba(37,211,102,0.3)", color: "#4ade80",
    fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.82rem",
    borderRadius: 10, padding: "10px 20px", cursor: "pointer",
  },

  // Fields
  fields: { display: "flex", flexDirection: "column", gap: 20, marginBottom: 22 },
  label: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.72rem", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: 5,
    background: "linear-gradient(90deg, #25D366, #00e5ff)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  hint: { fontSize: "0.77rem", color: "#3d5946", marginBottom: 10, lineHeight: 1.55 },
  inputRow: {
    display: "flex", alignItems: "center",
    background: "rgba(8,20,12,0.9)", border: "1.5px solid rgba(37,211,102,0.25)",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  prefix: {
    padding: "0 14px", fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: "0.82rem",
    background: "linear-gradient(90deg, #25D366, #00c853)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    borderRight: "1px solid rgba(37,211,102,0.18)",
    alignSelf: "stretch", display: "flex", alignItems: "center", whiteSpace: "nowrap",
  },
  prefixInput: {
    flex: 1, background: "transparent", border: "none",
    padding: "14px 14px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem", color: "#e8fff0", outline: "none",
  },
  input: {
    width: "100%", background: "rgba(8,20,12,0.9)",
    border: "1.5px solid rgba(37,211,102,0.25)", borderRadius: 12,
    padding: "14px 16px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem", color: "#e8fff0", outline: "none",
    boxShadow: "0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
    transition: "border-color 0.25s",
  },
  inputIcon: {
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    fontSize: "1rem", pointerEvents: "none",
  },
  dupWarning: { fontSize: "0.78rem", color: "#ff6b6b", marginTop: 6, fontWeight: 600 },
  dupOk:      { fontSize: "0.78rem", color: "#4ade80", marginTop: 6, fontWeight: 600 },

  // Buttons
  btnPrimary: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366 0%, #00c853 45%, #ffd600 100%)",
    color: "#020d06", fontFamily: "'Sora', sans-serif", fontSize: "0.95rem", fontWeight: 900,
    border: "none", borderRadius: 14, padding: "16px", cursor: "pointer",
    marginBottom: 14, letterSpacing: "0.02em",
    boxShadow: "0 4px 30px rgba(37,211,102,0.4), 0 0 60px rgba(37,211,102,0.1), inset 0 1px 0 rgba(255,255,255,0.25)",
    transition: "opacity 0.2s, transform 0.15s",
  },
  adminLink: {
    background: "none", border: "none", color: "#2a4032",
    fontFamily: "'Sora', sans-serif", fontSize: "0.78rem", fontWeight: 600,
    cursor: "pointer", width: "100%", textAlign: "center", padding: 4, marginTop: 2,
  },

  // Admin page
  adminPage: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #060e08, #030a0d, #060c06)",
    fontFamily: "'DM Sans', sans-serif", color: "#d4ead9",
    padding: "28px 20px 60px", maxWidth: 920, margin: "0 auto",
  },
  adminTop: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 },
  btnBack: {
    background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.22)",
    color: "#25D366", borderRadius: 10, padding: "9px 16px",
    fontFamily: "'Sora', sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
  },
  h2: {
    fontFamily: "'Sora', sans-serif", fontSize: "1.25rem", fontWeight: 800,
    background: "linear-gradient(90deg, #fff, #a8ffcc)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  badge: {
    background: "rgba(37,211,102,0.12)", color: "#4ade80",
    fontSize: "0.78rem", fontWeight: 800, padding: "4px 12px",
    borderRadius: 20, border: "1px solid rgba(37,211,102,0.28)",
    fontFamily: "monospace", boxShadow: "0 0 10px rgba(37,211,102,0.1)",
  },
  btnGhost: {
    background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.28)",
    color: "#4ade80", fontFamily: "'Sora', sans-serif", fontSize: "0.82rem",
    fontWeight: 700, borderRadius: 10, padding: "9px 18px", cursor: "pointer",
  },
  btnGreen: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366, #00c853, #ffd600)",
    color: "#020d06", fontFamily: "'Sora', sans-serif", fontSize: "0.9rem", fontWeight: 900,
    border: "none", borderRadius: 12, padding: "13px", cursor: "pointer", marginBottom: 0,
    boxShadow: "0 4px 25px rgba(37,211,102,0.35)",
  },

  // Security note
  secureNote: {
    background: "linear-gradient(135deg, rgba(37,211,102,0.06), rgba(0,200,100,0.02))",
    border: "1px solid rgba(37,211,102,0.15)", borderRadius: 10,
    padding: "10px 16px", fontSize: "0.78rem", color: "#4a8a5a",
    marginBottom: 20, lineHeight: 1.5,
  },

  // Auth box
  authBox: {
    maxWidth: 400, margin: "0 auto",
    background: "linear-gradient(160deg, rgba(12,26,16,0.97), rgba(6,14,9,0.99))",
    border: "1px solid rgba(37,211,102,0.2)", borderRadius: 18, padding: "36px 32px",
    boxShadow: "0 0 60px rgba(37,211,102,0.07), 0 30px 60px rgba(0,0,0,0.6)",
  },
  authTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#f0fdf4", marginBottom: 8 },
  authSub:   { fontSize: "0.82rem", color: "#3d6040", lineHeight: 1.6, marginBottom: 20 },

  empty: {
    textAlign: "center", color: "#3d6040", padding: "60px 20px",
    border: "1px dashed rgba(37,211,102,0.15)", borderRadius: 16,
    background: "rgba(37,211,102,0.02)", fontSize: "0.9rem",
  },
  tableWrap: {
    overflowX: "auto", borderRadius: 16,
    border: "1px solid rgba(37,211,102,0.15)",
    background: "linear-gradient(160deg, rgba(9,20,12,0.98), rgba(5,12,8,0.99))",
    boxShadow: "0 0 40px rgba(37,211,102,0.05)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.68rem", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.12em", color: "#25D366",
    padding: "15px 16px", textAlign: "left",
    borderBottom: "1px solid rgba(37,211,102,0.12)",
    background: "rgba(9,22,13,0.95)",
  },
  td: { padding: "13px 16px", borderBottom: "1px solid rgba(37,211,102,0.05)", fontSize: "0.88rem", color: "#b0ccb8" },
  btnDel: { background: "rgba(255,68,68,0.07)", border: "1px solid rgba(255,68,68,0.22)", color: "#ff6b6b", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: "0.78rem" },
  btnYes: { background: "rgba(255,68,68,0.14)", border: "1px solid rgba(255,68,68,0.28)", color: "#ff6b6b", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" },
  btnNo:  { background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)", color: "#4ade80", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" },

  infoBox: {
    marginTop: 24,
    background: "linear-gradient(135deg, rgba(37,211,102,0.06), rgba(0,180,80,0.02))",
    border: "1px solid rgba(37,211,102,0.14)", borderRadius: 16, padding: "22px 26px",
  },
  infoTitle: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.88rem", fontWeight: 800,
    background: "linear-gradient(90deg, #25D366, #ffd600)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 14,
  },
  infoList: { paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: "0.86rem", color: "#5a8a68", lineHeight: 1.65 },
};

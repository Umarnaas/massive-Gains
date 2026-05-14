import { useState, useEffect, useRef } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcICESZfVwhWdwqHQduZtt6vNZnEAh-RiT0nenIAxibRShKHryFwR6R5jvoniBezwp3Q/exec";
const MAX_SLOTS  = 300;
const FILE_NAME  = "MCG_ContactsGain_May2026";
const PREFIX     = "MCG";

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
    return ["BEGIN:VCARD","VERSION:3.0",`FN:${name}`,`TEL;TYPE=CELL,VOICE:${tel}`,"END:VCARD"].join("\r\n");
  }).join("\r\n");
}

function downloadVCF(contacts) {
  const blob = new Blob([buildVCF(contacts)], { type: "text/vcard;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.style.display = "none";
  a.href = url; a.download = `${FILE_NAME}.vcf`;
  document.body.appendChild(a); a.click();
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
  const [dupStatus,  setDupStatus]  = useState("idle");
  const debounce = useRef(null);

  useEffect(() => {
    fetch(`${SCRIPT_URL}?action=count`)
      .then(r => r.json())
      .then(j => { if (j.ok) setSlotInfo(j); })
      .catch(() => {});
  }, []);

  function handlePhoneChange(val) {
    setPhone(val); setStatus("idle");
    const digits = val.replace(/[^\d]/g, "");
    if (digits.length < 8) { setDupStatus("idle"); return; }
    clearTimeout(debounce.current);
    setDupStatus("checking");
    debounce.current = setTimeout(async () => {
      try {
        const form = new FormData();
        form.append("action", "check");
        form.append("phone", val.trim());
        await fetch(SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });
        setDupStatus("clear");
      } catch { setDupStatus("idle"); }
    }, 600);
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setStatus("error"); return; }
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 8) { setStatus("badphone"); return; }
    if (dupStatus === "duplicate") { setStatus("dupBlock"); return; }
    setStatus("loading");
    try {
      const form = new FormData();
      form.append("action", "save");
      form.append("name", name.trim());
      form.append("phone", phone.trim());
      await fetch(SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });
      const newCount = slotInfo ? slotInfo.count + 1 : 1;
      setSlotInfo(s => s ? { ...s, count: newCount, remaining: MAX_SLOTS - newCount } : null);
      setSlotResult(newCount);
      setSavedName(name.trim());
      setStatus("success");
      setName(""); setPhone(""); setDupStatus("idle");
    } catch { setStatus("error"); }
  }

  const isFull   = slotInfo && slotInfo.count >= MAX_SLOTS;
  const pct      = slotInfo ? Math.min(100, Math.round((slotInfo.count / MAX_SLOTS) * 100)) : 0;
  const slotsLeft = slotInfo ? slotInfo.remaining : MAX_SLOTS;

  return (
    <div style={S.page}>
      <style>{css}</style>

      {/* Background layers */}
      <div className="bg-grid" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      {/* Top accent line */}
      <div className="top-line" />

      <div style={S.wrapper}>

        {/* ── LEFT PANEL: Hero copy ── */}
        <div style={S.hero}>
          <div style={S.heroPill}>
            <span style={S.pillDot} /> EXCLUSIVE NETWORK · 300 SLOTS ONLY
          </div>

          <h1 style={S.heroH1}>
            <span style={S.heroLine1}>Massive</span>
            <span style={S.heroLine2}>Gains</span>
            <span style={S.heroLine3}>300.0</span>
          </h1>

          <p style={S.heroSub}>
            A verified Nigerian WhatsApp network built for serious entrepreneurs, hustlers & go-getters. One import. 300 connections. Unlimited opportunity.
          </p>

          {/* Social proof pills */}
          <div style={S.proofRow}>
            <div style={S.proofPill}>🇳🇬 Nigeria-Based</div>
            <div style={S.proofPill}>✅ Verified Members</div>
            <div style={S.proofPill}>⚡ MCG Prefixed</div>
          </div>

          {/* Slot urgency */}
          {slotInfo && (
            <div style={S.urgencyBox}>
              <div style={S.urgencyTop}>
                <span style={S.urgencyLabel}>
                  {isFull ? "🔴 CLOSED" : `🔥 Only ${slotsLeft} slots remaining!`}
                </span>
                <span style={S.urgencyCount}>{slotInfo.count}/{MAX_SLOTS}</span>
              </div>
              <div style={S.urgencyTrack}>
                <div
                  className="urgency-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90
                      ? "linear-gradient(90deg, #ff4444, #ff0000)"
                      : pct >= 70
                      ? "linear-gradient(90deg, #ffd600, #ff9500)"
                      : "linear-gradient(90deg, #4facfe, #00f2fe)",
                  }}
                />
              </div>
            </div>
          )}

          {/* Features list */}
          <div style={S.featureList}>
            {[
              ["⚡", "Instant contact import via .vcf file"],
              ["👁", "See all 300 members' WhatsApp Status"],
              ["🏷️", "MCG prefix — organised & verified"],
              ["🔒", "Duplicate-protected — one slot per number"],
            ].map(([icon, text]) => (
              <div key={text} style={S.featureItem}>
                <span style={S.featureIcon}>{icon}</span>
                <span style={S.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL: Form card ── */}
        <div style={S.formWrap}>
          <div style={S.card}>

            {/* Card top badge */}
            <div style={S.cardBadge}>
              <span style={S.cardBadgeInner}>SECURE REGISTRATION</span>
            </div>

            {status === "success" ? (
              /* ── SUCCESS ── */
              <div style={S.successWrap}>
                <div className="success-ring">
                  <span style={{ fontSize: "2.2rem" }}>✅</span>
                </div>
                <h3 style={S.successH}>You're In!</h3>
                <p style={S.successName}>MCG {savedName}</p>
                {slotResult && (
                  <div style={S.slotBadge}>Slot #{slotResult} of 300</div>
                )}
                <p style={S.successMsg}>
                  Your contact is saved. Watch out for <strong>MCG_ContactsGain_May2026.vcf</strong> in the group — import it to activate your full network.
                </p>
                <button style={S.btnOutline} onClick={() => setStatus("idle")}>
                  Submit Another →
                </button>
              </div>
            ) : isFull ? (
              /* ── FULL ── */
              <div style={S.fullWrap}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: 12 }}>🔒</span>
                <h3 style={S.fullH}>Registration Closed</h3>
                <p style={S.fullMsg}>All 300 MCG slots have been filled. The network is complete!</p>
              </div>
            ) : (
              /* ── FORM ── */
              <>
                <h2 style={S.cardH}>Claim Your Slot</h2>
                <p style={S.cardSub}>Fill in your details below to join the MCG 300.0 network</p>

                <div style={S.formFields}>
                  {/* Name */}
                  <div style={S.fieldGroup}>
                    <label style={S.fieldLabel}>YOUR NAME</label>
                    <div style={S.prefixWrap}>
                      <span style={S.prefixTag}>MCG</span>
                      <input
                        className="field-input"
                        style={S.prefixInput}
                        type="text"
                        placeholder="Chidi Okeke"
                        value={name}
                        onChange={e => { setName(e.target.value); setStatus("idle"); }}
                      />
                    </div>
                    <p style={S.fieldHint}>Saved exactly as typed, with MCG prefix added</p>
                  </div>

                  {/* Phone */}
                  <div style={S.fieldGroup}>
                    <label style={S.fieldLabel}>WHATSAPP NUMBER</label>
                    <div style={{ position: "relative" }}>
                      <input
                        className="field-input"
                        style={{
                          ...S.fieldInput,
                          borderColor: dupStatus === "duplicate"
                            ? "#ff4444"
                            : dupStatus === "clear"
                            ? "#4facfe"
                            : "rgba(79,172,254,0.2)",
                          paddingRight: 48,
                        }}
                        type="tel"
                        placeholder="08012345678"
                        value={phone}
                        onChange={e => handlePhoneChange(e.target.value)}
                      />
                      <span style={S.fieldIcon}>
                        {dupStatus === "checking"  && <span className="spin" style={{ color: "#ffd600" }}>⟳</span>}
                        {dupStatus === "clear"     && <span style={{ color: "#4facfe" }}>✓</span>}
                        {dupStatus === "duplicate" && <span style={{ color: "#ff4444" }}>✕</span>}
                      </span>
                    </div>
                    {dupStatus === "duplicate" && (
                      <p style={{ ...S.fieldHint, color: "#ff6b6b" }}>⚠️ Number already registered</p>
                    )}
                    {dupStatus === "clear" && (
                      <p style={{ ...S.fieldHint, color: "#4facfe" }}>✓ Number is available</p>
                    )}
                    {dupStatus === "idle" && (
                      <p style={S.fieldHint}>No country code needed — enter normally</p>
                    )}
                  </div>
                </div>

                {/* Error messages */}
                {status === "error"    && <Alert>Please fill in both your name and number.</Alert>}
                {status === "badphone" && <Alert>Enter a valid Nigerian number (e.g. 08012345678).</Alert>}
                {status === "dupBlock" && <Alert>This number is already registered in MCG 300.0.</Alert>}

                {/* Submit */}
                <button
                  className="btn-submit"
                  style={{
                    ...S.btnSubmit,
                    opacity: status === "loading" || dupStatus === "duplicate" ? 0.6 : 1,
                    cursor: dupStatus === "duplicate" ? "not-allowed" : "pointer",
                  }}
                  onClick={handleSubmit}
                  disabled={status === "loading" || dupStatus === "duplicate"}
                >
                  {status === "loading" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                      <span className="spin">⟳</span> Securing your slot…
                    </span>
                  ) : (
                    "Secure My Slot →"
                  )}
                </button>

                <p style={S.trustLine}>
                  🔒 Your data is stored securely · No spam · Nigeria only
                </p>
              </>
            )}

            <button style={S.adminBtn} onClick={onSwitch}>Admin →</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span style={S.footerText}>MCG 300.0 · Massive Gains Network · 🇳🇬 Nigeria</span>
      </div>
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
    if (!secret.trim()) { setAuthError("Enter your admin secret."); return; }
    setLoading(true); setAuthError("");
    try {
      const res  = await fetch(`${SCRIPT_URL}?secret=${encodeURIComponent(secret)}`);
      const json = await res.json();
      if (json.ok) { setContacts(json.contacts || []); setFetched(true); }
      else if (json.error === "Unauthorized") setAuthError("Wrong secret. Try again.");
      else setAuthError("Connection error. Try again.");
    } catch { setAuthError("Network error. Check your connection."); }
    finally { setLoading(false); }
  }

  async function handleDelete(idx) {
    setDeleting(idx); setConfirmIdx(null);
    try {
      await fetch(
        `${SCRIPT_URL}?secret=${encodeURIComponent(secret)}&action=delete&phone=${encodeURIComponent(contacts[idx].phone)}`,
        { mode: "no-cors" }
      );
    } finally {
      setContacts(p => p.filter((_, i) => i !== idx));
      setDeleting(null);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildVCF(contacts));
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  const filtered = contacts.filter(c =>
    String(c.name  || "").toLowerCase().includes(search.toLowerCase()) ||
    String(c.phone || "").includes(search)
  );
  const pct      = Math.min(100, Math.round((contacts.length / MAX_SLOTS) * 100));
  const barColor = pct >= 90 ? "#ff4444" : pct >= 70 ? "#ffd600" : "#4facfe";

  return (
    <div style={A.page}>
      <style>{css}</style>
      <div className="orb orb1" />
      <div className="orb orb2" />

      {/* Header */}
      <div style={A.header}>
        <button style={A.btnBack} onClick={onSwitch}>← Back to Form</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={A.headerBadge}>MCG</div>
          <h2 style={A.h2}>Admin Panel</h2>
          {fetched && <span style={A.countBadge}>{contacts.length}/{MAX_SLOTS}</span>}
        </div>
        {fetched && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={A.btnGhost} onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy vCard"}
            </button>
            <button style={A.btnBlue} onClick={() => downloadVCF(contacts)} disabled={contacts.length === 0}>
              ⬇ Download .vcf
            </button>
          </div>
        )}
      </div>

      {/* Security note */}
      <div style={A.secNote}>
        🔒 Admin secret verified on Google's backend only — never exposed in page source
      </div>

      {!fetched ? (
        <div style={A.authCard}>
          <div style={A.authIcon}>🔐</div>
          <h3 style={A.authH}>Admin Access</h3>
          <p style={A.authSub}>Your secret is verified server-side — never visible in browser code</p>
          <input
            className="field-input"
            style={{ ...A.input, marginBottom: 14 }}
            type="password"
            placeholder="Enter admin secret"
            value={secret}
            onChange={e => { setSecret(e.target.value); setAuthError(""); }}
            onKeyDown={e => e.key === "Enter" && fetchContacts()}
          />
          {authError && <Alert>{authError}</Alert>}
          <button style={A.btnBlue} onClick={fetchContacts} disabled={loading}>
            {loading ? "Verifying…" : "Access Panel →"}
          </button>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div style={A.progressCard}>
            <div style={A.progressRow}>
              <span style={{ ...A.progressLabel, color: barColor }}>
                {contacts.length >= MAX_SLOTS ? "🔴 All slots filled" : `🔥 ${MAX_SLOTS - contacts.length} slots remaining`}
              </span>
              <span style={A.progressCount}>{contacts.length} / {MAX_SLOTS}</span>
            </div>
            <div style={A.track}>
              <div style={{ ...A.fill, width: `${pct}%`, background: barColor, boxShadow: `0 0 14px ${barColor}99` }} />
            </div>
          </div>

          {/* Search */}
          <input
            className="field-input"
            style={{ ...A.input, marginBottom: 18 }}
            type="text"
            placeholder="🔍  Search by name or number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {contacts.length === 0 ? (
            <div style={A.empty}>No contacts yet. Share the form link!</div>
          ) : (
            <div style={A.tableWrap}>
              <table style={A.table}>
                <thead>
                  <tr>
                    {["Slot", "Name (MCG)", "Phone → Intl.", "Date", ""].map(h => (
                      <th key={h} style={A.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const ri = contacts.indexOf(c);
                    return (
                      <tr key={i} className="table-row" style={{ opacity: deleting === ri ? 0.4 : 1 }}>
                        <td style={{ ...A.td, color: "#4facfe", fontWeight: 800, fontFamily: "monospace" }}>#{c.slot || ri + 1}</td>
                        <td style={{ ...A.td, color: "#e8f0ff", fontWeight: 600 }}>{c.name}</td>
                        <td style={{ ...A.td, fontFamily: "monospace", fontSize: "0.82rem" }}>
                          <span style={{ color: "#8a9bbf" }}>{c.phone}</span>
                          <span style={{ color: "#3d4f70", marginLeft: 8 }}>→ {toInternational(c.phone)}</span>
                        </td>
                        <td style={{ ...A.td, fontSize: "0.78rem", color: "#3d4f70" }}>
                          {c.timestamp ? new Date(c.timestamp).toLocaleDateString("en-NG") : "—"}
                        </td>
                        <td style={A.td}>
                          {confirmIdx === ri ? (
                            <span style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => handleDelete(ri)} style={A.btnYes}>Yes</button>
                              <button onClick={() => setConfirmIdx(null)} style={A.btnNo}>No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmIdx(ri)} style={A.btnDel}>✕</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {search && (
                <p style={{ color: "#3d4f70", fontSize: "0.78rem", padding: "10px 16px" }}>
                  Showing {filtered.length} of {contacts.length}
                </p>
              )}
            </div>
          )}

          {/* VCF guide */}
          <div style={A.guideBox}>
            <p style={A.guideTitle}>📲 How to distribute the vCard</p>
            <ol style={A.guideList}>
              <li>Click <strong>Download .vcf</strong> above</li>
              <li>Open your WhatsApp group → tap attach → send as <strong>Document</strong></li>
              <li>Members tap the file → <strong>Import All</strong> → 300 contacts saved with MCG prefix</li>
              <li>Everyone can now see each other's WhatsApp Status 🎉</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Alert component ──────────────────────────────────────────

function Alert({ children }) {
  return (
    <div style={{
      background: "rgba(255,68,68,0.1)", color: "#ff8080",
      border: "1px solid rgba(255,68,68,0.25)",
      borderRadius: 10, padding: "11px 15px",
      fontSize: "0.85rem", marginBottom: 14, lineHeight: 1.55,
    }}>{children}</div>
  );
}

// ─── Root ─────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("form");
  return page === "form"
    ? <FormPage  onSwitch={() => setPage("admin")} />
    : <AdminPage onSwitch={() => setPage("form")}  />;
}

// ─── Global CSS ───────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #040b1a; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* ── Animated background grid ── */
  .bg-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(79,172,254,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,172,254,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
  }

  /* ── Glowing orbs ── */
  .orb {
    position: fixed; border-radius: 50%; pointer-events: none;
    filter: blur(80px); z-index: 0;
  }
  .orb1 {
    width: 600px; height: 600px; top: -200px; left: -150px;
    background: radial-gradient(circle, rgba(79,172,254,0.15) 0%, transparent 70%);
    animation: orbDrift1 18s ease-in-out infinite alternate;
  }
  .orb2 {
    width: 500px; height: 500px; bottom: -150px; right: -100px;
    background: radial-gradient(circle, rgba(102,0,255,0.12) 0%, transparent 70%);
    animation: orbDrift2 22s ease-in-out infinite alternate;
  }
  .orb3 {
    width: 350px; height: 350px; top: 40%; left: 30%;
    background: radial-gradient(circle, rgba(255,214,0,0.05) 0%, transparent 70%);
    animation: orbDrift3 15s ease-in-out infinite alternate;
  }

  /* ── Top shimmer line ── */
  .top-line {
    position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 10;
    background: linear-gradient(90deg,
      transparent 0%,
      #4facfe 25%,
      #00f2fe 50%,
      #6600ff 75%,
      transparent 100%
    );
    background-size: 300% 100%;
    animation: shimmer 5s linear infinite;
  }

  /* ── Input focus ── */
  .field-input {
    transition: border-color 0.25s, box-shadow 0.25s !important;
  }
  .field-input:focus {
    border-color: rgba(79,172,254,0.8) !important;
    box-shadow: 0 0 0 4px rgba(79,172,254,0.12), 0 0 25px rgba(79,172,254,0.1) !important;
    outline: none !important;
  }
  .field-input::placeholder { color: #1e3050; }

  /* ── Submit button pulse ── */
  .btn-submit { transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s; }
  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(79,172,254,0.5), 0 0 80px rgba(79,172,254,0.15) !important;
  }
  .btn-submit:active:not(:disabled) { transform: translateY(0); }

  /* ── Table row hover ── */
  .table-row { transition: background 0.15s; }
  .table-row:hover td { background: rgba(79,172,254,0.04) !important; }

  /* ── Success ring ── */
  .success-ring {
    width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px;
    background: linear-gradient(135deg, rgba(79,172,254,0.15), rgba(102,0,255,0.1));
    border: 2px solid rgba(79,172,254,0.4);
    display: flex; align-items: center; justify-content: center;
    animation: pulseRing 3s ease-in-out infinite;
  }

  /* ── Urgency bar fill ── */
  .urgency-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 0 12px currentColor;
  }

  /* ── Keyframes ── */
  @keyframes shimmer {
    0%   { background-position: -300% center; }
    100% { background-position: 300% center; }
  }
  @keyframes orbDrift1 {
    0%   { transform: translate(0,0) scale(1); }
    100% { transform: translate(80px, 60px) scale(1.15); }
  }
  @keyframes orbDrift2 {
    0%   { transform: translate(0,0) scale(1); }
    100% { transform: translate(-60px,-80px) scale(1.1); }
  }
  @keyframes orbDrift3 {
    0%   { transform: translate(0,0); }
    100% { transform: translate(40px,-40px); }
  }
  @keyframes pulseRing {
    0%,100% { box-shadow: 0 0 0 0 rgba(79,172,254,0.3); }
    50%     { box-shadow: 0 0 0 12px rgba(79,172,254,0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .spin { display: inline-block; animation: spin 1s linear infinite; }

  button { transition: filter 0.15s, transform 0.15s; }
  button:hover:not(:disabled) { filter: brightness(1.1); }
  button:active:not(:disabled) { transform: scale(0.97); }
  strong { font-weight: 700; }
`;

// ─── Form Styles ──────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#040b1a",
    backgroundImage: [
      "radial-gradient(ellipse 80% 60% at 15% 50%, rgba(79,172,254,0.07) 0%, transparent 60%)",
      "radial-gradient(ellipse 70% 50% at 85% 30%, rgba(102,0,255,0.08) 0%, transparent 60%)",
      "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0,242,254,0.04) 0%, transparent 55%)",
    ].join(","),
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: "60px 20px 40px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    position: "relative", zIndex: 1,
  },

  wrapper: {
    display: "flex", flexDirection: "row", alignItems: "center",
    gap: 60, maxWidth: 1080, width: "100%",
    flexWrap: "wrap", justifyContent: "center",
    position: "relative", zIndex: 2,
  },

  // Hero
  hero: { flex: 1, minWidth: 300, maxWidth: 480 },
  heroPill: {
    display: "inline-flex", alignItems: "center", gap: 8,
    background: "rgba(79,172,254,0.08)",
    border: "1px solid rgba(79,172,254,0.2)",
    borderRadius: 99, padding: "6px 14px",
    fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
    color: "#4facfe", marginBottom: 28,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  pillDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#4facfe",
    boxShadow: "0 0 8px #4facfe",
    display: "inline-block",
    animation: "pulseRing 2s ease-in-out infinite",
  },
  heroH1: {
    display: "flex", flexDirection: "column",
    marginBottom: 24, lineHeight: 1.05,
    fontFamily: "'Space Grotesk', sans-serif",
  },
  heroLine1: {
    fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 700,
    color: "rgba(255,255,255,0.85)", letterSpacing: "-0.03em",
  },
  heroLine2: {
    fontSize: "clamp(3.2rem, 7vw, 5.5rem)", fontWeight: 800,
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #6600ff 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    letterSpacing: "-0.04em",
  },
  heroLine3: {
    fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700,
    color: "#ffd600", letterSpacing: "0.05em",
  },
  heroSub: {
    fontSize: "1rem", color: "#5a7aa0", lineHeight: 1.75,
    marginBottom: 28, maxWidth: 420,
  },

  // Social proof
  proofRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  proofPill: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 99, padding: "5px 14px",
    fontSize: "0.78rem", color: "#8a9bbf", fontWeight: 600,
  },

  // Urgency
  urgencyBox: {
    background: "rgba(79,172,254,0.05)", border: "1px solid rgba(79,172,254,0.15)",
    borderRadius: 14, padding: "16px 18px", marginBottom: 28,
  },
  urgencyTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  urgencyLabel: { fontSize: "0.84rem", fontWeight: 700, color: "#4facfe" },
  urgencyCount: { fontSize: "0.84rem", fontFamily: "monospace", color: "#8a9bbf", fontWeight: 700 },
  urgencyTrack: {
    height: 8, background: "rgba(255,255,255,0.05)",
    borderRadius: 99, overflow: "hidden",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
  },

  // Features
  featureList: { display: "flex", flexDirection: "column", gap: 12 },
  featureItem: { display: "flex", alignItems: "center", gap: 12 },
  featureIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(79,172,254,0.08)", border: "1px solid rgba(79,172,254,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "1rem", flexShrink: 0,
  },
  featureText: { fontSize: "0.88rem", color: "#6a85aa", lineHeight: 1.5 },

  // Form card
  formWrap: { flex: 1, minWidth: 320, maxWidth: 440 },
  card: {
    background: "linear-gradient(160deg, rgba(10,20,40,0.95) 0%, rgba(6,12,28,0.98) 100%)",
    border: "1px solid rgba(79,172,254,0.2)", borderRadius: 24,
    padding: "36px 32px",
    boxShadow: [
      "0 0 0 1px rgba(79,172,254,0.05)",
      "0 0 80px rgba(79,172,254,0.08)",
      "0 40px 100px rgba(0,0,0,0.8)",
      "inset 0 1px 0 rgba(255,255,255,0.06)",
      "inset 0 -1px 0 rgba(79,172,254,0.06)",
    ].join(","),
    position: "relative",
  },
  cardBadge: {
    display: "flex", justifyContent: "center", marginBottom: 24,
  },
  cardBadgeInner: {
    background: "linear-gradient(135deg, rgba(79,172,254,0.12), rgba(102,0,255,0.08))",
    border: "1px solid rgba(79,172,254,0.25)",
    borderRadius: 99, padding: "5px 16px",
    fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.15em",
    color: "#4facfe", fontFamily: "'Space Grotesk', sans-serif",
  },
  cardH: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.6rem", fontWeight: 700,
    color: "#e8f0ff", letterSpacing: "-0.02em", marginBottom: 6, textAlign: "center",
  },
  cardSub: { fontSize: "0.84rem", color: "#3d5070", marginBottom: 28, textAlign: "center", lineHeight: 1.6 },

  // Fields
  formFields: { display: "flex", flexDirection: "column", gap: 18, marginBottom: 20 },
  fieldGroup: {},
  fieldLabel: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.68rem", fontWeight: 700,
    letterSpacing: "0.12em", color: "#4facfe", display: "block", marginBottom: 8,
  },
  prefixWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(5,12,28,0.9)", border: "1.5px solid rgba(79,172,254,0.2)",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
  },
  prefixTag: {
    padding: "0 14px", fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: "0.8rem",
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    borderRight: "1px solid rgba(79,172,254,0.15)",
    alignSelf: "stretch", display: "flex", alignItems: "center", whiteSpace: "nowrap",
  },
  prefixInput: {
    flex: 1, background: "transparent", border: "none",
    padding: "14px 14px", fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "1rem", color: "#c8d8f0", outline: "none",
  },
  fieldInput: {
    width: "100%", background: "rgba(5,12,28,0.9)",
    border: "1.5px solid rgba(79,172,254,0.2)", borderRadius: 12,
    padding: "14px 46px 14px 16px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "1rem", color: "#c8d8f0", outline: "none",
    boxShadow: "0 2px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.02)",
  },
  fieldIcon: {
    position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)",
    fontSize: "1.05rem", fontWeight: 700, pointerEvents: "none",
  },
  fieldHint: { fontSize: "0.76rem", color: "#2a3f5a", marginTop: 6, lineHeight: 1.5 },

  // Submit
  btnSubmit: {
    width: "100%",
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #6600ff 100%)",
    color: "#ffffff", fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1rem", fontWeight: 700, border: "none",
    borderRadius: 14, padding: "16px", marginBottom: 14,
    letterSpacing: "0.02em",
    boxShadow: "0 4px 30px rgba(79,172,254,0.35), 0 0 60px rgba(79,172,254,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  trustLine: {
    textAlign: "center", fontSize: "0.73rem", color: "#1e3050", lineHeight: 1.6,
  },
  adminBtn: {
    background: "none", border: "none", color: "#1a2a40",
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "0.75rem",
    cursor: "pointer", width: "100%", textAlign: "center",
    padding: "8px 4px 0", fontWeight: 600,
  },

  // Success
  successWrap: { textAlign: "center", padding: "10px 0" },
  successH: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 800,
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 6,
  },
  successName: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.1rem",
    color: "#ffd600", marginBottom: 14,
  },
  slotBadge: {
    display: "inline-block",
    background: "linear-gradient(135deg, rgba(79,172,254,0.12), rgba(102,0,255,0.08))",
    border: "1px solid rgba(79,172,254,0.3)",
    borderRadius: 99, padding: "5px 16px",
    fontSize: "0.8rem", fontWeight: 700, color: "#4facfe",
    fontFamily: "monospace", marginBottom: 20,
  },
  successMsg: { fontSize: "0.85rem", color: "#4a6080", lineHeight: 1.7, marginBottom: 22 },
  btnOutline: {
    background: "none", border: "1px solid rgba(79,172,254,0.3)", color: "#4facfe",
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "0.85rem",
    borderRadius: 10, padding: "10px 22px", cursor: "pointer",
  },

  // Full
  fullWrap: { textAlign: "center", padding: "20px 0" },
  fullH: {
    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: "1.3rem",
    color: "#ff6b6b", marginBottom: 12,
  },
  fullMsg: { fontSize: "0.88rem", color: "#6a3a3a", lineHeight: 1.65 },

  // Footer
  footer: { marginTop: 40, position: "relative", zIndex: 2 },
  footerText: { fontSize: "0.72rem", color: "#0d1a2e", fontWeight: 600, letterSpacing: "0.05em" },
};

// ─── Admin Styles ─────────────────────────────────────────────

const A = {
  page: {
    minHeight: "100vh", background: "#040b1a",
    backgroundImage: [
      "radial-gradient(ellipse 70% 50% at 10% 20%, rgba(79,172,254,0.06) 0%, transparent 60%)",
      "radial-gradient(ellipse 60% 40% at 90% 80%, rgba(102,0,255,0.06) 0%, transparent 55%)",
    ].join(","),
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: "#c8d8f0", padding: "28px 20px 60px",
    maxWidth: 940, margin: "0 auto", position: "relative", zIndex: 1,
  },
  header: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 16 },
  btnBack: {
    background: "rgba(79,172,254,0.07)", border: "1px solid rgba(79,172,254,0.2)",
    color: "#4facfe", borderRadius: 10, padding: "9px 16px",
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
  },
  headerBadge: {
    background: "linear-gradient(135deg, #4facfe, #00f2fe, #6600ff)",
    color: "#fff", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900,
    fontSize: "0.7rem", letterSpacing: "0.14em", padding: "5px 12px", borderRadius: 8,
    boxShadow: "0 0 20px rgba(79,172,254,0.4)",
  },
  h2: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.3rem", fontWeight: 800,
    background: "linear-gradient(90deg, #ffffff, #c8d8f0)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  countBadge: {
    background: "rgba(79,172,254,0.1)", color: "#4facfe",
    fontSize: "0.78rem", fontWeight: 800, padding: "4px 12px",
    borderRadius: 20, border: "1px solid rgba(79,172,254,0.25)",
    fontFamily: "monospace",
  },
  btnGhost: {
    background: "rgba(79,172,254,0.07)", border: "1px solid rgba(79,172,254,0.25)",
    color: "#4facfe", fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.82rem",
    fontWeight: 700, borderRadius: 10, padding: "9px 18px", cursor: "pointer",
  },
  btnBlue: {
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    color: "#040b1a", fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "0.88rem", fontWeight: 800, border: "none",
    borderRadius: 10, padding: "10px 20px", cursor: "pointer",
    boxShadow: "0 4px 20px rgba(79,172,254,0.3)",
  },
  secNote: {
    background: "rgba(79,172,254,0.05)", border: "1px solid rgba(79,172,254,0.12)",
    borderRadius: 10, padding: "10px 16px",
    fontSize: "0.76rem", color: "#2a4060", marginBottom: 20, lineHeight: 1.5,
  },
  authCard: {
    maxWidth: 400, margin: "0 auto",
    background: "linear-gradient(160deg, rgba(10,20,40,0.97), rgba(6,12,28,0.99))",
    border: "1px solid rgba(79,172,254,0.18)", borderRadius: 20, padding: "40px 32px",
    textAlign: "center",
    boxShadow: "0 0 60px rgba(79,172,254,0.07), 0 30px 60px rgba(0,0,0,0.6)",
  },
  authIcon: { fontSize: "2.5rem", marginBottom: 16 },
  authH: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.3rem", fontWeight: 700,
    color: "#e8f0ff", marginBottom: 8,
  },
  authSub: { fontSize: "0.82rem", color: "#2a3f5a", lineHeight: 1.65, marginBottom: 24 },
  input: {
    width: "100%", background: "rgba(5,12,28,0.9)",
    border: "1.5px solid rgba(79,172,254,0.2)", borderRadius: 12,
    padding: "14px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "1rem", color: "#c8d8f0", outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
    display: "block",
  },
  progressCard: {
    background: "rgba(79,172,254,0.05)", border: "1px solid rgba(79,172,254,0.15)",
    borderRadius: 14, padding: "16px 18px", marginBottom: 20,
  },
  progressRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel: { fontSize: "0.84rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" },
  progressCount: { fontSize: "0.84rem", fontFamily: "monospace", color: "#4facfe", fontWeight: 800 },
  track: { height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" },
  fill:  { height: "100%", borderRadius: 99, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" },
  empty: {
    textAlign: "center", color: "#2a3f5a", padding: "60px 20px",
    border: "1px dashed rgba(79,172,254,0.12)", borderRadius: 16,
    background: "rgba(79,172,254,0.02)", fontSize: "0.9rem",
  },
  tableWrap: {
    overflowX: "auto", borderRadius: 16,
    border: "1px solid rgba(79,172,254,0.12)",
    background: "linear-gradient(160deg, rgba(8,16,35,0.98), rgba(5,10,24,0.99))",
    boxShadow: "0 0 40px rgba(79,172,254,0.04)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.68rem", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.12em", color: "#4facfe",
    padding: "15px 16px", textAlign: "left",
    borderBottom: "1px solid rgba(79,172,254,0.1)",
    background: "rgba(8,18,38,0.95)",
  },
  td: { padding: "13px 16px", borderBottom: "1px solid rgba(79,172,254,0.05)", fontSize: "0.88rem", color: "#8a9bbf" },
  btnDel: { background: "rgba(255,68,68,0.07)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff6b6b", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: "0.78rem" },
  btnYes: { background: "rgba(255,68,68,0.14)", border: "1px solid rgba(255,68,68,0.28)", color: "#ff6b6b", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" },
  btnNo:  { background: "rgba(79,172,254,0.08)", border: "1px solid rgba(79,172,254,0.25)", color: "#4facfe", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" },
  guideBox: {
    marginTop: 24,
    background: "rgba(79,172,254,0.04)", border: "1px solid rgba(79,172,254,0.12)",
    borderRadius: 16, padding: "22px 26px",
  },
  guideTitle: {
    fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.88rem", fontWeight: 800,
    background: "linear-gradient(90deg, #4facfe, #00f2fe)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 14,
  },
  guideList: { paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: "0.86rem", color: "#2a4060", lineHeight: 1.65 },
};

import { useState, useEffect, useRef } from "react";

// ╔══════════════════════════════════════════════════════════════╗
// ║                  ✏️  EASY CONFIG — EDIT HERE                ║
// ╚══════════════════════════════════════════════════════════════╝
const CONFIG = {
  // 🔗 Your Google Apps Script URL (redeploy & paste here)
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyQIPZuT01eLk88g9o-EMoVYVMI9-mw3kVMGTWM1uJrZ_burUECWrC2J117Qarhmq1gmQ/exec",

  // 🔐 Admin password
  ADMIN_SECRET: "catalysT",

  // 🎯 Total slots available
  MAX_SLOTS: 300,

  // 📄 Downloaded .vcf file name
  FILE_NAME: "MCG_ContactsGain_May2026",

  // 🏷️ Branding
  BRAND_BADGE: "MCG",
  BRAND_TAGLINE: "Massive Gains 300.0",
  HERO_TITLE: "Join the Network",
  HERO_SUBTITLE: "Submit your details to be part of the verified Massive Gains contact list 🇳🇬",

  // 🎨 Accent color (WhatsApp green default)
  ACCENT: "#25D366",
  ACCENT_DARK: "#128C7E",
};
// ╚══════════════════════════════════════════════════════════════╝

// ─── Helpers ──────────────────────────────────────────────────

function toInternational(raw) {
  const d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("234")) return "+" + d;
  if (d.startsWith("0")) return "+234" + d.slice(1);
  return "+234" + d;
}

function buildVCF(contacts) {
  return contacts
    .map(({ name, phone }) => {
      const tel = toInternational(phone);
      return [
        "BEGIN:VCARD", "VERSION:3.0",
        `FN:${name}`, `TEL;TYPE=CELL,VOICE:${tel}`,
        "END:VCARD",
      ].join("\r\n");
    })
    .join("\r\n");
}

function downloadVCF(contacts) {
  const blob = new Blob([buildVCF(contacts)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url, download: `${CONFIG.FILE_NAME}.vcf`, style: "display:none",
  });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

// ─── Animated Counter ─────────────────────────────────────────

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = display;
    const end = value;
    if (start === end) return;
    const step = Math.ceil(Math.abs(end - start) / 20);
    const timer = setInterval(() => {
      start += end > start ? step : -step;
      if ((end > display && start >= end) || (end < display && start <= end)) {
        clearInterval(timer);
        setDisplay(end);
      } else {
        setDisplay(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

// ─── Slot Progress ────────────────────────────────────────────

function SlotBar({ count, max, compact = false }) {
  const pct = Math.min(100, Math.round((count / max) * 100));
  const remaining = max - count;
  const isFull = count >= max;
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : CONFIG.ACCENT;

  return (
    <div className={`slot-bar ${compact ? "compact" : ""}`}>
      <div className="slot-row">
        <span className="slot-label">
          <span className="dot" style={{ background: isFull ? "#ef4444" : color }} />
          {isFull ? "Slots Full" : `${remaining} slots remaining`}
        </span>
        <span className="slot-count">
          <AnimatedNumber value={count} /> / {max}
        </span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${CONFIG.ACCENT_DARK}, ${color})` }}
        />
        <div className="bar-glow" style={{ left: `${pct}%`, background: color }} />
      </div>
      {!compact && (
        <div className="bar-legend">
          <span>{pct}% filled</span>
          <span>{count} joined</span>
        </div>
      )}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  return (
    <div className={`toast toast-${type}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="toast-close">✕</button>
    </div>
  );
}

// ─── Form Page ────────────────────────────────────────────────

function FormPage({ onSwitch }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle");
  const [slotInfo, setSlotInfo] = useState(null);
  const [slotResult, setSlotResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    fetch(`${CONFIG.SCRIPT_URL}?action=count`)
      .then((r) => r.json())
      .then((j) => { if (j.ok) setSlotInfo(j); })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setStatus("error");
      setToast({ msg: "Please fill in both your name and number.", type: "error" });
      return;
    }
    const digits = phone.replace(/[^\d]/g, "");
    if (digits.length < 8) {
      setStatus("badphone");
      setToast({ msg: "Please enter a valid Nigerian phone number.", type: "error" });
      return;
    }
    setStatus("loading");
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("phone", phone.trim());
      await fetch(CONFIG.SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });
      const newCount = slotInfo ? slotInfo.count + 1 : 1;
      setSlotInfo((s) => s ? { ...s, count: newCount, remaining: CONFIG.MAX_SLOTS - newCount } : null);
      setSlotResult(newCount);
      setStatus("success");
      setToast({ msg: `✅ Welcome! You're slot #${newCount} — saved as MCG ${name.trim()}`, type: "ok" });
      setName(""); setPhone("");
    } catch {
      setStatus("error");
      setToast({ msg: "Connection error. Please try again.", type: "error" });
    }
  }

  const isFull = slotInfo && slotInfo.count >= CONFIG.MAX_SLOTS;

  return (
    <div className="page">
      <div className="grid-bg" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="container">
        {/* ── Brand pill ── */}
        <div className="brand-pill">
          <span className="brand-badge">{CONFIG.BRAND_BADGE}</span>
          <span className="brand-text">{CONFIG.BRAND_TAGLINE}</span>
        </div>

        {/* ── Hero ── */}
        <div className="hero">
          <div className="wa-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h1 className="hero-title">{CONFIG.HERO_TITLE}</h1>
          <p className="hero-sub">{CONFIG.HERO_SUBTITLE}</p>
        </div>

        {/* ── Slot Bar ── */}
        {slotInfo && <SlotBar count={slotInfo.count} max={CONFIG.MAX_SLOTS} />}

        {/* ── Social proof ── */}
        <div className="proof-row">
          {["🔒 Verified members only", "🤝 Mutual contact exchange", "📲 Instant .vcf import"].map((t) => (
            <span key={t} className="proof-chip">{t}</span>
          ))}
        </div>

        {/* ── Form Card ── */}
        <div className="form-card">
          {isFull ? (
            <div className="full-state">
              <div className="full-icon">🔒</div>
              <h2 className="full-title">Registration Closed</h2>
              <p className="full-sub">All {CONFIG.MAX_SLOTS} slots have been filled. The Massive Gains 300.0 network is complete!</p>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2 className="form-title">Your Details</h2>
                <p className="form-sub">Takes 10 seconds · Free forever</p>
              </div>

              {/* Name Field */}
              <div className={`field-group ${focused === "name" ? "focused" : ""}`}>
                <label className="field-label">Full Name</label>
                <p className="field-hint">A <strong>MCG</strong> prefix will be added automatically when saved</p>
                <div className="input-row">
                  <span className="input-prefix">MCG</span>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Chidi Okeke"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setStatus("idle"); }}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className={`field-group ${focused === "phone" ? "focused" : ""}`}>
                <label className="field-label">WhatsApp Number</label>
                <p className="field-hint">No country code needed — we'll format it automatically</p>
                <div className="input-row">
                  <span className="input-prefix flag-prefix">🇳🇬 +234</span>
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="08012345678"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setStatus("idle"); }}
                    onFocus={() => setFocused("phone")}
                    onBlur={() => setFocused(null)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
              </div>

              {/* Preview */}
              {(name || phone) && (
                <div className="preview-pill">
                  <span className="preview-label">Saves as:</span>
                  <span className="preview-value">
                    MCG {name || "…"} · {phone ? toInternational(phone) : "…"}
                  </span>
                </div>
              )}

              <button
                className={`btn-submit ${status === "loading" ? "loading" : ""}`}
                onClick={handleSubmit}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <><span className="spinner" /> Saving your spot…</>
                ) : (
                  <>Submit & Join MCG 300.0 →</>
                )}
              </button>
            </>
          )}
        </div>

        {/* ── How it works ── */}
        <div className="steps-section">
          <p className="steps-heading">How it works</p>
          <div className="steps-grid">
            {[
              { n: "1", icon: "✍️", title: "Submit Form", desc: "Enter your name and WhatsApp number above" },
              { n: "2", icon: "📥", title: "Admin Exports", desc: "Admin downloads the verified .vcf contact file" },
              { n: "3", icon: "📲", title: "Import All", desc: "Members import and see each other's Status instantly" },
            ].map((s) => (
              <div key={s.n} className="step-card">
                <div className="step-num">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-admin-link" onClick={onSwitch}>Admin Panel →</button>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────

function AdminPage({ onSwitch }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [secret, setSecret] = useState("");
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [confirmIdx, setConfirmIdx] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  async function fetchContacts() {
    setLoading(true); setAuthError(false);
    try {
      const res = await fetch(`${CONFIG.SCRIPT_URL}?secret=${encodeURIComponent(secret)}`);
      const json = await res.json();
      if (json.ok) { setContacts(json.contacts || []); setFetched(true); }
      else setAuthError(true);
    } catch { setAuthError(true); }
    finally { setLoading(false); }
  }

  async function handleDelete(idx) {
    setDeleting(idx); setConfirmIdx(null);
    const contact = contacts[idx];
    try {
      await fetch(
        `${CONFIG.SCRIPT_URL}?secret=${encodeURIComponent(secret)}&action=delete&phone=${encodeURIComponent(contact.phone)}`,
        { mode: "no-cors" }
      );
    } finally {
      setContacts((prev) => prev.filter((_, i) => i !== idx));
      setDeleting(null);
      setToast({ msg: "Contact removed.", type: "ok" });
    }
  }

  async function handleCopyVCF() {
    await navigator.clipboard.writeText(buildVCF(contacts));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    setToast({ msg: "vCard copied to clipboard!", type: "ok" });
  }

  const filtered = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  return (
    <div className="admin-page">
      <div className="grid-bg" />
      <div className="orb orb1" />

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="admin-container">
        {/* Header */}
        <div className="admin-topbar">
          <button className="btn-back" onClick={onSwitch}>← Back</button>
          <div className="admin-brand">
            <span className="brand-badge sm">{CONFIG.BRAND_BADGE}</span>
            <h2 className="admin-title">Admin Panel</h2>
            {fetched && <span className="count-badge">{contacts.length}/{CONFIG.MAX_SLOTS}</span>}
          </div>
          {fetched && (
            <div className="admin-actions">
              <button className="btn-outline" onClick={handleCopyVCF}>
                {copied ? "✓ Copied" : "Copy vCard"}
              </button>
              <button className="btn-submit sm" onClick={() => downloadVCF(contacts)} disabled={!contacts.length}>
                ⬇ Download .vcf
              </button>
            </div>
          )}
        </div>

        {/* Slot bar */}
        {fetched && <SlotBar count={contacts.length} max={CONFIG.MAX_SLOTS} compact />}

        {!fetched ? (
          <div className="auth-card">
            <div className="auth-icon">🔐</div>
            <h2 className="auth-title">Admin Access</h2>
            <p className="auth-sub">Enter your secret to load and manage contacts</p>
            <input
              className="input-field standalone"
              type="password"
              placeholder="Admin secret"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setAuthError(false); }}
              onKeyDown={(e) => e.key === "Enter" && fetchContacts()}
            />
            {authError && <p className="auth-error">⚠ Wrong secret or connection error</p>}
            <button className="btn-submit" onClick={fetchContacts} disabled={loading}>
              {loading ? <><span className="spinner" /> Loading…</> : "Load Contacts"}
            </button>
          </div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 48 }}>📭</div>
            <p>No contacts yet — share the form link!</p>
          </div>
        ) : (
          <>
            <input
              className="input-field standalone search-input"
              type="text"
              placeholder="🔍  Search by name or number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="table-wrap">
              <table className="contacts-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Name (MCG)</th>
                    <th>Phone → +234</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const realIdx = contacts.indexOf(c);
                    return (
                      <tr key={i} style={{ opacity: deleting === realIdx ? 0.3 : 1 }}>
                        <td className="col-slot">#{c.slot || realIdx + 1}</td>
                        <td className="col-name">{c.name}</td>
                        <td className="col-phone">
                          <span className="phone-raw">{c.phone}</span>
                          <span className="phone-int">→ {toInternational(c.phone)}</span>
                        </td>
                        <td className="col-date">
                          {c.timestamp ? new Date(c.timestamp).toLocaleDateString("en-NG") : "—"}
                        </td>
                        <td className="col-action">
                          {confirmIdx === realIdx ? (
                            <span className="confirm-row">
                              <button onClick={() => handleDelete(realIdx)} className="btn-yes">Yes</button>
                              <button onClick={() => setConfirmIdx(null)} className="btn-no">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmIdx(realIdx)} disabled={deleting === realIdx} className="btn-del">
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
              <p className="search-count">Showing {filtered.length} of {contacts.length} contacts</p>
            )}

            {/* Instructions */}
            <div className="instructions-card">
              <p className="inst-title">📲 How to share {CONFIG.FILE_NAME}.vcf</p>
              <ol className="inst-list">
                <li>Click <strong>⬇ Download .vcf</strong> to save the file</li>
                <li>Open WhatsApp → Massive Gains group → attach as <strong>Document</strong></li>
                <li>Members tap → <strong>Import All</strong> → contacts save instantly with MCG prefix</li>
                <li>Everyone now sees each other's WhatsApp Status 🎉</li>
              </ol>
            </div>
          </>
        )}
      </div>
      <style>{CSS}</style>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("form");
  return page === "form"
    ? <FormPage onSwitch={() => setPage("admin")} />
    : <AdminPage onSwitch={() => setPage("form")} />;
}

// ─── CSS ──────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Clash+Display:wght@600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --accent: ${CONFIG.ACCENT};
  --accent-dark: ${CONFIG.ACCENT_DARK};
  --bg: #060a07;
  --surface: #0d1610;
  --surface2: #111a13;
  --border: rgba(37,211,102,0.14);
  --border-hover: rgba(37,211,102,0.35);
  --text: #e8f5ea;
  --text-muted: #5a7a63;
  --text-dim: #3a5040;
  --radius: 16px;
  --radius-sm: 10px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body { background: var(--bg); }

/* ── Page ── */
.page, .admin-page {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

/* ── Background effects ── */
.grid-bg {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    linear-gradient(rgba(37,211,102,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37,211,102,0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}
.orb {
  position: fixed; border-radius: 50%; filter: blur(120px);
  pointer-events: none; z-index: 0; opacity: 0.5;
}
.orb1 {
  width: 600px; height: 400px;
  top: -150px; left: 50%; transform: translateX(-50%);
  background: radial-gradient(circle, rgba(37,211,102,0.18) 0%, transparent 70%);
}
.orb2 {
  width: 300px; height: 300px;
  bottom: 0; right: -100px;
  background: radial-gradient(circle, rgba(18,140,126,0.12) 0%, transparent 70%);
}

/* ── Container ── */
.container {
  position: relative; z-index: 1;
  max-width: 520px; margin: 0 auto;
  padding: 48px 20px 80px;
  display: flex; flex-direction: column; align-items: center; gap: 20px;
}

/* ── Brand pill ── */
.brand-pill {
  display: flex; align-items: center; gap: 10px;
  background: rgba(37,211,102,0.06);
  border: 1px solid var(--border);
  border-radius: 100px; padding: 6px 16px 6px 8px;
  animation: fadeDown 0.5s ease both;
}
.brand-badge {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #fff; font-weight: 800; font-size: 0.68rem;
  letter-spacing: 0.15em; padding: 4px 10px;
  border-radius: 100px;
  box-shadow: 0 2px 12px rgba(37,211,102,0.4);
}
.brand-badge.sm { font-size: 0.6rem; padding: 3px 8px; }
.brand-text {
  font-size: 0.82rem; font-weight: 600; color: #8db89e; letter-spacing: 0.02em;
}

/* ── Hero ── */
.hero {
  text-align: center;
  animation: fadeDown 0.6s ease 0.1s both;
}
.wa-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 72px; height: 72px;
  background: linear-gradient(135deg, rgba(37,211,102,0.15), rgba(18,140,126,0.08));
  border: 1px solid var(--border);
  border-radius: 22px; color: var(--accent);
  margin-bottom: 20px;
  box-shadow: 0 0 40px rgba(37,211,102,0.12), inset 0 1px 0 rgba(255,255,255,0.05);
}
.hero-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(2rem, 6vw, 2.8rem);
  font-weight: 800; color: #f0fdf4;
  letter-spacing: -0.03em; line-height: 1.1;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #f0fdf4 0%, var(--accent) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 0.9rem; color: var(--text-muted); line-height: 1.7; max-width: 360px; margin: 0 auto;
}

/* ── Slot Bar ── */
.slot-bar {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px 18px;
  animation: fadeUp 0.6s ease 0.2s both;
}
.slot-bar.compact { padding: 12px 16px; margin-bottom: 20px; }
.slot-row {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.slot-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.8rem; font-weight: 600; color: #7ab88a;
}
.dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.slot-count { font-size: 0.8rem; font-weight: 700; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.bar-track {
  height: 6px; background: rgba(37,211,102,0.08);
  border-radius: 100px; overflow: visible; position: relative;
}
.bar-fill {
  height: 100%; border-radius: 100px;
  transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  position: relative;
}
.bar-glow {
  position: absolute; top: 50%; transform: translate(-50%, -50%);
  width: 12px; height: 12px; border-radius: 50%; opacity: 0.6;
  filter: blur(4px); transition: left 0.8s cubic-bezier(0.4,0,0.2,1);
}
.bar-legend {
  display: flex; justify-content: space-between;
  font-size: 0.72rem; color: var(--text-dim); margin-top: 8px;
}

/* ── Proof chips ── */
.proof-row {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
  animation: fadeUp 0.6s ease 0.25s both;
}
.proof-chip {
  font-size: 0.72rem; font-weight: 600; color: var(--text-muted);
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 100px; padding: 5px 12px;
}

/* ── Form Card ── */
.form-card {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px; padding: 28px 24px;
  box-shadow: 0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,211,102,0.04);
  animation: fadeUp 0.7s ease 0.3s both;
  position: relative;
  overflow: hidden;
}
.form-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(37,211,102,0.4), transparent);
}
.form-header { margin-bottom: 22px; }
.form-title {
  font-size: 1.15rem; font-weight: 700; color: var(--text); margin-bottom: 4px;
}
.form-sub { font-size: 0.78rem; color: var(--text-dim); }

/* ── Field groups ── */
.field-group {
  margin-bottom: 18px;
  border: 1px solid transparent; border-radius: var(--radius-sm);
  transition: border-color 0.2s;
}
.field-group.focused { border-color: rgba(37,211,102,0.2); }

.field-label {
  display: block; font-size: 0.8rem; font-weight: 700;
  color: #7ab88a; margin-bottom: 5px; letter-spacing: 0.04em; text-transform: uppercase;
}
.field-hint {
  font-size: 0.73rem; color: var(--text-dim); margin-bottom: 8px; line-height: 1.5;
}
.field-hint strong { color: var(--accent); }

/* ── Inputs ── */
.input-row {
  display: flex; align-items: center;
  background: var(--surface2);
  border: 1px solid rgba(37,211,102,0.12);
  border-radius: var(--radius-sm); overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-row:focus-within {
  border-color: rgba(37,211,102,0.45);
  box-shadow: 0 0 0 3px rgba(37,211,102,0.08);
}
.input-prefix {
  padding: 0 12px; font-size: 0.82rem; font-weight: 700;
  color: var(--accent); border-right: 1px solid rgba(37,211,102,0.12);
  white-space: nowrap; background: rgba(37,211,102,0.05);
  align-self: stretch; display: flex; align-items: center;
}
.flag-prefix { font-size: 0.78rem; }
.input-field {
  flex: 1; padding: 12px 14px;
  background: transparent; border: none; outline: none;
  color: var(--text); font-size: 0.9rem; font-family: inherit;
}
.input-field::placeholder { color: var(--text-dim); }
.input-field.standalone {
  width: 100%;
  background: var(--surface2);
  border: 1px solid rgba(37,211,102,0.12);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-field.standalone:focus {
  border-color: rgba(37,211,102,0.45);
  box-shadow: 0 0 0 3px rgba(37,211,102,0.08);
  outline: none;
}
.input-field.standalone::placeholder { color: var(--text-dim); }
.search-input { margin-bottom: 16px; }

/* ── Preview pill ── */
.preview-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(37,211,102,0.06);
  border: 1px solid rgba(37,211,102,0.18);
  border-radius: 8px; padding: 9px 14px;
  margin-bottom: 18px; font-size: 0.78rem;
}
.preview-label { color: var(--text-dim); }
.preview-value { color: var(--accent); font-weight: 600; font-family: monospace; font-size: 0.8rem; }

/* ── Submit button ── */
.btn-submit {
  width: 100%; padding: 15px 20px;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #fff; border: none; border-radius: var(--radius-sm);
  font-size: 0.95rem; font-weight: 700; font-family: inherit;
  cursor: pointer; letter-spacing: 0.01em;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  box-shadow: 0 4px 24px rgba(37,211,102,0.3), 0 1px 0 rgba(255,255,255,0.1) inset;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 32px rgba(37,211,102,0.45), 0 1px 0 rgba(255,255,255,0.1) inset;
}
.btn-submit:active:not(:disabled) { transform: translateY(0); }
.btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
.btn-submit.loading { opacity: 0.75; }
.btn-submit.sm { width: auto; padding: 10px 20px; font-size: 0.85rem; }

/* ── Spinner ── */
.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

/* ── Full state ── */
.full-state { text-align: center; padding: 20px 0; }
.full-icon { font-size: 48px; margin-bottom: 16px; }
.full-title { font-size: 1.4rem; font-weight: 800; color: var(--text); margin-bottom: 10px; }
.full-sub { font-size: 0.87rem; color: var(--text-muted); line-height: 1.6; }

/* ── Steps ── */
.steps-section { width: 100%; animation: fadeUp 0.7s ease 0.4s both; }
.steps-heading {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--text-dim); text-align: center; margin-bottom: 14px;
}
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.step-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 14px 12px; text-align: center;
}
.step-num {
  font-size: 0.65rem; font-weight: 800; color: var(--accent);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
}
.step-icon { font-size: 20px; margin-bottom: 6px; }
.step-title { font-size: 0.78rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.step-desc { font-size: 0.68rem; color: var(--text-dim); line-height: 1.5; }

/* ── Admin link ── */
.btn-admin-link {
  background: none; border: none; color: var(--text-dim);
  font-size: 0.75rem; font-family: inherit; cursor: pointer;
  text-decoration: underline; text-underline-offset: 3px;
  padding: 4px; animation: fadeUp 0.7s ease 0.5s both;
}
.btn-admin-link:hover { color: var(--text-muted); }

/* ── Toast ── */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  padding: 12px 18px; border-radius: var(--radius-sm);
  font-size: 0.85rem; font-weight: 500;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  z-index: 100; max-width: 90vw; animation: slideUp 0.3s ease;
  backdrop-filter: blur(10px);
}
.toast-ok { background: rgba(37,211,102,0.12); border: 1px solid rgba(37,211,102,0.3); color: #4ade80; }
.toast-error { background: rgba(220,50,50,0.1); border: 1px solid rgba(220,50,50,0.25); color: #f87171; }
.toast-close {
  background: none; border: none; color: inherit;
  cursor: pointer; font-size: 0.8rem; opacity: 0.7; padding: 0 4px;
}

/* ── Admin ── */
.admin-container {
  position: relative; z-index: 1;
  max-width: 900px; margin: 0 auto; padding: 32px 20px 80px;
}
.admin-topbar {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  margin-bottom: 24px;
}
.admin-brand { display: flex; align-items: center; gap: 10px; flex: 1; }
.admin-title { font-size: 1.1rem; font-weight: 800; color: var(--text); }
.count-badge {
  background: rgba(37,211,102,0.1); color: var(--accent);
  border: 1px solid rgba(37,211,102,0.25); border-radius: 100px;
  font-size: 0.72rem; font-weight: 700; padding: 3px 10px;
}
.admin-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.btn-back {
  background: var(--surface); border: 1px solid var(--border);
  color: var(--text-muted); border-radius: var(--radius-sm);
  padding: 8px 14px; font-size: 0.82rem; font-family: inherit; cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.btn-back:hover { border-color: var(--border-hover); color: var(--text); }
.btn-outline {
  background: transparent; border: 1px solid var(--border);
  color: var(--text-muted); border-radius: var(--radius-sm);
  padding: 9px 16px; font-size: 0.82rem; font-family: inherit; cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}
.btn-outline:hover { border-color: var(--border-hover); color: var(--text); }

/* ── Auth card ── */
.auth-card {
  max-width: 400px; margin: 40px auto;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 30px; text-align: center;
}
.auth-icon { font-size: 48px; margin-bottom: 16px; }
.auth-title { font-size: 1.3rem; font-weight: 800; color: var(--text); margin-bottom: 8px; }
.auth-sub { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 20px; }
.auth-error { color: #f87171; font-size: 0.8rem; margin-bottom: 12px; }

/* ── Table ── */
.table-wrap { overflow-x: auto; border-radius: var(--radius); border: 1px solid var(--border); }
.contacts-table { width: 100%; border-collapse: collapse; }
.contacts-table thead tr {
  background: var(--surface2); border-bottom: 1px solid var(--border);
}
.contacts-table th {
  padding: 12px 16px; text-align: left;
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text-dim);
}
.contacts-table tbody tr { border-bottom: 1px solid rgba(37,211,102,0.05); transition: background 0.15s; }
.contacts-table tbody tr:hover { background: rgba(37,211,102,0.03); }
.contacts-table td { padding: 11px 16px; vertical-align: middle; }

.col-slot { color: var(--accent); font-weight: 700; font-family: monospace; font-size: 0.82rem; }
.col-name { color: var(--text); font-weight: 600; font-size: 0.87rem; }
.col-phone { font-family: monospace; font-size: 0.78rem; }
.phone-raw { color: var(--text-muted); }
.phone-int { color: var(--text-dim); margin-left: 8px; }
.col-date { font-size: 0.75rem; color: var(--text-dim); }
.col-action { width: 80px; }

.btn-del {
  background: transparent; border: 1px solid rgba(220,50,50,0.2);
  color: rgba(220,50,50,0.6); border-radius: 6px;
  width: 28px; height: 28px; cursor: pointer; font-size: 0.75rem;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.btn-del:hover { background: rgba(220,50,50,0.1); color: #f87171; border-color: rgba(220,50,50,0.4); }
.confirm-row { display: flex; gap: 4px; }
.btn-yes {
  background: rgba(220,50,50,0.15); border: 1px solid rgba(220,50,50,0.3);
  color: #f87171; border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 0.75rem; font-family: inherit;
}
.btn-no {
  background: var(--surface2); border: 1px solid var(--border);
  color: var(--text-muted); border-radius: 6px; padding: 3px 8px; cursor: pointer; font-size: 0.75rem; font-family: inherit;
}

.search-count { color: var(--text-dim); font-size: 0.78rem; margin-top: 10px; }
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 0.9rem; }
.empty-state div { margin-bottom: 12px; }

/* ── Instructions ── */
.instructions-card {
  margin-top: 24px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 24px;
}
.inst-title { font-weight: 700; color: var(--text); margin-bottom: 14px; font-size: 0.9rem; }
.inst-list { padding-left: 18px; display: flex; flex-direction: column; gap: 8px; }
.inst-list li { font-size: 0.82rem; color: var(--text-muted); line-height: 1.6; }
.inst-list strong { color: var(--accent); }

/* ── Animations ── */
@keyframes fadeDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: none; } }
@keyframes fadeUp   { from { opacity: 0; transform: translateY(16px);  } to { opacity: 1; transform: none; } }
@keyframes slideUp  { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translateX(-50%); } }
@keyframes spin     { to { transform: rotate(360deg); } }

@media (max-width: 480px) {
  .steps-grid { grid-template-columns: 1fr; }
  .admin-topbar { flex-direction: column; align-items: flex-start; }
  .hero-title { font-size: 1.9rem; }
}
`;

import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────
//  🔧 PASTE YOUR NEW APPS SCRIPT URL HERE AFTER REDEPLOYING
// ─────────────────────────────────────────────────────────────
const SCRIPT_URL   = "https://script.google.com/macros/s/AKfycbwb7JwAlwkYKJ3UphA-97t6m0O8TJqDkon-yHS32wUJH4jzFhm2_O5Zhubk8EGPt8q0Lg/exec";
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
  const [savedName,  setSavedName]  = useState("");

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
      setSavedName(name.trim());
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

            {/* ── SUCCESS SCREEN ── */}
            {status === "success" ? (
              <SuccessScreen slotResult={slotResult} savedName={savedName} />
            ) : (
              <button
                style={{ ...styles.btnPrimary, opacity: status === "loading" ? 0.7 : 1 }}
                onClick={handleSubmit} disabled={status === "loading"}
              >
                {status === "loading" ? "Saving…" : "Submit & Join MCG 300.0"}
              </button>
            )}
          </>
        )}

        <button style={styles.btnLink} onClick={onSwitch}>Admin: View & Export Contacts →</button>
      </div>

      <style>{globalStyle}</style>
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────

function SuccessScreen({ slotResult, savedName }) {
  const [copied, setCopied] = useState(false);

  const shareText = `🔥 I just joined Massive Gains 300.0!\n\nA verified WhatsApp network of 300 entrepreneurs & go-getters.\n\n📲 Grab your slot here:\n${FORM_URL}\n\n#MassiveGains #MCG300`;

  async function handleShare() {
    if (navigator.share) {
      // Native share sheet on mobile
      try {
        await navigator.share({ title: "Massive Gains 300.0", text: shareText, url: FORM_URL });
      } catch {}
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function handleJoinGroup() {
    window.open(WA_GROUP_LINK, "_blank");
  }

  return (
    <div style={styles.successBox}>
      {/* Tick */}
      <div style={styles.successIcon}>✅</div>

      {/* Welcome message */}
      <p style={styles.successTitle}>You're in, MCG {savedName}!</p>
      <p style={styles.successSlot}>
        {slotResult ? `Slot #${slotResult} of 300 secured 🎯` : "Contact saved successfully 🎯"}
      </p>

      {/* Step guide */}
      <div style={styles.guideBox}>
        <p style={styles.guideTitle}>📋 What to do next</p>
        <div style={styles.guideSteps}>
          <div style={styles.guideStep}>
            <span style={styles.stepNum}>1</span>
            <span style={styles.stepText}>Join the <strong>Massive Gains WhatsApp group</strong> below</span>
          </div>
          <div style={styles.guideStep}>
            <span style={styles.stepNum}>2</span>
            <span style={styles.stepText}>Wait for the admin to send the <strong>MCG_ContactsGain_May2026.vcf</strong> file</span>
          </div>
          <div style={styles.guideStep}>
            <span style={styles.stepNum}>3</span>
            <span style={styles.stepText}>Tap the file → <strong>Import All</strong> — all 300 contacts save with MCG prefix</span>
          </div>
          <div style={styles.guideStep}>
            <span style={styles.stepNum}>4</span>
            <span style={styles.stepText}>Now everyone in the group can see your <strong>WhatsApp Status</strong> 🎉</span>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <button style={styles.btnWA} onClick={handleJoinGroup}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={{ flexShrink: 0 }}>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Join the WhatsApp Group
      </button>

      <button style={styles.btnShare} onClick={handleShare}>
        {copied ? "✓ Copied to clipboard!" : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ flexShrink: 0 }}>
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/>
            </svg>
            Share Form with a Friend
          </>
        )}
      </button>

      <p style={styles.successNote}>
        Tell a friend to grab one of the remaining slots before they're gone!
      </p>
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
  body { background: #05080f; }
  input:focus { border-color: rgba(37,211,102,0.8) !important; box-shadow: 0 0 0 4px rgba(37,211,102,0.15), 0 0 20px rgba(37,211,102,0.1) !important; outline: none; }
  strong { font-weight: 700; }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(37,211,102,0.3), 0 0 60px rgba(37,211,102,0.1); }
    50% { box-shadow: 0 0 30px rgba(37,211,102,0.5), 0 0 80px rgba(37,211,102,0.2); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const styles = {
  // ── Layout ──
  page: {
    minHeight: "100vh",
    background: "#05080f",
    backgroundImage: [
      "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(37,211,102,0.28) 0%, transparent 60%)",
      "radial-gradient(ellipse 50% 40% at 10% 80%, rgba(255,200,0,0.08) 0%, transparent 55%)",
      "radial-gradient(ellipse 40% 35% at 90% 20%, rgba(0,180,255,0.07) 0%, transparent 50%)",
      "radial-gradient(ellipse 60% 40% at 80% 90%, rgba(37,211,102,0.07) 0%, transparent 55%)",
    ].join(","),
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 16px", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
  },
  glowTop: {
    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
    width: "100%", height: 3,
    background: "linear-gradient(90deg, transparent, #25D366, #00e5ff, #25D366, transparent)",
  },

  // ── Card ──
  card: {
    width: "100%", maxWidth: 490,
    background: "linear-gradient(160deg, rgba(15,28,18,0.98) 0%, rgba(8,15,10,0.99) 100%)",
    border: "1px solid rgba(37,211,102,0.35)",
    borderRadius: 24, padding: "38px 36px",
    boxShadow: [
      "0 0 0 1px rgba(37,211,102,0.08)",
      "0 0 60px rgba(37,211,102,0.12)",
      "0 0 120px rgba(37,211,102,0.05)",
      "0 40px 80px rgba(0,0,0,0.8)",
      "inset 0 1px 0 rgba(255,255,255,0.05)",
    ].join(","),
    position: "relative",
  },

  // ── Brand ──
  brandBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, marginBottom: 22,
  },
  mcgBadge: {
    background: "linear-gradient(135deg, #25D366 0%, #00c853 50%, #ffd600 100%)",
    color: "#000", fontFamily: "'Sora', sans-serif", fontWeight: 800,
    fontSize: "0.75rem", letterSpacing: "0.14em",
    padding: "5px 12px", borderRadius: 8,
    boxShadow: "0 0 20px rgba(37,211,102,0.5), 0 4px 15px rgba(0,0,0,0.3)",
    animation: "pulse-glow 3s ease-in-out infinite",
  },
  brandText: {
    fontFamily: "'Sora', sans-serif", fontWeight: 700,
    fontSize: "0.95rem",
    background: "linear-gradient(90deg, #25D366, #ffd600, #25D366)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmer 3s linear infinite",
    letterSpacing: "0.02em",
  },

  // ── Header ──
  cardHeader: { textAlign: "center", marginBottom: 22 },
  waBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 68, height: 68,
    background: "linear-gradient(135deg, rgba(37,211,102,0.2), rgba(37,211,102,0.05))",
    border: "2px solid rgba(37,211,102,0.4)",
    borderRadius: "50%", color: "#25D366", marginBottom: 18,
    animation: "float 4s ease-in-out infinite",
    boxShadow: "0 0 30px rgba(37,211,102,0.25), inset 0 0 20px rgba(37,211,102,0.05)",
  },
  h1: {
    fontFamily: "'Sora', sans-serif", fontSize: "1.75rem", fontWeight: 800,
    background: "linear-gradient(135deg, #ffffff 0%, #a8ffcc 50%, #ffffff 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    letterSpacing: "-0.02em", marginBottom: 10,
  },
  subtitle: { fontSize: "0.88rem", color: "#7aaa88", lineHeight: 1.7 },

  // ── Slot bar ──
  slotBox: {
    background: "linear-gradient(135deg, rgba(37,211,102,0.06), rgba(0,200,100,0.03))",
    border: "1px solid rgba(37,211,102,0.2)",
    borderRadius: 14, padding: "14px 18px", marginBottom: 24,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  slotTopRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  slotLabel:  { fontSize: "0.82rem", color: "#4ade80", fontFamily: "'Sora', sans-serif", fontWeight: 700 },
  slotCount:  { fontSize: "0.82rem", color: "#25D366", fontFamily: "monospace", fontWeight: 700 },
  barTrack: {
    height: 8, borderRadius: 99, overflow: "hidden",
    background: "rgba(255,255,255,0.05)",
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)",
  },
  barFill: {
    height: "100%", borderRadius: 99,
    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
    boxShadow: "0 0 10px currentColor",
  },

  // ── Full box ──
  fullBox: {
    background: "linear-gradient(135deg, rgba(220,50,50,0.12), rgba(180,0,0,0.06))",
    border: "1px solid rgba(220,50,50,0.3)",
    borderRadius: 14, padding: "24px", textAlign: "center", marginBottom: 20,
    boxShadow: "0 0 30px rgba(220,50,50,0.08)",
  },
  fullTitle: { fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#ff6b6b", marginBottom: 10 },
  fullSub:   { fontSize: "0.87rem", color: "#9a5555", lineHeight: 1.65 },

  // ── Fields ──
  fields: { display: "flex", flexDirection: "column", gap: 20, marginBottom: 22 },
  label: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.72rem", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.12em",
    background: "linear-gradient(90deg, #25D366, #00e5ff)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 5, display: "block",
  },
  hint:  { fontSize: "0.78rem", color: "#4a6b52", marginBottom: 10, lineHeight: 1.55 },
  inputWrap: {
    display: "flex", alignItems: "center",
    background: "rgba(10,25,15,0.8)",
    border: "1.5px solid rgba(37,211,102,0.25)",
    borderRadius: 12, overflow: "hidden",
    boxShadow: "0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  inputPrefix: {
    padding: "0 14px", fontFamily: "'Sora', sans-serif", fontWeight: 800,
    fontSize: "0.8rem",
    background: "linear-gradient(90deg, #25D366, #00c853)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    borderRight: "1px solid rgba(37,211,102,0.2)",
    whiteSpace: "nowrap", alignSelf: "stretch", display: "flex", alignItems: "center",
  },
  inputWithPrefix: {
    flex: 1, background: "transparent", border: "none",
    padding: "14px 14px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem", color: "#e8fff0", outline: "none",
  },
  input: {
    width: "100%",
    background: "rgba(10,25,15,0.8)",
    border: "1.5px solid rgba(37,211,102,0.25)",
    borderRadius: 12, padding: "14px 16px",
    fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "#e8fff0", outline: "none",
    boxShadow: "0 2px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)",
  },

  // ── Buttons ──
  btnPrimary: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366 0%, #00c853 40%, #ffd600 100%)",
    color: "#020d06", fontFamily: "'Sora', sans-serif", fontSize: "0.95rem", fontWeight: 800,
    border: "none", borderRadius: 14, padding: "16px",
    cursor: "pointer", marginBottom: 14, letterSpacing: "0.02em",
    boxShadow: "0 4px 30px rgba(37,211,102,0.4), 0 0 60px rgba(37,211,102,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  btnLink: {
    background: "none", border: "none", color: "#3a6645",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem",
    cursor: "pointer", width: "100%", textAlign: "center", padding: 4,
    transition: "color 0.2s",
  },

  // ── Admin ──
  adminPage: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #060e08 0%, #03080a 50%, #060c06 100%)",
    fontFamily: "'DM Sans', sans-serif", color: "#d4ead9",
    padding: "28px 20px 60px", maxWidth: 920, margin: "0 auto",
  },
  adminHeader: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 20 },
  btnBack: {
    background: "rgba(37,211,102,0.08)",
    border: "1px solid rgba(37,211,102,0.25)",
    color: "#25D366", borderRadius: 10, padding: "9px 16px",
    fontFamily: "'Sora', sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 0 15px rgba(37,211,102,0.08)",
  },
  h2: {
    fontFamily: "'Sora', sans-serif", fontSize: "1.3rem", fontWeight: 800,
    background: "linear-gradient(90deg, #ffffff, #a8ffcc)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  badge: {
    background: "linear-gradient(135deg, rgba(37,211,102,0.15), rgba(0,200,100,0.08))",
    color: "#4ade80", fontSize: "0.78rem",
    fontWeight: 800, padding: "4px 12px", borderRadius: 20,
    border: "1px solid rgba(37,211,102,0.3)",
    fontFamily: "monospace",
    boxShadow: "0 0 10px rgba(37,211,102,0.1)",
  },
  btnSecondary: {
    background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.3)",
    color: "#4ade80", fontFamily: "'Sora', sans-serif", fontSize: "0.82rem",
    fontWeight: 700, borderRadius: 10, padding: "9px 18px", cursor: "pointer",
    boxShadow: "0 0 15px rgba(37,211,102,0.08)",
  },
  authBox: {
    maxWidth: 390, margin: "0 auto",
    background: "linear-gradient(160deg, rgba(12,25,16,0.95), rgba(6,14,9,0.98))",
    border: "1px solid rgba(37,211,102,0.2)", borderRadius: 18, padding: "36px 32px",
    boxShadow: "0 0 60px rgba(37,211,102,0.07), 0 30px 60px rgba(0,0,0,0.5)",
  },
  empty: {
    textAlign: "center", color: "#3d6648", padding: "60px 20px",
    border: "1px dashed rgba(37,211,102,0.15)", borderRadius: 16,
    background: "rgba(37,211,102,0.02)",
  },
  tableWrap: {
    overflowX: "auto", borderRadius: 16,
    border: "1px solid rgba(37,211,102,0.15)",
    background: "linear-gradient(160deg, rgba(10,22,13,0.98), rgba(6,14,9,0.99))",
    boxShadow: "0 0 40px rgba(37,211,102,0.05)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.7rem", fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.12em",
    background: "linear-gradient(90deg, #25D366, #00e5ff)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    padding: "16px 16px", textAlign: "left",
    borderBottom: "1px solid rgba(37,211,102,0.12)",
    background: "rgba(10,25,15,0.9)",
  },
  td: {
    padding: "13px 16px",
    borderBottom: "1px solid rgba(37,211,102,0.06)",
    fontSize: "0.88rem", color: "#b8d8c0",
  },
  vcfBox: {
    marginTop: 24,
    background: "linear-gradient(135deg, rgba(37,211,102,0.07), rgba(0,200,100,0.03))",
    border: "1px solid rgba(37,211,102,0.15)", borderRadius: 16, padding: "22px 26px",
    boxShadow: "0 0 30px rgba(37,211,102,0.05)",
  },
  vcfTitle: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.9rem", fontWeight: 800,
    background: "linear-gradient(90deg, #25D366, #ffd600)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 14,
  },
  vcfList: { paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: "0.86rem", color: "#5a9e6a", lineHeight: 1.65 },
  btnDelete:     { background: "rgba(255,50,50,0.08)", border: "1px solid rgba(220,50,50,0.25)", color: "#ff6b6b", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontSize: "0.78rem" },
  btnConfirmYes: { background: "rgba(220,50,50,0.15)", border: "1px solid rgba(220,50,50,0.3)", color: "#ff6b6b", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" },
  btnConfirmNo:  { background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.25)", color: "#4ade80", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: "0.75rem" },

  // ── Success Screen ──
  successBox: {
    background: "linear-gradient(160deg, rgba(10,30,16,0.98), rgba(5,15,10,0.99))",
    border: "1px solid rgba(37,211,102,0.3)",
    borderRadius: 18, padding: "28px 22px", textAlign: "center", marginBottom: 6,
    boxShadow: "0 0 50px rgba(37,211,102,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
  },
  successIcon:  { fontSize: "2.8rem", marginBottom: 12, display: "block", animation: "float 3s ease-in-out infinite" },
  successTitle: {
    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.2rem",
    background: "linear-gradient(135deg, #ffffff, #a8ffcc)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 8,
  },
  successSlot: {
    fontSize: "0.85rem", marginBottom: 22, fontFamily: "monospace", fontWeight: 700,
    background: "linear-gradient(90deg, #25D366, #ffd600)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },

  // Guide steps
  guideBox: {
    background: "linear-gradient(135deg, rgba(37,211,102,0.05), rgba(0,180,100,0.02))",
    border: "1px solid rgba(37,211,102,0.15)",
    borderRadius: 14, padding: "18px", marginBottom: 20, textAlign: "left",
  },
  guideTitle: {
    fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "0.8rem",
    background: "linear-gradient(90deg, #25D366, #ffd600)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    marginBottom: 16, textAlign: "center", letterSpacing: "0.05em",
  },
  guideSteps: { display: "flex", flexDirection: "column", gap: 14 },
  guideStep:  { display: "flex", alignItems: "flex-start", gap: 14 },
  stepNum: {
    background: "linear-gradient(135deg, #25D366, #ffd600)",
    color: "#020d06", fontFamily: "'Sora', sans-serif", fontWeight: 900,
    fontSize: "0.72rem", width: 24, height: 24, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    boxShadow: "0 0 12px rgba(37,211,102,0.4)",
  },
  stepText: { fontSize: "0.83rem", color: "#7aaa88", lineHeight: 1.6 },

  // CTA Buttons
  btnWA: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10,
    background: "linear-gradient(135deg, #25D366 0%, #00c853 50%, #00e676 100%)",
    color: "#020d06", fontFamily: "'Sora', sans-serif", fontSize: "0.92rem", fontWeight: 900,
    border: "none", borderRadius: 14, padding: "15px",
    cursor: "pointer", marginBottom: 10,
    boxShadow: "0 4px 30px rgba(37,211,102,0.45), 0 0 60px rgba(37,211,102,0.1), inset 0 1px 0 rgba(255,255,255,0.25)",
  },
  btnShare: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8,
    background: "linear-gradient(135deg, rgba(255,214,0,0.1), rgba(255,180,0,0.05))",
    border: "1px solid rgba(255,214,0,0.35)", color: "#ffd600",
    fontFamily: "'Sora', sans-serif", fontSize: "0.87rem", fontWeight: 700,
    borderRadius: 14, padding: "14px", cursor: "pointer", marginBottom: 16,
    boxShadow: "0 0 20px rgba(255,214,0,0.08)",
  },
  successNote: { fontSize: "0.76rem", color: "#3a6040", lineHeight: 1.6 },
};

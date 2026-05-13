import { useState, useEffect } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFI-dGYNDOFD_1An62jZdg...";
const ADMIN_SECRET = "catalysT";

// ─── Helpers ─────────────────────────────────────────────────

function sanitizePhone(raw) {
  return raw.replace(/[^\d+]/g, "");
}

function buildVCF(contacts) {
  return contacts
    .map(({ name, phone }) => {
      const tel = sanitizePhone(phone);
      return ["BEGIN:VCARD", "VERSION:3.0", `FN:${name}`, `TEL;TYPE=CELL,VOICE:${tel}`, "END:VCARD"].join("\r\n");
    })
    .join("\r\n");
}

function downloadVCF(contacts) {
  const blob = new Blob([buildVCF(contacts)], { type: "text/vcard" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "whatsapp_contacts.vcf";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Form Page ────────────────────────────────────────────────

function FormPage({ onSwitch }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setStatus("error"); return; }
    setStatus("loading");
    try {
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (json.ok) {
        setStatus("success");
        setName(""); setPhone("");
      } else if (json.error === "duplicate") {
        setStatus("duplicate");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={styles.formPage}>
      <div style={styles.glowTop} />
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.waBadge}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h1 style={styles.h1}>Join the Group</h1>
          <p style={styles.subtitle}>Submit your details so everyone can connect & see your WhatsApp Status</p>
        </div>

        <div style={styles.fields}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={styles.label}>Your Name</label>
            <p style={styles.hint}>Enter it exactly as you want it saved in everyone's contacts</p>
            <input style={styles.input} type="text" placeholder="e.g. Amara Johnson"
              value={name} onChange={e => { setName(e.target.value); setStatus("idle"); }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={styles.label}>WhatsApp Number</label>
            <p style={styles.hint}>Include your country code — e.g. +234 812 345 6789</p>
            <input style={styles.input} type="tel" placeholder="+234 812 345 6789"
              value={phone} onChange={e => { setPhone(e.target.value); setStatus("idle"); }} />
          </div>
        </div>

        {status === "error"     && <Msg type="error">Please fill in both your name and number.</Msg>}
        {status === "duplicate" && <Msg type="warn">That number is already registered! ✓</Msg>}
        {status === "success"   && <Msg type="ok">You're in! 🎉 Your contact has been saved.</Msg>}

        <button
          style={{ ...styles.btnPrimary, opacity: status === "loading" ? 0.7 : 1 }}
          onClick={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Saving…" : "Submit My Contact"}
        </button>

        <button style={styles.btnLink} onClick={onSwitch}>Admin: View & Export Contacts →</button>
      </div>
      <style>{inputFocusStyle}</style>
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

  async function fetchContacts() {
    setLoading(true); setAuthError(false);
    try {
      const res = await fetch(`${SCRIPT_URL}?secret=${encodeURIComponent(secret)}`);
      const json = await res.json();
      if (json.ok) {
        setContacts(json.contacts || []);
        setFetched(true);
      } else {
        setAuthError(true);
      }
    } catch { setAuthError(true); }
    finally { setLoading(false); }
  }

  async function handleCopyVCF() {
    await navigator.clipboard.writeText(buildVCF(contacts));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={styles.adminPage}>
      <div style={styles.adminHeader}>
        <button style={styles.btnBack} onClick={onSwitch}>← Back to Form</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <h2 style={styles.h2}>Admin Panel</h2>
          {fetched && <span style={styles.badge}>{contacts.length} contacts</span>}
        </div>
        {fetched && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.btnSecondary} onClick={handleCopyVCF}>
              {copied ? "Copied! ✓" : "Copy vCard"}
            </button>
            <button style={{ ...styles.btnPrimary, width: "auto", marginBottom: 0 }}
              onClick={() => downloadVCF(contacts)} disabled={contacts.length === 0}>
              ⬇ Download .vcf
            </button>
          </div>
        )}
      </div>

      {!fetched ? (
        <div style={styles.authBox}>
          <p style={{ color: "#6b7c72", marginBottom: 14, fontSize: "0.9rem" }}>
            Enter your admin secret to load contacts from Google Sheets
          </p>
          <input
            style={{ ...styles.input, marginBottom: 12 }}
            type="password"
            placeholder="Admin secret"
            value={secret}
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
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Name", "WhatsApp Number", "Submitted"].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => (
                  <tr key={i}>
                    <td style={{ ...styles.td, color: "#3d5946", fontSize: "0.8rem" }}>{i + 1}</td>
                    <td style={{ ...styles.td, color: "#e8f5ea", fontWeight: 500 }}>{c.name}</td>
                    <td style={{ ...styles.td, fontFamily: "monospace", color: "#8db89e" }}>{c.phone}</td>
                    <td style={{ ...styles.td, fontSize: "0.8rem", color: "#3d5946" }}>
                      {c.timestamp ? new Date(c.timestamp).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.vcfBox}>
            <p style={styles.vcfTitle}>📲 How to share the vCard</p>
            <ol style={styles.vcfList}>
              <li>Click <strong>Download .vcf</strong> to get the contacts file</li>
              <li>Open WhatsApp → your group → send it as a <strong>Document</strong></li>
              <li>Members tap the file → <strong>Import</strong> → all contacts save instantly</li>
              <li>Everyone can now see each other's WhatsApp Status 🎉</li>
            </ol>
          </div>
        </>
      )}
      <style>{inputFocusStyle}</style>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────

function Msg({ type, children }) {
  const colors = {
    error: { bg: "rgba(220,50,50,0.1)", color: "#f87171", border: "rgba(220,50,50,0.2)" },
    warn:  { bg: "rgba(234,179,8,0.1)",  color: "#fbbf24", border: "rgba(234,179,8,0.2)" },
    ok:    { bg: "rgba(37,211,102,0.1)", color: "#4ade80", border: "rgba(37,211,102,0.25)" },
  }[type];
  return (
    <div style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}`,
      borderRadius: 10, padding: "12px 16px", fontSize: "0.88rem", marginBottom: 16, lineHeight: 1.5 }}>
      {children}
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

// ─── Styles ───────────────────────────────────────────────────

const inputFocusStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  input:focus { border-color: rgba(37,211,102,0.6) !important; box-shadow: 0 0 0 3px rgba(37,211,102,0.08) !important; outline: none; }
`;

const styles = {
  formPage: {
    minHeight: "100vh", background: "#0a0f0d",
    backgroundImage: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,211,102,0.18) 0%, transparent 70%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px 16px", fontFamily: "'DM Sans', sans-serif", position: "relative",
  },
  glowTop: {
    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
    width: 600, height: 2,
    background: "linear-gradient(90deg, transparent, rgba(37,211,102,0.5), transparent)",
  },
  card: {
    width: "100%", maxWidth: 460, background: "#111814",
    border: "1px solid rgba(37,211,102,0.2)", borderRadius: 20, padding: "40px 36px",
    boxShadow: "0 0 60px rgba(37,211,102,0.06), 0 24px 60px rgba(0,0,0,0.6)",
  },
  cardHeader: { textAlign: "center", marginBottom: 32 },
  waBadge: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 60, height: 60, background: "rgba(37,211,102,0.12)", borderRadius: "50%",
    color: "#25D366", marginBottom: 18,
  },
  h1: { fontFamily: "'Sora', sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#f0fdf4", letterSpacing: "-0.02em", marginBottom: 8 },
  subtitle: { fontSize: "0.88rem", color: "#6b7c72", lineHeight: 1.6 },
  fields: { display: "flex", flexDirection: "column", gap: 22, marginBottom: 24 },
  label: { fontFamily: "'Sora', sans-serif", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#25D366", marginBottom: 4, display: "block" },
  hint: { fontSize: "0.78rem", color: "#4a5c51", marginBottom: 10, lineHeight: 1.4 },
  input: {
    width: "100%", background: "#0d1410", border: "1.5px solid rgba(37,211,102,0.18)",
    borderRadius: 10, padding: "13px 16px", fontFamily: "'DM Sans', sans-serif",
    fontSize: "1rem", color: "#e8f5ea", outline: "none",
  },
  btnPrimary: {
    width: "100%", background: "#25D366", color: "#051007",
    fontFamily: "'Sora', sans-serif", fontSize: "0.95rem", fontWeight: 700,
    border: "none", borderRadius: 12, padding: 15, cursor: "pointer", marginBottom: 14,
  },
  btnLink: {
    background: "none", border: "none", color: "#3d6650",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem",
    cursor: "pointer", width: "100%", textAlign: "center", padding: 4,
  },
  adminPage: {
    minHeight: "100vh", background: "#07100d", fontFamily: "'DM Sans', sans-serif",
    color: "#d4ead9", padding: "28px 20px 60px", maxWidth: 860, margin: "0 auto",
  },
  adminHeader: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 14, marginBottom: 28 },
  btnBack: {
    background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)",
    color: "#25D366", borderRadius: 8, padding: "8px 14px",
    fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", cursor: "pointer",
  },
  h2: { fontFamily: "'Sora', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: "#f0fdf4" },
  badge: {
    background: "rgba(37,211,102,0.15)", color: "#25D366", fontSize: "0.75rem",
    fontWeight: 600, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(37,211,102,0.25)",
  },
  btnSecondary: {
    background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.25)",
    color: "#25D366", fontFamily: "'Sora', sans-serif", fontSize: "0.82rem",
    fontWeight: 600, borderRadius: 8, padding: "9px 16px", cursor: "pointer",
  },
  authBox: {
    maxWidth: 380, margin: "0 auto", background: "#0c1711",
    border: "1px solid rgba(37,211,102,0.12)", borderRadius: 16, padding: "32px 28px",
  },
  empty: {
    textAlign: "center", color: "#3d5946", padding: "60px 20px",
    border: "1px dashed rgba(37,211,102,0.12)", borderRadius: 14,
  },
  tableWrap: { overflowX: "auto", borderRadius: 14, border: "1px solid rgba(37,211,102,0.12)", background: "#0c1711" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    fontFamily: "'Sora', sans-serif", fontSize: "0.72rem", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.08em", color: "#25D366",
    padding: "14px 18px", textAlign: "left", borderBottom: "1px solid rgba(37,211,102,0.1)",
  },
  td: { padding: "13px 18px", borderBottom: "1px solid rgba(37,211,102,0.06)", fontSize: "0.92rem", color: "#c8dece" },
  vcfBox: {
    marginTop: 28, background: "#0c1711", border: "1px solid rgba(37,211,102,0.12)",
    borderRadius: 14, padding: "22px 26px",
  },
  vcfTitle: { fontFamily: "'Sora', sans-serif", fontSize: "0.9rem", color: "#25D366", marginBottom: 12, fontWeight: 600 },
  vcfList: { paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10, fontSize: "0.88rem", color: "#7aaa88", lineHeight: 1.6 },
};

import { useState, useEffect } from "react";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcICESZfVwhWdwqHQduZtt6vNZnEAh-RiT0nenIAxibRShKHryFwR6R5jvoniBezwp3Q/exec";
const MAX_SLOTS  = 300;
const FILE_NAME  = "MCG_ContactsGain_May2026";

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

// ─── Alert Component ──────────────────────────────────────────

function Alert({ children }) {
  return (
    <div style={{
      background: "rgba(255,68,68,0.1)",
      border: "1px solid rgba(255,68,68,0.4)",
      borderRadius: 10,
      padding: "10px 14px",
      color: "#ff8080",
      fontSize: "0.83rem",
      marginBottom: 14,
      letterSpacing: "0.01em",
    }}>
      {children}
    </div>
  );
}

// ─── Shared CSS ───────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #050a14; }

  .bg-grid {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(79,172,254,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79,172,254,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .orb {
    position: fixed; border-radius: 50%; filter: blur(80px);
    pointer-events: none; z-index: 0; opacity: 0.18;
  }
  .orb1 { width: 480px; height: 480px; background: #4facfe; top: -120px; right: -80px; }
  .orb2 { width: 380px; height: 380px; background: #00f2fe; bottom: -80px; left: -80px; }
  .orb3 { width: 260px; height: 260px; background: #a78bfa; top: 40%; left: 30%; opacity: 0.09; }

  .top-line {
    position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 100;
    background: linear-gradient(90deg, transparent, #4facfe, #00f2fe, transparent);
  }

  .field-input {
    width: 100%;
    background: rgba(10,20,40,0.7);
    border: 1.5px solid rgba(79,172,254,0.2);
    border-radius: 12px;
    color: #e8f0ff;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    padding: 13px 16px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field-input:focus {
    border-color: #4facfe;
    box-shadow: 0 0 0 3px rgba(79,172,254,0.12);
  }
  .field-input::placeholder { color: #3d4f70; }

  .btn-submit {
    width: 100%;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #050a14;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1rem;
    letter-spacing: 0.04em;
    border: none;
    border-radius: 14px;
    padding: 16px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    box-shadow: 0 0 28px rgba(79,172,254,0.35);
  }
  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(79,172,254,0.5);
  }
  .btn-submit:active:not(:disabled) { transform: translateY(0); }

  .success-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(79,172,254,0.12);
    border: 2px solid rgba(79,172,254,0.4);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    animation: pulseRing 2s ease infinite;
  }
  @keyframes pulseRing {
    0%, 100% { box-shadow: 0 0 0 0 rgba(79,172,254,0.3); }
    50%       { box-shadow: 0 0 0 14px rgba(79,172,254,0); }
  }

  .urgency-fill {
    height: 100%; border-radius: 99px;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }

  .spin { display: inline-block; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .table-row { transition: background 0.15s; }
  .table-row:hover { background: rgba(79,172,254,0.05); }

  @media (max-width: 860px) {
    .wrapper-grid { flex-direction: column !important; }
    .hero-panel   { min-width: unset !important; }
  }
`;

// ─── Styles ───────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#050a14",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
    paddingBottom: 60,
  },
  wrapper: {
    display: "flex",
    gap: 48,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "70px 24px 40px",
    position: "relative",
    zIndex: 1,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  hero: {
    flex: "1 1 340px",
    minWidth: 300,
    paddingTop: 8,
  },
  heroPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(79,172,254,0.1)",
    border: "1px solid rgba(79,172,254,0.25)",
    borderRadius: 99,
    padding: "6px 14px",
    fontSize: "0.72rem",
    fontWeight: 600,
    color: "#4facfe",
    letterSpacing: "0.08em",
    marginBottom: 28,
  },
  pillDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#4facfe",
    boxShadow: "0 0 8px #4facfe",
    display: "inline-block",
  },
  heroH1: {
    fontFamily: "'Syne', sans-serif",
    lineHeight: 0.92,
    marginBottom: 22,
  },
  heroLine1: {
    display: "block",
    fontSize: "clamp(2.6rem, 6vw, 4rem)",
    color: "#e8f0ff",
    fontWeight: 800,
  },
  heroLine2: {
    display: "block",
    fontSize: "clamp(3.2rem, 8vw, 5.2rem)",
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: 900,
  },
  heroLine3: {
    display: "block",
    fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
    color: "#3d5070",
    fontWeight: 700,
    letterSpacing: "0.15em",
  },
  heroSub: {
    color: "#8a9bbf",
    fontSize: "0.96rem",
    lineHeight: 1.65,
    marginBottom: 28,
    maxWidth: 420,
  },
  proofRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 28,
  },
  proofPill: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: "0.78rem",
    color: "#8a9bbf",
    fontWeight: 500,
  },
  urgencyBox: {
    background: "rgba(10,20,40,0.6)",
    border: "1px solid rgba(79,172,254,0.15)",
    borderRadius: 14,
    padding: "16px 18px",
    marginBottom: 28,
  },
  urgencyTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  urgencyLabel: {
    fontSize: "0.83rem",
    fontWeight: 600,
    color: "#e8f0ff",
  },
  urgencyCount: {
    fontSize: "0.78rem",
    color: "#3d4f70",
    fontFamily: "monospace",
  },
  urgencyTrack: {
    height: 6,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 99,
    overflow: "hidden",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIcon: {
    fontSize: "1.1rem",
    lineHeight: 1.4,
    flexShrink: 0,
  },
  featureText: {
    fontSize: "0.88rem",
    color: "#8a9bbf",
    lineHeight: 1.5,
  },
  formWrap: {
    flex: "1 1 360px",
    minWidth: 320,
  },
  card: {
    background: "rgba(10,18,35,0.85)",
    border: "1px solid rgba(79,172,254,0.14)",
    borderRadius: 24,
    padding: "36px 32px 28px",
    backdropFilter: "blur(24px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    position: "relative",
  },
  cardBadge: {
    position: "absolute",
    top: -14,
    left: "50%",
    transform: "translateX(-50%)",
  },
  cardBadgeInner: {
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    color: "#050a14",
    fontSize: "0.65rem",
    fontWeight: 800,
    letterSpacing: "0.12em",
    fontFamily: "'Syne', sans-serif",
    padding: "4px 14px",
    borderRadius: 99,
  },
  cardH: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#e8f0ff",
    marginBottom: 6,
    marginTop: 8,
  },
  cardSub: {
    color: "#4d6080",
    fontSize: "0.86rem",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  formFields: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    marginBottom: 20,
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#3d5070",
  },
  prefixWrap: {
    display: "flex",
    borderRadius: 12,
    overflow: "hidden",
    border: "1.5px solid rgba(79,172,254,0.2)",
    background: "rgba(10,20,40,0.7)",
    transition: "border-color 0.2s",
  },
  prefixTag: {
    background: "rgba(79,172,254,0.12)",
    color: "#4facfe",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "0.78rem",
    padding: "0 14px",
    display: "flex",
    alignItems: "center",
    borderRight: "1px solid rgba(79,172,254,0.15)",
    letterSpacing: "0.06em",
    flexShrink: 0,
  },
  prefixInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    borderRadius: 0,
    color: "#e8f0ff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.95rem",
    padding: "13px 14px",
    outline: "none",
  },
  fieldInput: {
    width: "100%",
    background: "rgba(10,20,40,0.7)",
    border: "1.5px solid rgba(79,172,254,0.2)",
    borderRadius: 12,
    color: "#e8f0ff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.95rem",
    padding: "13px 16px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  fieldHint: {
    fontSize: "0.74rem",
    color: "#3d4f70",
    marginTop: 2,
  },
  btnSubmit: {
    width: "100%",
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "#050a14",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "1rem",
    letterSpacing: "0.04em",
    border: "none",
    borderRadius: 14,
    padding: 16,
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
    boxShadow: "0 0 28px rgba(79,172,254,0.35)",
    marginBottom: 16,
  },
  trustLine: {
    textAlign: "center",
    fontSize: "0.74rem",
    color: "#2d3d55",
    marginBottom: 20,
  },
  adminBtn: {
    background: "none",
    border: "none",
    color: "#2d3d55",
    fontSize: "0.72rem",
    cursor: "pointer",
    width: "100%",
    textAlign: "right",
    padding: "4px 0 0",
    fontFamily: "'DM Sans', sans-serif",
    transition: "color 0.2s",
  },
  btnOutline: {
    background: "transparent",
    border: "1.5px solid rgba(79,172,254,0.35)",
    borderRadius: 12,
    color: "#4facfe",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: "0.88rem",
    padding: "12px 24px",
    cursor: "pointer",
    transition: "background 0.2s, border-color 0.2s",
    marginTop: 4,
  },
  successWrap: {
    textAlign: "center",
    padding: "12px 0 8px",
  },
  successH: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.8rem",
    fontWeight: 900,
    color: "#e8f0ff",
    marginBottom: 6,
  },
  successName: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.15rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 12,
  },
  slotBadge: {
    display: "inline-block",
    background: "rgba(79,172,254,0.1)",
    border: "1px solid rgba(79,172,254,0.3)",
    borderRadius: 99,
    padding: "4px 16px",
    fontSize: "0.78rem",
    color: "#4facfe",
    fontWeight: 600,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  successMsg: {
    color: "#8a9bbf",
    fontSize: "0.86rem",
    lineHeight: 1.6,
    marginBottom: 22,
  },
  fullWrap: {
    textAlign: "center",
    padding: "20px 0",
  },
  fullH: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.6rem",
    fontWeight: 800,
    color: "#e8f0ff",
    marginBottom: 10,
  },
  fullMsg: {
    color: "#8a9bbf",
    fontSize: "0.88rem",
    lineHeight: 1.6,
  },
  footer: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    paddingTop: 10,
  },
  footerText: {
    color: "#1e2d45",
    fontSize: "0.74rem",
    letterSpacing: "0.08em",
  },
};

// ─── Admin Styles ─────────────────────────────────────────────

const A = {
  page: {
    minHeight: "100vh",
    background: "#050a14",
    fontFamily: "'DM Sans', sans-serif",
    padding: "0 0 60px",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 32px",
    borderBottom: "1px solid rgba(79,172,254,0.1)",
    background: "rgba(5,10,20,0.8)",
    backdropFilter: "blur(16px)",
    flexWrap: "wrap",
  },
  btnBack: {
    background: "none",
    border: "1px solid rgba(79,172,254,0.2)",
    borderRadius: 10,
    color: "#4facfe",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.84rem",
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 0.2s",
    flexShrink: 0,
  },
  headerBadge: {
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    color: "#050a14",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 900,
    fontSize: "0.78rem",
    padding: "4px 10px",
    borderRadius: 8,
    letterSpacing: "0.06em",
  },
  h2: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.2rem",
    fontWeight: 800,
    color: "#e8f0ff",
  },
  countBadge: {
    background: "rgba(79,172,254,0.1)",
    border: "1px solid rgba(79,172,254,0.25)",
    borderRadius: 99,
    padding: "3px 12px",
    fontSize: "0.75rem",
    color: "#4facfe",
    fontFamily: "monospace",
    fontWeight: 700,
  },
  btnGhost: {
    background: "transparent",
    border: "1px solid rgba(79,172,254,0.25)",
    borderRadius: 10,
    color: "#4facfe",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: "0.84rem",
    padding: "8px 16px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  btnBlue: {
    background: "linear-gradient(135deg, #4facfe, #00f2fe)",
    border: "none",
    borderRadius: 10,
    color: "#050a14",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "0.84rem",
    padding: "9px 18px",
    cursor: "pointer",
    boxShadow: "0 0 20px rgba(79,172,254,0.3)",
    transition: "opacity 0.2s",
    letterSpacing: "0.03em",
  },
  authCard: {
    maxWidth: 420,
    margin: "80px auto",
    background: "rgba(10,18,35,0.85)",
    border: "1px solid rgba(79,172,254,0.14)",
    borderRadius: 24,
    padding: "40px 36px",
    textAlign: "center",
    backdropFilter: "blur(20px)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
    position: "relative",
    zIndex: 1,
  },
  authIcon: {
    fontSize: "2.8rem",
    marginBottom: 16,
  },
  authH: {
    fontFamily: "'Syne', sans-serif",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "#e8f0ff",
    marginBottom: 6,
  },
  authSub: {
    color: "#4d6080",
    fontSize: "0.84rem",
    lineHeight: 1.5,
    marginBottom: 24,
  },
  input: {
    width: "100%",
    background: "rgba(10,20,40,0.7)",
    border: "1.5px solid rgba(79,172,254,0.2)",
    borderRadius: 12,
    color: "#e8f0ff",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.95rem",
    padding: "13px 16px",
    outline: "none",
    transition: "border-color 0.2s",
    textAlign: "left",
    display: "block",
  },
  progressCard: {
    background: "rgba(10,18,35,0.6)",
    border: "1px solid rgba(79,172,254,0.1)",
    borderRadius: 16,
    padding: "18px 22px",
    margin: "24px 32px 0",
    position: "relative",
    zIndex: 1,
  },
  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: "0.84rem",
    fontWeight: 600,
  },
  progressCount: {
    fontFamily: "monospace",
    fontSize: "0.78rem",
    color: "#3d4f70",
  },
  track: {
    height: 6,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 99,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 99,
    transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
  },
  tableWrap: {
    margin: "0 32px",
    border: "1px solid rgba(79,172,254,0.1)",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    zIndex: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.86rem",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#3d4f70",
    background: "rgba(10,20,40,0.9)",
    borderBottom: "1px solid rgba(79,172,254,0.08)",
    textTransform: "uppercase",
  },
  td: {
    padding: "11px 16px",
    color: "#8a9bbf",
    borderBottom: "1px solid rgba(79,172,254,0.05)",
    verticalAlign: "middle",
  },
  btnDel: {
    background: "rgba(255,68,68,0.1)",
    border: "1px solid rgba(255,68,68,0.25)",
    borderRadius: 8,
    color: "#ff6b6b",
    fontSize: "0.75rem",
    padding: "5px 10px",
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
  },
  btnYes: {
    background: "rgba(255,68,68,0.2)",
    border: "1px solid rgba(255,68,68,0.4)",
    borderRadius: 7,
    color: "#ff6b6b",
    fontSize: "0.74rem",
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
  },
  btnNo: {
    background: "rgba(79,172,254,0.1)",
    border: "1px solid rgba(79,172,254,0.25)",
    borderRadius: 7,
    color: "#4facfe",
    fontSize: "0.74rem",
    padding: "4px 10px",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 700,
  },
  empty: {
    textAlign: "center",
    color: "#2d3d55",
    padding: "60px 0",
    fontSize: "0.9rem",
    position: "relative",
    zIndex: 1,
  },
  guideBox: {
    margin: "24px 32px 0",
    background: "rgba(79,172,254,0.05)",
    border: "1px solid rgba(79,172,254,0.12)",
    borderRadius: 16,
    padding: "20px 22px",
    position: "relative",
    zIndex: 1,
  },
  guideTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: "0.88rem",
    color: "#4facfe",
    marginBottom: 12,
    letterSpacing: "0.04em",
  },
  guideStep: {
    fontSize: "0.83rem",
    color: "#6a7f9f",
    lineHeight: 1.7,
    paddingLeft: 4,
  },
};

// ─── Form Page ────────────────────────────────────────────────

function FormPage({ onSwitch }) {
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [status,     setStatus]     = useState("idle");
  const [slotInfo,   setSlotInfo]   = useState(null);
  const [slotResult, setSlotResult] = useState(null);
  const [savedName,  setSavedName]  = useState("");

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
      form.append("action", "save");
      form.append("name", name.trim());
      form.append("phone", phone.trim());
      await fetch(SCRIPT_URL, { method: "POST", body: form, mode: "no-cors" });
      const newCount = slotInfo ? slotInfo.count + 1 : 1;
      setSlotInfo(s => s ? { ...s, count: newCount, remaining: MAX_SLOTS - newCount } : null);
      setSlotResult(newCount);
      setSavedName(name.trim());
      setStatus("success");
      setName(""); setPhone("");
    } catch { setStatus("error"); }
  }

  const isFull    = slotInfo && slotInfo.count >= MAX_SLOTS;
  const pct       = slotInfo ? Math.min(100, Math.round((slotInfo.count / MAX_SLOTS) * 100)) : 0;
  const slotsLeft = slotInfo ? slotInfo.remaining : MAX_SLOTS;

  return (
    <div style={S.page}>
      <style>{css}</style>

      <div className="bg-grid" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />
      <div className="top-line" />

      <div style={S.wrapper} className="wrapper-grid">

        {/* ── LEFT PANEL ── */}
        <div style={S.hero} className="hero-panel">
          <div style={S.heroPill}>
            <span style={S.pillDot} /> EXCLUSIVE NETWORK · 300 SLOTS ONLY
          </div>

          <h1 style={S.heroH1}>
            <span style={S.heroLine1}>Massive</span>
            <span style={S.heroLine2}>Gains</span>
            <span style={S.heroLine3}>300.0</span>
          </h1>

          <p style={S.heroSub}>
            A verified Nigerian WhatsApp network built for serious entrepreneurs, hustlers &amp; go-getters. One import. 300 connections. Unlimited opportunity.
          </p>

          <div style={S.proofRow}>
            <div style={S.proofPill}>🇳🇬 Nigeria-Based</div>
            <div style={S.proofPill}>✅ Verified Members</div>
            <div style={S.proofPill}>⚡ MCG Prefixed</div>
          </div>

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

          <div style={S.featureList}>
            {[
              ["⚡", "Instant contact import via .vcf file"],
              ["👁", "See all 300 members' WhatsApp Status"],
              ["🏷️", "MCG prefix — organised & verified"],
              ["🔒", "300-slot limited network — claim yours now"],
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

            <div style={S.cardBadge}>
              <span style={S.cardBadgeInner}>SECURE REGISTRATION</span>
            </div>

            {status === "success" ? (
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
                  Successfully, kindly return to the admin in order for you to be added to the main group.
                </p>
              </div>
            ) : isFull ? (
              <div style={S.fullWrap}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: 12 }}>🔒</span>
                <h3 style={S.fullH}>Registration Closed</h3>
                <p style={S.fullMsg}>All 300 MCG slots have been filled. The network is complete!</p>
              </div>
            ) : (
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
                    <input
                      className="field-input"
                      style={S.fieldInput}
                      type="tel"
                      placeholder="08012345678"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); setStatus("idle"); }}
                    />
                    <p style={S.fieldHint}>No country code needed — enter normally</p>
                  </div>
                </div>

                {status === "error"    && <Alert>Please fill in both your name and number.</Alert>}
                {status === "badphone" && <Alert>Enter a valid Nigerian number (e.g. 08012345678).</Alert>}

                <button
                  className="btn-submit"
                  style={{
                    ...S.btnSubmit,
                    opacity: status === "loading" ? 0.6 : 1,
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                  }}
                  onClick={handleSubmit}
                  disabled={status === "loading"}
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

      {!fetched ? (
        <div style={A.authCard}>
          <div style={A.authIcon}>🔐</div>
          <h3 style={A.authH}>Admin Access</h3>
          <p style={A.authSub}>Enter your secret to view and manage all registered contacts</p>
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
            style={{ ...A.input, margin: "20px 32px 18px", width: "calc(100% - 64px)" }}
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
            <p style={A.guideTitle}>📲 How to distribute the .vcf file</p>
            <p style={A.guideStep}>
              1. Click <strong style={{ color: "#4facfe" }}>Download .vcf</strong> to save the contact file.<br />
              2. Share <strong>MCG_ContactsGain_May2026.vcf</strong> in the WhatsApp group.<br />
              3. Members tap the file → <em>Import All</em> — all 300 contacts added instantly.<br />
              4. Everyone can now see each other's WhatsApp Status automatically.
            </p>
          </div>
        </>
      )}
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

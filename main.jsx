import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  Package,
  Video,
  TrendingUp,
  Wrench,
  Link2,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const C = {
  bg: "#14171F",
  panel: "#1D2130",
  panelLight: "#252A3C",
  text: "#EDE9DE",
  muted: "#8A8FA3",
  gold: "#E7B44E",
  teal: "#3FA796",
  coral: "#E2694B",
  line: "#2E3346",
};

function fmtN(n) {
  const num = Number(n) || 0;
  return "₦" + num.toLocaleString("en-NG");
}

const MODULES = [
  {
    id: "ai",
    title: "AI Tools & Freelancing",
    tease: "Use AI to offer services faster than the competition",
    Icon: Sparkles,
    points: [
      "AI writing, design, and coding tools let one person do work that used to take a small team.",
      "Start by picking one skill (writing, editing, basic design) and using AI tools to speed up your output.",
      "Build 2–3 sample projects for a portfolio before you pitch anyone.",
      "List your services on a freelance platform and price on the lower end while you build reviews, then raise your rate.",
    ],
    affiliate: { label: "Recommended AI toolkit", desc: "A starter bundle of AI tools for freelancers.", url: "" },
  },
  {
    id: "dropship",
    title: "Dropshipping / E-commerce",
    tease: "Sell products online without holding stock",
    Icon: Package,
    points: [
      "You list a product, a supplier ships it directly to the customer — you never touch inventory.",
      "Pick one niche instead of a bit of everything; focus builds trust faster.",
      "Test with a small ad budget before committing more money.",
      "Margins are thinner than they look once you count ads and returns — treat it as a real business, not a shortcut.",
    ],
    affiliate: { label: "Recommended store platform", desc: "Set up a storefront in under an hour.", url: "" },
  },
  {
    id: "content",
    title: "Content Creation",
    tease: "Build an audience, then monetize it",
    Icon: Video,
    points: [
      "Pick one platform and one topic you can talk about consistently for months.",
      "A smaller, engaged audience earns more than a big, indifferent one — niche down.",
      "Expect the first 6–12 months to be about skill-building, not income.",
      "Once you have an audience, income comes from brand deals, ads, and your own products.",
    ],
    affiliate: { label: "Recommended editing tool", desc: "Cut and edit content faster from your phone.", url: "" },
  },
  {
    id: "trading",
    title: "Trading & Investing",
    tease: "Grow money over time — with real risk",
    Icon: TrendingUp,
    points: [
      "Investing means putting money into assets hoping they grow in value — there's always a chance of loss.",
      "Never invest money you'll need in the next 12 months.",
      "Spreading money across different assets lowers the damage from any single one falling.",
      "Be skeptical of anything promising guaranteed high returns — that's a red flag, not an opportunity.",
    ],
    affiliate: { label: "Recommended learning platform", desc: "Investing basics before you put money in.", url: "" },
    note: "This is general education, not personal financial advice. Consider speaking with a licensed financial advisor before investing.",
  },
  {
    id: "trade",
    title: "Skilled Trade & Local Services",
    tease: "Hands-on work with immediate local demand",
    Icon: Wrench,
    points: [
      "Repairs, tailoring, catering, tutoring, event services — all have steady local demand.",
      "Start with people you already know and ask them to refer you.",
      "Price based on your time, materials, and a fair margin — don't undercharge to compete.",
      "Low starting cost and word-of-mouth growth make this one of the fastest ways to get your first paying customer.",
    ],
    affiliate: { label: "Recommended certification course", desc: "Get certified in an in-demand local trade.", url: "" },
  },
  {
    id: "affiliate",
    title: "Affiliate Marketing",
    tease: "Earn a commission recommending things you trust",
    Icon: Link2,
    points: [
      "You get a unique link — when someone buys through it, you earn a commission.",
      "Works best when paired with an audience you already have or are building (this module is a live example).",
      "Always disclose that your links are affiliate links — it's the law in many places, and it builds trust.",
      "Commissions per sale are usually small, so this works on volume and genuine trust, not one big win.",
    ],
    affiliate: { label: "Recommended affiliate network", desc: "Find products relevant to your audience.", url: "" },
  },
];

const STEPS = [
  { id: "welcome", input: "continue", bot: () => "Hey — I'm here to help you get a clearer picture of your money, and show you a few legit ways to grow it. Takes about 2 minutes. Ready?" },
  { id: "age", key: "age", input: "number", placeholder: "Age", bot: () => "First, how old are you?" },
  { id: "marital", key: "marital", input: "buttons", options: ["Single", "Married", "Divorced / Widowed"], bot: () => "What's your marital status?" },
  { id: "familySize", key: "familySize", input: "number", placeholder: "Number of people", bot: () => "How many people, including you, depend on your income?" },
  { id: "income", key: "income", input: "number", placeholder: "Monthly income", bot: () => "What's your average monthly income? (₦)" },
  { id: "expenses", key: "expenses", input: "number", placeholder: "Monthly expenses", bot: () => "And your average monthly expenses — everything combined? (₦)" },
  {
    id: "insight",
    input: "continue",
    bot: (a) => {
      const income = Number(a.income) || 0;
      const expenses = Number(a.expenses) || 0;
      const diff = income - expenses;
      if (income === 0 && expenses === 0) return "Got it. Let's keep going.";
      if (diff > 0) return `Based on what you shared, you've got roughly ${fmtN(diff)} left over most months. That's real room to build with. (Just a rough picture, not financial advice.)`;
      if (diff === 0) return "Looks like you're breaking even most months — income matches expenses with little buffer. (Rough picture, not financial advice.)";
      return `Right now expenses look like they outpace income by about ${fmtN(Math.abs(diff))} most months. That's tight — and exactly why an extra income stream can help. (Rough picture, not financial advice.)`;
    },
  },
  { id: "goal", key: "goal", input: "buttons", options: ["Cover basic expenses", "Save for something specific", "Pay off debt", "Build long-term wealth", "Support my family more"], bot: () => "What's the money goal on your mind most right now?" },
  { id: "ready", key: "ready", input: "buttons", options: ["Yes, show me", "Not right now"], bot: () => "Would you be open to exploring a legitimate way to earn extra income alongside what you already do?" },
];

// A stable per-device id, used only to let someone resume their own
// in-progress chat on this device. It is stored with each saved lead
// so you can tell repeat visitors apart in the database if you want to.
function getDeviceId() {
  let id = localStorage.getItem("growpath-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("growpath-device-id", id);
  }
  return id;
}

export default function App() {
  const [phase, setPhase] = useState("loading");
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [textVal, setTextVal] = useState("");
  const [selectedModule, setSelectedModule] = useState(null);
  const [saveError, setSaveError] = useState("");
  const scrollRef = useRef(null);
  const deviceId = useRef(getDeviceId());

  useEffect(() => {
    const saved = localStorage.getItem("growpath-progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed.answers || {});
        if (parsed.phase === "modules" || parsed.phase === "declined") {
          setPhase(parsed.phase);
          return;
        }
      } catch (e) {
        // ignore corrupted local data
      }
    }
    setPhase("chat");
  }, []);

  useEffect(() => {
    if (phase !== "chat") return;
    if (stepIndex >= STEPS.length) return;
    setTyping(true);
    const t = setTimeout(() => {
      const step = STEPS[stepIndex];
      setMessages((prev) => [...prev, { from: "bot", text: step.bot(answers) }]);
      setTyping(false);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIndex]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  // Save the finished profile as a lead in Supabase, and remember locally
  // so this device lands back on the right screen next visit.
  useEffect(() => {
    if (phase === "modules" || phase === "declined") {
      localStorage.setItem("growpath-progress", JSON.stringify({ answers, phase }));
      saveLead(answers, phase);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveLead(a, finalPhase) {
    setSaveError("");
    const { error } = await supabase.from("leads").insert({
      device_id: deviceId.current,
      age: a.age ? Number(a.age) : null,
      marital_status: a.marital || null,
      family_size: a.familySize ? Number(a.familySize) : null,
      monthly_income: a.income ? Number(a.income) : null,
      monthly_expenses: a.expenses ? Number(a.expenses) : null,
      goal: a.goal || null,
      opted_in: finalPhase === "modules",
    });
    if (error) {
      console.error(error);
      setSaveError("Saved locally, but couldn't reach the database.");
    }
  }

  async function logModuleView(moduleId) {
    const { error } = await supabase.from("module_views").insert({
      device_id: deviceId.current,
      module_id: moduleId,
    });
    if (error) console.error(error);
  }

  function submitAnswer(value, displayText) {
    const step = STEPS[stepIndex];
    if (step.key) setAnswers((prev) => ({ ...prev, [step.key]: value }));
    if (displayText) setMessages((prev) => [...prev, { from: "user", text: displayText }]);
    setTextVal("");

    if (step.id === "ready") {
      if (value === "Not right now") {
        setPhase("declined");
      } else {
        setTimeout(() => setPhase("modules"), 500);
      }
      return;
    }
    setStepIndex((i) => i + 1);
  }

  function restart() {
    localStorage.removeItem("growpath-progress");
    setAnswers({});
    setMessages([]);
    setStepIndex(0);
    setSelectedModule(null);
    setPhase("chat");
  }

  function openModule(m) {
    setSelectedModule(m);
    setPhase("detail");
    logModuleView(m.id);
  }

  if (phase === "loading") return <div style={{ background: C.bg, minHeight: "100vh" }} />;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.bg, color: C.text, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "1.25rem 1.25rem 0.9rem", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: C.gold }}>Grow</span>Path
          </div>
          {phase === "chat" && (
            <div style={{ fontSize: "0.7rem", color: C.muted, fontFamily: "'IBM Plex Mono', monospace", marginTop: "2px" }}>
              step {Math.min(stepIndex + 1, STEPS.length)} of {STEPS.length}
            </div>
          )}
        </div>
        {phase !== "chat" && (
          <button onClick={restart} style={ghostBtn}>
            <RotateCcw size={13} /> Start over
          </button>
        )}
      </header>

      {phase === "chat" && (
        <>
          <div style={{ display: "flex", gap: "3px", padding: "0.6rem 1.25rem 0" }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= stepIndex ? C.gold : C.line }} />
            ))}
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === "bot" ? "flex-start" : "flex-end", maxWidth: "82%", background: m.from === "bot" ? C.panel : C.gold, color: m.from === "bot" ? C.text : "#1B1506", padding: "0.65rem 0.9rem", borderRadius: m.from === "bot" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", fontSize: "0.92rem", lineHeight: 1.4 }}>
                {m.text}
              </div>
            ))}
            {typing && (
              <div style={{ alignSelf: "flex-start", background: C.panel, padding: "0.65rem 0.9rem", borderRadius: "4px 14px 14px 14px", display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((d) => (
                  <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: C.muted, opacity: 0.6, animation: "pulse 1s infinite", animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          {!typing && stepIndex < STEPS.length && (
            <div style={{ padding: "0.75rem 1.25rem 1.25rem", borderTop: `1px solid ${C.line}` }}>
              <StepInput step={STEPS[stepIndex]} textVal={textVal} setTextVal={setTextVal} onSubmit={submitAnswer} />
            </div>
          )}
        </>
      )}

      {phase === "declined" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center", gap: "0.75rem" }}>
          <CheckCircle2 size={32} color={C.teal} />
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.2rem" }}>No pressure</div>
          <div style={{ color: C.muted, fontSize: "0.9rem", maxWidth: "26rem" }}>
            Whenever you're ready to look at legit ways to grow your income, come back and I'll walk you through it.
          </div>
          <button onClick={() => setPhase("modules")} style={{ ...ghostBtn, marginTop: "0.5rem" }}>
            Actually, show me now
          </button>
        </div>
      )}

      {phase === "modules" && (
        <div style={{ padding: "1.25rem", overflowY: "auto" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.15rem" }}>Pick a path to explore</div>
            <div style={{ color: C.muted, fontSize: "0.85rem", marginTop: "0.2rem" }}>Based on your goal: {answers.goal || "growing your income"}</div>
          </div>
          {saveError && <div style={{ color: C.coral, fontSize: "0.78rem", marginBottom: "0.8rem" }}>{saveError}</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {MODULES.map((m) => (
              <button key={m.id} onClick={() => openModule(m)} style={{ textAlign: "left", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "10px", padding: "0.9rem", display: "flex", alignItems: "center", gap: "0.8rem", cursor: "pointer", color: C.text }}>
                <div style={{ background: C.panelLight, borderRadius: "8px", padding: "0.55rem", display: "flex" }}>
                  <m.Icon size={20} color={C.gold} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.title}</div>
                  <div style={{ color: C.muted, fontSize: "0.8rem", marginTop: "1px" }}>{m.tease}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: "1.5rem", fontSize: "0.72rem", color: C.muted, textAlign: "center", lineHeight: 1.5 }}>
            Educational content only — not professional financial advice.
            <br />
            Some links may be affiliate links and could earn a commission.
          </div>
        </div>
      )}

      {phase === "detail" && selectedModule && (
        <div style={{ padding: "1.25rem", overflowY: "auto" }}>
          <button onClick={() => setPhase("modules")} style={{ ...ghostBtn, marginBottom: "1rem" }}>
            <ArrowLeft size={13} /> All paths
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1rem" }}>
            <div style={{ background: C.panelLight, borderRadius: "8px", padding: "0.6rem", display: "flex" }}>
              <selectedModule.Icon size={22} color={C.gold} />
            </div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.15rem" }}>{selectedModule.title}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
            {selectedModule.points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "0.6rem", background: C.panel, padding: "0.7rem 0.85rem", borderRadius: "8px", fontSize: "0.88rem", lineHeight: 1.45 }}>
                <span style={{ color: C.teal, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>

          {selectedModule.note && (
            <div style={{ fontSize: "0.78rem", color: C.coral, background: "rgba(226,105,75,0.1)", border: `1px solid ${C.coral}`, borderRadius: "8px", padding: "0.6rem 0.75rem", marginBottom: "1.25rem" }}>
              {selectedModule.note}
            </div>
          )}

          <div style={{ background: C.panelLight, border: `1px dashed ${C.gold}`, borderRadius: "10px", padding: "0.9rem" }}>
            <div style={{ fontSize: "0.7rem", color: C.gold, textTransform: "uppercase", letterSpacing: "0.04em", fontFamily: "'IBM Plex Mono', monospace", marginBottom: "0.35rem" }}>
              Affiliate placeholder
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.92rem" }}>{selectedModule.affiliate.label}</div>
            <div style={{ color: C.muted, fontSize: "0.82rem", margin: "0.2rem 0 0.7rem" }}>{selectedModule.affiliate.desc}</div>
            {selectedModule.affiliate.url ? (
              <a href={selectedModule.affiliate.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: C.gold, color: "#1B1506", fontSize: "0.8rem", fontWeight: 700, padding: "0.5rem 0.8rem", borderRadius: "6px", textDecoration: "none" }}>
                <ExternalLink size={14} /> Check it out
              </a>
            ) : (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: C.line, color: C.muted, fontSize: "0.8rem", padding: "0.5rem 0.8rem", borderRadius: "6px" }}>
                <ExternalLink size={14} /> link not yet added
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.9} }
        button { font-family: inherit; }
        input:focus { outline: 2px solid ${C.gold}; }
      `}</style>
    </div>
  );
}

function StepInput({ step, textVal, setTextVal, onSubmit }) {
  if (step.input === "continue") {
    return <button onClick={() => onSubmit(null, null)} style={primaryBtn}>Continue</button>;
  }
  if (step.input === "buttons") {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {step.options.map((opt) => (
          <button key={opt} onClick={() => onSubmit(opt, opt)} style={chipBtn}>{opt}</button>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <input
        autoFocus
        value={textVal}
        onChange={(e) => setTextVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && textVal.trim()) onSubmit(textVal.trim(), textVal.trim()); }}
        placeholder={step.placeholder}
        inputMode={step.input === "number" ? "numeric" : "text"}
        style={{ flex: 1, background: C.panel, border: `1px solid ${C.line}`, borderRadius: "8px", padding: "0.7rem 0.85rem", color: C.text, fontSize: "0.92rem", fontFamily: step.input === "number" ? "'IBM Plex Mono', monospace" : "inherit" }}
      />
      <button onClick={() => textVal.trim() && onSubmit(textVal.trim(), textVal.trim())} style={{ ...primaryBtn, width: "3rem", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Send size={16} />
      </button>
    </div>
  );
}

const primaryBtn = { background: C.gold, color: "#1B1506", border: "none", borderRadius: "8px", padding: "0.7rem 1.1rem", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", width: "100%" };
const chipBtn = { background: C.panel, color: C.text, border: `1px solid ${C.line}`, borderRadius: "20px", padding: "0.5rem 0.9rem", fontSize: "0.85rem", cursor: "pointer" };
const ghostBtn = { background: "none", border: `1px solid ${C.line}`, color: C.muted, borderRadius: "6px", padding: "0.4rem 0.7rem", fontSize: "0.78rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.3rem" };

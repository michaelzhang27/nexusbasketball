"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

type DataView = "mens" | "womens";

interface TeamOption {
  team: string;
  conference: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8005";

const FEATURES = [
  {
    num: "01",
    label: "Portal Tracking",
    desc: "Every D1 player in the transfer portal with live stats & contact status.",
  },
  {
    num: "02",
    label: "Custom Fit Scoring",
    desc: "Per-40 weighted models by position. Your coefficients, not a generic algo.",
  },
  {
    num: "03",
    label: "Roster Simulation",
    desc: "Build depth charts and stress-test your rotation before committing to an offer.",
  },
  {
    num: "04",
    label: "NIL Modeling",
    desc: "Roster-adjusted NIL ranges based on position, usage, and your remaining budget.",
  },
];

const PARTICLES = [
  { label: "FIT 91/99", x: 6, y: 20, dur: 22, delay: 0, opacity: 0.4 },
  { label: "3PT 41.2%", x: 78, y: 32, dur: 25, delay: 3.5, opacity: 0.33 },
  { label: "BPM +6.8", x: 12, y: 68, dur: 20, delay: 7.0, opacity: 0.38 },
  { label: "USG 28.7%", x: 88, y: 60, dur: 27, delay: 1.8, opacity: 0.28 },
  { label: "$280–340k", x: 44, y: 82, dur: 21, delay: 5.2, opacity: 0.35 },
  { label: "TS% 64.1", x: 32, y: 8, dur: 24, delay: 9.0, opacity: 0.28 },
  // center fill
  { label: "19.4 PPG", x: 48, y: 38, dur: 21, delay: 2.3, opacity: 0.38 },
  { label: "AST/TO 2.4", x: 36, y: 52, dur: 23, delay: 6.4, opacity: 0.32 },
  { label: "REB% 14.2", x: 58, y: 48, dur: 20, delay: 10.5, opacity: 0.3 },
  { label: "+12 P/M", x: 42, y: 25, dur: 26, delay: 4.7, opacity: 0.33 },
  { label: "WIN% 72", x: 55, y: 65, dur: 19, delay: 8.1, opacity: 0.28 },
  { label: "PACE 71.4", x: 30, y: 42, dur: 22, delay: 1.5, opacity: 0.3 },
];

function passwordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  if (pw.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function SignupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dataView, setDataView] = useState<DataView>("mens");
  const [teamName, setTeamName] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const teamDropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  const pwStrength = passwordStrength(password);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Fetch team list from backend
  useEffect(() => {
    fetch(`${API_BASE}/api/teams`)
      .then((r) => r.json())
      .then((data: TeamOption[]) => setTeams(data))
      .catch(() => {
        /* backend unavailable — team dropdown stays empty */
      });
  }, []);

  // Close team dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        teamDropdownRef.current &&
        !teamDropdownRef.current.contains(e.target as Node)
      ) {
        setTeamDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Cycle feature highlights
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    // Step 1 — create the account via backend (admin API, email pre-confirmed)
    const signupRes = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        data_view: dataView,
        team_name: teamName || null,
      }),
    });

    if (!signupRes.ok) {
      const body = await signupRes.json().catch(() => ({}));
      setError(body.detail ?? "Failed to create account. Please try again.");
      setLoading(false);
      return;
    }

    // Step 2 — sign in immediately (no email confirmation required)
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/board");
    router.refresh();
  }

  return (
    <>
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
          8%   { opacity: var(--p-opacity); }
          88%  { opacity: var(--p-opacity); }
          100% { transform: translateY(-150px) translateX(6px); opacity: 0; }
        }
        @keyframes court-breathe {
          0%, 100% { opacity: 0.025; }
          50%       { opacity: 0.05;  }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.2; }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes feature-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .particle { animation: float-up var(--p-dur) ease-in-out var(--p-delay) infinite backwards; }
        .court-svg { animation: court-breathe 9s ease-in-out infinite; }
        .form-field { animation: slide-in-right 0.5s ease forwards; opacity: 0; }
        .left-content { animation: fade-in 0.7s ease 0.1s forwards; opacity: 0; }
        .input-focused { box-shadow: 0 0 0 3px rgba(59,130,246,0.12), 0 0 20px rgba(59,130,246,0.06); }
        .btn-shimmer {
          background-size: 200% auto;
          background-image: linear-gradient(90deg, #2563eb 0%, #3b82f6 40%, #60a5fa 50%, #3b82f6 60%, #2563eb 100%);
        }
        .btn-shimmer:hover:not(:disabled) {
          animation: shimmer 1.6s linear infinite;
        }
        .feature-row {
          transition: all 0.35s ease;
        }
      `}</style>

      <div className="min-h-screen flex bg-[#080a0d] text-white overflow-hidden">
        {/* ── Left panel ──────────────────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
          {/* Glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[20%] left-[35%] -translate-x-1/2 w-[700px] h-[600px] bg-blue-600/7 rounded-full blur-[130px]" />
            <div className="absolute top-[65%] left-[5%] w-[380px] h-[380px] bg-indigo-800/6 rounded-full blur-[90px]" />
          </div>

          {/* Court SVG */}
          <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden">
            <svg
              viewBox="0 0 520 470"
              className="court-svg w-[580px] h-auto mr-[-50px]"
              fill="none"
              stroke="white"
              strokeWidth="1.2"
            >
              <rect x="10" y="10" width="500" height="450" />
              <rect x="185" y="10" width="150" height="188" />
              <rect x="205" y="10" width="110" height="188" />
              <path d="M 205 198 A 55 55 0 0 0 315 198" />
              <path d="M 205 198 A 55 55 0 0 1 315 198" strokeDasharray="6 5" />
              <path d="M 58 10 L 58 108 A 214 214 0 0 0 462 108 L 462 10" />
              <line x1="10" y1="108" x2="58" y2="108" />
              <line x1="462" y1="108" x2="510" y2="108" />
              <rect x="238" y="10" width="44" height="5" />
              <circle cx="260" cy="38" r="9" />
              <path d="M 224 10 A 36 36 0 0 1 296 10" />
              <line x1="185" y1="112" x2="172" y2="112" />
              <line x1="185" y1="140" x2="172" y2="140" />
              <line x1="185" y1="168" x2="172" y2="168" />
              <line x1="335" y1="112" x2="348" y2="112" />
              <line x1="335" y1="140" x2="348" y2="140" />
              <line x1="335" y1="168" x2="348" y2="168" />
              <line x1="10" y1="460" x2="510" y2="460" />
              <circle cx="260" cy="460" r="55" />
              <circle cx="260" cy="460" r="24" />
            </svg>
          </div>

          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "36px 36px",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 40% 50%, black 20%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 80% at 40% 50%, black 20%, transparent 100%)",
            }}
          />

          {/* Particles */}
          {mounted && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              {PARTICLES.map((p, i) => (
                <span
                  key={i}
                  className="particle absolute font-mono text-[10px] text-blue-200/80 whitespace-nowrap tracking-tight"
                  style={
                    {
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      "--p-opacity": p.opacity,
                      "--p-dur": `${p.dur}s`,
                      "--p-delay": `${p.delay}s`,
                    } as React.CSSProperties
                  }
                >
                  {p.label}
                </span>
              ))}
            </div>
          )}

          {/* Left copy */}
          <div className="left-content relative z-10 flex flex-col justify-between h-full px-12 py-10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="font-bold tracking-widest text-blue-400 text-sm uppercase group-hover:text-blue-300 transition-colors">
                Nexus Analytics
              </span>
              <Badge variant="amber" className="text-[10px] px-1.5 py-0.5">
                BETA
              </Badge>
            </Link>

            {/* Feature showcase */}
            <div className="space-y-5 max-w-[400px]">
              <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  style={{ animation: "blink-dot 2.5s ease infinite" }}
                />
                <span className="text-xs text-blue-300 font-medium tracking-wide">
                  Get started in seconds
                </span>
              </div>

              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                Your recruiting edge
                <br />
                <span className="text-blue-400">starts here.</span>
              </h2>

              <div className="space-y-2 pt-2">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.num}
                    className="feature-row flex items-start gap-3 px-3 py-3 rounded-xl cursor-default"
                    style={{
                      background:
                        activeFeature === i
                          ? "rgba(59,130,246,0.07)"
                          : "transparent",
                      borderLeft:
                        activeFeature === i
                          ? "2px solid rgba(59,130,246,0.5)"
                          : "2px solid transparent",
                    }}
                    onMouseEnter={() => setActiveFeature(i)}
                  >
                    <div className="flex items-center gap-2 mt-0.5 shrink-0">
                      <span className="text-[10px] font-bold text-gray-700 tabular-nums">
                        {f.num}
                      </span>
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300"
                        style={{
                          background:
                            activeFeature === i
                              ? "rgba(59,130,246,0.2)"
                              : "transparent",
                          border:
                            activeFeature === i
                              ? "1px solid rgba(59,130,246,0.4)"
                              : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {activeFeature === i && (
                          <Check className="w-2.5 h-2.5 text-blue-400" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold transition-colors duration-300",
                          activeFeature === i
                            ? "text-blue-300"
                            : "text-gray-400",
                        )}
                      >
                        {f.label}
                      </p>
                      <p
                        className={cn(
                          "text-[11px] leading-relaxed transition-all duration-300 overflow-hidden",
                          activeFeature === i
                            ? "text-gray-500 max-h-10 mt-0.5"
                            : "text-transparent max-h-0",
                        )}
                      >
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-gray-700">
              © 2025 Nexus Analytics · NCAA D1 Men's Basketball
            </p>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────────── */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />

        {/* ── Right panel: form ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center w-full lg:w-[520px] lg:flex-shrink-0 px-8 py-12 relative overflow-y-auto">
          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold tracking-widest text-blue-400 text-sm uppercase">
                Nexus Analytics
              </span>
              <Badge variant="amber" className="text-[10px] px-1.5 py-0.5">
                BETA
              </Badge>
            </Link>
          </div>

          <div className="relative z-10 w-full max-w-sm">
            {/* Heading */}
            <div
              className="form-field mb-7"
              style={{ animationDelay: ready ? "0.05s" : "9999s" }}
            >
              <h1 className="text-2xl font-bold text-white">
                Create your account
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Get started with Nexus Analytics.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name */}
              <div
                className="form-field space-y-1.5"
                style={{ animationDelay: ready ? "0.10s" : "9999s" }}
              >
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                  Full name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Coach Johnson"
                    required
                    className={`w-full bg-[#0d1116] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all duration-200 ${
                      focusedField === "name"
                        ? "border-blue-500 input-focused"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  />
                  <div
                    className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-opacity duration-300"
                    style={{ opacity: focusedField === "name" ? 1 : 0 }}
                  />
                </div>
              </div>

              {/* Email */}
              <div
                className="form-field space-y-1.5"
                style={{ animationDelay: ready ? "0.16s" : "9999s" }}
              >
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="coach@university.edu"
                    required
                    className={`w-full bg-[#0d1116] border rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all duration-200 ${
                      focusedField === "email"
                        ? "border-blue-500 input-focused"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  />
                  <div
                    className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-opacity duration-300"
                    style={{ opacity: focusedField === "email" ? 1 : 0 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div
                className="form-field space-y-1.5"
                style={{ animationDelay: ready ? "0.22s" : "9999s" }}
              >
                <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Min. 8 characters"
                    required
                    className={`w-full bg-[#0d1116] border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all duration-200 ${
                      focusedField === "password"
                        ? "border-blue-500 input-focused"
                        : "border-white/[0.08] hover:border-white/[0.15]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-0.5"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <div
                    className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-opacity duration-300"
                    style={{ opacity: focusedField === "password" ? 1 : 0 }}
                  />
                </div>

                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="flex-1 h-0.5 rounded-full transition-all duration-400"
                          style={{
                            background:
                              n <= pwStrength.score
                                ? pwStrength.color
                                    .replace("bg-", "")
                                    .includes("red")
                                  ? "#ef4444"
                                  : pwStrength.color
                                        .replace("bg-", "")
                                        .includes("amber")
                                    ? "#f59e0b"
                                    : pwStrength.color
                                          .replace("bg-", "")
                                          .includes("emerald")
                                      ? "#10b981"
                                      : "#3b82f6"
                                : "rgba(255,255,255,0.06)",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className={cn(
                        "text-[10px] font-medium transition-colors",
                        pwStrength.score <= 1
                          ? "text-red-400"
                          : pwStrength.score <= 2
                            ? "text-amber-400"
                            : pwStrength.score <= 3
                              ? "text-blue-400"
                              : "text-emerald-400",
                      )}
                    >
                      {pwStrength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Team */}
              <div
                className="form-field space-y-1.5"
                style={{ animationDelay: ready ? "0.28s" : "9999s" }}
                ref={teamDropdownRef}
              >
                <div>
                  <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                    Your Team
                  </label>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Select the program you coach. Used for conference record
                    predictions.
                  </p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTeamDropdownOpen((v) => !v)}
                    className={cn(
                      "w-full bg-[#0d1116] border rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between transition-all duration-200 focus:outline-none",
                      teamDropdownOpen
                        ? "border-blue-500 input-focused"
                        : "border-white/[0.08] hover:border-white/[0.15]",
                      teamName ? "text-white" : "text-gray-700",
                    )}
                  >
                    <span className="truncate">
                      {teamName || "Search for your team…"}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-gray-600 shrink-0 ml-2 transition-transform",
                        teamDropdownOpen && "rotate-180",
                      )}
                    />
                  </button>

                  {teamDropdownOpen && (
                    <div className="absolute z-50 bottom-full mb-1 w-full bg-[#0d1116] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden">
                      {/* Search input */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.08]">
                        <Search className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <input
                          type="text"
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          placeholder="Type to search…"
                          autoFocus
                          className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-700 focus:outline-none"
                        />
                      </div>
                      {/* Options list */}
                      <div className="max-h-48 overflow-y-auto">
                        {teams
                          .filter(
                            (t) =>
                              t.team
                                .toLowerCase()
                                .includes(teamSearch.toLowerCase()) ||
                              t.conference
                                .toLowerCase()
                                .includes(teamSearch.toLowerCase()),
                          )
                          .slice(0, 80)
                          .map((t) => (
                            <button
                              key={t.team}
                              type="button"
                              onClick={() => {
                                setTeamName(t.team);
                                setTeamSearch("");
                                setTeamDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-white/5 transition-colors",
                                teamName === t.team
                                  ? "text-blue-300 bg-blue-900/15"
                                  : "text-gray-300",
                              )}
                            >
                              <span>{t.team}</span>
                              <span className="text-gray-600 text-[10px] ml-2 shrink-0">
                                {t.conference}
                              </span>
                            </button>
                          ))}
                        {teams.filter(
                          (t) =>
                            t.team
                              .toLowerCase()
                              .includes(teamSearch.toLowerCase()) ||
                            t.conference
                              .toLowerCase()
                              .includes(teamSearch.toLowerCase()),
                        ).length === 0 && (
                          <p className="text-xs text-gray-600 text-center py-4">
                            No teams found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data view */}
              <div
                className="form-field space-y-2"
                style={{ animationDelay: ready ? "0.34s" : "9999s" }}
              >
                <div>
                  <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                    Data view
                  </label>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Choose which transfer portal you&apos;d like to work with.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      value: "mens" as DataView,
                      label: "Men's",
                      sub: "D1 portal",
                    },
                    {
                      value: "womens" as DataView,
                      label: "Women's",
                      sub: "D1 portal",
                    },
                  ].map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDataView(value)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-medium border transition-all duration-200 text-left active:scale-[0.97]",
                        dataView === value
                          ? "bg-blue-600/15 border-blue-500/60 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                          : "bg-[#0d1116] border-white/[0.08] text-gray-400 hover:border-white/[0.18] hover:text-gray-300",
                      )}
                    >
                      <span className="block">{label}</span>
                      <span className="text-[10px] text-gray-600 font-normal">
                        {sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="form-field" style={{ animationDelay: "0s" }}>
                  <p className="text-xs text-red-400 bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    {error}
                  </p>
                </div>
              )}

              {/* Submit */}
              <div
                className="form-field pt-1"
                style={{ animationDelay: ready ? "0.42s" : "9999s" }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shimmer w-full py-3 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:shadow-blue-900/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating
                      account…
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div
              className="form-field mt-6 text-center"
              style={{ animationDelay: ready ? "0.48s" : "9999s" }}
            >
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

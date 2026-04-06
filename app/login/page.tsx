"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase";

const PARTICLES = [
  { label: "19.4 PPG", x: 8, y: 18, dur: 20, delay: 0, opacity: 0.45 },
  { label: "FG 54.1%", x: 72, y: 28, dur: 24, delay: 3.2, opacity: 0.35 },
  { label: "BPM +6.8", x: 15, y: 62, dur: 22, delay: 6.0, opacity: 0.4 },
  { label: "3PT 41.2%", x: 85, y: 55, dur: 26, delay: 1.5, opacity: 0.32 },
  { label: "7.3 APG", x: 48, y: 80, dur: 19, delay: 9.1, opacity: 0.38 },
  { label: "TS% 64.1", x: 30, y: 5, dur: 23, delay: 4.4, opacity: 0.3 },
  { label: "PER 22.8", x: 3, y: 44, dur: 25, delay: 2.2, opacity: 0.35 },
  { label: "ORT 116", x: 58, y: 10, dur: 18, delay: 5.0, opacity: 0.28 },
  // center fill
  { label: "FIT 91/99", x: 40, y: 35, dur: 22, delay: 2.6, opacity: 0.38 },
  { label: "AST/TO 2.4", x: 55, y: 50, dur: 20, delay: 7.8, opacity: 0.33 },
  { label: "REB% 14.2", x: 28, y: 55, dur: 25, delay: 4.1, opacity: 0.3 },
  { label: "$310k NIL", x: 62, y: 40, dur: 21, delay: 11.0, opacity: 0.32 },
  { label: "+12 P/M", x: 44, y: 68, dur: 23, delay: 0.7, opacity: 0.28 },
  { label: "WIN% 72", x: 35, y: 20, dur: 19, delay: 9.3, opacity: 0.3 },
];

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
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
          100% { transform: translateY(-160px) translateX(6px); opacity: 0; }
        }
        @keyframes court-breathe {
          0%, 100% { opacity: 0.028; }
          50%       { opacity: 0.055; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
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
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes input-glow-in {
          from { box-shadow: 0 0 0px 0px rgba(59,130,246,0); }
          to   { box-shadow: 0 0 0px 3px rgba(59,130,246,0.12), 0 0 20px rgba(59,130,246,0.06); }
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
      `}</style>

      <div className="min-h-screen flex bg-[#080a0d] text-white overflow-hidden">
        {/* ── Left panel: brand / ambient ─────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden">
          {/* Radial glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[15%] left-[40%] -translate-x-1/2 w-[700px] h-[600px] bg-blue-600/8 rounded-full blur-[120px]" />
            <div className="absolute top-[60%] left-[10%] w-[400px] h-[400px] bg-indigo-800/6 rounded-full blur-[90px]" />
          </div>

          {/* Basketball court SVG */}
          <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden">
            <svg
              viewBox="0 0 520 470"
              className="court-svg w-[640px] h-auto mr-[-60px]"
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

          {/* Floating stat particles */}
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

            {/* Center copy */}
            <div className="space-y-5 max-w-[420px]">
              <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/40 rounded-full px-4 py-1.5 backdrop-blur-sm">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  style={{ animation: "blink-dot 2.5s ease infinite" }}
                />
                <span className="text-xs text-blue-300 font-medium tracking-wide">
                  2026–27 Season · Live
                </span>
              </div>
              <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
                Every transfer.
                <br />
                <span className="text-blue-400">Scored for your system.</span>
              </h2>
              <p className="text-[13px] text-gray-500 leading-relaxed">
                8,470 D1 players. Custom fit models. NIL budget tools.
                Everything you need to fill your roster before the portal
                closes.
              </p>

              {/* Mini stat strip */}
              <div className="flex items-center gap-4 pt-2">
                {[
                  { v: "8,470", l: "Players" },
                  { v: "32", l: "Conferences" },
                  { v: "Live", l: "Portal Status" },
                ].map(({ v, l }) => (
                  <div key={l} className="text-center">
                    <p className="text-base font-bold text-white tabular-nums">
                      {v}
                    </p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider mt-0.5">
                      {l}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom attribution */}
            <p className="text-[11px] text-gray-700">
              © 2025 Nexus Analytics · NCAA D1 Men's Basketball
            </p>
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────────── */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />

        {/* ── Right panel: form ────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center w-full lg:w-[480px] lg:flex-shrink-0 px-8 py-12 relative">
          {/* Subtle right-side glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Mobile-only logo */}
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
              className="form-field mb-8"
              style={{ animationDelay: ready ? "0.05s" : "9999s" }}
            >
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="text-sm text-gray-500 mt-1.5">
                Sign in to your coaching account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div
                className="form-field space-y-1.5"
                style={{ animationDelay: ready ? "0.12s" : "9999s" }}
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
                  {/* Active indicator line */}
                  <div
                    className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent transition-opacity duration-300"
                    style={{ opacity: focusedField === "email" ? 1 : 0 }}
                  />
                </div>
              </div>

              {/* Password */}
              <div
                className="form-field space-y-1.5"
                style={{ animationDelay: ready ? "0.19s" : "9999s" }}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-400 tracking-wide uppercase">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[11px] text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
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
                style={{ animationDelay: ready ? "0.26s" : "9999s" }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-shimmer w-full py-3 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] hover:shadow-lg hover:shadow-blue-900/40"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Footer link */}
            <div
              className="form-field mt-6 text-center"
              style={{ animationDelay: ready ? "0.32s" : "9999s" }}
            >
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

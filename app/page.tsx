"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

// ── Floating stat particles ────────────────────────────────────────────────────
const PARTICLES = [
  { label: "19.4 PPG", x: 7, y: 22, dur: 20, delay: 0, opacity: 0.55 },
  { label: "FG 54.1%", x: 84, y: 30, dur: 24, delay: 3.2, opacity: 0.42 },
  { label: "BPM +6.8", x: 18, y: 66, dur: 22, delay: 6.0, opacity: 0.48 },
  { label: "3PT 41.2%", x: 90, y: 58, dur: 26, delay: 1.5, opacity: 0.38 },
  { label: "7.3 APG", x: 52, y: 84, dur: 19, delay: 9.1, opacity: 0.45 },
  { label: "TS% 64.1", x: 36, y: 7, dur: 23, delay: 4.4, opacity: 0.38 },
  { label: "USG 28.7%", x: 76, y: 87, dur: 21, delay: 7.5, opacity: 0.4 },
  { label: "PER 22.8", x: 3, y: 48, dur: 25, delay: 2.2, opacity: 0.42 },
  { label: "ORT 116", x: 62, y: 13, dur: 18, delay: 5.0, opacity: 0.35 },
  { label: "11.4 RPG", x: 93, y: 42, dur: 27, delay: 8.3, opacity: 0.32 },
  { label: "WIN SH 8.9", x: 44, y: 76, dur: 29, delay: 11.0, opacity: 0.3 },
  { label: "DRT 104", x: 14, y: 35, dur: 20, delay: 13.5, opacity: 0.35 },
];

const CONFERENCE_LOGOS = [
  { name: "ACC", src: "/users-logos/ACC-Logo.png" },
  { name: "SEC", src: "/users-logos/Southeastern-Conference-logo.png" },
  { name: "Big Ten", src: "/users-logos/Big_Ten_Conference_logo.svg.png" },
  {
    name: "Big 12",
    src: "/users-logos/Big_12_Conference_(cropped)_logo.svg.png",
  },
  {
    name: "Atlantic 10",
    src: "/users-logos/Atlantic_10_Conference_logo.svg.png",
  },
  { name: "ASUN", src: "/users-logos/Atlantic_Sun_Conference_logo.svg.png" },
  {
    name: "Ivy League",
    src: "/users-logos/ivy_league_logo_primary_2019_sportslogosnet-9024.png",
  },
];

const FEATURES = [
  {
    label: "Portal Tracking",
    desc: "Every D1 player in the transfer portal with live stats, eligibility windows, and contact status — filtered to what your system actually needs.",
  },
  {
    label: "Fit Scoring",
    desc: "Custom per-40 weighted models by position group. Guards and bigs evaluated differently, with your coefficients, not a generic algorithm.",
  },
  {
    label: "Roster Simulation",
    desc: "Build depth charts, project season production with ML predictions, and stress-test your rotation before committing to an offer.",
  },
  {
    label: "NIL Modeling",
    desc: "Roster-adjusted NIL ranges based on position, usage, and your remaining budget. Know the number before you get on the phone.",
  },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float-up {
          0%   { transform: translateY(0px) translateX(0px); opacity: 0; }
          8%   { opacity: var(--p-opacity); }
          88%  { opacity: var(--p-opacity); }
          100% { transform: translateY(-180px) translateX(8px); opacity: 0; }
        }
        @keyframes court-breathe {
          0%, 100% { opacity: 0.032; }
          50%       { opacity: 0.06;  }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes score-pop {
          from { opacity: 0; transform: scale(0.8) translateY(4px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);   }
        }
        @keyframes bar-fill {
          from { width: 0%; }
          to   { width: var(--bar-w); }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.2; }
        }
        @keyframes belt-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-25%); }
        }
        .particle {
          animation: float-up var(--p-dur) ease-in-out var(--p-delay) infinite backwards;
        }
        .court-svg { animation: court-breathe 9s ease-in-out infinite; }
        .hero-line {
          animation: fade-up 0.65s ease forwards;
          opacity: 0;
        }
        .logo-belt {
          animation: belt-scroll 50s linear infinite;
          will-change: transform;
        }
        .logo-belt:hover { animation-play-state: paused; }
      `}</style>

      <div className="min-h-screen bg-[#080a0d] text-white overflow-hidden relative">
        {/* ── Background: radial glows ───────────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[900px] h-[700px] bg-blue-600/7 rounded-full blur-[140px]" />
          <div className="absolute top-[55%] left-[20%]           w-[500px] h-[500px] bg-indigo-800/5 rounded-full blur-[100px]" />
        </div>

        {/* ── Background: basketball court SVG ──────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden">
          <svg
            viewBox="0 0 520 470"
            className="court-svg w-[740px] h-auto mr-[-80px]"
            fill="none"
            stroke="white"
            strokeWidth="1.3"
          >
            {/* Court boundary */}
            <rect x="10" y="10" width="500" height="450" />
            {/* Paint */}
            <rect x="185" y="10" width="150" height="188" />
            {/* Lane lines */}
            <rect x="205" y="10" width="110" height="188" />
            {/* Free throw circle top */}
            <path d="M 205 198 A 55 55 0 0 0 315 198" />
            {/* Free throw circle bottom (dashed look via two arcs) */}
            <path d="M 205 198 A 55 55 0 0 1 315 198" strokeDasharray="6 5" />
            {/* Three-point arc */}
            <path d="M 58 10 L 58 108 A 214 214 0 0 0 462 108 L 462 10" />
            {/* Corner three markers */}
            <line x1="10" y1="108" x2="58" y2="108" />
            <line x1="462" y1="108" x2="510" y2="108" />
            {/* Basket backboard */}
            <rect x="238" y="10" width="44" height="5" />
            {/* Basket */}
            <circle cx="260" cy="38" r="9" />
            {/* Restricted area arc */}
            <path d="M 224 10 A 36 36 0 0 1 296 10" />
            {/* Lane hash marks */}
            <line x1="185" y1="112" x2="172" y2="112" />
            <line x1="185" y1="140" x2="172" y2="140" />
            <line x1="185" y1="168" x2="172" y2="168" />
            <line x1="335" y1="112" x2="348" y2="112" />
            <line x1="335" y1="140" x2="348" y2="140" />
            <line x1="335" y1="168" x2="348" y2="168" />
            {/* Half-court line */}
            <line x1="10" y1="460" x2="510" y2="460" />
            {/* Center circle */}
            <circle cx="260" cy="460" r="55" />
            {/* Center tip-off circle (inner) */}
            <circle cx="260" cy="460" r="24" />
          </svg>
        </div>

        {/* ── Background: dot grid ───────────────────────────────────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 50% 40%, black 20%, transparent 100%)",
          }}
        />

        {/* ── Background: floating stat particles ───────────────────────────── */}
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

        {/* ── Nav ───────────────────────────────────────────────────────────── */}
        <header className="relative z-10 flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2.5">
            <span className="font-bold tracking-widest text-blue-400 text-sm uppercase">
              Nexus Analytics
            </span>
            <Badge variant="amber" className="text-[10px] px-1.5 py-0.5">
              BETA
            </Badge>
          </div>
          <nav className="flex items-center gap-1">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-blue-900/40"
            >
              Get access
            </Link>
          </nav>
        </header>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <main className="relative z-10 max-w-7xl mx-auto px-8 pt-14 pb-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-center min-h-[calc(100vh-160px)]">
          {/* Left: copy */}
          <div>
            {/* Live badge */}
            <div
              className="hero-line inline-flex items-center gap-2 bg-blue-950/70 border border-blue-800/50 rounded-full px-4 py-1.5 mb-9 backdrop-blur-sm"
              style={{ animationDelay: "0.05s" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                style={{ animation: "blink-dot 2.5s ease infinite" }}
              />
              <span className="text-xs text-blue-300 font-medium tracking-wide">
                2026–27 Season · 8,470 D1 Players
              </span>
            </div>

            <h1 className="font-bold leading-[1.06] tracking-tight">
              <span
                className="hero-line block text-5xl xl:text-[3.8rem] text-white"
                style={{ animationDelay: "0.15s" }}
              >
                Build your roster
              </span>
              <span
                className="hero-line block text-5xl xl:text-[3.8rem] text-blue-400"
                style={{ animationDelay: "0.25s" }}
              >
                before the portal
              </span>
              <span
                className="hero-line block text-5xl xl:text-[3.8rem] text-white"
                style={{ animationDelay: "0.35s" }}
              >
                closes.
              </span>
            </h1>

            <p
              className="hero-line mt-7 text-[15px] text-gray-400 leading-relaxed max-w-[420px]"
              style={{ animationDelay: "0.48s" }}
            >
              A single system for evaluating transfer portal players — custom
              fit scoring, ML stat projections, and NIL budget modeling. Built
              for how D1 recruiting actually works.
            </p>

            <div
              className="hero-line flex items-center gap-3 mt-10"
              style={{ animationDelay: "0.58s" }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all text-sm hover:shadow-xl hover:shadow-blue-900/40 active:scale-[0.97]"
              >
                Get access
                <span className="text-blue-300 text-base leading-none">→</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/4 hover:bg-white/8 border border-white/10 hover:border-white/20 text-gray-300 font-medium rounded-xl transition-colors text-sm"
              >
                Sign in
              </Link>
            </div>

            {/* Trust line */}
            <div
              className="hero-line mt-11 flex items-center gap-5 text-[11px] text-gray-600"
              style={{ animationDelay: "0.7s" }}
            >
              <span>8,470 players tracked</span>
              <span className="w-px h-3 bg-white/8" />
              <span>All 32 D1 conferences</span>
              <span className="w-px h-3 bg-white/8" />
              <span>Live portal status</span>
            </div>
          </div>

          {/* Right: product preview widget */}
          {mounted && (
            <div
              className="hidden lg:block"
              style={{
                animation: "fade-up 0.7s ease 0.5s forwards",
                opacity: 0,
              }}
            >
              <PlayerWidget />
            </div>
          )}
        </main>

        {/* ── Credibility belt ──────────────────────────────────────────────── */}
        <section className="relative z-10 pb-4">
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#080a0d] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#080a0d] to-transparent z-10 pointer-events-none" />

          {/* Label row */}
          <div className="flex items-center justify-center gap-6 mb-7">
            <div className="h-px flex-1 max-w-[120px] bg-white/[0.06]" />
            <p className="text-[10px] font-semibold text-gray-600 tracking-[0.18em] uppercase whitespace-nowrap">
              Trusted across major conferences
            </p>
            <div className="h-px flex-1 max-w-[120px] bg-white/[0.06]" />
          </div>

          {/* Scrolling belt — 4 copies so the strip always overfills any viewport */}
          <div className="overflow-hidden">
            <div className="logo-belt flex items-center gap-8 w-max">
              {[
                ...CONFERENCE_LOGOS,
                ...CONFERENCE_LOGOS,
                ...CONFERENCE_LOGOS,
                ...CONFERENCE_LOGOS,
              ].map((logo, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-center justify-center px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.07] opacity-50 hover:opacity-80 transition-opacity duration-300"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.name}
                    className="h-8 w-auto object-contain"
                    style={{ filter: "grayscale(1)" }}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ESPN callout */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-px w-16 bg-white/[0.05]" />
            <p className="text-[10px] text-gray-700 tracking-wide">
              as seen on
            </p>
            <div className="flex items-center justify-center px-4 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.07] opacity-40 hover:opacity-70 transition-opacity duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/users-logos/ESPN_wordmark.svg.png"
                alt="ESPN"
                className="h-4 w-auto object-contain"
                style={{ filter: "grayscale(1)" }}
                draggable={false}
              />
            </div>
            <div className="h-px w-16 bg-white/[0.05]" />
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section className="relative z-10 max-w-7xl mx-auto px-8 pb-24">
          <div className="border-t border-white/[0.06] pt-14">
            <p className="text-[10px] font-semibold text-gray-600 tracking-[0.18em] uppercase mb-10">
              What&apos;s inside
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.04]">
              {FEATURES.map(({ label, desc }, i) => (
                <div
                  key={label}
                  className="bg-[#080a0d] p-6 hover:bg-[#0c0f13] transition-colors group cursor-default"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-gray-700 tabular-nums">
                      0{i + 1}
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06] group-hover:bg-blue-500/30 transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                    {label}
                  </h3>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-white/[0.05] px-8 py-5 flex items-center justify-between">
          <span className="text-[11px] text-gray-700">
            © 2025 Nexus Analytics
          </span>
          <span className="text-[11px] text-gray-700">
            NCAA D1 Men&apos;s Basketball · Beta
          </span>
        </footer>
      </div>
    </>
  );
}

// ── Player evaluation preview widget ─────────────────────────────────────────
function PlayerWidget() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const STATS = [
    { label: "PPG", value: "19.4" },
    { label: "APG", value: "6.2" },
    { label: "3PT%", value: "39.8" },
    { label: "BPM", value: "+5.3" },
    { label: "TS%", value: "60.2" },
    { label: "USG%", value: "27.4" },
  ];

  return (
    <div className="relative">
      {/* Glow ring */}
      <div className="absolute -inset-[1px] bg-gradient-to-b from-blue-500/25 via-transparent to-transparent rounded-2xl" />

      <div className="relative bg-[#0d1116] border border-white/[0.09] rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
              MC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  Marcus Cole
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/40">
                  PG
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Kansas State · Jr. · 6&apos;2&quot;
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-400"
              style={{ animation: "blink-dot 3s ease infinite" }}
            />
            <span className="text-[10px] text-green-400 font-medium">
              Available
            </span>
          </div>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-4">
          {/* Fit score */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] text-gray-600 mb-1 uppercase tracking-widest">
                Fit Score
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-4xl font-bold text-white tabular-nums"
                  style={
                    phase >= 1
                      ? {
                          animation:
                            "score-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
                        }
                      : { opacity: 0 }
                  }
                >
                  91
                </span>
                <span className="text-sm text-gray-600 mb-1">/ 99</span>
              </div>
            </div>
            <div
              className="text-right"
              style={{
                opacity: phase >= 2 ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            >
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-900/25 border border-emerald-800/30 px-2 py-1 rounded-lg">
                ↑ Tier 1 · Top 4% at PG
              </span>
            </div>
          </div>

          {/* Fit bar */}
          <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-[width] duration-1000 ease-out"
              style={{ width: phase >= 1 ? "91%" : "0%" }}
            />
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-3 gap-2"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transition: "opacity 0.5s ease 0.1s",
            }}
          >
            {STATS.map(({ label, value }) => (
              <div
                key={label}
                className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-3 py-2.5"
              >
                <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
                  {label}
                </p>
                <p className="text-sm font-mono font-semibold text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* NIL estimate */}
          <div
            className="flex items-center justify-between bg-amber-950/30 border border-amber-800/20 rounded-xl px-3.5 py-2.5"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            <div>
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">
                NIL Estimate
              </p>
              <p className="text-sm font-mono font-semibold text-amber-300">
                $280k – $340k
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">
                Projected
              </p>
              <p className="text-sm font-mono font-semibold text-blue-300">
                17.8 PPG
              </p>
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex gap-2 pt-0.5"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transition: "opacity 0.4s ease 0.1s",
            }}
          >
            <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors">
              View Profile
            </button>
            <button className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-400 text-xs font-medium rounded-xl transition-colors">
              Add to Board
            </button>
          </div>
        </div>
      </div>

      {/* Floating annotation: Tier */}
      <div
        className="absolute -right-5 top-12 bg-[#0d1116] border border-white/[0.09] rounded-xl px-3 py-2.5 shadow-xl"
        style={{ animation: "fade-up 0.5s ease 1.4s forwards", opacity: 0 }}
      >
        <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
          vs. portal avg
        </p>
        <p className="text-xs font-semibold text-white">
          +4.1 PPG&nbsp; +1.8 APG
        </p>
      </div>

      {/* Floating annotation: Roster fit */}
      <div
        className="absolute -left-5 bottom-20 bg-[#0d1116] border border-white/[0.09] rounded-xl px-3 py-2.5 shadow-xl"
        style={{ animation: "fade-up 0.5s ease 1.7s forwards", opacity: 0 }}
      >
        <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">
          Roster gap
        </p>
        <p className="text-xs font-semibold text-emerald-400">
          Fills PG slot #1
        </p>
      </div>
    </div>
  );
}

import React from "react";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen bg-white dark:bg-gray-900">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between bg-brand-950 dark:bg-gray-950 px-16 py-14 relative overflow-hidden">

        {/* Background accents */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-700/20" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-800/20" />
        </div>

        {/* ── TOP: Org header ── */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-brand-400 uppercase leading-none">
                St. John's Research Institute
              </p>
              <p className="text-xs text-brand-500 mt-0.5">Bengaluru 560 034</p>
            </div>
          </div>

          <h1 className="text-[2.6rem] font-bold leading-none text-white tracking-tight whitespace-nowrap">
            SJRI Consultations
          </h1>

          <div className="mt-5 flex items-center gap-2">
            <div className="h-px w-6 bg-brand-500" />
            <p className="text-sm text-brand-300/80">
              Department of Biostatistics
            </p>
          </div>
        </div>

        {/* ── MIDDLE: Tagline ── */}
        <div className="relative z-10">
          <p className="text-base text-brand-200/60 leading-relaxed max-w-xs">
            Centralised portal for managing consultations, team assignments, and reporting across the department.
          </p>
        </div>

        {/* ── BOTTOM: Footer ── */}
        <div className="relative z-10 border-t border-white/[0.08] pt-5 flex items-center justify-between">
          <p className="text-xs text-brand-200/30">
            &copy; {new Date().getFullYear()} SJRI, Bengaluru
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            <span className="text-[10px] font-medium text-brand-400 tracking-wide">Internal portal</span>
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL (form — unchanged) ──────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>

      <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}

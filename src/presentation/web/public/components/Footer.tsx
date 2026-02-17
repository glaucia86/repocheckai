import React from "https://esm.sh/react@18.3.1";
import type { Locale } from "../types.ts";
import { t } from "../i18n/index.ts";

interface FooterProps {
  locale: Locale;
}

export const Footer = ({ locale }: FooterProps) => (
  <footer className="relative mt-8 overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white/95 via-cyan-50/50 to-amber-50/60 px-5 py-5 shadow-panel">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cobalt via-primary to-accent" />
    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-200/30 blur-2xl" />
    <div className="relative grid gap-5 lg:grid-cols-3">
      <section>
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-cobalt">{t("footerHeadline", locale)}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">{t("footerTrust", locale)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-200 bg-cyan-100 px-2.5 py-1 text-[11px] font-semibold text-cyan-900">{t("footerPillLocal", locale)}</span>
          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">{t("footerPillPrivate", locale)}</span>
          <span className="rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">{t("footerPillAccessible", locale)}</span>
        </div>
      </section>
      <section className="lg:col-span-2">
        <nav aria-label="Footer links" className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
          <a className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 font-semibold transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" href="https://github.com/glaucia86/repocheckai/tree/main/docs">
            {t("footerDocs", locale)}
          </a>
          <a className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 font-semibold transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" href="https://github.com/glaucia86/repocheckai#quick-start">
            {t("footerCli", locale)}
          </a>
          <a className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 font-semibold transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" href="https://github.com/glaucia86/repocheckai/blob/main/CHANGELOG.md">
            {t("footerChangelog", locale)}
          </a>
          <a className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 font-semibold transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" href="https://github.com/glaucia86/repocheckai">
            {t("footerGithub", locale)}
          </a>
          <a className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2 font-semibold transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" href="https://github.com/glaucia86/repocheckai/issues">
            {t("footerSupport", locale)}
          </a>
        </nav>
      </section>
    </div>
    <div className="relative mt-4 border-t border-slate-200/80 pt-3 text-xs text-slate-500">
      <p>RepoCheckAI • Local UI</p>
    </div>
  </footer>
);



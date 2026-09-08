import {
  ArrowRight,
  BarChart3,
  Building2,
  Eye,
  Facebook,
  Instagram,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Established', value: '2008' },
  { label: 'Years of experience', value: '16+' },
  { label: 'Clients served', value: '150' },
  { label: 'Merchandisers in field', value: '25+' },
];

const results = [
  { label: 'Sales performance', before: '80%', after: '85%', delta: '+5%', up: true },
  { label: 'Out of stock incidents', before: '15%', after: '4%', delta: '-73%', up: false },
  { label: 'Shelf availability', before: '85%', after: '97%', delta: '+12%', up: true },
  { label: 'Visibility compliance', before: '75%', after: '90%', delta: '+15%', up: true },
  { label: 'Planogram compliance', before: '85%', after: '100%', delta: '+15%', up: true },
  { label: 'Store coverage', before: '75%', after: '98%', delta: '+23%', up: true },
  { label: 'Retailer satisfaction', before: '3.2/5', after: '4.6/5', delta: '+44%', up: true },
];

const steps = [
  {
    icon: Building2,
    title: 'Strategy & Onboarding',
    description:
      'Defining goals, SKUs, KPIs, route design, and a pre-field retail baseline audit for every brand we take on.',
  },
  {
    icon: Store,
    title: 'Field Execution',
    description:
      'Shelf arrangement, FIFO stock rotation, POSM setup, and coordinated in-store activations run by a trained field team.',
  },
  {
    icon: BarChart3,
    title: 'Reporting & Insight',
    description:
      'Daily field follow-ups, weekly consolidated reports, and strategic review dossiers — turning execution into decisions.',
  },
];

const clients = [
  'WATA',
  'Dairy Khoury',
  'DSG Group',
  'Dark Blue',
  'El Maestro',
  'Elmir',
  'Bavaria',
  'Amigo',
  'Al Amira',
  'Berdawni',
  'Floe',
  'Ghanem',
  'Shouman',
  'Tchips',
  'Soupreem',
];

export function Landing() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#141b2b]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-white">
              I<span className="text-[#a8cc5c]">.</span>PROM
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-slate-400 sm:inline">
              Agency
            </span>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#a8cc5c] px-4 py-2 text-sm font-semibold text-[#141b2b] transition hover:bg-[#b8dc6e]"
          >
            Login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#141b2b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#a8cc5c]/30 bg-[#a8cc5c]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#a8cc5c]">
              <Sparkles className="h-3.5 w-3.5" />
              Merchandising · Visibility · Activations · Promoters
            </div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Retail execution that turns
              <span className="text-[#a8cc5c]"> shelves into sales</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              For over 16 years, I.Prom has powered visibility and sales for Lebanon's
              leading FMCG brands — transforming shelves into success stories through
              discipline, precision, and passion.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#a8cc5c] px-6 py-3 text-base font-semibold text-[#141b2b] transition hover:bg-[#b8dc6e]"
              >
                Login to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-[#a8cc5c] sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wide text-slate-400 sm:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proven results */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Measurable impact, real results
            </h2>
            <p className="mt-3 text-slate-600">
              Our merchandising solutions create stronger execution and sustainable
              retail growth — here's what changed after partnering with I.Prom.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <div
                key={r.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">{r.label}</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.up
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {r.up ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {r.delta}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-sm text-slate-400 line-through">
                    {r.before}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-2xl font-bold text-slate-900">{r.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              From strategy to shelf
            </h2>
            <p className="mt-3 text-slate-600">
              Visibility without strategy is just decoration — our framework connects
              field execution directly to brand insight.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#141b2b]">
                  <step.icon className="h-6 w-6 text-[#a8cc5c]" />
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted brands */}
      <section className="bg-[#141b2b] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">
              Trusted by Lebanon's leading brands
            </h2>
            <p className="mt-3 text-slate-400">
              150+ clients across FMCG, dairy, beverage, and consumer goods trust
              I.Prom with their retail execution.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {clients.map((c) => (
              <span
                key={c}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200"
              >
                {c}
              </span>
            ))}
            <span className="rounded-full border border-[#a8cc5c]/30 bg-[#a8cc5c]/10 px-4 py-2 text-sm font-medium text-[#a8cc5c]">
              + many more
            </span>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 sm:grid-cols-3">
          <div className="text-center">
            <Eye className="mx-auto h-8 w-8 text-[#141b2b]" />
            <h3 className="mt-3 font-semibold text-slate-900">Real-time visibility</h3>
            <p className="mt-1 text-sm text-slate-600">
              Instant photo uploads, shelf status, and out-of-stock alerts as they
              happen in-store.
            </p>
          </div>
          <div className="text-center">
            <Users className="mx-auto h-8 w-8 text-[#141b2b]" />
            <h3 className="mt-3 font-semibold text-slate-900">A trained field team</h3>
            <p className="mt-1 text-sm text-slate-600">
              30+ members — merchandisers, promoters, supervisors, and data
              collectors — all dedicated to your brand.
            </p>
          </div>
          <div className="text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-[#141b2b]" />
            <h3 className="mt-3 font-semibold text-slate-900">
              Reporting you can trust
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Daily follow-ups, weekly consolidated reports, and strategic review
              dossiers delivered on schedule.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900">
            Ready to see your brand's shelf performance?
          </h2>
          <p className="mt-3 text-slate-600">
            Brand managers get a dedicated, real-time view of coverage, compliance,
            and reports — built into the I.Prom platform.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#141b2b] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#1f2a41]"
          >
            Login to Dashboard
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#141b2b] py-10 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              I<span className="text-[#a8cc5c]">.</span>PROM
            </span>
            <span className="text-xs uppercase tracking-widest">Agency</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a
              href="tel:+96192225035"
              className="flex items-center gap-1.5 hover:text-white"
            >
              <Phone className="h-4 w-4" />
              +961 9 225 035
            </a>
            <a
              href="mailto:i.prom@live.com"
              className="flex items-center gap-1.5 hover:text-white"
            >
              <Mail className="h-4 w-4" />
              i.prom@live.com
            </a>
            <a
              href="https://instagram.com/i.prom.agency"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white"
            >
              <Instagram className="h-4 w-4" />
              i.prom.agency
            </a>
            <a
              href="https://facebook.com/I.PromAgency"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white"
            >
              <Facebook className="h-4 w-4" />
              I.PromAgency
            </a>
          </div>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} I.Prom Agency. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

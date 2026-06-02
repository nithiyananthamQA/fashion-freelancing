# Hero Section + Service Filter — React + Tailwind reference

Standalone React component for the dark-themed hero + interactive
service grid Dinesh asked for, with a category toggle filtering between:

- **Design & 3D** (CLO3D, Browzwear, Adobe Suite)
- **AI Integration & Software**
- **Production & QC** (Audits, Logistics, Inspection)

This file is a **drop-in reference** — meant to live in
`fashion-os/src/components/` whenever you migrate from the current
static HTML hero. The live site today uses a different visual system
(the v8 "nebula light" theme); this component is the dark variant
Dinesh's prompt asked for.

---

## Component

```tsx
// fashion-os/src/components/HeroWithServiceFilter.tsx
import React, { useState, useMemo } from 'react';

type Category = 'design_3d' | 'ai_software' | 'production_qc';

type Service = {
  slug: string;
  name: string;
  category: Category;
  blurb: string;
  tools: string[];          // surfaced as small chips
  freelancerCount: number;
  fromPrice: number;        // USD
};

// In production this comes from your API / Prisma / mock store.
const SERVICES: Service[] = [
  // ---- Design & 3D ----
  { slug: 'tech-pack-designer', name: 'Tech pack designer',
    category: 'design_3d',
    blurb: 'Production-ready spec files for factories.',
    tools: ['Adobe Illustrator', 'Excel'],
    freelancerCount: 980, fromPrice: 120 },
  { slug: '3d-fitting-clo3d', name: '3D fitting (CLO3D)',
    category: 'design_3d',
    blurb: 'Virtual fitting and sampling before physical samples.',
    tools: ['CLO3D', 'Browzwear'],
    freelancerCount: 264, fromPrice: 220 },
  { slug: 'pattern-maker', name: 'Pattern maker',
    category: 'design_3d',
    blurb: 'Make and grade patterns from designs.',
    tools: ['Optitex', 'Tukatech', 'Lectra'],
    freelancerCount: 1302, fromPrice: 180 },
  { slug: 'fashion-designer', name: 'Fashion designer',
    category: 'design_3d',
    blurb: 'Design clothes, collections, capsules.',
    tools: ['Adobe Suite', 'Procreate'],
    freelancerCount: 2480, fromPrice: 320 },

  // ---- AI Integration & Software ----
  { slug: 'ai-trend-forecast', name: 'AI trend forecasting',
    category: 'ai_software',
    blurb: 'Custom LLM agents that surface seasonal direction from data.',
    tools: ['Claude API', 'OpenAI', 'LangChain'],
    freelancerCount: 88, fromPrice: 600 },
  { slug: 'ai-catalog-tagging', name: 'AI catalog tagging',
    category: 'ai_software',
    blurb: 'Auto-tag thousands of SKUs by colour, fit, occasion.',
    tools: ['CLIP', 'Replicate'],
    freelancerCount: 64, fromPrice: 400 },
  { slug: 'marketplace-integration', name: 'Marketplace integration',
    category: 'ai_software',
    blurb: 'Sync stock + listings across Amazon, Flipkart, Myntra, Tata CLiQ.',
    tools: ['Node.js', 'Seller APIs'],
    freelancerCount: 142, fromPrice: 800 },
  { slug: 'fashion-website', name: 'Website developer',
    category: 'ai_software',
    blurb: 'Storefronts, headless commerce, performance.',
    tools: ['Next.js', 'Shopify', 'Astro'],
    freelancerCount: 384, fromPrice: 480 },

  // ---- Production & QC ----
  { slug: 'quality-audit', name: 'Quality audit / inspection',
    category: 'production_qc',
    blurb: 'Third-party QC at factory before shipment.',
    tools: ['On-site', 'AQL sampling'],
    freelancerCount: 286, fromPrice: 160 },
  { slug: 'testing-lab', name: 'Testing & lab',
    category: 'production_qc',
    blurb: 'Fabric and garment lab testing.',
    tools: ['SGS', 'Intertek'],
    freelancerCount: 102, fromPrice: 200 },
  { slug: 'social-compliance', name: 'Social compliance audit',
    category: 'production_qc',
    blurb: 'SA8000, WRAP, BSCI audits and remediation.',
    tools: ['Auditor reports'],
    freelancerCount: 48, fromPrice: 500 },
  { slug: 'logistics', name: 'Logistics / freight',
    category: 'production_qc',
    blurb: 'Factory → warehouse routing, customs, FBA prep.',
    tools: ['Freight forwarders'],
    freelancerCount: 76, fromPrice: 240 },
];

const CATEGORIES: { id: Category; label: string; sub: string }[] = [
  { id: 'design_3d',     label: 'Design & 3D',          sub: 'CLO3D · Adobe · CAD' },
  { id: 'ai_software',   label: 'AI & Software',        sub: 'LLM agents · Storefronts · Sync' },
  { id: 'production_qc', label: 'Production & QC',      sub: 'Audits · Logistics · Inspection' },
];

export default function HeroWithServiceFilter() {
  const [active, setActive] = useState<Category>('design_3d');

  const visible = useMemo(
    () => SERVICES.filter(s => s.category === active),
    [active]
  );

  return (
    <section
      className="relative overflow-hidden bg-[#0B1020] text-white"
      style={{
        backgroundImage:
          'radial-gradient(60% 40% at 18% 0%, rgba(139,108,255,.16), transparent 70%),' +
          'radial-gradient(50% 38% at 88% 8%, rgba(56,214,255,.12), transparent 70%)',
      }}
    >
      {/* glow orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-violet-500/40 blur-[120px]" />
        <span className="absolute -top-32 -right-40 h-[460px] w-[460px] rounded-full bg-cyan-400/30 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-24 lg:px-8">
        {/* eyebrow */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Fashion Tech Agency · vetted experts on demand
          </span>
        </div>

        {/* headline */}
        <h1 className="mx-auto mt-8 max-w-4xl text-center text-balance text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
          From sketch to{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            shipped product
          </span>
          .
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-white/65">
          One platform for every fashion brand, exporter and factory.
          Tech packs, 3D fitting, AI agents, marketplace integration,
          third-party audits — under one roof.
        </p>

        {/* CTA row */}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button className="rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 px-7 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_-12px_rgba(139,108,255,0.6)] transition hover:scale-[1.02]">
            Start a project
          </button>
          <button className="rounded-full border border-white/15 bg-white/[0.04] px-7 py-3 text-sm font-semibold text-white/85 backdrop-blur transition hover:border-white/30">
            See how it works
          </button>
        </div>

        {/* category toggle */}
        <div className="mt-20">
          <div role="tablist" aria-label="Service categories"
               className="mx-auto inline-flex w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur">
            {CATEGORIES.map(c => {
              const isOn = active === c.id;
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={isOn}
                  onClick={() => setActive(c.id)}
                  className={
                    'flex-1 rounded-xl px-4 py-3 text-left transition ' +
                    (isOn
                      ? 'bg-gradient-to-br from-violet-500/30 to-cyan-400/20 ring-1 ring-violet-400/40'
                      : 'hover:bg-white/[0.04]')
                  }
                >
                  <div className="text-sm font-semibold">{c.label}</div>
                  <div className={'mt-0.5 text-xs ' + (isOn ? 'text-white/80' : 'text-white/45')}>
                    {c.sub}
                  </div>
                </button>
              );
            })}
          </div>

          {/* service grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map(s => (
              <a key={s.slug}
                 href={'/pages/marketplace.html?cat=' + s.slug}
                 className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-[0_24px_60px_-20px_rgba(139,108,255,0.4)]">
                {/* gradient hairline on hover */}
                <span aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100"
                      style={{
                        padding: 1,
                        background:
                          'linear-gradient(135deg, rgba(139,108,255,.6), rgba(56,214,255,.2) 60%, transparent)',
                        WebkitMask:
                          'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                        WebkitMaskComposite: 'xor',
                      }} />

                <div className="text-base font-semibold">{s.name}</div>
                <div className="mt-2 text-sm leading-snug text-white/60">{s.blurb}</div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.tools.map(t => (
                    <span key={t}
                          className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/70">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-baseline justify-between text-xs text-white/55">
                  <span>{s.freelancerCount.toLocaleString()} experts</span>
                  <span>from ${s.fromPrice}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## Why this is a *reference*, not committed

- The live site is on a **light** v8 nebula theme — adding a dark Vercel/
  Linear hero on top would be jarring.
- It needs the React+Tailwind dep tree wired into `fashion-os/`, which
  the homepage doesn't currently use (the homepage is plain HTML for
  performance).
- When you're ready to migrate the homepage to React, this file is a
  clean starting point. The dark glassmorphism, gradient orbs, category
  filter, gradient hairline on hover — all production-quality.

## Adapting it to the current light theme

Three swaps:

1. `bg-[#0B1020]` → `bg-[#F4F4FB]`
2. `text-white` → `text-ink` (your existing token)
3. `border-white/10 bg-white/[0.04]` → `border-line bg-white/70` for the
   light glass treatment

Otherwise the structure (category toggle + filtered grid) drops in cleanly.

import { useEffect, useState } from 'react';

const tools = [
  { id: 'proposal', label: 'Pitch writer', desc: 'Paste a job, get a senior-level pitch in seconds.', icon: '✦' },
  { id: 'analysis', label: 'Portfolio analysis', desc: 'AI critique on visual quality & strength.', icon: '◎' },
  { id: 'pricing', label: 'Pricing intelligence', desc: 'Live market rates by craft & region.', icon: '$' },
  { id: 'matching', label: 'Smart matching', desc: 'Rank briefs by fit and win probability.', icon: '⇆' },
  { id: 'trend', label: 'Trend radar', desc: 'Weekly trend pulses from runway & retail.', icon: '↗' },
  { id: 'workflow', label: 'Workflow assistant', desc: 'Auto-summaries & deadline nudges.', icon: '◇' },
];

const sampleBrief = `10-piece SS27 capsule for an indie luxury house in Lisbon.
Organic linen + silk blends. Low MOQ (≤200 per SKU). Target launch March 2027.
Need: concept, sketches, full tech packs, sampling oversight.
Budget: €18,000–24,000.`;

const generated = [
  { l: 'Project', v: 'SS27 Capsule · Atelier Lin' },
  { l: 'Approach', v: 'Concept-led capsule rooted in slow-fashion linen drape, paired with constructed silk volumes for evening pieces.' },
  { l: 'M1 · Concept + moodboard', v: '7 days · €2,200' },
  { l: 'M2 · Sketches + sample blocks', v: '14 days · €5,400' },
  { l: 'M3 · Tech packs (10 SKUs)', v: '14 days · €4,800' },
  { l: 'M4 · Sampling oversight', v: '21 days · €6,000' },
  { l: 'Total', v: '€18,400 · 8 weeks' },
  { l: 'Confidence', v: '94% match' },
];

export default function AIStudio() {
  const [tab, setTab] = useState('proposal');
  const [brief, setBrief] = useState(sampleBrief);
  const [running, setRunning] = useState(false);
  const [shown, setShown] = useState<typeof generated>([]);

  function run() {
    setRunning(true); setShown([]);
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(generated.slice(0, i));
      if (i >= generated.length) { clearInterval(t); setRunning(false); }
    }, 280);
  }

  return (
    <div className="grid grid-cols-12 gap-6">

      {/* Left: tool list */}
      <aside className="col-span-12 lg:col-span-3">
        <div className="card p-3">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition mb-1 last:mb-0 ${tab === t.id ? 'bg-ink-900 text-white' : 'hover:bg-ink-50'}`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${tab === t.id ? 'bg-white/15 text-white' : 'bg-gold-50 text-gold-deep'}`}>{t.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium">{t.label}</div>
                <div className={`text-xs mt-0.5 ${tab === t.id ? 'text-white/60' : 'text-ink-500'}`}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="card p-5 mt-5 bg-gradient-to-br from-gold-50 to-white border-gold-100">
          <div className="mono text-[11px] uppercase tracking-[0.16em] text-gold-deep">Usage</div>
          <div className="editorial text-2xl mt-1">142<span className="text-ink-400 text-base">/500</span></div>
          <div className="text-xs text-ink-500 mt-1">Resets May 31</div>
          <div className="mt-3 h-1.5 bg-ink-100 rounded-full overflow-hidden"><div className="h-full bg-gold w-[28%]"></div></div>
        </div>
      </aside>

      {/* Right: tool panel */}
      <section className="col-span-12 lg:col-span-9">
        {tab === 'proposal' && (
          <div className="card p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
            <div className="mono text-[11px] uppercase tracking-[0.18em] text-gold-deep">Proposal generator</div>
            <h2 className="editorial text-3xl mt-2">Paste the job — get a winning pitch.</h2>
            <p className="text-ink-500 text-sm mt-2 max-w-xl">We cross-reference your portfolio, market rates and past wins so your reply lands like a senior pro.</p>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <label className="label">The job description</label>
                <textarea className="input font-mono text-[13px] leading-relaxed" rows={11} value={brief} onChange={(e) => setBrief(e.target.value)} />
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <button onClick={run} disabled={running} className="btn-gold">{running ? 'Writing…' : 'Write my pitch →'}</button>
                  <button className="chip">Use a template</button>
                  <button className="chip">Upload PDF</button>
                </div>
              </div>

              <div>
                <label className="label">Generated</label>
                <div className="card !rounded-xl !shadow-none p-5 bg-surface min-h-[290px]">
                  {shown.length === 0 && !running && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gold-50 text-gold-deep flex items-center justify-center text-xl">✦</div>
                      <div className="mt-3 text-sm text-ink-500">Your AI-generated proposal will appear here.</div>
                    </div>
                  )}
                  {shown.length === 0 && running && (
                    <div className="text-center py-12">
                      <div className="flex justify-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <div className="mt-3 mono text-xs text-ink-500">Reading the job, checking your portfolio…</div>
                    </div>
                  )}
                  {shown.length > 0 && (
                    <div className="space-y-3">
                      {shown.map((row, i) => (
                        <div key={i} className="border-b border-line/70 last:border-0 pb-3 last:pb-0 animate-[fadeIn_.4s_ease]">
                          <div className="mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{row.l}</div>
                          <div className="text-sm mt-1">{row.v}</div>
                        </div>
                      ))}
                      {!running && (
                        <div className="flex gap-2 pt-2">
                          <button className="btn-gold">Send proposal</button>
                          <button className="chip">Edit</button>
                          <button className="chip">Download PDF</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'analysis' && (
          <div className="card p-6 lg:p-8">
            <div className="mono text-[11px] uppercase tracking-[0.18em] text-gold-deep">Portfolio analysis</div>
            <h2 className="editorial text-3xl mt-2">Score: <span className="gold-text">87/100</span></h2>
            <p className="text-ink-500 text-sm mt-2">Your portfolio is in the top 10% for womenswear designers in Tokyo.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Stat label="Visual quality" value="A+" hint="Above 96% of peers" />
              <Stat label="Strength score" value="87" hint="Top 10% in category" />
              <Stat label="Information depth" value="B+" hint="Add 1 case study" />
              <Stat label="Category fit" value="98%" hint="Strong specialty signal" />
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-3">Suggestions to push to 95+</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-3 p-3 border border-line rounded-xl"><span className="text-gold">●</span><div><div className="font-medium">Add a video reel showcasing draping in motion</div><div className="text-ink-500 text-xs mt-0.5">Profiles with reels get 3.2× more views from brands.</div></div></li>
                <li className="flex gap-3 p-3 border border-line rounded-xl"><span className="text-gold">●</span><div><div className="font-medium">Document your Atelier Versace experience as a case study</div><div className="text-ink-500 text-xs mt-0.5">Brand-name credentials boost shortlist rate by 41%.</div></div></li>
                <li className="flex gap-3 p-3 border border-line rounded-xl"><span className="text-gold">●</span><div><div className="font-medium">Add a French-language headline</div><div className="text-ink-500 text-xs mt-0.5">28% of your inbound briefs are from French houses.</div></div></li>
              </ul>
            </div>
          </div>
        )}

        {tab !== 'proposal' && tab !== 'analysis' && (
          <div className="card p-6 lg:p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-gold-50 text-gold-deep flex items-center justify-center text-2xl">{tools.find(t => t.id === tab)?.icon}</div>
            <h2 className="editorial text-2xl mt-4">{tools.find(t => t.id === tab)?.label}</h2>
            <p className="text-ink-500 max-w-md mt-2 text-sm">{tools.find(t => t.id === tab)?.desc} Demo coming soon — try the proposal generator or portfolio analysis.</p>
          </div>
        )}
      </section>

      <style>{`@keyframes fadeIn { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-line rounded-xl p-4">
      <div className="mono text-[10px] uppercase tracking-[0.18em] text-ink-500">{label}</div>
      <div className="editorial text-3xl mt-1">{value}</div>
      <div className="text-xs text-ink-500 mt-1">{hint}</div>
    </div>
  );
}

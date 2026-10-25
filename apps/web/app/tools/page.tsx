import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/brand'
import { JUSTICE_STACK } from '@/lib/justice-stack'

const ACCENT = ['text-white/80', 'text-white/80', 'text-mint-300', 'text-gold-300']

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-night-950 text-white">
      <SiteHeader current="/tools" />

      <header className="relative isolate border-b border-white/[0.06]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50rem_24rem_at_50%_-20%,rgba(30,192,126,0.18),transparent)]" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint-400">The justice stack</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">Every tool, from knowledge to court.</h1>
          <p className="mt-5 max-w-2xl text-lg text-white/55">Reducing the distance between a dispute and a just outcome — one layer at a time.</p>
          <nav className="mt-8 flex flex-wrap gap-2">
            {JUSTICE_STACK.map((l, i) => (
              <a key={l.id} href={`#${l.id}`} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70 transition hover:border-white/25 hover:text-white">
                <span className={`mr-2 font-display font-semibold ${ACCENT[i]}`}>0{l.number}</span>
                {l.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6">
        {JUSTICE_STACK.map((layer, i) => (
          <section key={layer.id} id={layer.id} className="scroll-mt-24">
            <div className="flex flex-col gap-2 border-b border-white/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-baseline gap-4">
                <span className={`font-display text-5xl font-semibold tracking-tighter ${ACCENT[i]}`}>0{layer.number}</span>
                <div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">{layer.title}</h2>
                  <p className="text-white/45">{layer.tagline}</p>
                </div>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-white/50 md:text-right">{layer.description}</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {layer.tools.map((tool) => {
                const body = (
                  <>
                    <div className="flex items-start justify-between">
                      <span className="text-2xl" aria-hidden>
                        {tool.icon}
                      </span>
                      <span className="flex gap-1.5">
                        {tool.premium && <span className="rounded-full bg-gold-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-200 ring-1 ring-gold-300/30">Premium</span>}
                        {tool.external && <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 ring-1 ring-white/10">Opens ↗</span>}
                        {tool.status === 'soon' && <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">Soon</span>}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{tool.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/55">{tool.desc}</p>
                  </>
                )
                const cls = 'group block h-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 transition hover:-translate-y-0.5 hover:border-mint-400/30 hover:bg-white/[0.04]'
                if (tool.status !== 'live') return <div key={tool.name} className={cls + ' opacity-60'}>{body}</div>
                return tool.external ? (
                  <a key={tool.name} href={tool.href} className={cls}>
                    {body}
                  </a>
                ) : (
                  <Link key={tool.name} href={tool.href} className={cls}>
                    {body}
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <SiteFooter />
    </div>
  )
}

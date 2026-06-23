'use client'

import Link from 'next/link'
import { PREDICTIONS_ENABLED } from '@/lib/features'
import { JUSTICE_STACK } from '@/lib/justice-stack'

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">⚖️</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-3 sm:space-x-4 text-sm">
              {PREDICTIONS_ENABLED && (
                <Link href="/predictions" className="text-gray-300 hover:text-white transition">Predictions</Link>
              )}
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition">Marketplace</Link>
              <Link href="/auth/login" className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition text-sm">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-green-800/50 to-emerald-800/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-green-300 font-semibold tracking-widest text-sm uppercase mb-3">The justice infrastructure stack</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Four layers. One mission.</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Reducing the distance between a dispute and a just outcome — from knowledge to court.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {JUSTICE_STACK.map((layer) => (
          <section key={layer.id} id={layer.id} className="scroll-mt-20">
            <div className="flex items-start gap-4 mb-6">
              <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                {layer.number}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{layer.title}</h2>
                <p className="text-gray-400 text-sm">{layer.tagline}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {layer.tools.map((tool) => {
                const card = (
                  <div className={`h-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border ${layer.border} ${tool.status === 'live' ? 'hover:border-green-500/60 hover:scale-[1.02]' : 'opacity-70'} transition-all duration-300`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-3xl">{tool.icon}</span>
                      <div className="flex gap-1">
                        {tool.premium && (
                          <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">PREMIUM</span>
                        )}
                        {tool.status === 'soon' && (
                          <span className="bg-gray-600/40 text-gray-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">SOON</span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">{tool.name}</h3>
                    <p className="text-gray-400 text-sm">{tool.desc}</p>
                    {tool.status === 'live' && (
                      <div className="flex items-center text-green-400 text-sm font-medium mt-3">
                        <span>Open</span>
                        <span className="ml-1">{'->'}</span>
                      </div>
                    )}
                  </div>
                )

                return tool.status === 'live' ? (
                  <Link key={tool.name} href={tool.href} className="group">{card}</Link>
                ) : (
                  <div key={tool.name} title="Coming soon">{card}</div>
                )
              })}
            </div>
          </section>
        ))}

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-green-500/20 max-w-2xl mx-auto text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <h2 className="text-2xl font-bold text-white mb-3">Building infrastructure that scales trust</h2>
          <p className="text-gray-400 mb-6">
            CaseWin isn’t building AI for lawyers. It’s building the rails that reduce the distance
            between a dispute and a just outcome — for everyone.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            Explore the Lawyer Marketplace
          </Link>
        </div>
      </div>
    </div>
  )
}

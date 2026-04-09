'use client'

import Link from 'next/link'

export default function ForLawyersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-md border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">{'\u2696\uFE0F'}</span>
              <span className="text-xl font-bold text-white">CaseWin AI</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/demo/lawyers" className="text-gray-300 hover:text-white transition text-sm">
                Interactive Demo
              </Link>
              <Link href="/pricing" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 py-16 border-b border-green-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="bg-green-600/20 text-green-400 border border-green-500/30 px-4 py-1.5 rounded-full text-sm font-semibold">
            For Nigerian Lawyers &amp; Law Firms
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
            Premium Automation Tools
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            CaseWin AI offers 18+ free legal tools for everyone. For lawyers and firms, 
            we built two premium automation tools that save hours of work every single day.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo/lawyers" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Try Interactive Demo
            </Link>
            <Link href="/pricing" className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition">
              See Pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* What's Free vs Premium */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Free vs. Premium</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">{'\u{1F513}'}</span>
                <h3 className="text-xl font-bold text-white">Free Tools (Everyone)</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                All AI-powered legal tools are completely free — for students, lawyers, firms, and the public.
              </p>
              <ul className="space-y-2 text-sm text-gray-300">
                {[
                  'Case Research & Search',
                  'Document Drafting',
                  'Contract Analysis',
                  'Legal Summarization',
                  'Language Translation',
                  'Argument Generation',
                  'Compliance Checking',
                  'Deadline Tracking',
                  'Billing Calculator',
                  'Case Filing Guide',
                  'Citation Formatter',
                  'Hearing Prep',
                  'Clause Library',
                  'Legal Fee Calculator',
                  'AI Legal Chatbot',
                  'Case Outcome Prediction',
                  'Prediction Markets',
                ].map(tool => (
                  <li key={tool} className="flex items-center space-x-2">
                    <span className="text-green-400 text-xs">{'\u2713'}</span>
                    <span>{tool}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-green-500/30 ring-1 ring-green-500/10">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-2xl">{'\u26A1'}</span>
                <h3 className="text-xl font-bold text-white">Premium Automation (Lawyers &amp; Firms)</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Two powerful automation tools that go beyond individual queries — delivering continuous, 
                firm-specific intelligence.
              </p>
              <div className="space-y-4">
                <div className="bg-indigo-900/20 rounded-lg p-4 border border-indigo-500/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <span>{'\u{1F4F0}'}</span>
                    <span className="text-indigo-400 font-semibold text-sm">Daily Intelligence Brief</span>
                  </div>
                  <p className="text-gray-400 text-xs">Individual Lawyer plan ($20/mo) and above</p>
                </div>
                <div className="bg-emerald-900/20 rounded-lg p-4 border border-emerald-500/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <span>{'\u{1F9E0}'}</span>
                    <span className="text-emerald-400 font-semibold text-sm">Firm Knowledge Agent</span>
                  </div>
                  <p className="text-gray-400 text-xs">Law Firm plan ($30/mo) — includes Intelligence Brief</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tool 1: Daily Intelligence Brief */}
        <section id="intelligence-brief">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {'\u{1F4F0}'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Daily Intelligence Brief</h2>
              <p className="text-gray-400">Available on Individual Lawyer ($20/mo) and Law Firm ($30/mo) plans</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-xl font-bold text-white mb-3">What It Does</h3>
              <p className="text-gray-300 leading-relaxed">
                The Daily Intelligence Brief is an AI-powered legal monitoring system that scans the Nigerian 
                legal landscape and delivers a personalized daily briefing tailored to your practice areas. 
                Instead of spending hours reading gazettes, court reports, and regulatory notices, you get 
                a structured brief with everything that matters — filtered, summarized, and prioritized.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-xl font-bold text-white mb-4">What You Get Every Day</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: '\u{1F4DC}', title: 'New Legislation & Bills', desc: 'Bills passing through the National Assembly, gazette notices, amendments to existing laws (CAMA, ISA, etc.)' },
                  { icon: '\u{2696}\u{FE0F}', title: 'Court Decisions', desc: 'Supreme Court, Court of Appeal, and High Court judgments relevant to your practice areas with analysis' },
                  { icon: '\u{1F3DB}\u{FE0F}', title: 'Regulatory Updates', desc: 'Circulars and directives from SEC, CBN, CAC, FIRS, NCC, NERC, and other regulatory bodies' },
                  { icon: '\u{2705}', title: 'Compliance Alerts', desc: 'Filing deadlines, regulatory changes that affect your clients, and compliance obligation updates' },
                  { icon: '\u{1F4C8}', title: 'Market Intelligence', desc: 'Legal market trends, M&A activity, sector developments, and business opportunities for your practice' },
                  { icon: '\u{1F4A1}', title: 'Opportunities', desc: 'New areas of practice opened by regulation, government tenders, and emerging legal needs' },
                ].map(item => (
                  <div key={item.title} className="bg-gray-700/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                    </div>
                    <p className="text-gray-400 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-xl font-bold text-white mb-4">How to Use It</h3>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Select Your Practice Areas', desc: 'Choose from 14 practice areas: Corporate & Commercial, Litigation, Real Estate, Banking & Finance, Oil & Gas, Tax, IP, Employment, Family Law, Criminal Law, Constitutional, Maritime, Telecom, Environmental. You can select multiple.' },
                  { step: 2, title: 'Generate Your Brief', desc: 'Click "Generate My Brief" and the AI will scan for the latest Nigerian legal developments relevant to your selected areas. Generation takes about 10-15 seconds.' },
                  { step: 3, title: 'Review by Impact Level', desc: 'Each item is tagged with HIGH, MEDIUM, or LOW impact. Filter by type (legislation, court decision, regulatory, etc.) or by impact level to focus on what matters most.' },
                  { step: 4, title: 'Take Action on Items', desc: 'Every brief section includes specific action items: "Brief your corporate clients on the new CAMA requirement" or "Update standard contract clause 4.2." These are practical next steps.' },
                  { step: 5, title: 'Track Deadlines', desc: 'The brief surfaces upcoming filing deadlines and regulatory deadlines so nothing slips through the cracks.' },
                ].map(item => (
                  <div key={item.step} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-indigo-600/30 border border-indigo-500/30 rounded-full flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{item.title}</h4>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-900/20 rounded-xl p-6 border border-indigo-500/20">
              <h3 className="text-lg font-bold text-white mb-2">{'\u{1F4A1}'} Pro Tip</h3>
              <p className="text-gray-300 text-sm">
                Your practice area preferences are saved automatically. When you come back the next day, 
                the brief generates instantly with your saved preferences. Refresh anytime during the day 
                for the latest updates.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-700/50" />

        {/* Tool 2: Firm Knowledge Agent */}
        <section id="knowledge-agent">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {'\u{1F9E0}'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Firm Knowledge Agent</h2>
              <p className="text-gray-400">Available on Law Firm plan ($30/mo) — includes Intelligence Brief</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-xl font-bold text-white mb-3">What It Does</h3>
              <p className="text-gray-300 leading-relaxed">
                The Firm Knowledge Agent is a private AI assistant trained on your firm&apos;s own documents. 
                Upload your contract templates, case briefs, research memos, internal policies, and compliance 
                documents — and the AI builds a searchable knowledge base that your entire team can query in 
                natural language. It&apos;s your firm&apos;s institutional memory, powered by AI.
              </p>
              <p className="text-gray-300 leading-relaxed mt-3">
                Instead of searching through folders, emailing partners for precedents, or re-drafting 
                clauses from scratch — just ask the agent. It finds the answer from your own documents 
                and cites the source.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-xl font-bold text-white mb-4">How Law Firms Train Their Agent</h3>
              <p className="text-gray-400 text-sm mb-6">
                Training your agent is simple — upload documents and the AI learns automatically. Here&apos;s the complete process:
              </p>

              <div className="space-y-6">
                <div className="bg-gray-700/20 rounded-lg p-5">
                  <h4 className="text-white font-bold mb-3">Step 1: Set Up Your Firm</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    When you first open the Knowledge Agent, enter your firm name. This creates a private 
                    workspace — all documents you upload are isolated to your firm only. No other user or 
                    firm can see your data.
                  </p>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-600/30">
                    <p className="text-gray-500 text-xs font-mono">Example: &quot;Aluko & Oyebode&quot; → firm ID: aluko-&amp;-oyebode</p>
                  </div>
                </div>

                <div className="bg-gray-700/20 rounded-lg p-5">
                  <h4 className="text-white font-bold mb-3">Step 2: Categorize &amp; Upload Documents</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Before uploading each document, select a category. This helps the AI understand the 
                    type and context of the document. Categories include:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {[
                      { icon: '\u{1F4DD}', label: 'Contract Templates' },
                      { icon: '\u{2696}\u{FE0F}', label: 'Case Precedents' },
                      { icon: '\u{1F4CB}', label: 'Firm Policies' },
                      { icon: '\u{1F4DA}', label: 'Legal Research' },
                      { icon: '\u{1F465}', label: 'Client Documents' },
                      { icon: '\u{2705}', label: 'Compliance' },
                      { icon: '\u{1F4C4}', label: 'General' },
                    ].map(cat => (
                      <div key={cat.label} className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-600/30">
                        <span className="text-lg">{cat.icon}</span>
                        <p className="text-gray-400 text-xs mt-1">{cat.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Supported file formats: <code className="text-green-400">.txt</code>, <code className="text-green-400">.md</code>, <code className="text-green-400">.csv</code>, <code className="text-green-400">.json</code>.
                    For PDFs and Word documents, copy the text content into a .txt file before uploading.
                  </p>
                </div>

                <div className="bg-gray-700/20 rounded-lg p-5">
                  <h4 className="text-white font-bold mb-3">Step 3: AI Processes Your Documents</h4>
                  <p className="text-gray-400 text-sm">
                    When you upload a document, the AI automatically:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400 mt-3">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 shrink-0">{'\u2192'}</span>
                      <span><strong className="text-white">Chunks the text</strong> into ~1,000-character segments by sentence boundaries, preserving context</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 shrink-0">{'\u2192'}</span>
                      <span><strong className="text-white">Indexes each chunk</strong> for full-text search in your firm&apos;s private database</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 shrink-0">{'\u2192'}</span>
                      <span><strong className="text-white">Maps document names</strong> so answers can cite exact sources like &quot;Standard-NDA-Template.txt&quot;</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-700/20 rounded-lg p-5">
                  <h4 className="text-white font-bold mb-3">Step 4: Use the Training Guide</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    The Knowledge Agent includes a built-in Training Guide tab that shows:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>{'\u{2705}'} <strong className="text-white">Training status</strong> — visual progress bar showing how well-trained your agent is</li>
                    <li>{'\u{2705}'} <strong className="text-white">Document checklist</strong> — recommended document types to upload with completion tracking</li>
                    <li>{'\u{2705}'} <strong className="text-white">Best practices</strong> — tips for file naming, redacting sensitive data, and iterating</li>
                  </ul>
                  <p className="text-gray-400 text-sm mt-3">
                    We recommend uploading at least <strong className="text-white">10 documents</strong> across different categories 
                    for best results. The more documents you upload, the smarter your agent becomes.
                  </p>
                </div>

                <div className="bg-gray-700/20 rounded-lg p-5">
                  <h4 className="text-white font-bold mb-3">Step 5: Query Your Knowledge Base</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Switch to the Chat tab and ask questions in natural language. The AI will:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 shrink-0">1.</span>
                      <span>Search your firm&apos;s knowledge base for relevant document chunks</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 shrink-0">2.</span>
                      <span>Feed the relevant context to the AI (Grok-3) for intelligent synthesis</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-400 shrink-0">3.</span>
                      <span>Return a detailed answer that cites which documents the information came from</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Example Queries */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-xl font-bold text-white mb-4">Example Queries Lawyers Ask</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'What are our standard terms for commercial lease agreements?',
                  'Summarize our client onboarding procedure',
                  'What precedents do we have on landlord-tenant disputes?',
                  'What is our firm policy on conflict of interest?',
                  'Find our standard force majeure clause',
                  'What are the NBA rules on client account handling?',
                  'Summarize our most recent case brief on maritime law',
                  'What is our billing rate structure for litigation matters?',
                ].map(q => (
                  <div key={q} className="bg-gray-700/20 rounded-lg px-4 py-3 border border-gray-600/20">
                    <p className="text-gray-300 text-sm">&quot;{q}&quot;</p>
                  </div>
                ))}
              </div>
            </div>

            {/* What to Upload */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-xl font-bold text-white mb-4">What Documents Should You Upload?</h3>
              <div className="space-y-4">
                {[
                  { icon: '\u{1F4DD}', title: 'Contract Templates & Standard Agreements', examples: 'NDAs, service agreements, MOUs, employment contracts, lease agreements, shareholder agreements', why: 'So the AI knows your firm\'s preferred terms, clauses, and drafting style' },
                  { icon: '\u{2696}\u{FE0F}', title: 'Past Case Briefs & Judgments', examples: 'Your firm\'s case briefs, written arguments, court judgments you\'ve relied on', why: 'So the AI can reference your firm\'s litigation experience and precedents' },
                  { icon: '\u{1F4CB}', title: 'Internal Policies & Procedures', examples: 'Client onboarding, billing procedures, conflict checks, file management', why: 'So new associates and staff can quickly find answers about firm procedures' },
                  { icon: '\u{1F4DA}', title: 'Legal Research Memos & Opinions', examples: 'Research memos, advisory opinions, due diligence reports', why: 'So your team doesn\'t redo research that\'s already been done' },
                  { icon: '\u{2705}', title: 'Compliance & Regulatory Guides', examples: 'NBA rules, court practice directions, SCUML guidelines, data protection compliance notes', why: 'So the AI can quickly answer compliance questions from your regulatory knowledge' },
                ].map(item => (
                  <div key={item.title} className="bg-gray-700/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <h4 className="text-white font-semibold text-sm">{item.title}</h4>
                    </div>
                    <p className="text-gray-400 text-xs mb-1"><strong className="text-gray-300">Examples:</strong> {item.examples}</p>
                    <p className="text-gray-400 text-xs"><strong className="text-gray-300">Why:</strong> {item.why}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-900/20 rounded-xl p-6 border border-emerald-500/20">
              <h3 className="text-lg font-bold text-white mb-2">{'\u{1F6E1}\u{FE0F}'} Security &amp; Privacy</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>{'\u2022'} Each firm has an isolated workspace — no cross-firm data access</li>
                <li>{'\u2022'} Documents are stored in Supabase with Row Level Security (RLS) enabled</li>
                <li>{'\u2022'} We recommend redacting sensitive client names and personal data before uploading</li>
                <li>{'\u2022'} The AI only answers using YOUR documents — it does not mix in data from other firms or the internet</li>
                <li>{'\u2022'} Up to 10 team members can access the same firm knowledge base on the Firm plan</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-700/50" />

        {/* FAQ */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Are the basic AI tools really free?',
                a: 'Yes. Case Search, Document Drafting, Contract Analysis, Legal Summary, Translation, Argument Generator, Compliance Checker, Deadline Tracker, Billing Calculator, AI Chatbot, and all other tools listed on our Tools page are 100% free for everyone — students, lawyers, firms, and the public.',
              },
              {
                q: 'What exactly requires a subscription?',
                a: 'Only two tools require a subscription: Daily Intelligence Brief (Individual plan and above) and Firm Knowledge Agent (Law Firm plan only). These are automation tools designed specifically for practicing lawyers and law firms.',
              },
              {
                q: 'How is the Individual plan different from the Firm plan?',
                a: 'Individual Lawyer ($20/mo or ₦32,000) includes Daily Intelligence Brief with unlimited queries and priority processing for 1 user. Law Firm ($30/mo or ₦48,000) includes everything in Individual PLUS the Firm Knowledge Agent with document upload, AI-powered firm knowledge search, and up to 10 user seats.',
              },
              {
                q: 'How do I train the Knowledge Agent?',
                a: 'Go to the Knowledge Agent tool, enter your firm name, switch to the Upload tab, select a document category, and upload .txt, .md, or .csv files. The AI automatically chunks and indexes your documents for search. Use the Training Guide tab for a step-by-step checklist and best practices.',
              },
              {
                q: 'What file formats are supported?',
                a: 'Currently .txt, .md, .csv, and .json files. For PDFs and Word documents, copy the text content into a .txt file. We are working on native PDF upload support.',
              },
              {
                q: 'Can multiple people at my firm use the Knowledge Agent?',
                a: 'Yes. On the Law Firm plan, up to 10 team members can access the same firm knowledge base. Each person signs in with their own CaseWin AI account and enters the same firm name to access the shared knowledge base.',
              },
              {
                q: 'Is my firm\'s data private?',
                a: 'Yes. Each firm has an isolated workspace. Documents are stored with Row Level Security in our database. The AI only uses your firm\'s documents when answering queries — no data is shared across firms.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Subscriptions are monthly with no long-term commitment. Cancel anytime and your access continues until the end of your billing period.',
              },
              {
                q: 'Do I need to upload documents every day?',
                a: 'No. Upload once and your knowledge base persists. You can add new documents anytime — when you get new templates, complete new cases, or update firm policies. The agent gets smarter with each upload.',
              },
            ].map(item => (
              <div key={item.q} className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50">
                <h3 className="text-white font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-400 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-2xl p-12 border border-green-500/20">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Automate Your Practice?</h2>
          <p className="text-gray-300 mb-8 max-w-lg mx-auto">
            Try the interactive demo first, or subscribe now and start saving hours every day.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/demo/lawyers" className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Try Interactive Demo
            </Link>
            <Link href="/pricing" className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition">
              Subscribe — From $20/mo
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            CaseWin AI &bull; Nigerian Legal AI Platform &bull;{' '}
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link> &bull;{' '}
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface InvoiceItem {
  description: string
  hours?: number | null
  rate?: number | null
  amount: number
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email?: string
  client_phone?: string
  matter: string
  items: InvoiceItem[]
  subtotal: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_link?: string
  due_date?: string
  ai_draft?: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  sent: 'bg-blue-900 text-blue-300',
  paid: 'bg-green-900 text-green-300',
  overdue: 'bg-red-900 text-red-300',
  cancelled: 'bg-gray-800 text-gray-500',
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState('')

  // Form state
  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    matter: '',
    due_date: '',
    notes: '',
    hourly_rate: '10000',
  })
  const [services, setServices] = useState([
    { description: '', hours: '', amount: '' }
  ])

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    setLoading(true)
    try {
      const res = await fetch('/api/agent-commerce/invoices')
      if (res.status === 401) { router.push('/auth/login'); return }
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function createInvoice() {
    if (!form.client_name || !form.matter) return
    const validServices = services.filter(s => s.description.trim())
    if (!validServices.length) return

    setCreating(true)
    try {
      const res = await fetch('/api/agent-commerce/draft-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hourly_rate: parseInt(form.hourly_rate) || 10000,
          services: validServices.map(s => ({
            description: s.description,
            hours: s.hours ? parseFloat(s.hours) : undefined,
            amount: s.amount ? parseFloat(s.amount) : undefined,
          })),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowCreate(false)
        setSelectedInvoice(data.invoice)
        fetchInvoices()
        // Reset form
        setForm({ client_name: '', client_email: '', client_phone: '', matter: '', due_date: '', notes: '', hourly_rate: '10000' })
        setServices([{ description: '', hours: '', amount: '' }])
      } else {
        alert(data.error || 'Failed to create invoice')
      }
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  async function markSent(invoice: Invoice) {
    await fetch('/api/agent-commerce/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: invoice.id, status: 'sent' }),
    })
    fetchInvoices()
    if (selectedInvoice?.id === invoice.id) setSelectedInvoice({ ...invoice, status: 'sent' })
  }

  function copyLink(link: string, id: string) {
    navigator.clipboard.writeText(link)
    setCopied(id)
    setTimeout(() => setCopied(''), 2000)
  }

  function copyWhatsApp(invoice: Invoice) {
    const msg = `Dear ${invoice.client_name},\n\nPlease find your invoice ${invoice.invoice_number} for *${invoice.matter}*.\n\nAmount Due: ₦${invoice.total.toLocaleString()}\n${invoice.due_date ? `Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-NG')}` : ''}\n\nPay securely here:\n${invoice.payment_link}\n\nThank you.\nSent via CaseWin AI`
    navigator.clipboard.writeText(msg)
    setCopied('wa_' + invoice.id)
    setTimeout(() => setCopied(''), 2000)
  }

  const totalEarned = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalPending = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.total, 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-green-900/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">🧾 Agent Commerce</h1>
            <p className="text-gray-400 text-sm">AI-powered invoicing & payment collection</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            + New Invoice
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs mb-1">Total Invoices</p>
            <p className="text-2xl font-bold text-white">{invoices.length}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-green-900/40">
            <p className="text-gray-400 text-xs mb-1">Collected</p>
            <p className="text-2xl font-bold text-green-400">₦{totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-yellow-900/40">
            <p className="text-gray-400 text-xs mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-400">₦{totalPending.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoice List */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Invoices</h2>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-gray-900 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="bg-gray-900 rounded-xl p-8 text-center border border-dashed border-gray-700">
                <p className="text-4xl mb-3">🧾</p>
                <p className="text-gray-400 text-sm">No invoices yet.</p>
                <button onClick={() => setShowCreate(true)} className="mt-3 text-green-400 text-sm hover:underline">
                  Create your first invoice →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map(inv => (
                  <button
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`w-full text-left bg-gray-900 hover:bg-gray-800 rounded-xl p-4 border transition-colors ${selectedInvoice?.id === inv.id ? 'border-green-500' : 'border-gray-800'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{inv.client_name}</p>
                        <p className="text-gray-400 text-xs truncate">{inv.matter}</p>
                        <p className="text-green-400 text-sm font-bold mt-1">₦{inv.total.toLocaleString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ml-2 shrink-0 ${STATUS_COLORS[inv.status]}`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">{inv.invoice_number}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Invoice Detail */}
          <div className="lg:col-span-2">
            {selectedInvoice ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                {/* Invoice Header */}
                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/20 p-6 border-b border-gray-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-green-400 font-mono text-sm">{selectedInvoice.invoice_number}</p>
                      <h2 className="text-xl font-bold text-white mt-1">{selectedInvoice.client_name}</h2>
                      <p className="text-gray-400 text-sm">{selectedInvoice.matter}</p>
                      {selectedInvoice.client_email && (
                        <p className="text-gray-500 text-xs mt-1">{selectedInvoice.client_email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLORS[selectedInvoice.status]}`}>
                        {selectedInvoice.status.toUpperCase()}
                      </span>
                      <p className="text-3xl font-bold text-white mt-2">₦{selectedInvoice.total.toLocaleString()}</p>
                      {selectedInvoice.due_date && (
                        <p className="text-gray-400 text-xs mt-1">
                          Due: {new Date(selectedInvoice.due_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Services</h3>
                  <div className="space-y-2 mb-4">
                    {selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                        <div>
                          <p className="text-white text-sm">{item.description}</p>
                          {item.hours && item.rate && (
                            <p className="text-gray-500 text-xs">{item.hours} hrs × ₦{item.rate.toLocaleString()}</p>
                          )}
                        </div>
                        <p className="text-green-400 font-semibold">₦{item.amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-gray-800 rounded-lg px-4 py-2 text-right">
                      <p className="text-gray-400 text-xs">Subtotal: ₦{selectedInvoice.subtotal.toLocaleString()}</p>
                      <p className="text-white font-bold">Total: ₦{selectedInvoice.total.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* AI Draft */}
                  {selectedInvoice.ai_draft && (
                    <div className="mt-4 bg-gray-800/50 rounded-lg p-4 border border-green-900/30">
                      <p className="text-green-400 text-xs font-semibold mb-2">🤖 AI Professional Notes</p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedInvoice.ai_draft}</p>
                    </div>
                  )}

                  {/* Payment Link */}
                  {selectedInvoice.payment_link && (
                    <div className="mt-4 bg-gray-800 rounded-lg p-4">
                      <p className="text-gray-400 text-xs mb-2 font-semibold">💳 PAYMENT LINK (share with client)</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={selectedInvoice.payment_link}
                          className="flex-1 bg-gray-900 text-green-400 text-xs px-3 py-2 rounded-lg font-mono border border-gray-700 min-w-0 truncate"
                        />
                        <button
                          onClick={() => copyLink(selectedInvoice.payment_link!, selectedInvoice.id)}
                          className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg shrink-0 transition-colors"
                        >
                          {copied === selectedInvoice.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedInvoice.status === 'draft' && (
                      <button
                        onClick={() => markSent(selectedInvoice)}
                        className="bg-blue-700 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        ✉️ Mark as Sent
                      </button>
                    )}
                    {selectedInvoice.payment_link && (
                      <button
                        onClick={() => copyWhatsApp(selectedInvoice)}
                        className="bg-green-800 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        {copied === `wa_${selectedInvoice.id}` ? '✓ Copied!' : '📱 Copy WhatsApp Message'}
                      </button>
                    )}
                    {selectedInvoice.payment_link && (
                      <a
                        href={selectedInvoice.payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
                      >
                        🔗 Open Payment Page
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-dashed border-gray-700 p-16 text-center">
                <p className="text-5xl mb-4">📄</p>
                <p className="text-gray-400">Select an invoice to view details</p>
                <button onClick={() => setShowCreate(true)} className="mt-4 text-green-400 hover:underline text-sm">
                  Or create a new one →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">🤖 New AI Invoice</h2>
                <p className="text-gray-400 text-sm">AI will draft professional notes and generate a payment link</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Client Name *</label>
                  <input
                    value={form.client_name}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    placeholder="Chief Emeka Obi"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Client Email</label>
                  <input
                    value={form.client_email}
                    onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                    placeholder="client@email.com"
                    type="email"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Client Phone</label>
                  <input
                    value={form.client_phone}
                    onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                    placeholder="+234..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Default Hourly Rate (₦)</label>
                  <input
                    value={form.hourly_rate}
                    onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                    type="number"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Legal Matter / Case Title *</label>
                <input
                  value={form.matter}
                  onChange={e => setForm(f => ({ ...f, matter: e.target.value }))}
                  placeholder="e.g. Land Dispute — Obi v. Adeyemi (Suit No. FHC/ABJ/...)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Services */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-gray-400 text-xs">Services Rendered *</label>
                  <button
                    onClick={() => setServices(s => [...s, { description: '', hours: '', amount: '' }])}
                    className="text-green-400 text-xs hover:underline"
                  >
                    + Add Line
                  </button>
                </div>
                <div className="space-y-2">
                  {services.map((svc, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        value={svc.description}
                        onChange={e => setServices(s => s.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                        placeholder="e.g. Court appearance, filing fees..."
                        className="col-span-6 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                      />
                      <input
                        value={svc.hours}
                        onChange={e => setServices(s => s.map((x, j) => j === i ? { ...x, hours: e.target.value } : x))}
                        placeholder="Hrs"
                        type="number"
                        className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                      />
                      <input
                        value={svc.amount}
                        onChange={e => setServices(s => s.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                        placeholder="₦ Fixed"
                        type="number"
                        className="col-span-3 bg-gray-800 border border-gray-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                      />
                      {services.length > 1 && (
                        <button
                          onClick={() => setServices(s => s.filter((_, j) => j !== i))}
                          className="col-span-1 text-gray-600 hover:text-red-400 text-center"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-1">Enter hours (uses hourly rate) or fixed ₦ amount. Use hours OR amount per line.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">Due Date</label>
                  <input
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    type="date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Additional Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special payment terms, case context..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createInvoice}
                  disabled={creating || !form.client_name || !form.matter}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  {creating ? '🤖 AI Drafting...' : '✨ Generate Invoice + Payment Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

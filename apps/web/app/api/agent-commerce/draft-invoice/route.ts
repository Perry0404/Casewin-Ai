import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const ZENDFI_BASE = 'https://api.zendfi.tech/api/v1'

function getAuthenticatedClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  )
}

// POST /api/agent-commerce/draft-invoice
// Body: { client_name, client_email, client_phone, matter, services[], due_date, notes }
// Returns: AI-drafted invoice with itemized billing + payment link
export async function POST(request: NextRequest) {
  try {
    const supabase = getAuthenticatedClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { client_name, client_email, client_phone, matter, services, due_date, notes, hourly_rate } = body

    if (!client_name || !matter || !services?.length) {
      return NextResponse.json(
        { error: 'Required: client_name, matter, services (array of { description, hours?, amount? })' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || ''
    const zendfiKey = process.env.ZENDFI_API_KEY || ''

    // Step 1: AI drafts professional invoice content
    let aiDraft = ''
    if (apiKey) {
      const servicesText = services.map((s: { description: string; hours?: number; amount?: number }) =>
        `- ${s.description}${s.hours ? ` (${s.hours} hrs @ ₦${hourly_rate || 10000}/hr)` : ''}${s.amount ? ` — ₦${s.amount.toLocaleString()}` : ''}`
      ).join('\n')

      const grokRes = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.GROK_MODEL || 'grok-3',
          messages: [
            {
              role: 'system',
              content: 'You are a professional legal billing assistant in Nigeria. Draft clear, formal invoice descriptions and professional notes for legal services. Keep language professional and concise.'
            },
            {
              role: 'user',
              content: `Draft professional invoice content for the following legal matter:

Client: ${client_name}
Matter: ${matter}
Services Rendered:
${servicesText}
${due_date ? `Due Date: ${due_date}` : ''}
${notes ? `Additional Notes: ${notes}` : ''}

Please provide:
1. A professional invoice summary (2-3 sentences describing the legal work)
2. Professional payment terms notice
3. Brief note on the legal matter handled

Keep it formal, appropriate for Nigerian legal practice.`
            }
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      })

      if (grokRes.ok) {
        const grokData = await grokRes.json()
        aiDraft = grokData.choices?.[0]?.message?.content || ''
      }
    }

    // Step 2: Calculate totals
    const defaultRate = hourly_rate || 10000
    const items = services.map((s: { description: string; hours?: number; amount?: number }) => {
      const amount = s.amount || (s.hours ? s.hours * defaultRate : defaultRate)
      return {
        description: s.description,
        hours: s.hours || null,
        rate: s.hours ? defaultRate : null,
        amount,
      }
    })

    const subtotal = items.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0)
    const taxRate = 0 // VAT exemption for most legal services in Nigeria
    const taxAmount = Math.round(subtotal * taxRate)
    const total = subtotal + taxAmount

    // Step 3: Generate invoice number
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count } = await serviceClient
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('lawyer_id', user.id)

    const invoiceNumber = `CW-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    // Step 4: Create ZendFi payment link for collection
    let paymentLink = ''
    let zendfiPaymentLinkId = ''
    let paymentReference = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`

    if (zendfiKey && total > 0) {
      const NGN_TO_USD = 1600
      const amountUsd = Math.round((total / NGN_TO_USD) * 100) / 100

      const zendfiRes = await fetch(`${ZENDFI_BASE}/payment-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zendfiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountUsd,
          amount_ngn: total,
          currency: 'USD',
          token: 'USDC',
          onramp: true,
          payer_service_charge: true,
          description: `Invoice ${invoiceNumber} - ${matter} | CaseWin AI`,
          metadata: {
            invoice_number: invoiceNumber,
            client_name,
            lawyer_id: user.id,
            matter,
            reference: paymentReference,
          },
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://casewinai.com'}/api/webhooks/zendfi`,
        }),
      })

      if (zendfiRes.ok) {
        const zendfiData = await zendfiRes.json()
        paymentLink = zendfiData.payment_url || zendfiData.data?.payment_url || zendfiData.payment_link || zendfiData.data?.payment_link || zendfiData.url || zendfiData.data?.url || zendfiData.checkout_url || zendfiData.data?.checkout_url || ''
        zendfiPaymentLinkId = zendfiData.id || zendfiData.data?.id || ''
      }
    }

    // Step 5: Save invoice to database
    const { data: invoice, error: insertError } = await serviceClient
      .from('invoices')
      .insert([{
        lawyer_id: user.id,
        client_name,
        client_email: client_email || null,
        client_phone: client_phone || null,
        invoice_number: invoiceNumber,
        matter,
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        currency: 'NGN',
        status: 'draft',
        payment_link: paymentLink || null,
        payment_reference: paymentReference,
        zendfi_payment_link_id: zendfiPaymentLinkId || null,
        due_date: due_date || null,
        notes: notes || null,
        ai_draft: aiDraft || null,
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Invoice insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save invoice: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        items,
        payment_link: paymentLink,
        ai_draft: aiDraft,
      },
    })
  } catch (err) {
    console.error('Agent commerce error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

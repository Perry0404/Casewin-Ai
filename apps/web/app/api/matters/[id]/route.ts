import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function authedClient(request: NextRequest) {
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

function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function loadOwned(request: NextRequest, id: string) {
  const { data: { user } } = await authedClient(request).auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 as const }
  const svc = serviceClient()
  const { data: matter } = await svc.from('matters').select('*').eq('id', id).single()
  if (!matter) return { error: 'Matter not found', status: 404 as const }
  if (matter.owner_id !== user.id && matter.lawyer_id !== user.id) {
    return { error: 'Forbidden', status: 403 as const }
  }
  return { user, svc, matter }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const r = await loadOwned(request, params.id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ matter: r.matter })
}

// PATCH — advance the matter. Accepts any of:
//   { stage }                                   set the pipeline stage
//   { addEvidence: { name, hash, type } }        append an evidence proof
//   { settlement }                               store settlement engine output (→ stage 'settlement')
//   { invoiceId, paymentLink }                   attach the transactions-layer invoice (→ stage 'agreement')
//   { resolution: 'settled' | 'filed' }          close or escalate the matter
//   { joinAsLawyer: true }                       a lawyer joins the matter
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const r = await loadOwned(request, params.id)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status })
  const { user, svc, matter } = r

  const body = await request.json()
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.stage) update.stage = body.stage

  if (body.addEvidence?.hash && body.addEvidence?.name) {
    const current = Array.isArray(matter.evidence) ? matter.evidence : []
    update.evidence = [
      ...current,
      { name: body.addEvidence.name, hash: body.addEvidence.hash, type: body.addEvidence.type || 'file', addedAt: new Date().toISOString() },
    ]
  }

  if (body.settlement) {
    update.settlement = body.settlement
    update.stage = 'settlement'
  }

  if (body.invoiceId || body.paymentLink) {
    if (body.invoiceId) update.invoice_id = body.invoiceId
    if (body.paymentLink) update.payment_link = body.paymentLink
    update.stage = 'agreement'
  }

  if (body.resolution === 'settled') {
    update.resolution = 'settled'
    update.stage = 'closed'
  } else if (body.resolution === 'filed') {
    update.resolution = 'filed'
    update.stage = 'filed'
  }

  if (body.joinAsLawyer === true) {
    update.lawyer_id = user!.id
  }

  if (typeof body.narrative === 'string') update.narrative = body.narrative

  const { data, error } = await svc.from('matters').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, matter: data })
}

export const config = { runtime: 'edge' }

interface TrackBody {
  type: 'page_view' | 'click'
  profile_id: string
  link_id?: string
  source?: string | null
  campaign?: string | null
  referrer?: string | null
  device?: string | null
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: TrackBody
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!body.profile_id || (body.type !== 'page_view' && body.type !== 'click')) {
    return new Response(JSON.stringify({ error: 'profile_id and a valid type are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Vercel's edge network resolves these from the visitor's IP automatically —
  // no external API call, no rate limits, and city-level instead of just country.
  const decode = (v: string | null) => (v ? decodeURIComponent(v) : null)
  const country = decode(request.headers.get('x-vercel-ip-country'))
  const city = decode(request.headers.get('x-vercel-ip-city'))

  const table = body.type === 'page_view' ? 'page_view_events' : 'click_events'
  const payload: Record<string, unknown> = {
    profile_id: body.profile_id,
    source: body.source ?? null,
    campaign: body.campaign ?? null,
    referrer: body.referrer ?? null,
    device: body.device ?? null,
    country,
    city,
  }
  if (table === 'click_events') payload.link_id = body.link_id

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server is missing Supabase configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(JSON.stringify({ error: text }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(null, { status: 204 })
}

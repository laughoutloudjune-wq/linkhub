import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface TrackBody {
  type: "page_view" | "click"
  profile_id: string
  link_id?: string
  source?: string | null
  campaign?: string | null
  referrer?: string | null
  device?: string | null
}

async function lookupCountry(url: string, extract: (data: unknown) => string | null): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return null
    const data = await res.json()
    const country = extract(data)
    return country && country.length > 0 ? country : null
  } catch {
    return null
  }
}

async function resolveCountry(req: Request): Promise<string | null> {
  const cfCountry = req.headers.get("cf-ipcountry")
  if (cfCountry && cfCountry !== "XX") return cfCountry

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  if (!ip) return null

  // Try two free, keyless providers in sequence — either can rate-limit on
  // shared serverless egress IPs, so don't let one failure block tracking.
  const fromIpwho = await lookupCountry(
    `https://ipwho.is/${ip}?fields=success,country`,
    (data) => {
      const d = data as { success?: boolean; country?: string }
      return d.success && d.country ? d.country : null
    },
  )
  if (fromIpwho) return fromIpwho

  return lookupCountry(
    `https://freeipapi.com/api/json/${ip}`,
    (data) => (data as { countryName?: string }).countryName ?? null,
  )
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  }

  let body: TrackBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  if (!body.profile_id || (body.type !== "page_view" && body.type !== "click")) {
    return new Response(JSON.stringify({ error: "profile_id and a valid type are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  const country = await resolveCountry(req)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  )

  const table = body.type === "page_view" ? "page_view_events" : "click_events"
  const payload: Record<string, unknown> = {
    profile_id: body.profile_id,
    source: body.source ?? null,
    campaign: body.campaign ?? null,
    referrer: body.referrer ?? null,
    device: body.device ?? null,
    country,
  }
  if (table === "click_events") payload.link_id = body.link_id

  const { error } = await supabase.from(table).insert(payload)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  return new Response(null, { status: 204, headers: corsHeaders })
})

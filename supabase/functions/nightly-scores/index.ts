// Supabase Edge Function: Nightly Score Computation
// Called by pg_cron or an external scheduler at ~2 AM UTC daily.
// Iterates all active users and calls compute_daily_score() for yesterday.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')

    if (profilesError) {
      throw profilesError
    }

    // Compute yesterday's date in UTC
    const yesterday = new Date()
    yesterday.setUTCDate(yesterday.getUTCDate() - 1)
    const scoreDate = yesterday.toISOString().split('T')[0]

    let computed = 0
    let errors = 0

    for (const profile of profiles || []) {
      const { error } = await supabase.rpc('compute_daily_score', {
        p_user_id: profile.id,
        p_date: scoreDate,
      })

      if (error) {
        console.error(`Error computing score for ${profile.id}:`, error.message)
        errors++
      } else {
        computed++
      }
    }

    return new Response(
      JSON.stringify({
        message: `Score computation complete for ${scoreDate}`,
        computed,
        errors,
        total: profiles?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

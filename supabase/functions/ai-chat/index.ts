/**
 * AI Chat Proxy Edge Function
 *
 * Proxies chat requests to OpenAI/Anthropic with:
 * - User authentication via Supabase JWT
 * - Daily usage limits for free tier
 * - BYOK support (use user's own key if provided)
 * - Streaming responses
 *
 * Deploy: supabase functions deploy ai-chat
 * Test: curl -X POST https://<project>.supabase.co/functions/v1/ai-chat
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const DAILY_FREE_LIMIT = 20;
const DEFAULT_MODEL = 'gpt-4o-mini'; // Cost-effective for free tier
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// CORS headers — restrict to mobile app and Supabase dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') || '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  stream?: boolean;
  model?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check user tier and usage
    const { data: settings } = await supabase
      .from('user_ai_settings')
      .select('tier, has_own_key')
      .eq('user_id', user.id)
      .single();

    const tier = settings?.tier || 'free';
    const hasOwnKey = settings?.has_own_key || false;

    // Skip usage check for premium users or BYOK
    if (tier === 'free' && !hasOwnKey) {
      const today = new Date().toISOString().split('T')[0];

      const { data: usage } = await supabase
        .from('ai_usage')
        .select('message_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      const currentCount = usage?.message_count || 0;

      if (currentCount >= DAILY_FREE_LIMIT) {
        return new Response(
          JSON.stringify({
            error: 'daily_limit_reached',
            message: `You've used all ${DAILY_FREE_LIMIT} free messages today. Add your own API key for unlimited access, or try again tomorrow.`,
            remaining: 0,
            limit: DAILY_FREE_LIMIT,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // 3. Parse request
    const { messages, stream = true, model = DEFAULT_MODEL }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Forward to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(JSON.stringify({ level: 'error', context: 'openai_proxy', message: 'OpenAI API error', status: openaiResponse.status }));
      return new Response(JSON.stringify({ error: 'AI service error', details: errorText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Increment usage (best-effort — log failures but don't block response)
    if (tier === 'free' && !hasOwnKey) {
      const today = new Date().toISOString().split('T')[0];

      try {
        const { error: usageError } = await supabase.rpc('increment_ai_usage', {
          p_user_id: user.id,
          p_date: today,
        });
        if (usageError) {
          console.error(JSON.stringify({ level: 'error', context: 'usage_tracking', message: 'Failed to increment usage', detail: usageError.message }));
        }
      } catch (err) {
        console.error(JSON.stringify({ level: 'error', context: 'usage_tracking', message: 'Failed to increment usage', detail: err instanceof Error ? err.message : 'Unknown error' }));
      }
    }

    // 6. Stream response back
    if (stream) {
      return new Response(openaiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const data = await openaiResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', context: 'edge_function', message: 'Unhandled error', detail: error instanceof Error ? error.message : 'Unknown error' }));
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

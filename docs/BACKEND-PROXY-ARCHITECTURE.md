# Backend Proxy Architecture

## Problem

The AI companion requires an OpenAI or Anthropic API key. Most users don't have one. This limits the app to power users only, which kills mass adoption.

## Goal

Make the AI companion "just work" for everyone, like how ChatGPT just works when you open the app.

---

## Options Considered

### Option 1: BYOK Only (Current)

- Users bring their own key
- **Pros:** Zero backend cost, privacy-first
- **Cons:** Kills adoption, complex for users

### Option 2: Backend Proxy (Recommended)

- We run a proxy that forwards requests to OpenAI/Anthropic
- Users don't need their own keys
- **Pros:** Frictionless UX, we control the experience
- **Cons:** We pay for API costs, need rate limiting

### Option 3: Hybrid

- Free tier with limits (e.g., 20 messages/day)
- Power users can add their own key for unlimited
- **Pros:** Best of both, sustainable
- **Cons:** More complex to implement

---

## Recommended Architecture: Hybrid Model

### Tiers

| Tier    | Messages/Day | API Key        | Cost     |
| ------- | ------------ | -------------- | -------- |
| Free    | 20           | Ours (proxied) | Free     |
| BYOK    | Unlimited    | User's own     | Free     |
| Premium | Unlimited    | Ours (proxied) | $X/month |

### Backend Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Mobile App                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                   │
│                                                              │
│  /ai/chat                                                    │
│  ├── Authenticate user (JWT from Supabase Auth)             │
│  ├── Check usage limits (Redis/Supabase)                    │
│  ├── Select API key (user's or ours)                        │
│  ├── Forward to OpenAI/Anthropic                            │
│  ├── Stream response back                                    │
│  └── Log usage (for billing/limits)                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   OpenAI / Anthropic API                     │
└─────────────────────────────────────────────────────────────┘
```

### Security Considerations

1. **API Key Storage**
   - Our API keys stored in Supabase secrets
   - Never exposed to client
   - Rotated regularly

2. **Rate Limiting**
   - Per-user daily limits
   - Per-minute burst limits
   - IP-based fallback

3. **Abuse Prevention**
   - Monitor for prompt injection attempts
   - Block users who abuse the system
   - Log all requests (encrypted)

4. **Privacy**
   - Messages not stored on server (pass-through only)
   - User can use BYOK for full privacy
   - Clear privacy policy

### Database Schema (Usage Tracking)

```sql
-- Track daily usage for free tier limits
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INT NOT NULL DEFAULT 0,
  token_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, date)
);

-- Track BYOK users
CREATE TABLE user_ai_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  has_own_key BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_provider TEXT, -- 'openai' | 'anthropic'
  tier TEXT NOT NULL DEFAULT 'free', -- 'free' | 'premium'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Edge Function: /ai/chat

```typescript
// Simplified example
import { createClient } from '@supabase/supabase-js';

const DAILY_LIMIT = 20;
const OUR_OPENAI_KEY = Deno.env.get('OPENAI_API_KEY')!;

Deno.serve(async (req) => {
  // 1. Authenticate
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(/* ... */);
  const {
    data: { user },
  } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Check if user has own key
  const { data: settings } = await supabase
    .from('user_ai_settings')
    .select('has_own_key, tier')
    .eq('user_id', user.id)
    .single();

  // 3. Check usage limits (for free tier without own key)
  if (!settings?.has_own_key && settings?.tier !== 'premium') {
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('message_count')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single();

    if ((usage?.message_count || 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'daily_limit_reached',
          message: "You've reached your daily limit. Add your own API key for unlimited access.",
        }),
        { status: 429 },
      );
    }
  }

  // 4. Get messages from request
  const { messages, stream = true } = await req.json();

  // 5. Forward to OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OUR_OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Cost-effective for free tier
      messages,
      stream,
    }),
  });

  // 6. Update usage count
  await supabase.rpc('increment_ai_usage', { p_user_id: user.id });

  // 7. Stream response back
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});
```

### Cost Estimation

Assuming GPT-4o-mini at $0.15/1M input tokens, $0.60/1M output tokens:

- Average conversation: ~1000 input tokens, ~500 output tokens
- Cost per message: ~$0.00045

| Users  | Messages/Day | Monthly Cost |
| ------ | ------------ | ------------ |
| 100    | 1,000        | ~$13         |
| 1,000  | 10,000       | ~$135        |
| 10,000 | 100,000      | ~$1,350      |

This is very manageable. The premium tier could pay for the free tier.

---

## Implementation Plan

### Phase 1: BYOK (Current)

- Already implemented
- Users can add their own key

### Phase 2: Backend Proxy

1. Create Supabase Edge Function
2. Add usage tracking tables
3. Update mobile app to use proxy by default
4. Fall back to BYOK if user has key

### Phase 3: Premium Tier

1. Add Stripe/RevenueCat integration
2. Create premium subscription
3. Remove limits for paying users

---

## Mobile App Changes

Update `aiService.ts` to support proxy:

```typescript
// Check if user has own key
const hasOwnKey = await secureStorage.getItemAsync(API_KEY_STORAGE_KEY);

if (hasOwnKey) {
  // Use direct API call (current behavior)
  return directAPICall(messages, options);
} else {
  // Use proxy
  return proxyAPICall(messages, options);
}

async function proxyAPICall(messages: ChatMessage[], options: ChatOptions) {
  const session = await supabase.auth.getSession();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.data.session?.access_token}`,
    },
    body: JSON.stringify({ messages, ...options }),
  });

  // Handle streaming...
}
```

---

## Next Steps

1. [ ] Create `ai_usage` and `user_ai_settings` tables in Supabase
2. [ ] Write Edge Function for `/ai/chat`
3. [ ] Update `aiService.ts` to support proxy
4. [ ] Test end-to-end
5. [ ] Add rate limit UI (show remaining messages)
6. [ ] Plan premium tier pricing

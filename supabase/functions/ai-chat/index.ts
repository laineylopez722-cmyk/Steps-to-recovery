/**
 * AI Chat Proxy Edge Function
 *
 * Proxies chat requests to OpenAI/Anthropic with:
 * - User authentication via Supabase JWT
 * - Daily usage limits for free tier
 * - BYOK support (use user's own key if provided)
 * - Streaming responses
 * - Structured logging & error tracking
 *
 * Deploy: supabase functions deploy ai-chat
 * Test: curl -X POST https://<project>.supabase.co/functions/v1/ai-chat \
 *   -H "Authorization: Bearer $JWT_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"messages":[{"role":"user","content":"Hello"}]}'
 */

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
/// <reference lib="deno.ns" />

// deno-lint-ignore-file
// @ts-types="https://esm.sh/@supabase/supabase-js"
import { createClient } from "https://esm.sh/@supabase/supabase-js";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};

// ============================================================================
// Types
// ============================================================================
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface UserSettings {
  tier: "free" | "pro" | "premium";
  has_own_key: boolean;
  // Optional chatbot settings stored per-user
  system_prompt?: string | null;
  assistant_name?: string | null;
  default_model?: string | null;
  default_temperature?: number | null;
  default_max_tokens?: number | null;
}

interface UsageData {
  message_count: number;
}

interface CorsHeaders {
  readonly "Access-Control-Allow-Origin": string;
  readonly "Access-Control-Allow-Headers": string;
  readonly "Access-Control-Allow-Methods"?: string;
  [key: string]: string | undefined;
}

interface LogContext {
  level: "debug" | "info" | "warn" | "error";
  context: string;
  message: string;
  userId?: string;
  status?: number;
  detail?: string;
}

// ============================================================================
// Configuration
// ============================================================================
const DAILY_FREE_LIMIT = 20;
const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_MESSAGE_LENGTH = 4000;
const REQUEST_TIMEOUT_MS = 30000;

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

// Validate critical environment variables
const validateEnv = (): void => {
  const required = [
    "OPENAI_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];
  const missing = required.filter((key): boolean => !Deno.env.get(key));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

// CORS headers — restrict to mobile app
function getCorsHeaders(): CorsHeaders {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

// ============================================================================
// Logging
// ============================================================================
function log(logEntry: LogContext): void {
  const sanitized = {
    level: logEntry.level,
    context: logEntry.context,
    message: logEntry.message,
    ...(logEntry.userId && { userId: logEntry.userId }),
    ...(logEntry.status && { status: logEntry.status }),
    ...(logEntry.detail && { detail: logEntry.detail }),
  };
  console.log(JSON.stringify(sanitized));
}

// ============================================================================
// Validation
// ============================================================================
const validateChatRequest = (data: unknown): ChatRequest => {
  if (!data || typeof data !== "object") {
    throw new Error("Request body must be a JSON object");
  }

  const request = data as Record<string, unknown>;

  // Validate messages array
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new Error("Messages array is required and must not be empty");
  }

  // Validate each message
  for (const msg of request.messages) {
    if (typeof msg !== "object" || msg === null) {
      throw new Error("Each message must be an object");
    }

    const message = msg as Record<string, unknown>;
    const { role, content } = message;

    if (!["user", "assistant", "system"].includes(role as string)) {
      throw new Error(
        `Invalid role: ${role}. Must be 'user', 'assistant', or 'system'`,
      );
    }

    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error("Message content must be a non-empty string");
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message content exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`,
      );
    }
  }

  // Validate optional parameters
  const model = request.model ? String(request.model) : DEFAULT_MODEL;
  const stream = request.stream === true;
  const temperature = request.temperature !== undefined
    ? Number(request.temperature)
    : undefined;
  const max_tokens = request.max_tokens !== undefined
    ? Number(request.max_tokens)
    : undefined;

  if (
    temperature !== undefined &&
    (!Number.isFinite(temperature) || temperature < 0 || temperature > 2)
  ) {
    throw new Error("Temperature must be a number between 0 and 2");
  }

  if (
    max_tokens !== undefined &&
    (!Number.isFinite(max_tokens) || max_tokens < 1 || max_tokens > 4096)
  ) {
    throw new Error("max_tokens must be a number between 1 and 4096");
  }

  return {
    messages: request.messages as ChatMessage[],
    stream,
    model,
    ...(temperature !== undefined && { temperature }),
    ...(max_tokens !== undefined && { max_tokens }),
  };
};

// ============================================================================
// Safe Type Guards
// ============================================================================
function isUserSettings(value: unknown): value is UserSettings {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    (obj.tier === "free" || obj.tier === "pro" || obj.tier === "premium") &&
    typeof obj.has_own_key === "boolean"
  );
}

// ============================================================================
// Error Response Builders
// ============================================================================
const errorResponse = (
  status: number,
  error: string,
  details?: string,
): Response => {
  const body = { error, ...(details && { details }) };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(),
      "Content-Type": "application/json",
    },
  });
};

const limitResponse = (
  limit: number,
  remaining: number,
): Response => {
  return errorResponse(
    429,
    "daily_limit_reached",
    `Daily limit of ${limit} messages reached. Remaining: ${remaining}. Upgrade for unlimited access.`,
  );
};

// ============================================================================
// Helper Functions
// ============================================================================
function getAllowedMethod(): string {
  return "POST";
}

// ============================================================================
// Main Handler
// ============================================================================
Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders();

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    const preflightHeaders = {
      ...corsHeaders,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    };
    return new Response("ok", {
      status: 200,
      headers: preflightHeaders,
    });
  }

  // Only allow POST
  if (req.method !== getAllowedMethod()) {
    return errorResponse(405, "Method not allowed. Use POST.");
  }

  try {
    validateEnv();

    // Check for required API key
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Missing or invalid Authorization header");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.id) {
      log({
        level: "warn",
        context: "auth",
        message: "Authentication failed",
        detail: authError?.message || "User not found",
      });
      return errorResponse(401, "Invalid or expired token");
    }

    // 2. Get user settings (includes chatbot-specific defaults)
    const { data: settings, error: settingsError } = await supabase
      .from("user_ai_settings")
      .select(
        "tier, has_own_key, system_prompt, assistant_name, default_model, default_temperature, default_max_tokens",
      )
      .eq("user_id", user.id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 = no rows returned (user has no settings — treat as free tier)
      log({
        level: "error",
        context: "settings_fetch",
        message: "Failed to fetch user settings",
        userId: user.id,
        detail: settingsError.message,
      });
    }

    const settings_validated = isUserSettings(settings) ? settings : null;
    const tier = (settings_validated?.tier as UserSettings["tier"]) || "free";
    const hasOwnKey = settings_validated?.has_own_key || false;

    // 3. Check daily usage for free tier (no BYOK)
    if (tier === "free" && !hasOwnKey) {
      const today = new Date().toISOString().split("T")[0];

      const { data: usage, error: usageError } = await supabase
        .from("ai_usage")
        .select("message_count")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      if (usageError && usageError.code !== "PGRST116") {
        log({
          level: "warn",
          context: "usage_check",
          message: "Failed to check usage",
          userId: user.id,
          detail: usageError.message,
        });
      }

      const currentCount = usage?.message_count || 0;
      const remaining = DAILY_FREE_LIMIT - currentCount;

      if (remaining <= 0) {
        log({
          level: "info",
          context: "usage_limit",
          message: "Daily limit exceeded",
          userId: user.id,
          detail: `Used ${currentCount}/${DAILY_FREE_LIMIT}`,
        });
        return limitResponse(DAILY_FREE_LIMIT, 0);
      }
    }

    // 4. Parse and validate request
    let chatRequest: ChatRequest;
    try {
      const body = await req.json();
      chatRequest = validateChatRequest(body);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Invalid request body";
      return errorResponse(400, "Invalid request", message);
    }

    // Apply user chatbot settings (if present) as non-destructive defaults
    try {
      if (settings_validated) {
        const userSystemPrompt = settings_validated.system_prompt || "";
        const assistantName = settings_validated.assistant_name || "";

        if (
          (userSystemPrompt || assistantName) &&
          !chatRequest.messages.some((m) => m.role === "system")
        ) {
          const combined = [
            assistantName ? `You are ${assistantName}.` : "",
            userSystemPrompt,
          ]
            .filter(Boolean)
            .join(" ");
          if (combined.length > 0 && combined.length <= MAX_MESSAGE_LENGTH) {
            chatRequest.messages.unshift({ role: "system", content: combined });
            log({
              level: "debug",
              context: "settings_apply",
              message: "Applied system prompt from user settings",
              userId: user.id,
            });
          }
        }

        const defaultModel = settings_validated.default_model;
        const defaultTemp = settings_validated.default_temperature;
        const defaultMaxTokens = settings_validated.default_max_tokens;

        if (
          !chatRequest.model && typeof defaultModel === "string" &&
          defaultModel.length > 0
        ) {
          chatRequest.model = defaultModel;
          log({
            level: "debug",
            context: "settings_apply",
            message:
              `Applied default model from user settings: ${defaultModel}`,
            userId: user.id,
          });
        }

        if (
          chatRequest.temperature === undefined && defaultTemp !== null &&
          defaultTemp !== undefined
        ) {
          const t = Number(defaultTemp);
          if (!Number.isNaN(t) && t >= 0 && t <= 2) chatRequest.temperature = t;
        }

        if (
          chatRequest.max_tokens === undefined && defaultMaxTokens !== null &&
          defaultMaxTokens !== undefined
        ) {
          const mt = Number(defaultMaxTokens);
          if (!Number.isNaN(mt) && mt >= 1 && mt <= 4096) {
            chatRequest.max_tokens = mt;
          }
        }
      }
    } catch (err) {
      // Guard against unexpected settings shapes — settings are best-effort and must not block requests
      log({
        level: "warn",
        context: "settings_apply",
        message: "Failed to apply user chatbot settings",
        userId: user.id,
        detail: err instanceof Error ? err.message : String(err),
      });
    }

    // 5. Forward to OpenAI
    const openaiPayload = {
      model: chatRequest.model,
      messages: chatRequest.messages,
      stream: chatRequest.stream,
      ...(chatRequest.temperature !== undefined &&
        { temperature: chatRequest.temperature }),
      ...(chatRequest.max_tokens !== undefined &&
        { max_tokens: chatRequest.max_tokens }),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let openaiResponse: Response;
    try {
      openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify(openaiPayload),
          signal: controller.signal,
        },
      );
    } catch (error) {
      clearTimeout(timeoutId);
      const message = error instanceof Error && error.name === "AbortError"
        ? "Request timeout"
        : error instanceof Error
        ? error.message
        : "Unknown error";

      log({
        level: "error",
        context: "openai_request",
        message: "Failed to connect to OpenAI",
        userId: user.id,
        detail: message,
      });
      return errorResponse(502, "AI service unavailable", message);
    }

    clearTimeout(timeoutId);

    // Handle OpenAI errors
    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      log({
        level: "error",
        context: "openai_error",
        message: "OpenAI API error",
        userId: user.id,
        status: openaiResponse.status,
        detail: errorText.slice(0, 200), // Truncate to prevent log spam
      });

      return errorResponse(
        openaiResponse.status === 429 ? 429 : 502,
        "AI service error",
        openaiResponse.status === 429
          ? "OpenAI rate limit exceeded. Please try again later."
          : "OpenAI returned an error",
      );
    }

    // 6. Increment usage counter (best-effort, non-blocking)
    if (tier === "free" && !hasOwnKey) {
      const today = new Date().toISOString().split("T")[0];

      try {
        const { error: rpcError } = await supabase.rpc("increment_ai_usage", {
          p_user_id: user.id,
          p_date: today,
        });

        if (rpcError) {
          log({
            level: "warn",
            context: "usage_update",
            message: "Failed to increment usage counter",
            userId: user.id,
            detail: rpcError.message,
          });
        }
      } catch (error) {
        log({
          level: "warn",
          context: "usage_update",
          message: "Unexpected error incrementing usage",
          userId: user.id,
          detail: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // 7. Stream or return response
    if (chatRequest.stream && openaiResponse.body) {
      return new Response(openaiResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming response
    const data = await openaiResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    log({
      level: "error",
      context: "edge_function",
      message: "Unhandled error",
      detail: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(500, "Internal server error");
  }
});

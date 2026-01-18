/**
 * Kindred AI - Professional LLM Orchestration System
 *
 * Handles intelligent routing, context management, latency optimization,
 * and multi-model orchestration for optimal AI responses.
 */

import { supabase } from "@/lib/supabase-client";

// Types
export type ModelTier = 'fast' | 'balanced' | 'quality';
export type RequestPriority = 'realtime' | 'high' | 'normal' | 'low';
export type ContextType = 'chat' | 'voice' | 'video' | 'analysis';

export interface OrchestratorConfig {
  // Model selection
  preferredTier: ModelTier;
  maxLatencyMs: number;
  enableFallback: boolean;

  // Context management
  maxContextTokens: number;
  contextCompressionThreshold: number;

  // Caching
  enableResponseCache: boolean;
  cacheTTLSeconds: number;

  // Rate limiting
  maxRequestsPerMinute: number;
  enableThrottling: boolean;
}

export interface OrchestrationRequest {
  type: ContextType;
  priority: RequestPriority;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  avatarId: string;
  userId: string;
  language: string;
  metadata?: Record<string, unknown>;
}

export interface OrchestrationResponse {
  content: string;
  model: string;
  latencyMs: number;
  tokensUsed: number;
  fromCache: boolean;
  contextCompressed: boolean;
}

// Model configurations with latency profiles
const MODEL_PROFILES = {
  fast: {
    model: 'google/gemini-2.5-flash-lite',
    maxTokens: 512,
    avgLatencyMs: 200,
    costPer1kTokens: 0.0001,
  },
  balanced: {
    model: 'google/gemini-2.5-flash',
    maxTokens: 1024,
    avgLatencyMs: 400,
    costPer1kTokens: 0.0005,
  },
  quality: {
    model: 'anthropic/claude-3.5-sonnet',
    maxTokens: 2048,
    avgLatencyMs: 800,
    costPer1kTokens: 0.003,
  },
} as const;

// Priority to tier mapping
const PRIORITY_TIER_MAP: Record<RequestPriority, ModelTier[]> = {
  realtime: ['fast'],
  high: ['fast', 'balanced'],
  normal: ['balanced', 'quality'],
  low: ['quality'],
};

// Request timing tracker for latency optimization
class LatencyTracker {
  private samples: Map<string, number[]> = new Map();
  private readonly maxSamples = 100;

  record(model: string, latencyMs: number): void {
    const samples = this.samples.get(model) || [];
    samples.push(latencyMs);
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
    this.samples.set(model, samples);
  }

  getAverage(model: string): number {
    const samples = this.samples.get(model);
    if (!samples || samples.length === 0) return MODEL_PROFILES.balanced.avgLatencyMs;
    return samples.reduce((a, b) => a + b, 0) / samples.length;
  }

  getP95(model: string): number {
    const samples = this.samples.get(model);
    if (!samples || samples.length === 0) return MODEL_PROFILES.balanced.avgLatencyMs * 2;
    const sorted = [...samples].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.95);
    return sorted[idx] || sorted[sorted.length - 1];
  }
}

// Response cache for frequently asked questions
class ResponseCache {
  private cache: Map<string, { response: string; timestamp: number; hits: number }> = new Map();
  private readonly ttlMs: number;

  constructor(ttlSeconds: number = 300) {
    this.ttlMs = ttlSeconds * 1000;
  }

  private hashKey(messages: Array<{ role: string; content: string }>, avatarId: string): string {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content || '';
    // Simple hash for similar queries
    return `${avatarId}:${lastUserMsg.toLowerCase().trim().slice(0, 100)}`;
  }

  get(messages: Array<{ role: string; content: string }>, avatarId: string): string | null {
    const key = this.hashKey(messages, avatarId);
    const entry = this.cache.get(key);

    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.response;
  }

  set(messages: Array<{ role: string; content: string }>, avatarId: string, response: string): void {
    const key = this.hashKey(messages, avatarId);
    this.cache.set(key, { response, timestamp: Date.now(), hits: 1 });

    // Cleanup old entries
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > this.ttlMs) {
          this.cache.delete(k);
        }
      }
    }
  }

  getStats(): { size: number; totalHits: number } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    return { size: this.cache.size, totalHits };
  }
}

// Context compressor for long conversations
class ContextCompressor {
  private readonly maxTokens: number;
  private readonly compressionThreshold: number;

  constructor(maxTokens: number = 4000, compressionThreshold: number = 0.8) {
    this.maxTokens = maxTokens;
    this.compressionThreshold = compressionThreshold;
  }

  // Estimate token count (rough approximation)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  compress(messages: Array<{ role: string; content: string }>): {
    messages: Array<{ role: string; content: string }>;
    compressed: boolean;
  } {
    const totalTokens = messages.reduce((sum, m) => sum + this.estimateTokens(m.content), 0);

    if (totalTokens <= this.maxTokens * this.compressionThreshold) {
      return { messages, compressed: false };
    }

    // Keep system message and last N messages
    const systemMsg = messages.find(m => m.role === 'system');
    const otherMsgs = messages.filter(m => m.role !== 'system');

    // Sliding window approach - keep recent context
    let compressed: Array<{ role: string; content: string }> = [];
    let tokenCount = systemMsg ? this.estimateTokens(systemMsg.content) : 0;

    // Add messages from newest to oldest until we hit limit
    for (let i = otherMsgs.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokens(otherMsgs[i].content);
      if (tokenCount + msgTokens > this.maxTokens * 0.9) {
        // Add summary of older messages
        const olderMsgs = otherMsgs.slice(0, i + 1);
        if (olderMsgs.length > 0) {
          const summary = this.summarizeMessages(olderMsgs);
          compressed.unshift({ role: 'system', content: `[Previous context summary: ${summary}]` });
        }
        break;
      }
      compressed.unshift(otherMsgs[i]);
      tokenCount += msgTokens;
    }

    if (systemMsg) {
      compressed.unshift(systemMsg);
    }

    return { messages: compressed, compressed: true };
  }

  private summarizeMessages(messages: Array<{ role: string; content: string }>): string {
    // Extract key topics and entities from older messages
    const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content);
    const topics = this.extractTopics(userMsgs.join(' '));
    return `User discussed: ${topics.slice(0, 5).join(', ')}`;
  }

  private extractTopics(text: string): string[] {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'che', 'e', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall']);

    const wordFreq = new Map<string, number>();
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    return [...wordFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}

// Rate limiter for API protection
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequestsPerMinute: number = 60) {
    this.maxRequests = maxRequestsPerMinute;
    this.windowMs = 60000;
  }

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Filter out old requests
    const recentRequests = userRequests.filter(t => now - t < this.windowMs);
    this.requests.set(userId, recentRequests);

    return recentRequests.length < this.maxRequests;
  }

  recordRequest(userId: string): void {
    const userRequests = this.requests.get(userId) || [];
    userRequests.push(Date.now());
    this.requests.set(userId, userRequests);
  }

  getWaitTime(userId: string): number {
    const userRequests = this.requests.get(userId) || [];
    if (userRequests.length < this.maxRequests) return 0;

    const oldest = Math.min(...userRequests);
    return Math.max(0, this.windowMs - (Date.now() - oldest));
  }
}

// Main Orchestrator class
export class LLMOrchestrator {
  private config: OrchestratorConfig;
  private latencyTracker: LatencyTracker;
  private responseCache: ResponseCache;
  private contextCompressor: ContextCompressor;
  private rateLimiter: RateLimiter;

  constructor(config?: Partial<OrchestratorConfig>) {
    this.config = {
      preferredTier: 'balanced',
      maxLatencyMs: 1000,
      enableFallback: true,
      maxContextTokens: 4000,
      contextCompressionThreshold: 0.8,
      enableResponseCache: true,
      cacheTTLSeconds: 300,
      maxRequestsPerMinute: 60,
      enableThrottling: true,
      ...config,
    };

    this.latencyTracker = new LatencyTracker();
    this.responseCache = new ResponseCache(this.config.cacheTTLSeconds);
    this.contextCompressor = new ContextCompressor(
      this.config.maxContextTokens,
      this.config.contextCompressionThreshold
    );
    this.rateLimiter = new RateLimiter(this.config.maxRequestsPerMinute);
  }

  // Select optimal model based on request priority and latency requirements
  private selectModel(priority: RequestPriority, maxLatency: number): typeof MODEL_PROFILES[ModelTier] {
    const allowedTiers = PRIORITY_TIER_MAP[priority];

    for (const tier of allowedTiers) {
      const profile = MODEL_PROFILES[tier];
      const avgLatency = this.latencyTracker.getAverage(profile.model);

      if (avgLatency <= maxLatency) {
        return profile;
      }
    }

    // Fallback to fastest model
    return MODEL_PROFILES.fast;
  }

  // Process a request with full orchestration
  async process(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const startTime = performance.now();

    // Rate limiting
    if (this.config.enableThrottling && !this.rateLimiter.canMakeRequest(request.userId)) {
      const waitTime = this.rateLimiter.getWaitTime(request.userId);
      throw new Error(`Rate limited. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }

    // Check cache for similar queries
    if (this.config.enableResponseCache) {
      const cachedResponse = this.responseCache.get(request.messages, request.avatarId);
      if (cachedResponse) {
        return {
          content: cachedResponse,
          model: 'cache',
          latencyMs: performance.now() - startTime,
          tokensUsed: 0,
          fromCache: true,
          contextCompressed: false,
        };
      }
    }

    // Compress context if needed
    const { messages, compressed } = this.contextCompressor.compress(request.messages);

    // Select model based on priority
    const maxLatency = request.type === 'voice' || request.type === 'video'
      ? Math.min(this.config.maxLatencyMs, 500) // Stricter for real-time
      : this.config.maxLatencyMs;

    const modelProfile = this.selectModel(request.priority, maxLatency);

    // Record request
    this.rateLimiter.recordRequest(request.userId);

    // Make the API call
    const response = await this.callModel(modelProfile, messages, request);

    const latencyMs = performance.now() - startTime;
    this.latencyTracker.record(modelProfile.model, latencyMs);

    // Cache successful responses
    if (this.config.enableResponseCache && response.content) {
      this.responseCache.set(request.messages, request.avatarId, response.content);
    }

    return {
      ...response,
      latencyMs,
      fromCache: false,
      contextCompressed: compressed,
    };
  }

  private async callModel(
    profile: typeof MODEL_PROFILES[ModelTier],
    messages: Array<{ role: string; content: string }>,
    request: OrchestrationRequest
  ): Promise<Omit<OrchestrationResponse, 'latencyMs' | 'fromCache' | 'contextCompressed'>> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const chatUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages,
          avatarId: request.avatarId,
          avatarName: request.metadata?.avatarName || 'Marco',
          avatarPersonality: request.metadata?.avatarPersonality || [],
          avatarRole: request.metadata?.avatarRole || 'companion',
          avatarTagline: request.metadata?.avatarTagline || '',
          avatarDescription: request.metadata?.avatarDescription || '',
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          // Pass orchestration hints
          _orchestration: {
            model: profile.model,
            maxTokens: profile.maxTokens,
            priority: request.priority,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) content += delta;
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      return {
        content,
        model: profile.model,
        tokensUsed: Math.ceil(content.length / 4), // Rough estimate
      };

    } catch (error) {
      console.error('LLM Orchestrator error:', error);
      throw error;
    }
  }

  // Get orchestrator statistics
  getStats(): {
    cacheStats: { size: number; totalHits: number };
    latencyStats: Record<ModelTier, { avg: number; p95: number }>;
  } {
    return {
      cacheStats: this.responseCache.getStats(),
      latencyStats: {
        fast: {
          avg: this.latencyTracker.getAverage(MODEL_PROFILES.fast.model),
          p95: this.latencyTracker.getP95(MODEL_PROFILES.fast.model),
        },
        balanced: {
          avg: this.latencyTracker.getAverage(MODEL_PROFILES.balanced.model),
          p95: this.latencyTracker.getP95(MODEL_PROFILES.balanced.model),
        },
        quality: {
          avg: this.latencyTracker.getAverage(MODEL_PROFILES.quality.model),
          p95: this.latencyTracker.getP95(MODEL_PROFILES.quality.model),
        },
      },
    };
  }

  // Update configuration at runtime
  updateConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let orchestratorInstance: LLMOrchestrator | null = null;

export function getOrchestrator(config?: Partial<OrchestratorConfig>): LLMOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new LLMOrchestrator(config);
  }
  return orchestratorInstance;
}

// Helper function for quick requests
export async function orchestratedRequest(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  options: {
    avatarId: string;
    userId: string;
    type?: ContextType;
    priority?: RequestPriority;
    metadata?: Record<string, unknown>;
  }
): Promise<OrchestrationResponse> {
  const orchestrator = getOrchestrator();
  return orchestrator.process({
    messages,
    avatarId: options.avatarId,
    userId: options.userId,
    type: options.type || 'chat',
    priority: options.priority || 'normal',
    language: 'auto',
    metadata: options.metadata,
  });
}

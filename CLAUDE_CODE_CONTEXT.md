# KINDRED AI - Complete Platform Technical Context
## For Claude Code Analysis

---

# 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication Flow](#5-authentication-flow)
6. [Avatar System](#6-avatar-system)
7. [Voice Call Integration (VAPI)](#7-voice-call-integration-vapi)
8. [Video Streaming (HeyGen)](#8-video-streaming-heygen)
9. [RAG Memory System](#9-rag-memory-system)
10. [Edge Functions](#10-edge-functions)
11. [Multilingual Support](#11-multilingual-support)
12. [UI Components](#12-ui-components)
13. [Hooks & State Management](#13-hooks--state-management)
14. [API Secrets & Environment](#14-api-secrets--environment)
15. [WebRTC Architecture](#15-webrtc-architecture)
16. [Deployment & URLs](#16-deployment--urls)

---

# 1. PROJECT OVERVIEW

**Kindred AI** is an AI companion platform that provides emotional support through realistic AI avatars. Users can:
- Chat via text with AI companions
- Make voice calls with real-time AI responses
- Video call with lip-synced AI avatars
- Build long-term memory relationships
- Track emotional wellness goals

## Core Value Proposition
- 24/7 AI companions that remember user context
- Multiple avatar personalities (Marco, Sofia)
- Multilingual support (IT, EN, ES, FR, DE, PT)
- Crisis detection and wellness resources
- Privacy-first architecture

---

# 2. TECHNOLOGY STACK

## Frontend
```
- React 18.3.1
- Vite (build tool)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Framer Motion (animations)
- React Router DOM 6.x
```

## Backend (Lovable Cloud / Supabase)
```
- PostgreSQL database
- Row Level Security (RLS)
- Edge Functions (Deno)
- Realtime subscriptions
- Storage buckets
- pgvector for embeddings
```

## External Integrations
```
- VAPI: Voice AI calls
- HeyGen: Video avatar streaming
- ElevenLabs: Voice synthesis
- Daily.co: WebRTC infrastructure
- OpenAI/Lovable AI: LLM responses
```

---

# 3. PROJECT STRUCTURE

```
kindred-ai/
├── src/
│   ├── assets/
│   │   ├── avatars/          # Avatar images (marco.jpg, sofia.jpg, etc.)
│   │   ├── kindred-logo.png
│   │   └── kindred-intro.mp4
│   │
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, card, dialog, etc.)
│   │   ├── chat/             # ChatBubble, ChatInput, TypingIndicator
│   │   ├── video-call/       # ImmersiveVideoCall, WebRTCDebugPanel
│   │   ├── dashboard/        # DashboardHeader, UserInsights, GoalsProgress
│   │   ├── gallery/          # SharedMemoriesGallery, MemoryCard
│   │   ├── settings/         # ProfileSettings, SecuritySettings, BillingSettings
│   │   ├── avatar/           # AboutAvatarPanel
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx
│   │   ├── AvatarGallery.tsx
│   │   ├── HeyGenVideoCall.tsx    # NEW: HeyGen video integration
│   │   ├── VideoCallModal.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useVapiCall.ts         # VAPI voice call management
│   │   ├── useHeyGenStreaming.ts  # NEW: HeyGen WebRTC streaming
│   │   ├── useChatHistory.ts      # Chat message persistence
│   │   ├── useLanguage.ts         # Multilingual support
│   │   ├── useProfile.ts          # User profile management
│   │   ├── useFavorites.ts        # Avatar favorites
│   │   ├── useRatings.ts          # Session ratings
│   │   ├── useSharedMemories.ts   # Photo memories
│   │   ├── useSessionInsights.ts  # Conversation analytics
│   │   ├── useTemporalContext.ts  # Time-aware context
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── Index.tsx              # Landing page
│   │   ├── Login.tsx              # Authentication
│   │   ├── SignUp.tsx
│   │   ├── Dashboard.tsx          # Main user dashboard
│   │   ├── Chat.tsx               # Chat interface with avatar
│   │   ├── Onboarding.tsx         # New user onboarding
│   │   ├── Demo.tsx               # Demo chat experience
│   │   └── OurPromise.tsx         # Privacy & AI transparency
│   │
│   ├── data/
│   │   └── avatars.ts             # Avatar definitions (Marco, Sofia)
│   │
│   ├── lib/
│   │   ├── utils.ts               # Utility functions
│   │   └── i18n.ts                # Internationalization
│   │
│   └── integrations/
│       └── supabase/
│           ├── client.ts          # Supabase client (auto-generated)
│           └── types.ts           # Database types (auto-generated)
│
├── supabase/
│   ├── config.toml                # Edge function config
│   └── functions/
│       ├── chat/                  # Main chat endpoint
│       ├── vapi-call/             # VAPI webhook handler
│       ├── vapi-public-key/       # VAPI key provider
│       ├── heygen-streaming/      # HeyGen session management
│       ├── daily-room/            # Daily.co room creation
│       ├── create-vapi-assistants/
│       ├── session-analysis/      # Conversation insights
│       ├── knowledge-extractor/   # RAG knowledge extraction
│       ├── knowledge-sync/        # Knowledge base sync
│       ├── generate-embeddings/   # Vector embeddings
│       ├── analyze-memory/        # Photo analysis
│       ├── video-narration/       # Video descriptions
│       └── call-summary/          # Post-call summaries
│
├── DOCUMENTATION.md               # Technical documentation
├── CLAUDE_CONTEXT.txt             # Source code concatenation
└── CLAUDE_CODE_CONTEXT.md         # This file
```

---

# 4. DATABASE SCHEMA

## Core Tables

### profiles
User profile information and preferences.
```sql
- id: uuid (PK)
- user_id: uuid (references auth.users)
- display_name: text
- bio: text
- avatar_url: text
- subscription_tier: text (free/premium/enterprise)
- subscription_status: text (active/cancelled/past_due)
- tokens_balance: integer (default 100)
- trial_started_at: timestamp
- trial_ends_at: timestamp
- safe_space_theme: text (forest/ocean/mountain/night)
- safe_space_sound: text (rain/waves/wind/silence)
- notification_preferences: jsonb
- has_completed_onboarding: boolean
- stripe_customer_id: text
- created_at, updated_at: timestamp
```

### chat_messages
All chat messages between users and avatars.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text (marco/sofia)
- role: text (user/assistant)
- content: text
- created_at: timestamp
```

### user_context
Long-term memory storage for each user-avatar pair.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- context_type: text (preference/fact/emotion/goal)
- key: text
- value: text
- confidence: float (0-1)
- embedding: vector(1536)
- is_cross_avatar: boolean
- privacy_level: text (private/shared)
- expires_at: timestamp
- created_at, updated_at: timestamp
```

### knowledge_base
Global and avatar-specific knowledge for RAG.
```sql
- id: uuid (PK)
- avatar_id: text (nullable for global)
- title: text
- content: text
- category: text (wellness/psychology/mindfulness/etc)
- knowledge_type: text (static/learned/validated)
- embedding: vector(1536)
- is_global: boolean
- validation_status: text (pending/validated/rejected)
- validation_count: integer
- source: text
- metadata: jsonb
- learned_from_user_id: uuid
- learned_at: timestamp
- last_used_at: timestamp
- created_at: timestamp
```

### session_insights
Analytics for each conversation session.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- topic: text
- mood: text
- summary: text
- key_points: jsonb
- duration_seconds: integer
- created_at: timestamp
```

### session_summaries
Daily conversation summaries with embeddings.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- session_date: date
- summary: text
- topics_discussed: text[]
- emotions_detected: text[]
- insights: jsonb
- embedding: vector(1536)
- created_at: timestamp
```

### shared_memories
User-uploaded photos with AI analysis.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- image_url: text
- image_path: text
- user_caption: text
- avatar_comment: text
- ai_description: text
- ai_themes: text[]
- ai_emotions: text[]
- ai_objects: text[]
- is_favorite: boolean
- analyzed_at: timestamp
- created_at: timestamp
```

### social_graph
People mentioned in conversations.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- person_name: text
- relationship: text (friend/family/colleague/partner)
- sentiment: text (positive/neutral/negative)
- context: text
- mention_count: integer
- metadata: jsonb
- first_mentioned_at, last_mentioned_at: timestamp
```

### temporal_goals
User goals tracked over time.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- goal_description: text
- goal_category: text (health/career/relationship/personal)
- status: text (active/completed/abandoned)
- target_date: date
- progress_notes: jsonb
- achieved_at: timestamp
- created_at, updated_at: timestamp
```

### user_avatar_affinity
Relationship depth between user and avatar.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- affinity_level: integer (1-10)
- total_messages: integer
- total_call_minutes: integer
- deep_conversations: integer
- deep_topics: jsonb
- unlocked_secrets: text[]
- created_at, updated_at: timestamp
```

### avatar_identity
Avatar personality definitions.
```sql
- id: uuid (PK)
- avatar_id: text
- name: text
- age: integer
- birthdate: date
- birthplace: text
- education: text
- education_story: text
- relationship_status: text
- relationship_story: text
- past_occupations: text[]
- formative_story: text
- formative_pain: text
- loves: text[]
- hates: text[]
- favorite_book: text
- favorite_coffee: text
- personality_traits: jsonb
- deep_secrets: jsonb
- speech_patterns: text[]
- forbidden_phrases: text[]
- must_remember: text[]
- created_at, updated_at: timestamp
```

### interaction_feedback
User feedback for AI improvement.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- session_id: text
- feedback_type: text (positive/negative/correction)
- user_message: text
- assistant_response: text
- correction_note: text
- learned_pattern: text
- weight_adjustment: jsonb
- created_at: timestamp
```

### crisis_logs
Crisis detection and response logs.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- crisis_type: text (suicidal/self-harm/abuse)
- message_content: text
- action_taken: text
- detected_at: timestamp
```

### ratings
Post-session ratings.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- session_id: uuid (FK to session_insights)
- rating: integer (1-5)
- feedback: text
- created_at: timestamp
```

### referrals
Referral system for user acquisition.
```sql
- id: uuid (PK)
- referrer_id: uuid
- referred_id: uuid
- referral_code: text (unique)
- status: text (pending/completed)
- bonus_tokens: integer (default 50)
- completed_at: timestamp
- created_at: timestamp
```

### pending_knowledge
Knowledge extracted from conversations awaiting validation.
```sql
- id: uuid (PK)
- user_id: uuid
- avatar_id: text
- extracted_fact: text
- fact_category: text
- source_message: text
- confidence: numeric
- is_personal: boolean
- processing_status: text (pending/approved/rejected)
- processed_at: timestamp
- created_at: timestamp
```

### metaphor_library
Collection of metaphors for avatar responses.
```sql
- id: uuid (PK)
- avatar_id: text
- metaphor: text
- category: text
- theme: text
- source: text
- usage_context: text
- created_at: timestamp
```

### knowledge_sync_log
Daily knowledge base synchronization logs.
```sql
- id: uuid (PK)
- sync_date: date
- status: text (running/completed/failed)
- items_processed: integer
- items_approved: integer
- items_rejected: integer
- items_merged: integer
- error_message: text
- started_at, completed_at: timestamp
```

## Database Views

### global_knowledge
View of validated global knowledge entries.
```sql
SELECT * FROM knowledge_base 
WHERE is_global = true 
  AND (validation_status = 'validated' OR knowledge_type = 'static')
```

## Database Functions

### search_knowledge(query_embedding, match_threshold, match_count, filter_avatar_id)
Vector similarity search on knowledge base.

### search_user_context(p_user_id, p_avatar_id, query_embedding, match_threshold, match_count)
Vector similarity search on user context.

### search_global_knowledge(query_embedding, match_threshold, match_count)
Vector search on global validated knowledge.

### get_user_private_context(p_user_id, p_avatar_id)
Get all private context for a user-avatar pair.

### handle_new_user()
Trigger function to create profile and referral code on signup.

### update_updated_at_column()
Trigger function to auto-update updated_at timestamps.

---

# 5. AUTHENTICATION FLOW

## Signup Flow
1. User visits `/signup`
2. Enters email/password or uses Google OAuth
3. `supabase.auth.signUp()` creates auth.users entry
4. Trigger `handle_new_user()` creates:
   - `profiles` entry with display_name
   - `referrals` entry with unique code
5. Email confirmation sent (auto-confirm enabled for dev)
6. Redirect to `/onboarding`

## Login Flow
1. User visits `/login`
2. `supabase.auth.signInWithPassword()` or OAuth
3. Session stored in localStorage
4. Redirect to `/dashboard`

## Session Management
```typescript
// Check auth state
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User logged in
  } else if (event === 'SIGNED_OUT') {
    // User logged out
  }
});
```

## RLS Policies
All tables use Row Level Security:
```sql
-- Example: Users can only see their own data
CREATE POLICY "Users can view their own messages" 
ON chat_messages FOR SELECT 
USING (auth.uid() = user_id);
```

---

# 6. AVATAR SYSTEM

## Avatar Definitions (src/data/avatars.ts)

```typescript
export interface Avatar {
  id: string;
  name: string;
  role: string;
  description: string;
  personality: string[];
  imageUrl: string;
  newImageUrl: string;
  voiceStyle: string;
  vapiAssistantId: string;      // VAPI assistant for voice calls
  readyPlayerMeUrl: string;      // 3D avatar URL (unused)
  heygenAvatarId: string;        // HeyGen public avatar ID
}

export const avatars: Avatar[] = [
  {
    id: "marco",
    name: "Marco",
    role: "Your Creative Companion",
    description: "Artistic soul, philosopher...",
    personality: ["Creative", "Empathetic", "Curious", "Warm"],
    voiceStyle: "Warm and thoughtful",
    vapiAssistantId: "0b68de61-ae30-4f77-a06b-ea427c180bf2",
    heygenAvatarId: "Bryan_IT_Sitting_public"
  },
  {
    id: "sofia",
    name: "Sofia",
    role: "Your Wellness Guide",
    description: "Former yoga instructor...",
    personality: ["Calm", "Wise", "Nurturing", "Grounded"],
    voiceStyle: "Soothing and grounded",
    vapiAssistantId: "36b8f8e3-7a79-4c93-a5e8-7f2d83fe9c44",
    heygenAvatarId: "Elias_Outdoors_public"
  }
];
```

## Avatar Identity (Database)
Extended personality stored in `avatar_identity` table:
- Background stories
- Speech patterns
- Deep secrets (unlocked by affinity)
- Forbidden phrases (never say)
- Must-remember facts

---

# 7. VOICE CALL INTEGRATION (VAPI)

## Architecture
```
User Microphone → VAPI SDK → VAPI Cloud → Webhook → Edge Function → AI Response → VAPI TTS → User Speaker
```

## Hook: useVapiCall.ts
```typescript
export function useVapiCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  const startCall = async (assistantId: string) => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    
    await vapi.start(assistantId, {
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "multi"  // Auto-detect language
      }
    });
    
    vapi.on('message', handleMessage);
    vapi.on('call-end', handleCallEnd);
  };
  
  const endCall = () => {
    vapi.stop();
    setIsCallActive(false);
  };
  
  return { isCallActive, transcript, startCall, endCall };
}
```

## Edge Function: vapi-call
Webhook handler for VAPI events:
- `assistant-request`: Returns assistant config
- `function-call`: Handles tool calls
- `end-of-call-report`: Saves call summary

## VAPI Assistant Configuration
```json
{
  "voice": {
    "provider": "11labs",
    "voiceId": "pNInz6obpgDQGcFmaJgB",
    "model": "eleven_multilingual_v2"
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "multi"
  },
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "systemPrompt": "You are Marco, a creative companion..."
  }
}
```

---

# 8. VIDEO STREAMING (HEYGEN)

## Architecture
```
VAPI Audio → HeyGen Streaming API → WebRTC → Video Element
                    ↓
              Avatar lip-sync
```

## Hook: useHeyGenStreaming.ts
```typescript
export function useHeyGenStreaming() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const startSession = async (avatarId: string) => {
    // 1. Create session via edge function
    const { session_id, sdp, ice_servers } = await createSession(avatarId);
    
    // 2. Setup WebRTC peer connection
    const pc = new RTCPeerConnection({ iceServers: ice_servers });
    
    // 3. Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendIceCandidate(session_id, event.candidate);
      }
    };
    
    // 4. Handle incoming video track
    pc.ontrack = (event) => {
      videoElement.srcObject = event.streams[0];
    };
    
    // 5. Set remote description and create answer
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    // 6. Send answer to HeyGen
    await startStream(session_id, answer);
  };
  
  const sendText = async (text: string) => {
    // Send text for lip-sync
    await sendTask(sessionId, text);
  };
  
  const setListeningMode = (isListening: boolean) => {
    // Enable/disable listening animations
  };
  
  return { isConnected, isConnecting, startSession, sendText, stopSession };
}
```

## Edge Function: heygen-streaming
```typescript
// Actions:
// - list-public-avatars: Get available public avatars
// - create-session: Initialize streaming session
// - start-session: Start WebRTC stream
// - send-task: Send text for lip-sync (repeat mode)
// - set-listening: Toggle listening mode
// - send-gesture: Trigger avatar gesture
// - set-emotion: Set avatar emotion
// - stop-session: End session
```

## Public Avatars
```typescript
const PUBLIC_AVATARS = {
  BRYAN_IT_SITTING: 'Bryan_IT_Sitting_public',
  ELIAS_OUTDOORS: 'Elias_Outdoors_public'
};
```

---

# 9. RAG MEMORY SYSTEM

## Memory Layers

### Layer 1: Immediate Context (Session)
- Last 10 messages in conversation
- Stored in component state
- Lost on page refresh

### Layer 2: Short-term Memory (user_context)
- Facts extracted from conversations
- Stored with embeddings for semantic search
- Expires after configurable period

### Layer 3: Long-term Memory (knowledge_base)
- Validated facts promoted from pending_knowledge
- Avatar-specific or global knowledge
- Permanent storage

### Layer 4: Session Summaries
- Daily conversation summaries
- Stored with embeddings
- Used for "remember when we talked about..."

## Knowledge Extraction Flow
```
User Message → knowledge-extractor function → pending_knowledge table
                                                      ↓
                        knowledge-sync function (daily) → knowledge_base
                                                      ↓
                                         Validation (manual/auto)
```

## RAG Query Flow
```typescript
// 1. Generate embedding for user query
const embedding = await generateEmbedding(userMessage);

// 2. Search relevant context
const userContext = await searchUserContext(userId, avatarId, embedding);
const globalKnowledge = await searchGlobalKnowledge(embedding);
const sessionSummaries = await searchSessionSummaries(userId, embedding);

// 3. Build context for LLM
const context = buildContext(userContext, globalKnowledge, sessionSummaries);

// 4. Generate response with context
const response = await generateResponse(userMessage, context);
```

## Embedding Generation
```typescript
// Edge function: generate-embeddings
// Uses OpenAI text-embedding-3-small (1536 dimensions)
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
}
```

---

# 10. EDGE FUNCTIONS

## chat/index.ts
Main chat endpoint for text conversations.
```typescript
// POST /functions/v1/chat
// Body: { message, avatarId, userId, conversationHistory }
// Returns: { response, extractedFacts?, emotionDetected? }
```

## vapi-call/index.ts
Webhook handler for VAPI voice calls.
```typescript
// POST /functions/v1/vapi-call
// Handles: assistant-request, function-call, end-of-call-report
```

## vapi-public-key/index.ts
Returns VAPI public key for client initialization.

## heygen-streaming/index.ts
HeyGen Interactive Avatar session management.
```typescript
// POST /functions/v1/heygen-streaming
// Actions: create-session, start-session, send-task, stop-session
```

## daily-room/index.ts
Creates Daily.co rooms for WebRTC calls.

## session-analysis/index.ts
Analyzes conversation for insights.
```typescript
// POST /functions/v1/session-analysis
// Body: { messages, userId, avatarId }
// Returns: { mood, topics, keyPoints, summary }
```

## knowledge-extractor/index.ts
Extracts learnable facts from messages.
```typescript
// POST /functions/v1/knowledge-extractor
// Body: { message, userId, avatarId }
// Returns: { facts: [{ fact, category, confidence }] }
```

## knowledge-sync/index.ts
Daily job to process pending knowledge.

## generate-embeddings/index.ts
Generates vector embeddings for text.
```typescript
// POST /functions/v1/generate-embeddings
// Body: { text }
// Returns: { embedding: number[] }
```

## analyze-memory/index.ts
Analyzes uploaded photos with vision AI.
```typescript
// POST /functions/v1/analyze-memory
// Body: { imageUrl }
// Returns: { description, themes, emotions, objects }
```

## video-narration/index.ts
Generates descriptions for videos.

## call-summary/index.ts
Creates post-call summaries.

---

# 11. MULTILINGUAL SUPPORT

## Supported Languages
```typescript
export type SupportedLanguage = 
  | 'auto' | 'en' | 'it' | 'es' | 'fr' | 'de' | 'pt';
```

## Language Detection (lib/i18n.ts)
```typescript
export function detectLanguageFromText(text: string): SupportedLanguage {
  const patterns = {
    it: /\b(ciao|come|sono|che|questo|molto|grazie|prego)\b/i,
    es: /\b(hola|como|soy|que|esto|muy|gracias|por favor)\b/i,
    fr: /\b(bonjour|comment|suis|que|ceci|très|merci|s'il vous plaît)\b/i,
    de: /\b(hallo|wie|bin|was|dies|sehr|danke|bitte)\b/i,
    pt: /\b(olá|como|sou|que|isto|muito|obrigado|por favor)\b/i,
  };
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) return lang as SupportedLanguage;
  }
  return 'en';
}
```

## Hook: useLanguage.ts
```typescript
export function useLanguage() {
  const [language, setLanguage] = useState<SupportedLanguage>('auto');
  
  const detectFromMessage = (text: string) => {
    const detected = detectLanguageFromText(text);
    if (detected !== language) {
      setLanguage(detected);
    }
  };
  
  return { language, translations, setLanguage, detectFromMessage };
}
```

## VAPI Multilingual Configuration
```typescript
// Transcriber with multi-language support
transcriber: {
  provider: "deepgram",
  model: "nova-2",
  language: "multi"  // Auto-detect any language
}

// Voice with multilingual model
voice: {
  provider: "11labs",
  voiceId: "pNInz6obpgDQGcFmaJgB",
  model: "eleven_multilingual_v2"
}

// System prompt includes language instruction
systemPrompt: `You are Marco... 
CRITICAL: You are a polyglot. Detect the language the user speaks 
and respond in the SAME language. If they speak Italian, respond in Italian...`
```

---

# 12. UI COMPONENTS

## Layout Components
- `Navbar`: Main navigation with auth state
- `Footer`: Site footer with links
- `Sidebar`: Dashboard sidebar navigation

## Page Sections
- `HeroSection`: Landing page hero
- `AvatarGallery`: Avatar selection cards
- `FeaturesSection`: Feature highlights
- `PricingSection`: Subscription plans
- `AITransparencySection`: AI ethics info

## Chat Components
- `ChatBubble`: Message bubble with avatar
- `ChatInput`: Text input with send button
- `TypingIndicator`: "Avatar is typing..."
- `WelcomeBackMessage`: Personalized greeting

## Video Call Components
- `ImmersiveVideoCall`: Full video call interface
- `HeyGenVideoCall`: HeyGen avatar video call
- `VideoCallModal`: Call initiation modal
- `CinematicFilter`: Video visual effects
- `DynamicBackground`: Animated backgrounds

## Dashboard Components
- `DashboardHeader`: User greeting and stats
- `UserInsights`: Conversation analytics
- `GoalsProgress`: Goal tracking widget
- `SubscriptionWidget`: Plan info

## Gallery Components
- `SharedMemoriesGallery`: Photo grid
- `MemoryCard`: Individual memory card
- `MemoryDetail`: Fullscreen memory view

## Settings Components
- `ProfileSettings`: User profile form
- `SecuritySettings`: Password change
- `BillingSettings`: Subscription management
- `DangerZoneSettings`: Account deletion

---

# 13. HOOKS & STATE MANAGEMENT

## Authentication
- `useProfile`: User profile CRUD
- `useReferrals`: Referral code management

## Avatar Interaction
- `useVapiCall`: Voice call lifecycle
- `useHeyGenStreaming`: Video streaming
- `useChatHistory`: Message persistence
- `useFavorites`: Avatar favorites
- `useRatings`: Session ratings
- `useAvatarIdentity`: Avatar personality data

## Memory & Context
- `useSessionInsights`: Conversation analytics
- `useSharedMemories`: Photo memories
- `useTemporalContext`: Time-aware context

## Utilities
- `useLanguage`: Multilingual support
- `useMobile`: Responsive detection
- `useToast`: Toast notifications

---

# 14. API SECRETS & ENVIRONMENT

## Required Secrets (Supabase Edge Functions)
```
VAPI_PRIVATE_KEY       - VAPI authentication
VAPI_PUBLIC_KEY        - VAPI client initialization
HEYGEN_API_KEY         - HeyGen API access
DAILY_API_KEY          - Daily.co room creation
ELEVENLABS_API_KEY     - Voice synthesis
LOVABLE_API_KEY        - Lovable AI access
SUPABASE_URL           - Database URL
SUPABASE_SERVICE_ROLE_KEY - Admin database access
SUPABASE_ANON_KEY      - Public database access
SUPABASE_DB_URL        - Direct database connection
```

## Environment Variables (Frontend)
```
VITE_SUPABASE_URL           - Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY - Supabase anon key
VITE_SUPABASE_PROJECT_ID    - Project ID
```

---

# 15. WEBRTC ARCHITECTURE

## VAPI Voice (Audio Only)
```
Browser Microphone
       ↓
VAPI Web SDK (captures audio)
       ↓
VAPI Cloud (STT → LLM → TTS)
       ↓
VAPI Web SDK (plays audio)
       ↓
Browser Speaker
```

## HeyGen Video (WebRTC)
```
HeyGen Streaming API
       ↓
Create Session (get SDP offer)
       ↓
Browser creates RTCPeerConnection
       ↓
Exchange ICE candidates
       ↓
Set remote description (HeyGen offer)
       ↓
Create answer, set local description
       ↓
Send answer to HeyGen
       ↓
Receive video track
       ↓
Display in <video> element
```

## Hybrid Call (VAPI Audio + HeyGen Video)
```
VAPI handles all audio (STT, LLM, TTS)
       ↓
VAPI transcript events captured
       ↓
Send transcript text to HeyGen
       ↓
HeyGen avatar lip-syncs to text
       ↓
Video displayed in UI
```

---

# 16. DEPLOYMENT & URLS

## Preview URL
```
https://id-preview--45f93fb7-32eb-4acd-a2de-121ac42b8927.lovable.app
```

## Published URL
```
https://virtual-kin-connect.lovable.app
```

## Supabase Project
```
Project ID: vrnjccybvrdzakrrfard
URL: https://vrnjccybvrdzakrrfard.supabase.co
```

## Edge Functions Base URL
```
https://vrnjccybvrdzakrrfard.supabase.co/functions/v1/
```

---

# APPENDIX A: KEY FILE CONTENTS

## Avatar Definitions
See: `src/data/avatars.ts`

## VAPI Hook
See: `src/hooks/useVapiCall.ts`

## HeyGen Hook
See: `src/hooks/useHeyGenStreaming.ts`

## Chat Edge Function
See: `supabase/functions/chat/index.ts`

## HeyGen Edge Function
See: `supabase/functions/heygen-streaming/index.ts`

## i18n Configuration
See: `src/lib/i18n.ts`

---

# APPENDIX B: COMMON PATTERNS

## Supabase Query Pattern
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (error) throw error;
return data;
```

## Edge Function Pattern
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { action, ...params } = await req.json();
    
    // Handle action...
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

## React Hook Pattern
```typescript
export function useCustomHook() {
  const [state, setState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const action = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncOperation();
      setState(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [dependencies]);
  
  return { state, isLoading, error, action };
}
```

---

# END OF DOCUMENT

This document provides complete technical context for Claude Code analysis.
For source code, see: CLAUDE_CONTEXT.txt
For user documentation, see: DOCUMENTATION.md

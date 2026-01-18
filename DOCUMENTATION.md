# Kindred - Documentazione Tecnica Completa

**Versione:** 2.0.0  
**Data:** 2026-01-18  
**Stack:** React + Vite + TypeScript + Tailwind CSS + Supabase (Lovable Cloud)

---

## 📐 Architettura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KINDRED PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   VAPI      │    │   HEYGEN    │    │  SUPABASE   │    │   OPENAI    │  │
│  │  (Voice AI) │    │ (Video AI)  │    │ (Backend)   │    │  (LLM/RAG)  │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                   │                  │          │
│         ▼                  ▼                   ▼                  ▼          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      EDGE FUNCTIONS (Deno)                           │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  • vapi-call         → Gestione chiamate vocali                      │   │
│  │  • heygen-streaming  → WebRTC streaming video avatar                 │   │
│  │  • chat              → RAG + LLM + Crisis Detection                  │   │
│  │  • session-analysis  → Analisi sessione con AI                       │   │
│  │  • knowledge-sync    → Sincronizzazione knowledge base               │   │
│  │  • generate-embeddings → Vettorizzazione per RAG                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         REACT FRONTEND                                │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │  Pages:        Index, Dashboard, Chat, Login, SignUp, Onboarding     │   │
│  │  Components:   HeyGenVideoCall, ChatInput, AvatarGallery, etc.       │   │
│  │  Hooks:        useVapiCall, useHeyGenStreaming, useChatHistory       │   │
│  │  State:        React Query + Supabase Realtime                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### Tabelle Principali

#### `profiles`
Dati utente estesi sincronizzati con `auth.users`.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID univoco profilo |
| user_id | UUID (FK → auth.users) | Riferimento utente Supabase |
| display_name | TEXT | Nome visualizzato |
| avatar_url | TEXT | URL immagine profilo |
| bio | TEXT | Biografia utente |
| subscription_tier | TEXT | free/premium/pro |
| subscription_status | TEXT | active/cancelled/past_due |
| tokens_balance | INTEGER | Saldo token per uso AI |
| trial_ends_at | TIMESTAMPTZ | Fine periodo trial |
| has_completed_onboarding | BOOLEAN | Flag onboarding |
| safe_space_theme | TEXT | Tema ambiente sicuro |
| safe_space_sound | TEXT | Suono ambiente sicuro |
| notification_preferences | JSONB | Preferenze notifiche |

#### `chat_messages`
Storico messaggi chat per ogni avatar.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID messaggio |
| user_id | UUID | Utente proprietario |
| avatar_id | TEXT | ID avatar (marco, sofia, etc.) |
| role | TEXT | user/assistant/system |
| content | TEXT | Contenuto messaggio |
| created_at | TIMESTAMPTZ | Timestamp creazione |

#### `user_context`
Memoria contestuale per personalizzazione risposte.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID contesto |
| user_id | UUID | Utente |
| avatar_id | TEXT | Avatar correlato |
| context_type | TEXT | personal_fact/preference/memory |
| key | TEXT | Chiave identificativa |
| value | TEXT | Valore memorizzato |
| confidence | FLOAT | Livello confidenza (0-1) |
| embedding | VECTOR(1536) | Embedding per ricerca semantica |
| is_cross_avatar | BOOLEAN | Condivisione tra avatar |
| privacy_level | TEXT | public/private/sensitive |
| expires_at | TIMESTAMPTZ | Scadenza opzionale |

#### `knowledge_base`
RAG Knowledge Base - ~230 documenti di saggezza.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID documento |
| title | TEXT | Titolo documento |
| content | TEXT | Contenuto completo |
| category | TEXT | Categoria tematica |
| knowledge_type | TEXT | philosophy/psychology/wisdom |
| embedding | VECTOR(1536) | Embedding per similarity search |
| is_global | BOOLEAN | Disponibile a tutti gli avatar |
| avatar_id | TEXT | Avatar specifico (se non global) |
| source | TEXT | Fonte originale |
| validation_status | TEXT | approved/pending/rejected |
| validation_count | INTEGER | Numero validazioni |

#### `avatar_identity`
Identità profonda degli avatar con backstory.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID identità |
| avatar_id | TEXT | ID avatar |
| name | TEXT | Nome avatar |
| age | INTEGER | Età avatar |
| birthdate | DATE | Data nascita |
| birthplace | TEXT | Luogo nascita |
| education | TEXT | Formazione |
| education_story | TEXT | Storia formativa |
| past_occupations | TEXT[] | Lavori precedenti |
| personality_traits | JSONB | Tratti personalità |
| formative_pain | TEXT | Trauma formativo |
| formative_story | TEXT | Storia formatrice |
| speech_patterns | TEXT[] | Pattern linguistici |
| forbidden_phrases | TEXT[] | Frasi da evitare |
| loves | TEXT[] | Cose che ama |
| hates | TEXT[] | Cose che odia |
| deep_secrets | JSONB | Segreti sbloccabili |
| must_remember | TEXT[] | Cose da ricordare sempre |

#### `social_graph`
Grafo sociale degli utenti per memoria relazionale.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID nodo |
| user_id | UUID | Utente proprietario |
| avatar_id | TEXT | Avatar correlato |
| person_name | TEXT | Nome persona menzionata |
| relationship | TEXT | Tipo relazione (amico, famiglia, etc.) |
| context | TEXT | Contesto menzione |
| sentiment | TEXT | Sentimento associato |
| mention_count | INTEGER | Conteggio menzioni |
| first_mentioned_at | TIMESTAMPTZ | Prima menzione |
| last_mentioned_at | TIMESTAMPTZ | Ultima menzione |

#### `temporal_goals`
Obiettivi utente tracciati cross-avatar.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID obiettivo |
| user_id | UUID | Utente |
| avatar_id | TEXT | Avatar che ha registrato |
| goal_description | TEXT | Descrizione obiettivo |
| goal_category | TEXT | Categoria (health, career, etc.) |
| status | TEXT | active/paused/achieved |
| target_date | DATE | Data target |
| progress_notes | JSONB | Note progresso |
| achieved_at | TIMESTAMPTZ | Data completamento |

#### `session_insights`
Analisi sessioni di conversazione.

| Colonna | Tipo | Descrizione |
|---------|------|-------------|
| id | UUID (PK) | ID sessione |
| user_id | UUID | Utente |
| avatar_id | TEXT | Avatar |
| topic | TEXT | Argomento principale |
| mood | TEXT | Umore rilevato |
| summary | TEXT | Riassunto conversazione |
| key_points | JSONB | Punti chiave |
| duration_seconds | INTEGER | Durata sessione |

#### `favorites`
Avatar preferiti dagli utenti.

#### `ratings`
Valutazioni sessioni.

#### `shared_memories`
Immagini condivise con analisi AI.

#### `crisis_logs`
Log interventi crisi (suicidio, autolesionismo).

#### `metaphor_library`
Libreria metafore per avatar.

---

## 🔐 Row Level Security (RLS) Policies

Tutte le tabelle hanno RLS attivo con policy:

```sql
-- Esempio policy per chat_messages
CREATE POLICY "Users can view own messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy per knowledge_base (global readable)
CREATE POLICY "Knowledge is globally readable"
ON knowledge_base FOR SELECT
USING (is_global = true OR avatar_id = current_avatar_id);
```

---

## 🔄 Flussi Logici Principali

### 1. Flusso Chiamata Vocale (VAPI)

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  User    │────▶│ useVapiCall│────▶│ vapi-public-key│────▶│  VAPI    │
│ (Browser)│     │   Hook    │     │ Edge Function │     │  Cloud   │
└──────────┘     └───────────┘     └──────────────┘     └──────────┘
                      │                                        │
                      │  WebSocket Connection                 │
                      │◀───────────────────────────────────────│
                      │                                        │
                      │  1. speech-start (assistant speaking)  │
                      │  2. transcript (real-time text)        │
                      │  3. volume-level (user speaking)       │
                      │  4. speech-end                         │
                      │◀───────────────────────────────────────│
```

**Configurazione Multilingue:**
```javascript
{
  transcriber: {
    provider: "deepgram",
    model: "nova-2-general",
    language: "multi",  // Auto-detection
    smartFormat: true
  },
  voice: {
    provider: "11labs",
    model: "eleven_multilingual_v2",
    voiceId: "<avatar_voice>"
  }
}
```

### 2. Flusso Video Streaming (HeyGen WebRTC)

```
┌──────────┐     ┌────────────────┐     ┌──────────────────┐     ┌──────────┐
│  User    │────▶│useHeyGenStream │────▶│ heygen-streaming │────▶│ HeyGen   │
│ (Browser)│     │     Hook       │     │ Edge Function    │     │  API     │
└──────────┘     └────────────────┘     └──────────────────┘     └──────────┘
                        │                                              │
                        │  1. create-session (get SDP + ICE)          │
                        │◀─────────────────────────────────────────────│
                        │                                              │
                        │  2. RTCPeerConnection setup                  │
                        │  3. setRemoteDescription(SDP offer)          │
                        │  4. createAnswer()                           │
                        │  5. setLocalDescription(answer)              │
                        │                                              │
                        │  6. start-session (send SDP answer)          │
                        │─────────────────────────────────────────────▶│
                        │                                              │
                        │  7. ontrack → MediaStream                    │
                        │◀─────────────────────────────────────────────│
                        │                                              │
                        │  8. send-task (lip-sync text)                │
                        │─────────────────────────────────────────────▶│
```

**Parametri WebRTC:**
```javascript
// ICE Servers (forniti da HeyGen)
{
  iceServers: response.ice_servers2 || [
    { urls: "stun:stun.l.google.com:19302" }
  ],
  iceCandidatePoolSize: 10
}

// Transceivers
pc.addTransceiver("video", { direction: "recvonly" });
pc.addTransceiver("audio", { direction: "recvonly" });
```

### 3. Flusso Chat con RAG

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌──────────┐
│  User    │────▶│ ChatInput │────▶│ chat Edge   │────▶│ OpenAI   │
│ Message  │     │ Component │     │ Function    │     │ GPT-4o   │
└──────────┘     └───────────┘     └─────────────┘     └──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
             │ Knowledge   │    │ User Context│    │ Social      │
             │ Base (RAG)  │    │ Memory      │    │ Graph       │
             └─────────────┘    └─────────────┘    └─────────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         ▼
                              ┌─────────────────────┐
                              │ System Prompt Build │
                              │ + Temporal Context  │
                              │ + Avatar Identity   │
                              │ + Crisis Detection  │
                              └─────────────────────┘
```

### 4. Flusso Cambio Lingua (Runtime)

```
┌───────────────┐
│ User speaks   │
│ in English    │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ VAPI Transcriber (language: "multi")                  │
│ → Deepgram Nova-2 Auto-Detection                     │
│ → Detects: "en-US"                                   │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ VAPI System Prompt Override                          │
│ "You are a polyglot. Always respond in the language  │
│  used by the user. If user switches language mid-    │
│  conversation, you must switch immediately."         │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ ElevenLabs Voice (eleven_multilingual_v2)            │
│ → Same voice ID, different language output           │
│ → Maintains Marco's timbre in English                │
└───────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ Frontend useLanguage Hook                            │
│ → detectFromMessage(response)                        │
│ → Updates UI labels dynamically                      │
│ → Saves preference to localStorage                   │
└───────────────────────────────────────────────────────┘
```

---

## 🔑 API Keys & Secrets

Le seguenti variabili d'ambiente sono richieste nel backend (Supabase Secrets):

| Nome Secret | Servizio | Descrizione |
|-------------|----------|-------------|
| `VAPI_PRIVATE_KEY` | VAPI | Chiave privata per API calls |
| `VAPI_PUBLIC_KEY` | VAPI | Chiave pubblica per client SDK |
| `HEYGEN_API_KEY` | HeyGen | API key per avatar streaming |
| `ELEVENLABS_API_KEY` | ElevenLabs | API key per TTS |
| `OPENAI_API_KEY` | OpenAI | API key per GPT-4o/embeddings |
| `DAILY_API_KEY` | Daily.co | API key per video rooms (fallback) |

**Nota:** I valori reali NON sono inclusi. Configura tramite Lovable Cloud → Settings → Secrets.

---

## 📁 Struttura Progetto

```
kindred/
├── src/
│   ├── assets/              # Immagini, video, icone
│   ├── components/
│   │   ├── ui/              # Componenti Shadcn/Radix
│   │   ├── chat/            # ChatInput, ChatBubble, TypingIndicator
│   │   ├── video-call/      # ImmersiveVideoCall, WebRTCDebugPanel
│   │   ├── dashboard/       # GoalsProgress, UserInsights
│   │   ├── gallery/         # SharedMemoriesGallery
│   │   └── settings/        # ProfileSettings, SecuritySettings
│   ├── hooks/
│   │   ├── useVapiCall.ts        # Gestione chiamate VAPI
│   │   ├── useHeyGenStreaming.ts # WebRTC HeyGen streaming
│   │   ├── useChatHistory.ts     # Storico chat
│   │   ├── useLanguage.ts        # Multilingua runtime
│   │   └── useProfile.ts         # Dati utente
│   ├── pages/
│   │   ├── Index.tsx        # Landing page
│   │   ├── Dashboard.tsx    # Dashboard utente
│   │   ├── Chat.tsx         # Pagina chat principale
│   │   └── Onboarding.tsx   # Flusso onboarding
│   ├── data/
│   │   └── avatars.ts       # Definizione avatar
│   ├── lib/
│   │   ├── utils.ts         # Utility functions
│   │   └── i18n.ts          # Sistema traduzioni
│   └── integrations/
│       └── supabase/
│           ├── client.ts    # Client Supabase
│           └── types.ts     # Tipi TypeScript generati
├── supabase/
│   ├── functions/
│   │   ├── chat/            # Chat con RAG + Crisis Detection
│   │   ├── vapi-call/       # Gestione chiamate VAPI
│   │   ├── vapi-public-key/ # Recupero chiave pubblica
│   │   ├── heygen-streaming/# WebRTC streaming video
│   │   ├── session-analysis/# Analisi sessioni AI
│   │   ├── generate-embeddings/# Vettorizzazione
│   │   └── knowledge-sync/  # Sync knowledge base
│   └── config.toml          # Configurazione progetto
├── tailwind.config.ts       # Configurazione Tailwind
├── vite.config.ts           # Configurazione Vite
└── package.json             # Dipendenze npm
```

---

## 🧠 Sistema RAG (Retrieval Augmented Generation)

### Knowledge Base
- ~230 documenti di saggezza, filosofia, psicologia
- Embedding con OpenAI text-embedding-3-small (1536 dimensioni)
- Ricerca semantica via `pgvector`

### Query RAG
```sql
-- Funzione search_knowledge
SELECT 
  id, title, content, category,
  1 - (embedding <=> query_embedding) AS similarity
FROM knowledge_base
WHERE is_global = true 
  OR avatar_id = $avatar_id
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

### Contesto Temporale
Il sistema include consapevolezza temporale:
- Ora del giorno (mattina/pomeriggio/sera/notte)
- Tono circadiano adattato
- Tempo dall'ultima interazione
- Continuità conversazionale

---

## 🚨 Sistema Crisis Detection

Pattern rilevati automaticamente:
- Ideazione suicidaria
- Autolesionismo
- Pensieri di morte
- Espressioni di disperazione

**Risposta:**
1. Log in `crisis_logs`
2. Risposta empatica ma non sostitutiva
3. Riferimento a risorse professionali
4. Numeri emergenza (Telefono Azzurro, etc.)

---

## 📞 Contatti API Esterni

### VAPI (Voice AI)
- **Endpoint Base:** `https://api.vapi.ai`
- **SDK Client:** `@vapi-ai/web`
- **Autenticazione:** Public Key + Bearer Token
- **WebSocket:** Real-time audio streaming

### HeyGen (Video Avatar)
- **Endpoint Base:** `https://api.heygen.com`
- **Versione API:** v1
- **Protocollo:** WebRTC (STUN/TURN)
- **Avatar Pubblici:** `Bryan_IT_Sitting_public`, `Elias_Outdoors_public`

### Parametri Token di Sessione HeyGen
```json
{
  "session_id": "string",
  "sdp": {
    "type": "offer",
    "sdp": "v=0\r\no=- ..."
  },
  "ice_servers2": [
    {
      "urls": ["turn:..."],
      "username": "...",
      "credential": "..."
    }
  ],
  "access_token": "jwt_token_for_session"
}
```

---

## 🔧 Comandi Sviluppo

```bash
# Installazione dipendenze
npm install

# Sviluppo locale
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview
```

---

## 📝 Note per Migrazione

1. **GitHub Sync:** Il codice si sincronizza automaticamente con GitHub
2. **Secrets:** Riconfigurare tutti i secrets nel nuovo ambiente
3. **Database:** Esportare schema via Supabase Dashboard
4. **Edge Functions:** Deploy automatico con `supabase functions deploy`

---

*Generato automaticamente per export progetto Kindred*

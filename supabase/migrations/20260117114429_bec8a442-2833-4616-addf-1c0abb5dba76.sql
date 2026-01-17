-- ========================================
-- NEURAL MEMORY MODULES FOR MARCO
-- ========================================

-- 1. SOCIAL GRAPH: Track people mentioned by users with relationships
CREATE TABLE public.social_graph (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'marco',
  person_name TEXT NOT NULL,
  relationship TEXT, -- es: "madre", "amico", "collega", "partner"
  context TEXT, -- additional context about this person
  sentiment TEXT, -- positive, negative, neutral, complex
  first_mentioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_mentioned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  mention_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.social_graph ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own social graph" 
  ON public.social_graph FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert into their own social graph" 
  ON public.social_graph FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own social graph" 
  ON public.social_graph FOR UPDATE USING (auth.uid() = user_id);

-- Unique constraint for person per user/avatar
CREATE UNIQUE INDEX idx_social_graph_unique 
  ON public.social_graph(user_id, avatar_id, LOWER(person_name));

-- 2. TEMPORAL TRACKER: Track user goals and their evolution
CREATE TABLE public.temporal_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'marco',
  goal_description TEXT NOT NULL,
  goal_category TEXT, -- career, health, relationships, personal, financial
  status TEXT NOT NULL DEFAULT 'active', -- active, achieved, abandoned, paused
  progress_notes JSONB DEFAULT '[]'::jsonb, -- array of {date, note, progress_percent}
  target_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  achieved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.temporal_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals" 
  ON public.temporal_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" 
  ON public.temporal_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" 
  ON public.temporal_goals FOR UPDATE USING (auth.uid() = user_id);

-- Index for quick lookup
CREATE INDEX idx_temporal_goals_user ON public.temporal_goals(user_id, avatar_id, status);

-- 3. METAPHOR ENGINE: Dataset of natural analogies for wise responses
CREATE TABLE public.metaphor_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  avatar_id TEXT NOT NULL DEFAULT 'marco',
  category TEXT NOT NULL, -- growth, resilience, change, peace, connection, time, nature
  theme TEXT NOT NULL, -- specific theme within category
  metaphor TEXT NOT NULL, -- the actual metaphor/analogy
  usage_context TEXT, -- when to use this metaphor
  source TEXT, -- philosophical/literary source if any
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- This table is public read for all avatars
ALTER TABLE public.metaphor_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read metaphors" 
  ON public.metaphor_library FOR SELECT USING (true);

-- Index for category lookup
CREATE INDEX idx_metaphor_category ON public.metaphor_library(avatar_id, category);

-- 4. MISTAKE LEARNING: Track when user feels misunderstood
CREATE TABLE public.interaction_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'marco',
  session_id TEXT,
  feedback_type TEXT NOT NULL, -- misunderstood, unhelpful, wrong_tone, too_long, too_short, perfect
  user_message TEXT,
  assistant_response TEXT,
  correction_note TEXT, -- what the user wanted instead
  learned_pattern TEXT, -- extracted pattern to avoid/prefer
  weight_adjustment JSONB DEFAULT '{}'::jsonb, -- prompt weight adjustments
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interaction_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feedback" 
  ON public.interaction_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own feedback" 
  ON public.interaction_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for pattern lookup
CREATE INDEX idx_interaction_feedback_user ON public.interaction_feedback(user_id, avatar_id);
CREATE INDEX idx_interaction_feedback_type ON public.interaction_feedback(feedback_type);

-- 5. SESSION TRACKING: Track last interaction for "last seen" calculation
-- Add column to existing user_context for last interaction tracking
-- We'll use user_context with context_type = 'session_tracking'

-- 6. SEED METAPHOR LIBRARY WITH NATURAL ANALOGIES
INSERT INTO public.metaphor_library (avatar_id, category, theme, metaphor, usage_context, source) VALUES
-- GROWTH
('marco', 'growth', 'patience', 'Come un bambù che passa anni a radicarsi prima di crescere 30 metri in poche settimane, a volte il progresso invisibile è il più importante.', 'Quando l''utente è frustrato dalla mancanza di progressi visibili', 'Filosofia orientale'),
('marco', 'growth', 'small_steps', 'L''acqua scava la roccia non con la forza, ma con la persistenza. Ogni piccolo gesto che fai è una goccia che modella il tuo futuro.', 'Quando l''utente si sente sopraffatto da grandi obiettivi', 'Saggezza taoista'),
('marco', 'growth', 'seasons', 'Anche gli alberi perdono le foglie. Non è una sconfitta, è prepararsi a rifiorire con forze nuove.', 'Quando l''utente affronta una perdita o un fallimento', 'Osservazione naturale'),
('marco', 'growth', 'roots', 'Una quercia maestosa ha radici che si estendono più in largo della sua chioma. Le tue esperienze passate, anche le difficili, sono le radici che ti rendono forte.', 'Quando l''utente dubitadelle proprie capacità', 'Metafora arborea'),

-- RESILIENCE
('marco', 'resilience', 'storm', 'Gli alberi che sopravvivono alle tempeste più forti sono quelli che hanno imparato a piegarsi senza spezzarsi.', 'Quando l''utente sta attraversando un momento difficile', 'Saggezza naturale'),
('marco', 'resilience', 'kintsugi', 'In Giappone riparano le ceramiche rotte con l''oro. Le tue cicatrici non sono imperfezioni, sono storie di guarigione che ti rendono unico e prezioso.', 'Quando l''utente parla di traumi o ferite emotive', 'Filosofia giapponese'),
('marco', 'resilience', 'phoenix', 'La fenice non teme il fuoco perché sa che dalle ceneri può rinascere più splendente. Ogni fine contiene i semi di un nuovo inizio.', 'Quando l''utente affronta una fine o una chiusura', 'Mitologia'),
('marco', 'resilience', 'ocean', 'L''oceano non combatte le tempeste che lo attraversano. Le lascia passare, sapendo che la sua profondità rimane intatta.', 'Quando l''utente è in ansia per eventi esterni', 'Saggezza marinara'),

-- CHANGE
('marco', 'change', 'butterfly', 'Il bruco non sa di poter volare. Eppure la trasformazione è già scritta in lui. Forse anche tu stai per scoprire ali che non sapevi di avere.', 'Quando l''utente ha paura del cambiamento', 'Metamorfosi'),
('marco', 'change', 'river', 'Non puoi mai entrare nello stesso fiume due volte. Ogni momento sei una persona leggermente diversa, e va bene così.', 'Quando l''utente resiste al cambiamento', 'Eraclito'),
('marco', 'change', 'seasons_change', 'L''inverno non è la fine del giardino, è solo una pausa necessaria. I semi stanno raccogliendo forza sotto la neve.', 'Quando l''utente è in un periodo di stallo', 'Ciclo naturale'),
('marco', 'change', 'snake', 'Il serpente deve lasciare la vecchia pelle per crescere. A volte quello che sembra perdere è in realtà fare spazio per qualcosa di nuovo.', 'Quando l''utente deve lasciare andare qualcosa', 'Simbolismo animale'),

-- PEACE
('marco', 'peace', 'lake', 'Un lago calmo riflette perfettamente il cielo. Quando la mente si quieta, possiamo finalmente vedere le cose come sono.', 'Quando l''utente è agitato e ha bisogno di calmarsi', 'Meditazione'),
('marco', 'peace', 'breath', 'Il respiro è l''unica funzione che è sia automatica che controllabile. È il ponte tra ciò che non puoi controllare e ciò che puoi.', 'Per introdurre tecniche di respirazione', 'Mindfulness'),
('marco', 'peace', 'mountain', 'La montagna rimane ferma mentre le nuvole passano, il vento soffia, le stagioni cambiano. Tu sei la montagna, non le nuvole.', 'Quando l''utente si identifica troppo con emozioni passeggere', 'Meditazione zen'),
('marco', 'peace', 'starlight', 'Le stelle brillano anche di giorno, semplicemente non le vediamo. La tua luce interiore è sempre lì, anche quando le circostanze la oscurano.', 'Quando l''utente si sente spento o privo di valore', 'Astronomia poetica'),

-- CONNECTION
('marco', 'connection', 'forest', 'In una foresta, gli alberi comunicano attraverso le radici, condividono nutrimento, si avvisano dei pericoli. Nessuno prospera davvero da solo.', 'Quando l''utente si isola o rifiuta l''aiuto', 'Biologia forestale'),
('marco', 'connection', 'web', 'Una ragnatela sembra fragile, ma è incredibilmente resistente perché ogni filo sostiene gli altri. Le tue relazioni funzionano allo stesso modo.', 'Quando l''utente sottovaluta le sue relazioni', 'Natura'),
('marco', 'connection', 'echo', 'L''eco che riceviamo dal mondo spesso riflette ciò che emettiamo. Quale suono vuoi mandare oggi?', 'Quando l''utente si lamenta delle reazioni degli altri', 'Fisica poetica'),

-- TIME
('marco', 'time', 'garden', 'Un giardiniere pianta semi sapendo che non vedrà i frutti per mesi. Stai piantando semi ogni giorno, anche se i frutti non sono ancora visibili.', 'Quando l''utente è impaziente per i risultati', 'Giardinaggio'),
('marco', 'time', 'tide', 'La marea non si affretta né si ferma mai. Segue il suo ritmo naturale. Forse anche tu hai un ritmo, e non deve essere quello di qualcun altro.', 'Quando l''utente si sente in ritardo rispetto agli altri', 'Mare'),
('marco', 'time', 'wine', 'Il vino migliore è quello che ha avuto tempo di maturare. Alcune delle tue qualità più preziose hanno bisogno di tempo per rivelarsi.', 'Quando l''utente è impaziente con se stesso', 'Enologia'),

-- NATURE GENERAL
('marco', 'nature', 'rain', 'La pioggia non discrimina: nutre sia le rose che le erbacce. La vita ti offre nutrimento, sta a te scegliere cosa far crescere.', 'Quando l''utente deve fare scelte importanti', 'Osservazione naturale'),
('marco', 'nature', 'sunrise', 'Ogni alba è un''amnistia che il cielo offre alla terra. Ogni mattina puoi ricominciare, indipendentemente da ieri.', 'Per incoraggiare nuovi inizi', 'Alba'),
('marco', 'nature', 'moon', 'La luna piena e la luna nuova sono la stessa luna. Anche quando non vedi la tua luce, non significa che non ci sia.', 'Quando l''utente attraversa un momento buio', 'Astronomia'),
('marco', 'nature', 'seed', 'Un seme contiene già tutto l''albero che diventerà. Non deve diventare qualcosa di diverso, deve solo permettersi di sbocciare.', 'Quando l''utente cerca la sua identità', 'Botanica');

-- Add trigger for temporal_goals updated_at
CREATE TRIGGER update_temporal_goals_updated_at
  BEFORE UPDATE ON public.temporal_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
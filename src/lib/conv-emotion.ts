/**
 * Conv-Emotion Integration for Kindred AI
 *
 * Contextual Emotion Recognition in Conversations (ERC)
 * Analyzes emotional dynamics across conversation turns,
 * not just individual messages.
 *
 * Based on research from:
 * @see https://github.com/declare-lab/conv-emotion
 *
 * Emotions detected: happiness, sadness, anger, fear, surprise, disgust, neutral
 * Plus: love, gratitude, anxiety, hope, frustration, loneliness
 */

export type BaseEmotion =
  | "happiness"
  | "sadness"
  | "anger"
  | "fear"
  | "surprise"
  | "disgust"
  | "neutral";

export type ExtendedEmotion =
  | BaseEmotion
  | "love"
  | "gratitude"
  | "anxiety"
  | "hope"
  | "frustration"
  | "loneliness"
  | "confusion"
  | "excitement"
  | "calm";

export interface EmotionScore {
  emotion: ExtendedEmotion;
  score: number; // 0-1
  confidence: number; // 0-1
}

export interface TurnAnalysis {
  turnIndex: number;
  role: "user" | "assistant";
  content: string;
  primaryEmotion: ExtendedEmotion;
  emotions: EmotionScore[];
  emotionCause?: string; // What triggered this emotion
  sentiment: number; // -1 to 1
}

export interface ConversationEmotionAnalysis {
  turns: TurnAnalysis[];
  overallMood: ExtendedEmotion;
  moodIntensity: number; // 0-10
  emotionalTrajectory: "improving" | "stable" | "declining" | "volatile";
  dominantEmotions: ExtendedEmotion[];
  emotionShifts: Array<{
    fromTurn: number;
    toTurn: number;
    fromEmotion: ExtendedEmotion;
    toEmotion: ExtendedEmotion;
    cause?: string;
  }>;
  recommendations: {
    responseStyle: "supportive" | "celebratory" | "calming" | "engaging" | "validating";
    suggestedTone: string;
    topicsToAvoid?: string[];
    topicsToExplore?: string[];
  };
}

// Emotion lexicon for pattern matching (Italian + English)
const EMOTION_PATTERNS: Record<ExtendedEmotion, RegExp[]> = {
  happiness: [
    /felice|contento|allegro|gioioso|entusiasta|fantastico/i,
    /happy|joyful|glad|excited|wonderful|great|amazing/i,
    /😊|😄|🎉|❤️|💕|🥳/,
  ],
  sadness: [
    /triste|depresso|giù|malinconico|sconfortato|piango/i,
    /sad|depressed|down|unhappy|miserable|crying|tears/i,
    /😢|😭|💔|😞|😔/,
  ],
  anger: [
    /arrabbiato|furioso|incazzato|irritato|frustrato|odio/i,
    /angry|furious|mad|pissed|annoyed|hate|frustrated/i,
    /😠|😡|🤬|💢/,
  ],
  fear: [
    /paura|spaventato|terrorizzato|ansioso|preoccupato|temo/i,
    /afraid|scared|terrified|anxious|worried|fear/i,
    /😰|😨|😱|🥺/,
  ],
  surprise: [
    /sorpreso|stupito|incredulo|scioccato|wow/i,
    /surprised|amazed|shocked|astonished|wow|omg/i,
    /😮|😲|🤯|😳/,
  ],
  disgust: [
    /disgusto|schifo|nausea|orribile|rivoltante/i,
    /disgusted|gross|awful|terrible|revolting/i,
    /🤢|🤮|😒/,
  ],
  neutral: [
    /normale|tranquillo|niente di che|così così/i,
    /okay|fine|normal|whatever|meh/i,
  ],
  love: [
    /amore|amo|adoro|affetto|voglio bene|ti amo/i,
    /love|adore|care|cherish|heart/i,
    /❤️|💕|💗|🥰|😍/,
  ],
  gratitude: [
    /grazie|grato|riconoscente|apprezzo/i,
    /thank|grateful|appreciate|thankful/i,
    /🙏|💝/,
  ],
  anxiety: [
    /ansia|ansioso|nervoso|agitato|teso|stress/i,
    /anxious|nervous|stressed|tense|worried|panic/i,
    /😰|😥/,
  ],
  hope: [
    /speranza|spero|ottimista|fiducioso|sogno/i,
    /hope|hopeful|optimistic|wish|dream/i,
    /🌟|✨|🙏/,
  ],
  frustration: [
    /frustrato|esasperato|stufo|non ce la faccio/i,
    /frustrated|annoyed|fed up|can't take it/i,
    /😤|😫/,
  ],
  loneliness: [
    /solo|solitudine|isolato|abbandonato|nessuno mi capisce/i,
    /lonely|alone|isolated|abandoned|no one understands/i,
    /😔|🥺/,
  ],
  confusion: [
    /confuso|non capisco|perplesso|disorientato/i,
    /confused|don't understand|puzzled|lost/i,
    /🤔|😕|❓/,
  ],
  excitement: [
    /eccitato|emozionato|non vedo l'ora|fantastico/i,
    /excited|thrilled|can't wait|pumped/i,
    /🎉|🔥|⚡/,
  ],
  calm: [
    /calmo|sereno|rilassato|in pace|tranquillo/i,
    /calm|peaceful|relaxed|serene|chill/i,
    /😌|🧘|☮️/,
  ],
};

// Sentiment patterns
const POSITIVE_PATTERNS = [
  /bene|ottimo|perfetto|fantastico|bellissimo|meraviglioso/i,
  /good|great|excellent|perfect|wonderful|amazing|awesome/i,
  /grazie|ti voglio bene|sei il migliore/i,
];

const NEGATIVE_PATTERNS = [
  /male|terribile|orribile|pessimo|schifoso/i,
  /bad|terrible|horrible|awful|worst/i,
  /odio|non sopporto|fa schifo/i,
];

/**
 * Analyze emotions in a conversation contextually
 */
export function analyzeConversationEmotions(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): ConversationEmotionAnalysis {
  const turns: TurnAnalysis[] = [];
  const emotionHistory: ExtendedEmotion[] = [];

  // Analyze each turn
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const previousTurn = i > 0 ? turns[i - 1] : null;

    const turnAnalysis = analyzeTurn(
      message.content,
      message.role as "user" | "assistant",
      i,
      previousTurn
    );

    turns.push(turnAnalysis);

    if (message.role === "user") {
      emotionHistory.push(turnAnalysis.primaryEmotion);
    }
  }

  // Calculate overall mood from user turns only
  const userTurns = turns.filter((t) => t.role === "user");
  const overallMood = calculateOverallMood(userTurns);
  const moodIntensity = calculateMoodIntensity(userTurns);
  const emotionalTrajectory = calculateTrajectory(userTurns);
  const emotionShifts = detectEmotionShifts(userTurns);

  // Get dominant emotions
  const emotionCounts = new Map<ExtendedEmotion, number>();
  for (const turn of userTurns) {
    const count = emotionCounts.get(turn.primaryEmotion) || 0;
    emotionCounts.set(turn.primaryEmotion, count + 1);
  }
  const dominantEmotions = [...emotionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([emotion]) => emotion);

  // Generate recommendations
  const recommendations = generateRecommendations(
    overallMood,
    emotionalTrajectory,
    dominantEmotions
  );

  return {
    turns,
    overallMood,
    moodIntensity,
    emotionalTrajectory,
    dominantEmotions,
    emotionShifts,
    recommendations,
  };
}

/**
 * Analyze a single conversation turn
 */
function analyzeTurn(
  content: string,
  role: "user" | "assistant",
  turnIndex: number,
  previousTurn: TurnAnalysis | null
): TurnAnalysis {
  const emotions = detectEmotions(content);
  const primaryEmotion = emotions[0]?.emotion || "neutral";
  const sentiment = calculateSentiment(content);

  // Detect what caused the emotion (context from previous turn)
  let emotionCause: string | undefined;
  if (previousTurn && role === "user" && primaryEmotion !== "neutral") {
    emotionCause = extractEmotionCause(content, previousTurn.content);
  }

  return {
    turnIndex,
    role,
    content,
    primaryEmotion,
    emotions,
    emotionCause,
    sentiment,
  };
}

/**
 * Detect emotions in text using pattern matching
 */
function detectEmotions(text: string): EmotionScore[] {
  const scores: EmotionScore[] = [];

  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS)) {
    let matchCount = 0;
    let totalPatterns = patterns.length;

    for (const pattern of patterns) {
      if (pattern.test(text)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      const score = matchCount / totalPatterns;
      scores.push({
        emotion: emotion as ExtendedEmotion,
        score,
        confidence: Math.min(0.5 + score * 0.5, 1),
      });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // If no emotions detected, default to neutral
  if (scores.length === 0) {
    scores.push({ emotion: "neutral", score: 0.5, confidence: 0.3 });
  }

  return scores;
}

/**
 * Calculate sentiment score (-1 to 1)
 */
function calculateSentiment(text: string): number {
  let positiveMatches = 0;
  let negativeMatches = 0;

  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.test(text)) positiveMatches++;
  }

  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(text)) negativeMatches++;
  }

  const total = positiveMatches + negativeMatches;
  if (total === 0) return 0;

  return (positiveMatches - negativeMatches) / total;
}

/**
 * Calculate overall mood from user turns
 */
function calculateOverallMood(userTurns: TurnAnalysis[]): ExtendedEmotion {
  if (userTurns.length === 0) return "neutral";

  // Weight recent turns more heavily
  const weightedCounts = new Map<ExtendedEmotion, number>();
  const totalTurns = userTurns.length;

  for (let i = 0; i < totalTurns; i++) {
    const weight = (i + 1) / totalTurns; // More recent = higher weight
    const emotion = userTurns[i].primaryEmotion;
    const current = weightedCounts.get(emotion) || 0;
    weightedCounts.set(emotion, current + weight);
  }

  let maxEmotion: ExtendedEmotion = "neutral";
  let maxWeight = 0;

  for (const [emotion, weight] of weightedCounts.entries()) {
    if (weight > maxWeight) {
      maxWeight = weight;
      maxEmotion = emotion;
    }
  }

  return maxEmotion;
}

/**
 * Calculate mood intensity (0-10)
 */
function calculateMoodIntensity(userTurns: TurnAnalysis[]): number {
  if (userTurns.length === 0) return 5;

  // Average the confidence scores of primary emotions
  const avgConfidence =
    userTurns.reduce((sum, turn) => {
      const primaryScore = turn.emotions[0]?.confidence || 0.5;
      return sum + primaryScore;
    }, 0) / userTurns.length;

  // Also factor in sentiment extremity
  const avgSentimentExtremity =
    userTurns.reduce((sum, turn) => sum + Math.abs(turn.sentiment), 0) /
    userTurns.length;

  return Math.round((avgConfidence * 7 + avgSentimentExtremity * 3) * 10) / 10;
}

/**
 * Calculate emotional trajectory over conversation
 */
function calculateTrajectory(
  userTurns: TurnAnalysis[]
): "improving" | "stable" | "declining" | "volatile" {
  if (userTurns.length < 2) return "stable";

  const sentiments = userTurns.map((t) => t.sentiment);

  // Calculate volatility (variance)
  const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const variance =
    sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
    sentiments.length;

  if (variance > 0.3) return "volatile";

  // Calculate trend (first half vs second half)
  const midpoint = Math.floor(sentiments.length / 2);
  const firstHalf = sentiments.slice(0, midpoint);
  const secondHalf = sentiments.slice(midpoint);

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.2) return "improving";
  if (diff < -0.2) return "declining";
  return "stable";
}

/**
 * Detect significant emotion shifts in conversation
 */
function detectEmotionShifts(
  userTurns: TurnAnalysis[]
): ConversationEmotionAnalysis["emotionShifts"] {
  const shifts: ConversationEmotionAnalysis["emotionShifts"] = [];

  for (let i = 1; i < userTurns.length; i++) {
    const prev = userTurns[i - 1];
    const curr = userTurns[i];

    if (prev.primaryEmotion !== curr.primaryEmotion) {
      // Check if it's a significant shift (not just neutral transitions)
      if (prev.primaryEmotion !== "neutral" || curr.primaryEmotion !== "neutral") {
        shifts.push({
          fromTurn: prev.turnIndex,
          toTurn: curr.turnIndex,
          fromEmotion: prev.primaryEmotion,
          toEmotion: curr.primaryEmotion,
          cause: curr.emotionCause,
        });
      }
    }
  }

  return shifts;
}

/**
 * Extract what caused the emotion from context
 */
function extractEmotionCause(
  currentContent: string,
  previousContent: string
): string | undefined {
  // Simple extraction: look for references to previous content
  const referencePatterns = [
    /quello che hai detto|le tue parole|quando hai/i,
    /what you said|your words|when you/i,
  ];

  for (const pattern of referencePatterns) {
    if (pattern.test(currentContent)) {
      return previousContent.substring(0, 100);
    }
  }

  return undefined;
}

/**
 * Generate response recommendations based on emotional state
 */
function generateRecommendations(
  mood: ExtendedEmotion,
  trajectory: "improving" | "stable" | "declining" | "volatile",
  dominantEmotions: ExtendedEmotion[]
): ConversationEmotionAnalysis["recommendations"] {
  const negativeEmotions: ExtendedEmotion[] = [
    "sadness",
    "anger",
    "fear",
    "anxiety",
    "frustration",
    "loneliness",
  ];
  const positiveEmotions: ExtendedEmotion[] = [
    "happiness",
    "love",
    "gratitude",
    "hope",
    "excitement",
  ];

  const isNegative = negativeEmotions.includes(mood);
  const isPositive = positiveEmotions.includes(mood);

  let responseStyle: ConversationEmotionAnalysis["recommendations"]["responseStyle"];
  let suggestedTone: string;
  let topicsToAvoid: string[] = [];
  let topicsToExplore: string[] = [];

  if (isNegative) {
    if (mood === "sadness" || mood === "loneliness") {
      responseStyle = "supportive";
      suggestedTone = "Gentile, comprensivo, presente";
      topicsToExplore = ["cosa ti farebbe sentire meglio", "ricordi positivi"];
    } else if (mood === "anxiety" || mood === "fear") {
      responseStyle = "calming";
      suggestedTone = "Rassicurante, calmo, pratico";
      topicsToExplore = ["tecniche di rilassamento", "prospettive positive"];
      topicsToAvoid = ["scenari negativi", "pressioni temporali"];
    } else if (mood === "anger" || mood === "frustration") {
      responseStyle = "validating";
      suggestedTone = "Comprensivo ma equilibrato";
      topicsToExplore = ["cosa è successo", "come risolvere"];
    } else {
      responseStyle = "supportive";
      suggestedTone = "Empatico e presente";
    }
  } else if (isPositive) {
    if (mood === "happiness" || mood === "excitement") {
      responseStyle = "celebratory";
      suggestedTone = "Entusiasta, partecipe";
      topicsToExplore = ["dettagli positivi", "piani futuri"];
    } else if (mood === "gratitude" || mood === "love") {
      responseStyle = "engaging";
      suggestedTone = "Caloroso, sincero";
    } else {
      responseStyle = "engaging";
      suggestedTone = "Positivo e coinvolgente";
    }
  } else {
    responseStyle = "engaging";
    suggestedTone = "Amichevole e curioso";
    topicsToExplore = ["interessi", "come sta andando la giornata"];
  }

  // Adjust based on trajectory
  if (trajectory === "declining") {
    suggestedTone += " - Attenzione: umore in calo";
    topicsToExplore.push("cosa sta succedendo");
  } else if (trajectory === "improving") {
    suggestedTone += " - Continuare su questa linea positiva";
  } else if (trajectory === "volatile") {
    suggestedTone = "Stabile e rassicurante - umore instabile";
    topicsToAvoid.push("argomenti controversi");
  }

  return {
    responseStyle,
    suggestedTone,
    topicsToAvoid: topicsToAvoid.length > 0 ? topicsToAvoid : undefined,
    topicsToExplore: topicsToExplore.length > 0 ? topicsToExplore : undefined,
  };
}

/**
 * Get emotion emoji for display
 */
export function getEmotionEmoji(emotion: ExtendedEmotion): string {
  const emojiMap: Record<ExtendedEmotion, string> = {
    happiness: "😊",
    sadness: "😢",
    anger: "😠",
    fear: "😰",
    surprise: "😮",
    disgust: "🤢",
    neutral: "😐",
    love: "❤️",
    gratitude: "🙏",
    anxiety: "😥",
    hope: "🌟",
    frustration: "😤",
    loneliness: "😔",
    confusion: "🤔",
    excitement: "🎉",
    calm: "😌",
  };
  return emojiMap[emotion] || "😐";
}

/**
 * Get emotion label in Italian
 */
export function getEmotionLabel(emotion: ExtendedEmotion, lang: "it" | "en" = "it"): string {
  const labels: Record<ExtendedEmotion, { it: string; en: string }> = {
    happiness: { it: "Felicità", en: "Happiness" },
    sadness: { it: "Tristezza", en: "Sadness" },
    anger: { it: "Rabbia", en: "Anger" },
    fear: { it: "Paura", en: "Fear" },
    surprise: { it: "Sorpresa", en: "Surprise" },
    disgust: { it: "Disgusto", en: "Disgust" },
    neutral: { it: "Neutrale", en: "Neutral" },
    love: { it: "Amore", en: "Love" },
    gratitude: { it: "Gratitudine", en: "Gratitude" },
    anxiety: { it: "Ansia", en: "Anxiety" },
    hope: { it: "Speranza", en: "Hope" },
    frustration: { it: "Frustrazione", en: "Frustration" },
    loneliness: { it: "Solitudine", en: "Loneliness" },
    confusion: { it: "Confusione", en: "Confusion" },
    excitement: { it: "Eccitazione", en: "Excitement" },
    calm: { it: "Calma", en: "Calm" },
  };
  return labels[emotion]?.[lang] || emotion;
}

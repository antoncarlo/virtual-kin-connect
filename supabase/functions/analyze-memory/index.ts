import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  description: string;
  themes: string[];
  emotions: string[];
  objects: string[];
  avatarComment: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { memoryId, imageUrl, avatarId, avatarName, avatarPersonality } = await req.json();

    if (!memoryId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: memoryId, imageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing memory ${memoryId} for user ${user.id}`);

    // Call Gemini 2.5 Pro for Vision analysis
    const visionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `Sei un analizzatore di immagini empatico. Analizza l'immagine e restituisci un JSON con:
- "description": descrizione dettagliata dell'immagine in italiano (2-3 frasi)
- "themes": array di 2-4 temi principali (es: "natura", "famiglia", "viaggio", "celebrazione", "amicizia", "sport", "arte", "cibo", "animali", "lavoro")
- "emotions": array di 1-3 emozioni percepite (es: "gioia", "serenità", "nostalgia", "eccitazione", "amore", "gratitudine")
- "objects": array di 3-6 oggetti/elementi principali visibili

Rispondi SOLO con il JSON, senza markdown o altro testo.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analizza questa immagine e restituisci il JSON richiesto.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', errorText);
      throw new Error(`Vision API failed: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const analysisText = visionData.choices?.[0]?.message?.content || '{}';
    
    // Parse the JSON response
    let analysis: Partial<AnalysisResult>;
    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedText = analysisText.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse vision response:', analysisText);
      analysis = {
        description: 'Immagine analizzata',
        themes: ['ricordo'],
        emotions: ['neutro'],
        objects: ['immagine']
      };
    }

    // Generate personalized avatar comment
    const commentResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Sei ${avatarName}, un avatar AI con questa personalità: ${avatarPersonality}

L'utente ha condiviso una foto con te. Genera un commento personale, caldo e autentico basato su ciò che vedi nell'immagine.
Il commento deve essere:
- In prima persona
- Emotivamente coinvolgente
- Riferito ai dettagli specifici dell'immagine
- Lungo 1-2 frasi
- Può includere una domanda gentile o un'osservazione profonda`
          },
          {
            role: 'user',
            content: `L'immagine mostra: ${analysis.description}
Temi: ${analysis.themes?.join(', ')}
Emozioni: ${analysis.emotions?.join(', ')}
Elementi: ${analysis.objects?.join(', ')}

Genera il tuo commento personale per questa foto condivisa.`
          }
        ],
        max_tokens: 200,
      }),
    });

    let avatarComment = 'Che bella foto! Grazie per averla condivisa con me.';
    if (commentResponse.ok) {
      const commentData = await commentResponse.json();
      avatarComment = commentData.choices?.[0]?.message?.content || avatarComment;
    }

    // Update the memory record with analysis results
    const { error: updateError } = await supabase
      .from('shared_memories')
      .update({
        ai_description: analysis.description,
        ai_themes: analysis.themes || [],
        ai_emotions: analysis.emotions || [],
        ai_objects: analysis.objects || [],
        avatar_comment: avatarComment,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', memoryId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update memory:', updateError);
      throw updateError;
    }

    console.log(`Memory ${memoryId} analyzed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          description: analysis.description,
          themes: analysis.themes,
          emotions: analysis.emotions,
          objects: analysis.objects,
          avatarComment,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-memory:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

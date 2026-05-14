// Edge function: extracts structured pigeon fields from a dictated note
// using Lovable AI Gateway (Gemini Flash) + tool calling.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, audio, language = "es" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un experto en colombofilia (palomas mensajeras). 
Tu tarea es transcribir el audio (si se proporciona) y extraer los siguientes campos en formato JSON:
- "name": nombre de la paloma.
- "ringNumber": número de anilla (ej: BE-2024-1234567).
- "sex": "cock" (macho) | "hen" (hembra).
- "bornYear": año (ej: 2024).
- "color": color (ej: Rodado, Azul).
- "loft": palomar.
- "breeder": criador.
- "status": "breeder" | "racer" | "young" | "lost".
- "notes": cualquier otra observación.

Si recibes audio, primero transcríbelo palabra por palabra y luego extrae los campos.
Devuelve un JSON con { "transcript": "texto transcrito", "fields": { ... } }`;

    let userContent;
    if (audio) {
      // Extraer el base64 puro (quitar el prefijo data:audio/...)
      const base64Data = audio.split(",")[1] || audio;
      userContent = [
        { type: "text", text: "Transcribe este audio de un criador de palomas y extrae los datos." },
        {
          type: "image_url", // Lovable Gateway usa image_url como contenedor genérico para archivos en algunos modelos, 
          // pero para Gemini 1.5 Flash usaremos el formato estándar de mensaje si es posible.
          // Nota: El Gateway de Lovable mapea esto a los inputs multimodales de Gemini.
          image_url: { url: `data:audio/wav;base64,${base64Data}` }
        }
      ];
    } else {
      userContent = transcript;
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-1.5-flash", // Usamos 1.5 Flash que es excelente con audio
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errorText);
      throw new Error("AI Gateway failed");
    }

    const aiData = await aiRes.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    return new Response(JSON.stringify({ 
      transcript: result.transcript || transcript, 
      fields: result.fields || {} 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pigeon error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

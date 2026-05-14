// Edge function: transcribes dictated audio AND/OR extracts structured pigeon
// fields using Lovable AI Gateway (Gemini 2.5 Flash) with tool calling.
//
// Accepts JSON body with EITHER:
//   - { audio: "<base64 or data URL>", mimeType?: string, language?: string }
//   - { transcript: string, language?: string }
//
// Returns: { transcript: string, fields: Partial<Pigeon> }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres un asistente experto en colombofilia (palomas mensajeras).
Recibes la transcripción (o el audio) de un criador describiendo una paloma.
Tu tarea es extraer los campos estructurados llamando a la herramienta "save_pigeon".
- Si un campo no se menciona, NO lo incluyas.
- "sex": "cock" si dice macho/cock/pichón macho, "hen" si dice hembra/hen.
- "status": uno de "breeder" (reproductor), "racer" (de competición/volador), "young" (joven/pichón), "lost" (perdido).
- "bornYear": número de 4 dígitos.
- "ringNumber": tal como lo dicte (ej: "ESP-2024-123456").
- "notes": información extra que no encaje en otros campos.`;

const PIGEON_TOOL = {
  type: "function",
  function: {
    name: "save_pigeon",
    description: "Guarda los datos extraídos de la paloma.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        ringNumber: { type: "string" },
        sex: { type: "string", enum: ["cock", "hen"] },
        bornYear: { type: "integer" },
        color: { type: "string" },
        loft: { type: "string" },
        breeder: { type: "string" },
        status: { type: "string", enum: ["breeder", "racer", "young", "lost"] },
        notes: { type: "string" },
      },
      additionalProperties: false,
    },
  },
};

function audioFormatFromMime(mime?: string): string {
  if (!mime) return "webm";
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  return "webm";
}

function stripDataUrl(s: string): { data: string; mime?: string } {
  // Handles data URLs with optional parameters like ;codecs=opus before ;base64,
  const m = s.match(/^data:([^;,]+)(?:;[^,]*?)?;base64,(.*)$/);
  if (m) return { data: m[2], mime: m[1] };
  // Fallback: if it starts with "data:" but didn't match, strip up to the comma
  const idx = s.indexOf("base64,");
  if (s.startsWith("data:") && idx !== -1) {
    return { data: s.slice(idx + "base64,".length) };
  }
  return { data: s };
}

async function callGateway(body: unknown, apiKey: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error("AI gateway error:", res.status, errorText);
    if (res.status === 429) throw new Error("Rate limit alcanzado. Inténtalo en unos segundos.");
    if (res.status === 402) throw new Error("Créditos de IA agotados. Añade créditos al espacio de trabajo.");
    throw new Error(`AI gateway: ${res.status}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, audio, mimeType, language = "es" } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalTranscript = (transcript ?? "").toString();

    // ── 1. Transcribe audio if provided ─────────────────────────────────────
    if (audio && !finalTranscript) {
      const { data: base64Data, mime: detectedMime } = stripDataUrl(audio);
      const format = audioFormatFromMime(mimeType || detectedMime);

      const transcribeBody = {
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un transcriptor de voz. Transcribe el audio del usuario palabra por palabra en ${language === "en" ? "inglés" : language === "pt" ? "portugués" : "español"}. Devuelve SOLO la transcripción, sin comentarios.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe este audio:" },
              {
                type: "input_audio",
                input_audio: { data: base64Data, format },
              },
            ],
          },
        ],
      };

      const transcribeRes = await callGateway(transcribeBody, LOVABLE_API_KEY);
      finalTranscript = (transcribeRes?.choices?.[0]?.message?.content ?? "").toString().trim();
    }

    if (!finalTranscript) {
      return new Response(JSON.stringify({ transcript: "", fields: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. Extract structured fields with tool calling ──────────────────────
    const extractBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Transcripción: """${finalTranscript}"""` },
      ],
      tools: [PIGEON_TOOL],
      tool_choice: { type: "function", function: { name: "save_pigeon" } },
    };

    const extractRes = await callGateway(extractBody, LOVABLE_API_KEY);
    const toolCall = extractRes?.choices?.[0]?.message?.tool_calls?.[0];
    let fields: Record<string, unknown> = {};
    if (toolCall?.function?.arguments) {
      try {
        fields = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool args:", toolCall.function.arguments);
      }
    }

    return new Response(JSON.stringify({ transcript: finalTranscript, fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-pigeon error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

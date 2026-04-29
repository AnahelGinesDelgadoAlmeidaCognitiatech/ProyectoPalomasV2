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
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Eres un asistente que extrae datos de palomas mensajeras de carreras a partir de una nota dictada (en español o inglés).
Reglas:
- Devuelve SOLO los campos que aparezcan claramente en el texto. Si un campo no aparece, omítelo.
- "name": nombre o identificador corto (ej: "Apollo", "Rayo", "El 47").
- "ringNumber": número de anilla. Conserva letras y dígitos. Quita espacios internos pero mantén guiones. Mayúsculas. Ej: "BE-2024-1234567".
- "sex": "cock" (macho) | "hen" (hembra).
- "bornYear": año de nacimiento (entero entre 1990 y 2100).
- "color": color o características físicas (ej: "Blue Bar", "Checker", "ajedrezado oscuro").
- "loft": nombre del palomar donde está alojada.
- "breeder": nombre del criador.
- "status": "breeder" | "racer" | "young" | "lost".
- "notes": observaciones extra que no encajen en los otros campos.
Sé tolerante a errores de transcripción de voz.`;

    const tool = {
      type: "function",
      function: {
        name: "extract_pigeon",
        description: "Extrae los campos de una paloma desde texto dictado",
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

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_pigeon" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable Cloud." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: Record<string, unknown> = {};
    if (call?.function?.arguments) {
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch (e) {
        console.error("Could not parse arguments:", call.function.arguments);
      }
    }

    return new Response(JSON.stringify({ fields: parsed }), {
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

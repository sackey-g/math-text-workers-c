const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /api/content へのメモ・解答リクエストを処理
    if (url.pathname === "/api/content") {
      const corsHeaders = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };

      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (request.method === "GET") {
        const subject = url.searchParams.get("subject") || url.searchParams.get("university");
        const lecture = url.searchParams.get("lecture") || url.searchParams.get("year");
        const type = url.searchParams.get("type") || "exercise";
        const contentType = url.searchParams.get("contentType");

        if (!subject || !lecture || !type || !contentType) {
          return new Response(JSON.stringify({ error: "Missing parameters" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        if (!isValidContentKey({ subject, lecture, type, contentType })) {
          return new Response(JSON.stringify({ error: "Invalid parameters" }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const key = `${subject}/${lecture}/${type}/${contentType}.md`;

        try {
          if (env.R2_BUCKET) {
            const obj = await env.R2_BUCKET.get(key);
            const text = obj ? await obj.text() : "";
            return new Response(JSON.stringify({ text }), { headers: corsHeaders });
          }
          return new Response(JSON.stringify({ error: "R2 binding is unavailable" }), {
            status: 503,
            headers: corsHeaders,
          });
        } catch (e) {
          console.error("R2 Get error:", e);
          return new Response(JSON.stringify({ error: "Failed to load content" }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      }

      if (request.method === "POST") {
        try {
          const body = await request.json();
          const { subject, lecture, type = "exercise", contentType, text } = body;

          if (!subject || !lecture || !contentType) {
            return new Response(JSON.stringify({ error: "Missing parameters" }), {
              status: 400,
              headers: corsHeaders,
            });
          }

          if (
            !isValidContentKey({ subject, lecture, type, contentType }) ||
            typeof text !== "string" ||
            text.length > 100_000
          ) {
            return new Response(JSON.stringify({ error: "Invalid request body" }), {
              status: 400,
              headers: corsHeaders,
            });
          }

          const key = `${subject}/${lecture}/${type}/${contentType}.md`;

          if (env.R2_BUCKET) {
            await env.R2_BUCKET.put(key, text || "", {
              httpMetadata: { contentType: "text/markdown" },
            });
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
          }

          return new Response(JSON.stringify({ error: "R2 binding is unavailable" }), {
            status: 503,
            headers: corsHeaders,
          });
        } catch (e) {
          console.error("R2 Put error:", e);
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      }

      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, Allow: "GET, POST, OPTIONS" },
      });
    }

    // 静的ファイル（HTML/CSS/JS/画像）へフォールバック配信
    return env.ASSETS.fetch(request);
  },
};

export default worker;

const VALID_SUBJECTS = new Set(["math1", "math2", "math3", "science_math"]);
const VALID_TYPES = new Set(["self_study", "example", "exercise"]);
const VALID_CONTENT_TYPES = new Set(["answer", "memo"]);

function isValidContentKey({ subject, lecture, type, contentType }) {
  return (
    VALID_SUBJECTS.has(subject) &&
    /^lec\d{2}$/.test(lecture) &&
    VALID_TYPES.has(type) &&
    VALID_CONTENT_TYPES.has(contentType)
  );
}

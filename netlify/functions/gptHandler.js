const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const {
      topic,
      audience,
      recommendation,
      supportingPoints,
      type,
      frame
    } = JSON.parse(event.body);

    let promptTemplate = null;

    if (frame) {
      const framePath = path.join(__dirname, `${frame}.json`);
      const raw = fs.readFileSync(framePath, "utf-8");
      const frameJson = JSON.parse(raw);
      promptTemplate = frameJson.promptTemplate;
    }

    const finalPrompt = promptTemplate
      ? promptTemplate
          .replace("{{doSomething}}", recommendation)
          .replace("{{consequence1}}", supportingPoints[0] || "")
          .replace("{{consequence2}}", supportingPoints[1] || "")
          .replace("{{consequence3}}", supportingPoints[2] || "")
          .replace("{{recommendation}}", recommendation)
      : `Write a ${type} for the following situation:\nAudience: ${audience}\nTopic: ${topic}\nRecommendation: ${recommendation}\nSupporting Points:\n- ${supportingPoints.join("\n- ")}`;

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a messaging strategist. Generate clear, persuasive content using the user’s framing."
        },
        {
          role: "user",
          content: finalPrompt
        }
      ]
    });

    const result = chatResponse.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (err) {
    console.error("🔥 GPT handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", details: err.message })
    };
  }
};

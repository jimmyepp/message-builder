import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const handler = async (event) => {
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
      frame,
      frameData
    } = JSON.parse(event.body);

    // 🧠 Build the final prompt
    let finalPrompt = "";

    if (frame && frameData?.promptTemplate) {
      // Replace template tokens with real values
      finalPrompt = frameData.promptTemplate
        .replace("{{doSomething}}", recommendation)
        .replace("{{consequence1}}", supportingPoints[0] || "")
        .replace("{{consequence2}}", supportingPoints[1] || "")
        .replace("{{consequence3}}", supportingPoints[2] || "")
        .replace("{{recommendation}}", recommendation);
    } else {
      // Default fallback prompt
      finalPrompt = `Write a ${type} for the following situation:\nAudience: ${audience}\nTopic: ${topic}\nRecommendation: ${recommendation}\nSupporting Points:\n- ${supportingPoints.join("\n- ")}`;
    }

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

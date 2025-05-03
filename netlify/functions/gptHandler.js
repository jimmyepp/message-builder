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
      type: format,
      frame: selectedFrame
    } = JSON.parse(event.body);

    console.log("📥 Incoming request:", {
      topic,
      audience,
      recommendation,
      supportingPoints,
      format,
      selectedFrame
    });

    let frameInstructions = "";
    let promptTemplate = null;

    if (selectedFrame) {
      try {
        const framePath = path.join(__dirname, "frames", `${selectedFrame}.json`);
        console.log("🛠️ Attempting to load frame from:", framePath);

        const frameRaw = fs.readFileSync(framePath, "utf-8");
        const frameJson = JSON.parse(frameRaw);

        console.log("✅ Frame JSON loaded:", frameJson);

        frameInstructions = `${frameJson.longDescription}\n\nWhen to use:\n- ${frameJson.whenToUse.join("\n- ")}\n\nHow to use:\n- ${frameJson.howToUse.join("\n- ")}`;
        promptTemplate = frameJson.promptTemplate;
      } catch (err) {
        console.error("⚠️ Could not load frame file:", err);
      }
    } else {
      console.log("ℹ️ No frame selected. Using default instructions.");
    }

    let finalPrompt = "";

    if (promptTemplate) {
      finalPrompt = promptTemplate
        .replace("{{doSomething}}", recommendation)
        .replace("{{consequence1}}", supportingPoints[0] || "")
        .replace("{{consequence2}}", supportingPoints[1] || "")
        .replace("{{consequence3}}", supportingPoints[2] || "")
        .replace("{{recommendation}}", recommendation);

      console.log("🧠 Final prompt using frame template:", finalPrompt);
    } else {
      finalPrompt = `Write a ${format} for the following:\nAudience: ${audience}\nTopic: ${topic}\nRecommendation: ${recommendation}\nSupporting Points:\n- ${supportingPoints.join("\n- ")}`;

      console.log("🧠 Final prompt using fallback format:", finalPrompt);
    }

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a messaging strategist. Use the following frame:\n\n${frameInstructions}`
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

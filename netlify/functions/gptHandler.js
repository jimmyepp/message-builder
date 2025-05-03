import { readFileSync } from "fs";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI();

export const handler = async (event) => {
  console.log("📥 Incoming request:", event.body);

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
      format,
      selectedFrame
    } = JSON.parse(event.body);

    // Try to load frame data
    let frame = null;
    if (selectedFrame) {
      try {
        const framePath = path.join(__dirname, "frames", `${selectedFrame}.json`);
        console.log("🛠️ Attempting to load frame from:", framePath);
        const frameData = readFileSync(framePath, "utf8");
        frame = JSON.parse(frameData);
        console.log("✅ Frame JSON loaded:", frame);
      } catch (err) {
        console.error("⚠️ Could not load frame file:", err);
      }
    }

    // Format supporting points list
    const supportingList = supportingPoints && supportingPoints.length > 0
      ? supportingPoints.join(", ")
      : "serious consequences";

    // Build initial prompt
    let prompt = frame?.promptTemplate
      ? frame.promptTemplate
          .replace(/{{recommendation}}/g, recommendation)
          .replace(/{{supportingList}}/g, supportingList)
      : `Write a ${format} for the following:
Topic: ${topic}
Audience: ${audience}
Recommendation: ${recommendation}
Supporting Points: ${supportingList}`;

    // Format-specific wrapping
    if (format === "email") {
      prompt = `Write a professional email with a subject line, greeting, and closing. Use the following content:\n\n${prompt}`;
    } else if (format === "elevator pitch") {
      prompt = `Write a concise and persuasive elevator pitch based on this:\n\n${prompt}`;
    } else if (format === "slide copy") {
      prompt = `Write slide headlines and bullets for a presentation. Base the content on:\n\n${prompt}`;
    }

    console.log("🧠 Final prompt using frame template:", prompt);

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4"
    });

    const result = completion.choices[0].message.content;
    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (err) {
    console.error("🔥 GPT handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};

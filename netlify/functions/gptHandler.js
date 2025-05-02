const fs = require("fs");
const path = require("path");

const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async function (event, context) {
  console.log("📩 Raw event received:", event);

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
    console.log("📬 Parsed body:", body);
  } catch (err) {
    console.error("❌ Failed to parse request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }


  const { topic, audience, recommendation, supportingPoints, type, frame } = body;

  // Try to load frame file
  let frameInstructions = "";
  if (frame) {
    try {
      const filePath = path.join(__dirname, `${frame.toLowerCase()}.json`);
      const frameData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      frameInstructions = frameData?.longDescription || "";
      console.log("📚 Frame instructions loaded from file.");
    } catch (error) {
      console.warn("⚠️ Could not load frame file:", error.message);
    }
  }

  try {
    const prompt = `
You are an expert communicator.

Your task is to generate a message in the form of a ${type} for the following scenario:

Topic: ${topic}
Audience: ${audience}
Recommendation: ${recommendation}
Supporting Points:
- ${supportingPoints.join("\n- ")}

${frameInstructions ? "Frame Instructions:\n" + frameInstructions : ""}

The response should be formatted as a professional ${type}.`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const result = completion.data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    console.error("🔥 GPT handler error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate message" }),
    };
  }
};

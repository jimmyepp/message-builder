const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const messagingFrames = {
  systemPrompt: `
You are a message framing expert. Your job is to apply the selected messaging frame (like negative or positive) and follow its instructions to create the most effective message.`,
  positive: `
Reframe this message to focus on hope, benefits, or positive transformation. Emphasize opportunities and desirable outcomes.`,
  balanced: `
Frame this message to show both the positive opportunity and the risk of doing nothing.`
};

function loadFrameInstructions(frame) {
  try {
    const framePath = path.join(__dirname, `${frame}.json`);
    const frameData = fs.readFileSync(framePath, "utf-8");
    const parsed = JSON.parse(frameData);
    return parsed.longDescription || "";
  } catch (err) {
    console.warn(`⚠️ Could not load frame instructions for '${frame}':`, err.message);
    return "Use a clear, persuasive message structure.";
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }

  const { topic, audience, recommendation, supportingPoints, type, frame } = body;
  const selectedFrame = frame?.toLowerCase();
  const frameInstructions = messagingFrames[selectedFrame] || loadFrameInstructions(selectedFrame);
  const bulletPoints = Array.isArray(supportingPoints) ? supportingPoints.join("\n- ") : "";

  const prompt = `
${messagingFrames.systemPrompt}

Frame: ${selectedFrame}

Instructions:
${frameInstructions}

Write a ${type} for this audience.

Topic: ${topic}
Audience: ${audience}
Recommendation: ${recommendation}
Supporting Points:
- ${bulletPoints}
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    const result = completion.data.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate message" })
    };
  }
};

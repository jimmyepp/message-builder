const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const negativeFrame = `
You will use this frame when a user selects it as part of their message. directions below.
`;

const messagingFrames = {
  systemPrompt: `
You are a message framing communication professional. Your job is to identify which messaging frame the user is using (such as negative, positive, balanced, etc.) and help them craft the most effective message possible.

You must always follow the instructions included in the selected frame below, and structure your GPT prompt to reflect those framing principles. Be specific, persuasive, and aligned with the user's intent.
  `,
  positive: "Reframe this message to focus on hope, benefits, or positive transformation. Emphasize opportunities and desirable outcomes.",
  negative: negativeFrame,
  balanced: "Frame this message to show both the positive opportunity and the risk of doing nothing."
};

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
    console.log("📥 Incoming event:", body);
  } catch (err) {
    console.error("❌ Failed to parse request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }

  const { topic, audience, recommendation, supportingPoints, type, frame } = body;

  const frameInstructions = messagingFrames[frame];
  const prompt = `
${messagingFrames.systemPrompt}

Frame: ${frame.toUpperCase()}

Instructions:
${frameInstructions}

Write a ${type} for this audience.

Topic: ${topic}
Audience: ${audience}
Recommendation: ${recommendation}
Supporting Points:
- ${supportingPoints.join("\n- ")}
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
    console.error("🔥 GPT handler error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate message" })
    };
  }
};

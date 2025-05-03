const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


const messagingFrames = {
  systemPrompt: `
You are a message framing expert. Your job is to apply the selected messaging frame (like negative or positive) and follow its instructions to create the most effective message.`,
  positive: `
Reframe this message to focus on hope, benefits, or positive transformation. Emphasize opportunities and desirable outcomes.`,
  negative: `
Use this frame to show the consequences of inaction.

Use this frame when:
- You need your audience to act quickly
- You’re trying to stop something from getting worse
- The status quo is riskier than change

How to use:
- Name the real consequences of doing nothing
- Use urgent, clear language
- Don’t exaggerate—just get real
- Show how your recommendation avoids those risks
`,
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
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }

  const { topic, audience, recommendation, supportingPoints, type, frame } = body;
  const selectedFrame = frame?.toLowerCase();
  const frameInstructions = messagingFrames[selectedFrame] || "Use a clear, persuasive message structure.";
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

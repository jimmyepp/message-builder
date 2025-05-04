const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const messagingFrames = {
  systemPrompt: `
You are a message framing expert. Your job is to apply the selected messaging frames and follow its instructions to create the most effective message.`,
  positive: `
Reframe this message to focus on hope, benefits, or positive transformation. Emphasize opportunities and desirable outcomes.`,
  negative: `
Use this frame to show the threats, consequences and danger of not following the user's recommendation.

How to use:
- Name the real threat or danger of doing nothing
- Show how that threat affects stability, health, growth, or credibility
- Use urgent, clear language: “we risk...”, “could lose...”, “will face...”
- Be grounded — don’t exaggerate. Just reveal what’s being overlooked
- Show how the outcomes might interfere with the audience's self-preservation
- Use stronger emotional cues — irrelevance, decline, or exposure to risk
- Connect the danger to the audience’s identity, stability, or long-term viability
- Show how your recommendation helps avoid or neutralize the threat

`





,
  balanced: "Frame this message to show both the positive opportunity and the risk of doing nothing."
};

exports.handler = async function (event, context) {
    console.log("✅ Handler is being hit."); // ← Add this here

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
    console.error("❌ Failed to parse request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }

  const { topic, audience, recommendation, supportingPoints, type, frame } = body;

  try {
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

console.log("🧠 Frame selected:", selectedFrame);
console.log("📝 Prompt being sent to GPT:\n", prompt);


    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
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
      body: JSON.stringify({ error: "Failed to generate message" })

    };
  }
};

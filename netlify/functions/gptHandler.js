const fetch = require("node-fetch");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.handler = async function (event, context) {
  try {
    if (!event.body) {
      console.error("No request body received");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No request body received" }),
      };
    }

    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error("Invalid JSON:", parseError.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { audience, topic, recommendation, supportingPoints, type, frame } = body;
    console.log("Incoming event:", body);
    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    // This was TEMP fallback frame instructions
const frameDoc = await getDoc(doc(db, "frames", frame));
if (frameDoc.exists()) {
  frameInstructions = frameDoc.data().longDescription + '\n' +
                      (frameDoc.data().howToUse || []).join('\n');
}



    const systemPrompt = `You are a senior messaging strategist helping professionals turn their brainstorms into clear, persuasive messages.

Your job is to:
- Focus on the audience.
- Think step-by-step.
- Keep sentences short.
- Avoid fluff.
- Use tone that matches the request (e.g., email, pitch).
${frameInstructions ? `\n\nFRAME INSTRUCTIONS:\n${frameInstructions}` : ''}`;

    const userPrompt = `Write a ${type} for the following:

Audience: ${audience}
Topic: ${topic}
Recommendation: ${recommendation}
Supporting Points:
- ${supportingPoints?.[0] || ''}
- ${supportingPoints?.[1] || ''}
- ${supportingPoints?.[2] || ''}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

if (!response.ok) {
  console.error("OpenAI error:", data);
  return {
    statusCode: response.status,
    body: JSON.stringify({ error: data.error?.message || "OpenAI API error" }),
  };
}

console.log("OpenAI response:", data);


if (!audience || !topic || !recommendation || !type) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Missing required input fields." }),
  };
}

    return {
      statusCode: 200,
      body: JSON.stringify({ result: data.choices?.[0]?.message?.content || "No response from GPT" }),
    };
  } catch (error) {
    console.error("Error in GPT Handler:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

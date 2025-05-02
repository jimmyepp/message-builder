const fetch = require("node-fetch");
const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

exports.handler = async function (event, context) {
  console.log("Incoming event:", event.body);
  console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

if (!event.body) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "No request body received" })
  };
}

let parsedBody;
try {
  parsedBody = JSON.parse(event.body);
} catch (err) {
  return {
    statusCode: 400,
    body: JSON.stringify({ error: "Invalid JSON in request body" })
  };
}


  const { audience, topic, recommendation, supportingPoints, type, frame } = parsedBody;

  // Optional: pull frame instructions from Firestore if frame is selected
  let frameInstructions = '';
  if (frame) {
    try {
      const docSnap = await db.collection("frames").doc(frame).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        frameInstructions = data?.longDescription || '';
      }
    } catch (err) {
      console.error("Failed to fetch frame data:", err.message);
    }
  }

  const systemPrompt = `
You are a senior messaging strategist. Your job is to turn ideas into clear, structured, persuasive writing. Use the audience, topic, recommendation, and supporting points to create a ${type}. If a frame is selected, reflect it in the message style. Keep it tight, persuasive, and well-structured.
${frameInstructions ? `\n\nFRAME INSTRUCTIONS:\n${frameInstructions}` : ''}
`;

  const userPrompt = `Audience: ${audience}
Topic: ${topic}
Recommendation: ${recommendation}
Supporting Points:
- ${supportingPoints?.[0] || ''}
- ${supportingPoints?.[1] || ''}
- ${supportingPoints?.[2] || ''}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log("OpenAI response:", JSON.stringify(data));

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: data.choices?.[0]?.message?.content || "No result generated"
      })
    };
  } catch (err) {
    console.error("Error in GPT Handler:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

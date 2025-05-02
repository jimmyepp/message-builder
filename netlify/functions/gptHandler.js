const { Configuration, OpenAIApi } = require("openai");
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, doc, getDoc } = require("firebase-admin/firestore");

const serviceAccount = require("./firebase-service-account.json");

// Only initialize Firebase once
if (!admin.apps.length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
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
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const { topic, audience, recommendation, supportingPoints, type, frame } = body;

  let frameInstructions = "";
  if (frame) {
    try {
      const frameDoc = await getDoc(doc(db, "frames", frame.toLowerCase()));
      if (frameDoc.exists()) {
        const data = frameDoc.data();
        frameInstructions = data?.longDescription || "";
        console.log("📚 Frame instructions loaded.");
      } else {
        console.warn("⚠️ Frame not found:", frame);
      }
    } catch (error) {
      console.error("🔥 Error loading frame:", error.message);
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

const { Configuration, OpenAIApi } = require("openai");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

exports.handler = async function (event) {
  console.log("📥 Incoming event:", event.body || event);

  // Parse the request body
  let body;
  try {
    body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  } catch (err) {
    console.error("❌ Failed to parse request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const { topic, audience, recommendation, supportingPoints = [], type, frame } = body;

  if (!topic || !audience || !recommendation || !type) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required input fields" }),
    };
  }

  console.log("🧠 Generating for type:", type, "frame:", frame);

  // Optional: Load frame instructions from Firestore
  let frameInstructions = "";
  if (frame) {
    try {
      const docRef = db.collection("frames").doc(frame.toLowerCase());
      const frameDoc = await docRef.get();
      if (frameDoc.exists) {
        const data = frameDoc.data();
        frameInstructions = data.longDescription || data.instructions || "";
        console.log("📚 Frame instructions loaded.");
      } else {
        console.warn("⚠️ No frame found for:", frame);
      }
    } catch (err) {
      console.error("🔥 Error loading frame:", err.message);
    }
  }

  // OpenAI setup
  const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

  const prompt = `
You are an expert communicator helping someone craft a ${type}.
They are targeting this audience: "${audience}"
Their topic is: "${topic}"
Their recommendation is: "${recommendation}"
Here are their three strongest supporting points:
- ${supportingPoints.join("\n- ")}

${frameInstructions ? `Use the following framing strategy:\n${frameInstructions}` : ""}

Please respond with only the completed ${type}. Don't include any extra explanation or formatting instructions.
`;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "system",
          content: "You are a communication assistant that transforms structured inputs into persuasive messages.",
        },
        { role: "user", content: prompt },
      ],
    });

    const result = completion.data.choices[0].message.content;
    console.log("✅ OpenAI response received.");

    return {
      statusCode: 200,
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    console.error("❌ Error in OpenAI request:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate message from OpenAI" }),
    };
  }
};

const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

exports.handler = async function (event, context) {
  try {
    if (!event.body) throw new Error("No request body received");

    console.log("Incoming event:", event.body);
    const { audience, topic, recommendation, supportingPoints, type, frame } = JSON.parse(event.body);

    if (!audience || !topic || !recommendation || !type) {
      throw new Error("Missing required fields in request body");
    }

    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    // Optional: fetch frame data from Firestore if frame is selected
    let frameInstructions = '';
    if (frame) {
      try {
        const frameDoc = await db.collection("frames").doc(frame).get();
        if (frameDoc.exists) {
          const frameData = frameDoc.data();
          frameInstructions = `\n\n---\n\nFrame: ${frameData.label}\nHow to use this frame:\n${(frameData.howToUse || []).join('\n')}`;
        } else {
          console.warn(`No frame data found for frame: ${frame}`);
        }
      } catch (err) {
        console.warn("Error fetching frame data:", err.message);
      }
    }

    const systemPrompt = `You are a copywriter and messaging strategist. Your job is to help professionals turn ideas into clear, persuasive, and structured communication. Use the details provided to write compelling copy. Avoid fluff. Short sentences. Prioritize clarity and confidence. Adapt your tone if needed.${frameInstructions}`;

    const userPrompt = `Write a ${type} for the following:\n\nAudience: ${audience}\nTopic: ${topic}\nRecommendation: ${recommendation}\nSupporting Points:\n- ${(supportingPoints || []).join('\n- ')}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
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
      body: JSON.stringify({ result: data.choices?.[0]?.message?.content || "No response from GPT" })
    };

  } catch (error) {
    console.error("Error in GPT Handler:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const frameInstructions = frameData?.howToUse?.join('\n') || '';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

exports.handler = async function (event, context) {
  try {
    console.log("Incoming event:", event.body);

    const { topic, audience, recommendation, supportingPoints, type, frame } = JSON.parse(event.body);
    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    // Base system prompt
    const systemPrompt = `
You are a copywriter and senior messaging strategist. Your job is to help professionals turn their brainstormed ideas into clear, persuasive, and structured communication.

You work independently, think step-by-step, and ensure the result is focused on the intended audience. Avoid fluff. Use jargon only when appropriate. Prioritize clarity and confidence.

Write succinctly. Short sentences are better. Short paragraphs are better. Use the ideas provided to write compelling copy.
`;

    // Try to fetch frame instruction from Firestore
    let frameInstruction = '';
    if (frame) {
      try {
        const frameDoc = await db.collection('frames').doc(frame).get();
        if (frameDoc.exists) {
          const frameData = frameDoc.data();
          frameInstruction = frameData?.longDescription || '';
        }
      } catch (err) {
        console.error('Error loading frame data:', err.message);
      }
    }

    // User prompt with optional frame guidance
    let userPrompt = `Write a ${type} for the following:\n\nAudience: ${audience}\nTopic: ${topic}\nRecommendation: ${recommendation}\nSupporting Points:\n- ${supportingPoints[0]}\n- ${supportingPoints[1]}\n- ${supportingPoints[2]}`;
    if (frameInstruction) {
      userPrompt += `\n\n# FRAME INSTRUCTION\n${frameInstruction}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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

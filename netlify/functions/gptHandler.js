const fs = require('fs');
const path = require('path');

exports.handler = async function (event, context) {
  try {
    console.log("Incoming event:", event.body);
    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    const { audience, topic, recommendation, supportingPoints, type, frame } = JSON.parse(event.body);




const messagingFrames = {
  positive: "Reframe this message to focus on hope, benefits, or positive transformation. Emphasize opportunities and desirable outcomes.",
  negative: NEGATIVE_FRAME,
  balanced: "Frame this message to show both the positive opportunity and the risk of doing nothing...",
  // ...etc
};


    const systemPrompt = `
You are a copywriter and senior messaging strategist. You are an expert at framing messages. and you are framing messages for users with their inpuYour job is to help professionals turn their brainstormed ideas into clear, persuasive, and structured communication.

You work independently, think step-by-step, and ensure the result is focused on the intended audience. Avoid fluff. Do not use jargon at all. Prioritize clarity.

Write succinctly. Short sentences are better. Short paragraphs are better. Do not write long. Use the brainstorm points provided to write compelling copy.

If a tone is provided (e.g., bold, friendly, formal), match your writing style to that tone while keeping the message clear and effective.
    `;

    let userPrompt = `
# OBJECTIVE
Write a ${type} using the structured messaging information below. Focus on creating a message that is clear, relevant, and persuasive to the intended audience.

# CONTEXT
Audience: ${audience}  
Topic: ${topic}  
Recommendation: ${recommendation}

# SUPPORTING POINTS
${supportingPoints.map((pt) => `- ${pt}`).join('\n')}

# GUIDELINES
- Focus on the audience’s priorities and needs
- Emphasize the benefits of the recommendation
- Keep the structure tight and persuasive
- Use the selected frame type and its guidance to shape the message
- Use a tone appropriate for the audience (match if tone is specified)
`;

    if (frame && messagingFrames[frame]) {
      console.log("🧩 Injected frame instruction:", messagingFrames[frame]);
      const frameData = messagingFrames[frame];

      if (typeof frameData === 'string') {
        userPrompt += `\n\n# FRAME INSTRUCTION\n${frameData}`;
      } else if (typeof frameData === 'object' && frameData.promptTemplate) {
        const supportingList = supportingPoints.join(', ');
        const filledPrompt = frameData.promptTemplate
          .replace(/{{recommendation}}/g, recommendation)
          .replace(/{{supportingList}}/g, supportingList);

        userPrompt += `\n\n# FRAME INSTRUCTION\n${filledPrompt}`;
      }
    }

    userPrompt += `\n\n# INSTRUCTIONS\nWrite only the ${type}. Do not explain or summarize it. Think before you write. Begin when ready.`;

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

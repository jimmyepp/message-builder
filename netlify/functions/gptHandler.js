exports.handler = async function (event, context) {
  try {
    console.log("Incoming event:", event.body);
    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    const { audience, topic, recommendation, supportingPoints, type, frame } = JSON.parse(event.body);

const messagingFrames = {
  positive: {
    label: "Positive Frame",
    shortDescription: "Focus on hope, benefits, or positive transformation.",
    prompt: "Reframe this message to focus on hope, benefits, or positive transformation. Emphasize opportunities and desirable outcomes."
  },
  negative: {
    id: "negative",
    label: "Negative Frame",
    shortDescription: "Emphasize the consequences of inaction to drive urgency.",
    longDescription: "Use this frame when the consequences of inaction matter more than the upside of action...",
    whenToUse: [
      "You need your audience to act quickly.",
      "You’re trying to stop something from getting worse.",
      "The status quo is riskier than change."
    ],
    howToUse: [
      "Name the real consequences of doing nothing.",
      "Use urgent, clear language.",
      "Don’t exaggerate—just get real.",
      "Then show how your recommendation avoids those risks."
    ],
    promptTemplate: "If we don’t {{recommendation}}, we risk {{supportingList}}. That’s why I recommend {{recommendation}}."
  },
  balanced: {
    prompt: "Frame this message to show both the positive opportunity and the risk of doing nothing. Offer a thoughtful, complete perspective."
  },
  attribute: {
    prompt: "Reframe this message by emphasizing a key feature or characteristic of the topic. Consider how it could be viewed positively or negatively."
  },
  benefit: {
    prompt: "Reframe this message by focusing on what the audience gets. Translate features into real-life improvements and tangible results."
  },
  settlement: {
    prompt: "Frame this message around a safer choice versus a risky option. Highlight the stability of your recommendation."
  },
  assembly: {
    prompt: "Assemble positive, negative, attribute, and benefit frames into a single powerful message that blends both promise and risk."
  },
  inverted: {
    prompt: "Start with data, details, and context first, then build to the recommendation. Let the audience reach their own conclusion."
  }
};

    const systemPrompt = `
You are a copywriter and senior messaging strategist. Your job is to help professionals turn their brainstormed ideas into clear, persuasive, and structured communication.

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
- Use a tone appropriate for the audience (match if tone is specified)
`;

    if (frame && messagingFrames[frame]) {
      userPrompt += `\n\n# FRAME INSTRUCTION\n${messagingFrames[frame]}`;
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

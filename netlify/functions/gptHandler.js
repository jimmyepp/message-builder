exports.handler = async function (event, context) {
  try {
    console.log("Incoming event:", event.body);
    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    const { audience, topic, recommendation, supportingPoints, type } = JSON.parse(event.body);

    const systemPrompt = `
You are a copywriter and senior messaging strategist. Your job is to help professionals turn their brainstormed ideas into clear, persuasive, and structured communication.

You work independently, think step-by-step, and ensure the result is focused on the intended audience. Avoid fluff. Use jargon only when appropriate. Prioritize clarity and confidence.

Write succinctly. Short sentences are better. Short paragraphs are better. Use the ideas provided to write compelling copy or brainstorm additional concepts.

If a tone is provided (e.g., bold, friendly, formal), match your writing style to that tone while keeping the message clear and effective.
    `;

    const userPrompt = `
# OBJECTIVE
Write a ${type} using the structured messaging information below. Focus on creating a message that is clear, relevant, and persuasive to the intended audience.

# CONTEXT
Audience: ${audience}  
Topic: ${topic}  
Recommendation: ${recommendation}

# SUPPORTING POINTS
${supportingPoints.map((pt, i) => `- ${pt}`).join('\n')}

# GUIDELINES
- Focus on the audience’s priorities and needs
- Emphasize the benefits of the recommendation
- Keep the structure tight and persuasive
- Use a tone appropriate for the audience (match if tone is specified)

# INSTRUCTIONS
Write only the ${type}. Do not explain or summarize it. Think before you write. Begin when ready.
    `;

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

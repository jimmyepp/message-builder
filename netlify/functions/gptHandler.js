const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const { audience, topic, recommendation, supportingPoints, type } = JSON.parse(event.body);

  const systemPrompt = "You are a marketing strategist who writes clear, persuasive, and structured content.";
  const userPrompt = `Write a ${type} for the following:

Audience: ${audience}
Topic: ${topic}
Recommendation: ${recommendation}
Supporting Points:
- ${supportingPoints[0]}
- ${supportingPoints[1]}
- ${supportingPoints[2]}

Be clear, well-structured, and persuasive.`;

  try {
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
    const message = data.choices?.[0]?.message?.content || "No response.";

    return {
      statusCode: 200,
      body: JSON.stringify({ result: message })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

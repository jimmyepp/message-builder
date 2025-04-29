exports.handler = async function (event, context) {
  try {
    console.log("Incoming event:", event.body);
    console.log("Using API Key?", !!process.env.OPENAI_API_KEY);

    const { audience, topic, recommendation, supportingPoints, type } = JSON.parse(event.body);

    const systemPrompt = "You are a marketing strategist who writes clear, persuasive, and structured content.";
    const userPrompt = `Write a ${type} for the following:\n\nAudience: ${audience}\nTopic: ${topic}\nRecommendation: ${recommendation}\nSupporting Points:\n- ${supportingPoints[0]}\n- ${supportingPoints[1]}\n- ${supportingPoints[2]}`;

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

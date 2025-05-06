const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const messagingFrames = {
  systemPrompt: `
You are a message framing expert. Your job is to apply the selected messaging frames, influence pricniples, topic, recommendation and make a message. It is really important to follow the framing and influence instructions when applied to create one cohesive message for the user. 
Guidelines on building messages:
- Even though you are building messages for users, these messages are to be written for the user's audience. 
- Avoid Self-Promotion: Let the audience’s success or failure speak for itself.
- Show, Don’t Tell
- Audience-centered tone: Focuses on your journey—not on the user's offerings.
﻿﻿- No bragging or directives: Removes phrases like "Look no further" and "Don't wait any longer," which feel promotional.
﻿﻿- No hero language: Replaces "We are the reason you can get help..." with a tone of partnership and presence.
- Asddress the users audience as you.
- You must take in all inputs and make one message.

`,
  positive: `
Use this frame to show the opportunity, transformation, and gain that comes from following the user's recommendation.

How to use:
- Highlight the benefit or positive change that’s possible
- Use clear, optimistic language: “we gain...”, “this allows...”, “you unlock...”
- Show how the outcome leads to growth, clarity, success, or relief
- Align the benefit with the audience’s goals, values, or aspirations
- Appeal to hope, progress, and possibility — not just logic
- Consider the performative effect — avoid language that could accidentally trigger fear or anxiety
- Focus on how the message makes the audience feel — it should sound encouraging, empowering, and opportunity-driven
- Frame your recommendation as the path to something better

Example: 
- By expanding our SEO strategy, we can capture more local traffic, reach underserved markets, and establish ourselves as the go-to provider in the region. This positions us for long-term growth and deeper community trust. That’s why I recommend broadening our keyword list now to seize that opportunity.`,
  

  negative: `
Use this frame to show the threats, consequences and danger of not following the user's recommendation.

How to use:
- Name the real threat or danger of doing nothing
- Show how that threat affects stability, health, growth, or credibility
- Use urgent, clear language: “we risk...”, “could lose...”, “will face...”
- Be grounded — don’t exaggerate. Just reveal what’s being overlooked
- Show how the outcomes might interfere with the audience's self-preservation
- Use stronger emotional cues — irrelevance, decline, or exposure to risk
- Connect the danger to the audience’s identity, stability, or long-term viability
- Show how your recommendation helps avoid or neutralize the threat

Example: 
- If we don’t act now to expand our SEO strategy, we risk being overtaken by less qualified competitors, losing the visibility that brings us new business, and slowly becoming irrelevant in the markets we serve. That puts our growth — and reputation — at risk. That’s why I recommend broadening our target keyword list immediately.`,

  balanced:  `
Use this frame to show both the benefits of action and the risks of inaction. It helps the audience see both sides — the reward and the cost — and encourages thoughtful, informed decision-making.

How to use:
- Start with the opportunity or benefit that comes from action
- Then clearly state the risk or consequence of not acting
- Use measured, grounded language — avoid fearmongering or overhype
- Emphasize contrast: growth vs. stagnation, gain vs. loss, clarity vs. confusion
- Use this frame when your audience is skeptical, cautious, or analytical
- Create a balanced emotional tone — hopeful but realistic
- Frame your recommendation as the smart way to move forward and avoid regret

Example:
- By expanding our keyword strategy now, we can increase local traffic and improve visibility in underserved markets. But if we wait, we risk falling behind competitors who are already targeting those terms. Taking action now gives us the best chance to lead — not play catch-up."`,

  attribute: `
Use this frame to spotlight a specific feature or characteristic of your topic, and present it in a way that shifts perception — positively, negatively, or both — without changing the underlying fact.

How to use:
- Identify a key feature, attribute, or detail about your topic
- Choose whether to frame it as a strength, a drawback, or both
- Keep the factual content the same — only the framing should shift
- Use language that guides how the audience perceives the attribute: “95% lean” vs. “5% fat”
- Focus on what the attribute means to your audience — what it enables or limits
- Use this frame when you want to shape perception around a specific detail without making new claims

Example:
- This tool analyzes content automatically and makes real-time SEO suggestions. That means your team doesn’t have to dig through data — the insights come to you. Consider it your always-on optimization partner.`,

  benefit: `
Use this frame to turn features into outcomes that matter. Focus on how your topic improves life, saves time, solves a problem, or creates a better experience for your audience.

How to use:
- Identify the key feature or action you're recommending
- Translate that feature into a real benefit — something the audience gains or enjoys
- Use clear, emotional language: “you save time…”, “you get peace of mind…”, “this means less stress…”
- Make the benefit tangible and relatable — how does it improve daily life?
- Watch out for negative benefits that may create anxiety instead of reassurance
- When helpful, use humor or contrast to turn a downside into a surprising benefit
- Frame your recommendation as a way to unlock that better outcome

Example:
- This new patient portal update gives you faster access to test results, fewer phone calls, and more control over your care — all from your phone. Consider switching to the app to make your healthcare experience easier and more transparent.`,

  settlement: `
Use this frame to show that your recommendation is the smarter, safer choice compared to a higher-risk alternative. It helps people feel confident choosing the more certain path over the riskier unknown.

How to use:
- Present two paths: one known/safe (your recommendation), and one risky/uncertain (status quo or alternative)
- Emphasize the risks, costs, or unpredictability of the riskier path
- Use the audience's natural bias toward certainty and stability
- Use language like: “there’s a safer way…”, “a smarter choice would be…”, “the risk just isn’t worth it”
- When possible, include probability, impact, or emotional cost of the risky path
- Frame your recommendation as the smart, lower-risk option that still leads to a positive outcome

Example:
- We could wait and hope traffic rebounds, but that’s a gamble. There’s no guarantee it will recover without intervention. Instead, we can act now to update our SEO strategy — a safer, more reliable move that gives us better odds of regaining visibility and driving results.
Wrong way to use it: 
- When it comes to YouTube, the settlement approach is key to ensuring success in your video marketing strategy.`,

  assembly: `
Use this frame to blend everything — attributes, benefits, and emotional tone — into a message that feels complete, balanced, and human. This frame brings together both the upsides and the tradeoffs in a single, honest narrative.

How to use:
- Identify the key features, benefits, and emotional angles of your topic
- Include both positive and negative elements to create contrast and authenticity
- Consider the performative impact — how the tone might emotionally land
- Use humor or self-awareness when helpful (especially with negative benefits or downsides)
- Frame your recommendation as a real-world decision — not perfect, but worth it

Example:
- Our automated patient portal gives you faster access to test results and fewer phone calls with your provider. That means more clarity, more control — and yes, fewer excuses to ignore that follow-up appointment. While it makes healthcare easier, it might also mean your doctor can finally hold you accountable — in real time.`,

  inverted: `
Use this frame when you want to build your case logically, starting with facts, data, or observations — and ending with your recommendation. This works well when your audience needs to see the reasoning before accepting the conclusion.

How to use:
- Start with the topic or issue you're addressing
- Walk through 2–3 key data points, observations, or findings
- Let the evidence lead naturally to your conclusion
- State your recommendation at the end — once the audience is primed
- Use this frame for transparency, post-mortems, or technical audiences
- Avoid this frame when your audience has short attention spans or wants a clear ask up front

Example:
- I want to talk to you about the drop in search rankings for our CRM Integration page. First, although the page was ranking well, it had almost zero conversions. Second, it performed poorly in ads too, which suggests the content didn’t connect with users. Third, our location-specific pages are still ranking high and converting well. Given these points, I recommend we prioritize local landing pages over general ones moving forward.`
};

const influenceGuidance = {
  commonGround: `
Use this principle to build trust by showing how your recommendation aligns with shared experiences, beliefs, or values.
How to use:
- Reference mutual goals, cultural norms, or points of agreement
- Use inclusive language
- Show that you understand where your audience is coming from
Example: “Just like you, we believe patients deserve answers fast — that’s why this change puts test results directly in their hands.”`,

  consistency: `
Use this principle to align your message with your audience’s past beliefs or commitments.
How to use:
- Show how your recommendation reinforces their values or direction
- do not specifically say the word consistent... but show hoe their views might be consistent with the recommendation
Example: “You value speed-to-market matters — this solution supports that priority.”
Wrong way to use it: "Remember, consistency is key in maintaining a strong online presence."`,

  contrast: `
Use this principle when you want your idea to stand out by comparison.
How to use:
- Compare your recommendation to an outdated or less effective option, exaggerate if you need to. 
- Highlight changes in results, speed, or simplicity
Example: "Our current process take days to implement, this approach cuts response time in half.”`,

  emotional: `
- Identify the core emotion you want to tap into — hope, fear, pride, frustration, relief, compassion
- Use vivid, emotionally charged language and imagery to bring the emotion to life
- Anchor the emotion in something the audience cares about — their people, their values, their future
- Use this frame when you want your message to be memorable, motivating, or deeply resonant
- Make sure the emotion fits the topic and tone — aim for impact, not manipulation
- Frame your recommendation as a way to resolve or amplify that emotional state
Example: "Imagine falling asleep knowing your loved one is being cared for by someone who sees them as family. That kind of peace of mind is rare — but it’s exactly what this program was built for. Because care isn’t just clinical — it’s deeply human. And it should feel that way."`,

  novelty: `
Use this principle to spark interest by introducing something new, surprising, or different.
How to use:
- Emphasize a shift in strategy, a new feature, or a breakthrough idea
- Highlight what makes it different from what’s been tried before
Example: “This is a completely new way of approaching local SEO — and no one in our region is doing it yet.”`,

  scarcity: `
Use this principle to create urgency by showing what could be lost by waiting.
How to use:
- Emphasize a closing window, limited availability, or cost of delay
- Only use this when the urgency is real and meaningful
Example: “If we don’t act this month, we lose the early renewal discount.”`
};


exports.handler = async function (event, context) {
  console.log("✅ Handler is being hit.");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error("❌ Failed to parse request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" })
    };
  }

  const { topic, audience, recommendation, supportingPoints, type, frame, influence } = body;

  try {
    const selectedFrame = frame?.toLowerCase();
    const frameInstructions = messagingFrames[selectedFrame] || "Use a clear, persuasive message structure.";
    const bulletPoints = Array.isArray(supportingPoints) ? supportingPoints.join("\n- ") : "";
const influenceNote = influence && influenceGuidance[influence]
  ? `\nInfluence Concept: ${influence}\nInstructions: ${influenceGuidance[influence]}`
  : "";

    const prompt = `
${messagingFrames.systemPrompt}

Frame: ${selectedFrame}

Instructions:
${frameInstructions}

${influenceNote}

Write a ${type} for this audience.

Topic: ${topic}
Audience: ${audience}
Recommendation: ${recommendation}
Supporting Points:
- ${bulletPoints}
`;


    console.log("🧠 Frame selected:", selectedFrame);
    console.log("📝 Prompt being sent to GPT:\n", prompt);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    const result = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ result })
    };
  } catch (err) {
    console.error("🔥 GPT handler error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate message" })
    };
  }
};

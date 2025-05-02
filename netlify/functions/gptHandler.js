exports.handler = async function (event, context) {
  console.log("📥 Incoming event:", event.body || event);

  let body;

  try {
    // If the body is already an object (in local dev), use it directly
    if (typeof event.body === "object") {
      body = event.body;
    } else {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    console.error("❌ Failed to parse request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  // ... continue with frame lookup and OpenAI call

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.handler = async function (event, context) {
  console.log("📥 Incoming event:", event.body);

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No request body received" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const { frame } = body;

  if (!frame) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No frame specified" }),
    };
  }

  try {
    const frameDoc = await db.collection("frames").doc(frame).get();
    if (!frameDoc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `Frame "${frame}" not found` }),
      };
    }

    const frameData = frameDoc.data();
    console.log("✅ Frame data retrieved:", frameData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Frame "${frame}" retrieved successfully.`,
        frameData,
      }),
    };
  } catch (err) {
    console.error("❌ Error retrieving frame from Firestore:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to retrieve frame data" }),
    };
  }
};

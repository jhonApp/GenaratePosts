const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { GoogleAuth } = require("google-auth-library");

// Initialize clients outside handler (Cold Start Optimization)
const region = process.env.AWS_REGION || "us-east-1";
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));
  
  // SQS Event contains Records
  for (const record of event.Records) {
    const { messageId, body } = record;
    let jobData;

    try {
      jobData = JSON.parse(body);
    } catch (e) {
      console.error(`Failed to parse message body for record ${messageId}:`, e);
      continue; // Skip invalid JSON
    }

    const { jobId, prompt, userId } = jobData;
    
    if (!jobId || !prompt) {
      console.error(`Missing jobId or prompt in message ${messageId}`, jobData);
      continue;
    }

    console.log(`Processing Job ID: ${jobId}, Prompt: ${prompt.substring(0, 50)}...`);

    try {
      // 1. Generate Image via Vertex AI
      console.time(`Generate-${jobId}`);
      const imageBase64 = await generateImage(prompt);
      console.timeEnd(`Generate-${jobId}`);
      
      const imageUrl = `data:image/png;base64,${imageBase64}`;

      // 2. Update DynamoDB to COMPLETED
      await docClient.send(new UpdateCommand({
        TableName: "ImageJobs",
        Key: { id: jobId },
        UpdateExpression: "set #s = :s, imageUrl = :i, updatedAt = :u",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":s": "COMPLETED",
          ":i": imageUrl,
          ":u": new Date().toISOString()
        }
      }));

      console.log(`Job ${jobId} successfully completed and updated in DynamoDB.`);

    } catch (error) {
      console.error(`Job ${jobId} failed processing:`, error);
      
      // Update DynamoDB to FAILED
      try {
        await docClient.send(new UpdateCommand({
          TableName: "ImageJobs",
          Key: { id: jobId },
          UpdateExpression: "set #s = :s, errorMessage = :e, updatedAt = :u",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: {
            ":s": "FAILED",
            ":e": error.message,
            ":u": new Date().toISOString()
          }
        }));
      } catch (dbError) {
        console.error(`Failed to update job ${jobId} status to FAILED:`, dbError);
      }
    }
  }
};

/**
 * Helper to call Vertex AI (Imagen)
 */
async function generateImage(prompt) {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us-central1";

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID environment variable is missing");
  }

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  const token = accessToken.token;

  // Use the same endpoint format as seen in the Next.js app
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1 },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex AI API Error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
    return result.predictions[0].bytesBase64Encoded;
  }

  throw new Error("Vertex AI returned no image data.");
}

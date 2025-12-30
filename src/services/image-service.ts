import { GoogleAuth } from "google-auth-library";

/**
 * Generates an image using Google Vertex AI (Imagen).
 * @param prompt The prompt to generate the image from.
 * @returns The Base64 encoded image string.
 * @throws Error if generation fails.
 */
export async function generateImageService(prompt: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us-central1";

  if (!projectId) {
    throw new Error("GCP_PROJECT_ID is not set");
  }

  if (!prompt) {
    throw new Error("Prompt is required");
  }

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  const token = accessToken.token;

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
    console.error(`Vertex AI Error (${response.status}):`, errorText);
    throw new Error(`Vertex AI API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  if (result.predictions && result.predictions.length > 0) {
    return result.predictions[0].bytesBase64Encoded;
  }

  throw new Error("No image returned from Vertex AI");
}

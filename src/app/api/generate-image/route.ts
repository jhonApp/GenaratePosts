import { GoogleAuth } from "google-auth-library";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("🔥 [DEBUG] Rota /process foi chamada!"); // <--- ADICIONE ISSO
  try {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || "us-central1";

    if (!projectId) {
      return NextResponse.json(
        { error: "GCP_PROJECT_ID is not set" },
        { status: 500 }
      );
    }

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
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
      const bytesBase64Encoded = result.predictions[0].bytesBase64Encoded;
      return NextResponse.json({ bytesBase64Encoded });
    }

    throw new Error("No image returned from Vertex AI");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}

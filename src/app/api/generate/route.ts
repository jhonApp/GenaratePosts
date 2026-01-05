import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { docClient } from "@/lib/dynamodb";
import { sqsClient } from "@/lib/sqs";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID, createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = body;

    // 1. Preparação
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();
    const normalizedPrompt = cleanPrompt.toLowerCase();
    
    // 2. Fingerprint (MD5)
    // Usamos o prompt normalizado (lowercase) para o hash para aumentar o Cache Hit rate
    const promptHash = createHash("md5").update(normalizedPrompt).digest("hex");

    // 3. Verificação de Cache (Ouro 🏆)
    try {
        const queryCmd = new QueryCommand({
            TableName: "ImageJobs",
            IndexName: "PromptHashIndex",
            KeyConditionExpression: "promptHash = :h",
            FilterExpression: "#status = :s", // Garantir que está COMPLETED
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":h": promptHash,
                ":s": "COMPLETED"
            },
            Limit: 1
        });

        const existing = await docClient.send(queryCmd);

        // 4. Decisão: Cache HIT
        if (existing.Items && existing.Items.length > 0) {
            const item = existing.Items[0];
            
            // Retorno IMEDIATO sem SQS
            return NextResponse.json({
                success: true,
                cached: true,
                jobId: item.id,
                imageUrl: item.imageUrl
            });
        }

    } catch (error) {
        console.error("Cache Check Failed:", error);
        // Em caso de erro no cache, continuamos o fluxo normal de geração
    }

    // 5. Decisão: Cache MISS (Não achou ou deu erro no query)
    const jobId = randomUUID();
    const createdAt = new Date().toISOString();

    const newJobItem = {
        id: jobId,
        userId: userId,
        prompt: cleanPrompt, // Salvamos o original no display
        promptHash: promptHash, // Salvamos o hash para futuros hits
        status: "PENDING",
        createdAt: createdAt
    };

    // Salvar no DynamoDB
    await docClient.send(new PutCommand({
        TableName: "ImageJobs",
        Item: newJobItem
    }));

    // Enviar para o SQS
    const queueUrl = process.env.AWS_SQS_QUEUE_URL;
    if (!queueUrl) throw new Error("AWS_SQS_QUEUE_URL is not defined");

    await sqsClient.send(new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
            jobId,
            prompt: cleanPrompt,
            userId
        })
    }));

    // Retorno de Processamento
    return NextResponse.json({
        success: true,
        status: "PENDING",
        jobId: jobId
    });

  } catch (error) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

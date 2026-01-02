import { SQSClient } from "@aws-sdk/client-sqs";

const region = process.env.AWS_REGION || "us-east-1";

export const sqsClient = new SQSClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

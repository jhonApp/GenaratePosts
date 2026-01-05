/* eslint-disable @typescript-eslint/no-require-imports */
const { DynamoDBClient, UpdateTableCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });

const run = async () => {
  try {
    const data = await client.send(
      new UpdateTableCommand({
        TableName: "ImageJobs",
        AttributeDefinitions: [
          { AttributeName: "promptHash", AttributeType: "S" },
        ],
        GlobalSecondaryIndexUpdates: [
            {
                Create: {
                    IndexName: "PromptHashIndex",
                    KeySchema: [
                        { AttributeName: "promptHash", KeyType: "HASH" } // Partition Key
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    // For On-Demand capacity (PAY_PER_REQUEST), ProvisionedThroughput is not strictly required 
                    // but often needed by the SDK types or if the table is provisioned. 
                    // Safest to omit for On-Demand tables, or set generic low values if using Provisioned.
                    // Assuming On-Demand based on "Serverless" goal. If error occurs, we might need to remove this or adjust.
                }
            }
        ]
      })
    );
    console.log("Success, table updating:", data);
  } catch (err) {
    console.error("Error", err);
  }
};

run();

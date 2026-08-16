import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { CreateVendorSchema } from "./schemas";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    // 1. Parse the request body
    const rawBody = JSON.parse(event.body ?? '{}');

    // 2. Validate against the schema
    const parseResult = CreateVendorSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors,
        }),
      };
    }

    // 3. Only proceed if validation passed
    const body = parseResult.data;
    const item = {
      vendorId: randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME!,
        Item: item,
      })
    );

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({ message: 'Vendor created', vendorId: item.vendorId }),
    };
  } catch (error) {
    console.error('Error creating vendor:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Shared CORS headers — extracted to avoid repetition
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PUT',
  };
}

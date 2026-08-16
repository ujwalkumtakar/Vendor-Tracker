import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteVendorSchema } from "./schemas";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const rawBody = JSON.parse(event.body ?? '{}');

    const parseResult = DeleteVendorSchema.safeParse(rawBody);
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

    const { vendorId } = parseResult.data;

    await docClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME!,
        Key: { vendorId },
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ message: 'Vendor deleted' }),
    };
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PUT',
  };
}

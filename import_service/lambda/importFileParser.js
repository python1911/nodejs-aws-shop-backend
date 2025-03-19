const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const csv = require("csv-parser");

const s3 = new S3Client({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });

exports.handler = async (event) => {
  console.log("🔹 Lambda triggered with event:", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;
      console.log(`📂 Processing file: s3://${bucketName}/${key}`);

      const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
      const readableStream = Body.pipe(csv());

      for await (const row of readableStream) {
        console.log("🔍 Processing row:", row);

        // Validate required fields
        if (!row.title || !row.price || !row.count) {
          console.warn(" Skipping row due to missing fields:", row);
          continue;
        }

        // Ensure correct data types
        const product = {
          title: row.title.trim(),
          price: parseFloat(row.price),
          count: parseInt(row.count),
        };

        // Validate parsing
        if (isNaN(product.price) || isNaN(product.count)) {
          console.warn(" Invalid data format, skipping row:", row);
          continue;
        }

        const sqsParams = {
          QueueUrl: process.env.SQS_URL,
          MessageBody: JSON.stringify(product),
        };

        try {
          await sqs.send(new SendMessageCommand(sqsParams));
          console.log(" Sent product to SQS:", product);
        } catch (sqsError) {
          console.error(" Failed to send message to SQS:", sqsError);
        }
      }

      console.log(" Finished processing file:", key);
    }
  } catch (error) {
    console.error(" Error processing file:", error);
  }
};

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const csv = require("csv-parser");

const s3 = new S3Client({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;
      const params = { Bucket: bucketName, Key: key };

      const { Body } = await s3.send(new GetObjectCommand(params));
      const readableStream = Body.pipe(csv());

      for await (const row of readableStream) {
        const sqsParams = {
          QueueUrl: process.env.SQS_URL,
          MessageBody: JSON.stringify(row),
        };

        await sqs.send(new SendMessageCommand(sqsParams));
        console.log("Sent product to SQS:", row);
      }
    }
  } catch (error) {
    console.error("Error processing file:", error);
  }
};

const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const csvParser = require("csv-parser");
const { Readable } = require("stream");

const s3 = new S3Client({ region: "us-east-1" });
const sqs = new SQSClient({ region: "us-east-1" });

exports.handler = async (event) => {
  try {
    console.log("Event importFileParser:", JSON.stringify(event));

    const catalogItemsQueueUrl = process.env.SQS_URL;

    if (!catalogItemsQueueUrl) {
      throw Error("Missing environment variable: SQS_URL");
    }

    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

      const getObjectResponse = await s3.send(
        new GetObjectCommand({ Bucket: bucketName, Key: key })
      );

      const fileStream = getObjectResponse.Body;

      const parsedProducts = [];
      await new Promise((resolve, reject) => {
        Readable.from(fileStream)
          .pipe(csvParser())
          .on("data", (row) => parsedProducts.push(row))
          .on("error", reject)
          .on("end", resolve);
      });

      for (const product of parsedProducts) {
        await sqs.send(
          new SendMessageCommand({
            QueueUrl: catalogItemsQueueUrl,
            MessageBody: JSON.stringify(product),
          })
        );
        console.log("Sent to SQS:", product);
      }
    }
  } catch (error) {
    console.error("Error processing file:", error);
  }
};

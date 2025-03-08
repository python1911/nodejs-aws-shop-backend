const AWS = require('aws-sdk');
const csv = require('csv-parser');
const s3 = new AWS.S3();

exports.handler = async (event) => {
  try {
    for (const record of event.Records) {
      const bucketName = record.s3.bucket.name;
      const key = record.s3.object.key;
      const params = { Bucket: bucketName, Key: key };

      const s3Stream = s3.getObject(params).createReadStream();

      s3Stream.pipe(csv())
        .on('data', (row) => {
          console.log('Parsed row:', row);
        })
        .on('end', async () => {
          console.log(`Finished processing file: ${key}`);
          // Optional: Move the file from "uploaded/" to a "parsed/" folder if desired
        });
    }
  } catch (error) {
    console.error('Error processing S3 event:', error);
  }
};

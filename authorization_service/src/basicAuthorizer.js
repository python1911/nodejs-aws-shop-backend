require('dotenv').config();

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));

  if (!event.headers || !event.headers.Authorization) {
    return generatePolicy('user', 'Deny', event.methodArn, 401);
  }

  const encodedCreds = event.headers.Authorization.split(' ')[1];
  const decodedCreds = Buffer.from(encodedCreds, 'base64').toString('utf-8');
  const [username, password] = decodedCreds.split(':');

  const storedPassword = process.env[username]; // e.g. process.env['python1911']

  if (!storedPassword || storedPassword !== password) {
    return generatePolicy(username, 'Deny', event.methodArn, 403);
  }

  return generatePolicy(username, 'Allow', event.methodArn);
};

function generatePolicy(principalId, effect, resource, statusCode = 200) {
  if (effect === 'Allow') {
    return {
      principalId,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource,
          },
        ],
      },
    };
  } else {
    return {
      statusCode,
      body: JSON.stringify({ message: 'Unauthorized' }),
    };
  }
}

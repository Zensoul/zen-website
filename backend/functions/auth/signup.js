// File: signup.js

const {
  CognitoIdentityProviderClient,
  SignUpCommand
} = require('@aws-sdk/client-cognito-identity-provider');

// ### CORS headers (unchanged)
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

// ### CHANGED: use AWS_REGION env var if available
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

module.exports.handler = async (event) => {
  // ### CHANGED: handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // ### CHANGED: unified env-var name for Cognito client ID
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,  // was process.env.CLIENT_ID
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name',  Value: name  }
      ]
    };

    await cognitoClient.send(new SignUpCommand(params));

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Signup successful. Please check your email to verify your account.'
      }),
    };
  } catch (err) {
    console.error('Signup error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: err.message || 'Internal Server Error' }),
    };
  }
};

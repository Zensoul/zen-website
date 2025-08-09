// File: functions/auth/login.js

const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
} = require('@aws-sdk/client-cognito-identity-provider');

// Expanded CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'ap-south-1'
});

module.exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }

    // Use Cognito to authenticate
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const response = await cognitoClient.send(command);
    const authResult = response.AuthenticationResult;

    if (!authResult || !authResult.IdToken) {
      throw new Error('Authentication failed');
    }

    // Return the JWT from Cognito
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        token: authResult.IdToken,
        refreshToken: authResult.RefreshToken,
        expiresIn: authResult.ExpiresIn
      })
    };
  } catch (err) {
    console.error('Login error:', err);
    const statusCode = err.name === 'NotAuthorizedException' ? 401 : 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ message: err.message || 'Internal Server Error' })
    };
  }
};

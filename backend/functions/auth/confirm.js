// File: confirm.js

const AWS = require('aws-sdk');
const cognito = new AWS.CognitoIdentityServiceProvider();

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

module.exports.handler = async (event) => {
  // ### CHANGED: Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '' 
    };
  }

  try {
    // ### UNCHANGED: parse body
    const body = JSON.parse(event.body);
    // ### UNCHANGED: destructure confirmationCode to match front-end payload
    const { email, confirmationCode } = body;

    if (!email || !confirmationCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Email and confirmation code are required.' }),
      };
    }

    // ### CHANGED: unified env var name to COGNITO_CLIENT_ID
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID, 
      Username: email,
      ConfirmationCode: confirmationCode,
    };

    await cognito.confirmSignUp(params).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'User confirmed successfully.' }),
    };
  } catch (error) {
    console.error('Confirm SignUp Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to confirm user',
        error: error.message || 'Unknown error'
      }),
    };
  }
};

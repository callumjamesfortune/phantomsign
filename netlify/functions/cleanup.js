import { schedule } from '@netlify/functions';

const API_ENDPOINT = 'https://phantomsign.com?key=YOUR_SECRET_KEY';

export const handler = schedule('*/5 * * * *', async (event, context) => {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Error: ${data.message}`);
    }

    console.log('Cleanup task triggered successfully', data);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Cleanup task triggered successfully' }),
    };
  } catch (error) {
    console.error('Error triggering cleanup task:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
});

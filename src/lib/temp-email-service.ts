import axios from 'axios';

class TempEmailService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  generateEmailId() {
    const randomChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const word = 'phantom';
    let emailId = '';
    emailId += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    for (let i = 0; i < 7; i++) {
      emailId += word[i % word.length];
      emailId += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return emailId;
  }

  async createInbox() {
    const emailId = this.generateEmailId();
    console.log("EMAIL ID: " + emailId);

    try {
      const response = await axios.post(
        `https://api.mailslurp.com/inboxes?emailAddress=${emailId}@mailslurp.net`,
        {},
        { headers: { 'x-api-key': this.apiKey } }
      );

      console.log("Response: " + JSON.stringify(response.data));

      // Extract and return the inbox ID
      const inboxId = response.data.id;
      if (!inboxId) {
        throw new Error("Failed to create inbox: Inbox ID is undefined");
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        // The request was made, and the server responded with a status code that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made, but no response was received
        console.error("Error request data:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
      }
      throw new Error(`Failed to create inbox: ${error.message}`);
    }
  }

  async getLatestEmail(inboxId: string, timeout: number) {
    try {
      const response = await axios.get(
        `https://api.mailslurp.com/inboxes/getLatestEmail?inboxId=${inboxId}&timeoutMillis=60000`,
        { headers: { 'x-api-key': this.apiKey } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        throw new Error('No email yet');
      }
      throw error;
    }
  }

  async deleteInbox(inboxId: string) {
    await axios.delete(`https://api.mailslurp.com/inboxes/${inboxId}`, {
      headers: { 'x-api-key': this.apiKey },
    });
  }
}

export default TempEmailService;

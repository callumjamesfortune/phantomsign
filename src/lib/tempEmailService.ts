import axios from 'axios';

class TempEmailService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createInbox() {
    const response = await axios.post(
      'https://api.mailslurp.com/inboxes',
      {},
      { headers: { 'x-api-key': this.apiKey } }
    );
    return response.data;
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

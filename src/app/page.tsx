'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [verificationData, setVerificationData] = useState<string | JSX.Element>('');
  const [loading, setLoading] = useState(false);

  const generateEmail = async () => {
    setLoading(true);
    setVerificationData('');
    try {
      const response = await fetch('/api/generate-inbox', {
        method: 'POST',
      });
      const data = await response.json();
      setEmail(data.emailAddress);
      pollForVerificationData(data.inboxId);
    } catch (error: any) {
      setVerificationData(`Error: ${error.message}`);
    }
  };

  const pollForVerificationData = async (inboxId: string) => {
    try {
      const response = await fetch(`/api/get-verification-data?inboxId=${inboxId}`);
      if (response.ok) {
        const data = await response.json();
        console.log(JSON.stringify(data));
        let displayContent;
        if (data.link) {
          displayContent = (
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => window.open(data.link, "_blank")}>
              Verify Link
            </button>
          );
        } else {
          displayContent = `Verification Code: ${data.code}`;
        }
        setVerificationData(displayContent);
        setLoading(false);
      } else {
        setTimeout(() => pollForVerificationData(inboxId), 2000); // Retry after 2 seconds
      }
    } catch (error: any) {
      setVerificationData(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Email Verification</h1>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={generateEmail}
        disabled={loading}
      >
        {loading ? 'Generating Email...' : 'Generate Email'}
      </button>
      {email && (
        <div
          className="mt-4 p-2 border rounded bg-white cursor-pointer"
          onClick={() => navigator.clipboard.writeText(email)}
        >
          Email Address: {email}
        </div>
      )}
      {verificationData && <div className="mt-4">{verificationData}</div>}
    </div>
  );
}

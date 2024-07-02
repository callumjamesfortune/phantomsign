'use client';

import { useState } from 'react';
import { ClipboardIcon } from '@heroicons/react/outline'; // Ensure you have Heroicons installed

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
      setLoading(false);
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
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4" onClick={() => window.open(data.link, "_blank")}>
              Verify Link
            </button>
          );
        } else {
          displayContent = (
            <div className="relative mt-4 px-4 py-2 border rounded-lg bg-gray-100 cursor-pointer text-center">
              {data.code}
              {/* <ClipboardIcon
                className="h-5 w-5 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%] cursor-pointer"
                onClick={() => navigator.clipboard.writeText(data.code)}
              /> */}
            </div>
          );
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
    <div className="relative flex flex-col min-h-screen">
      <div className='w-screen h-[300px] bg-white grid place-content-center'>
        <h1 className='text-green-600 text-[4em] font-bold'>Phantom<span className='text-gray-600'>Sign</span></h1>
      </div>

      <div className="relative flex flex-col flex-grow items-center bg-gray-200 pt-[100px]">
        <button
          className="absolute bg-blue-500 hover:bg-blue-700 text-white text-[1.5em] font-bold py-2 px-4 rounded flex items-center justify-center"
          style={{ top: '0', transform: 'translateY(-50%)' }}
          onClick={generateEmail}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-gray-200 border-t-white rounded-full" viewBox="0 0 24 24"></svg>
              Generating...
            </>
          ) : (
            'Generate Email'
          )}
        </button>

        {email && (
          <div className='flex flex-col mt-8'>
            <h2 className='text-center font-bold'>Email Address</h2>
            <div className="relative mt-4 px-4 py-2 border rounded-lg bg-gray-100 cursor-pointer">
              {email}
              <ClipboardIcon
                className="h-5 w-5 absolute top-2 right-2 cursor-pointer"
                onClick={() => navigator.clipboard.writeText(email)}
              />
            </div>
          </div>
        )}

        {verificationData}
      </div>
    </div>
  );
}

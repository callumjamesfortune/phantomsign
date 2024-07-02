'use client';

import { useState, useEffect } from 'react';
import { DocumentDuplicateIcon } from '@heroicons/react/outline'; // Ensure you have Heroicons installed

const COUNTDOWN_TIME = 120; // Countdown time in seconds (e.g., 120 seconds for 2 minutes)

export default function Home() {
  const [email, setEmail] = useState('');
  const [verificationData, setVerificationData] = useState<string | JSX.Element>('');
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loadingEmail) {
      timer = setInterval(() => {
        setCountdown(prevCountdown => {
          if (prevCountdown <= 1) {
            clearInterval(timer);
            setLoadingEmail(false);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [loadingEmail]);

  const generateEmail = async () => {
    setLoadingInbox(true);
    setVerificationData('');
    setCountdown(COUNTDOWN_TIME);
    try {
      const response = await fetch('/api/generate-inbox', {
        method: 'POST',
      });
      const data = await response.json();
      setEmail(data.emailAddress);
      setLoadingInbox(false);
      setLoadingEmail(true);
      pollForVerificationData(data.inboxId);
    } catch (error: any) {
      setVerificationData(`Error: ${error.message}`);
      setLoadingInbox(false);
      setLoadingEmail(false);
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
            <div className='flex mt-8 gap-4 items-end'>
              <span className='px-4 py-2 rounded-lg bg-gray-100 text-center font-bold self-end'>{data.company || 'No company data available'}</span>
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg self-end" onClick={() => window.open(data.link, "_blank")}>
                Verify Link
              </button>
            </div>
          );
        } else if (data.code) {
          displayContent = (
            <div className='flex mt-8 gap-4 items-end'>
              <span className='px-4 py-2 rounded-lg bg-gray-100 text-center font-bold self-end'>{data.company || 'No company data available'}</span>
              <div onClick={() => navigator.clipboard.writeText(data.code)} className="relative px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-300 hover:scale-[1.05] duration-75 cursor-pointer self-end">
                {data.code}
                <div className='p-1 rounded-lg bg-gray-100 text-gray-600 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%]'>
                  <DocumentDuplicateIcon
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => navigator.clipboard.writeText(data.code)}
                  />
                </div>
              </div>
            </div>
          );
        } else {
          displayContent = (
            <div className='flex mt-8 gap-4 items-center'>
              <span className='px-4 py-2 rounded-lg bg-gray-100 text-center font-bold'>No verification code or link found</span>
            </div>
          );
        }
        setVerificationData(displayContent);
        setLoadingEmail(false);
      } else {
        setTimeout(() => pollForVerificationData(inboxId), 2000); // Retry after 2 seconds
      }
    } catch (error: any) {
      setVerificationData(`Error: ${error.message}`);
      setLoadingEmail(false);
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen">
      <div className='w-screen h-[300px] bg-white grid place-content-center'>
        <h1 className='text-green-600 text-[4em] font-bold'>Phantom<span className='text-gray-600'>Sign</span></h1>
      </div>

      <div className="relative flex flex-col flex-grow items-center bg-gray-200 pt-[100px]">
        <button
          className="absolute bg-blue-500 hover:bg-blue-700 text-white text-[1.5em] font-bold py-2 px-4 rounded-lg flex items-center justify-center"
          style={{ top: '0', transform: 'translateY(-50%)' }}
          onClick={generateEmail}
          disabled={loadingInbox}
        >
          {loadingInbox ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-gray-200 border-t-white rounded-full" viewBox="0 0 24 24"></svg>
              Generating...
            </>
          ) : email ? (
            'Regenerate Email'
          ) : (
            'Generate Email'
          )}
        </button>

        {email && (
          <div className='flex flex-col mt-8'>
            <h2 className='text-center font-bold'>Email Address</h2>
            <div onClick={() => navigator.clipboard.writeText(email)} className="relative mt-4 px-4 py-2 border rounded-lg bg-gray-100 hover:bg-gray-300 hover:scale-[1.05] duration-75 cursor-pointer">
              {email}
              <div className='p-1 rounded-lg bg-gray-100 text-gray-600 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%]'>
                <DocumentDuplicateIcon
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => navigator.clipboard.writeText(email)}
                />
              </div>
            </div>
          </div>
        )}

        {loadingEmail && (
          <div className='flex flex-col mt-8 items-center'>
            <svg className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-gray-200 border-t-white rounded-full" viewBox="0 0 24 24"></svg>
            <p className='mt-8'>Waiting for verification email...</p>
            <p className='mt-2'>Time remaining: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p>
          </div>
        )}

        {verificationData}
      </div>
    </div>
  );
}

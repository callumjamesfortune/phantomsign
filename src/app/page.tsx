'use client';

import { useState, useEffect } from 'react';
import { DocumentDuplicateIcon, OfficeBuildingIcon, SparklesIcon } from '@heroicons/react/outline'; // Ensure you have Heroicons installed
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';
import logo from '../../public/phantom.svg';

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
      toast.success('Email generated successfully!');
    } catch (error: any) {
      setVerificationData(`Error: ${error.message}`);
      setLoadingInbox(false);
      setLoadingEmail(false);
      toast.error(`Error generating email: ${error.message}`);
    }
  };

  const pollForVerificationData = async (inboxId: string) => {
    try {
      const response = await fetch(`/api/get-verification-data?inboxId=${inboxId}`);
      if (response.ok) {
        const data = await response.json();
        let displayContent;
        const companyInfo = data.company ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-center font-bold self-end">
            <OfficeBuildingIcon className="w-5 h-5" />
            {data.company}
          </div>
        ) : (
          <span className='px-4 py-2 rounded-lg bg-red-100 text-center font-bold self-end'>Company information unavailable</span>
        );

        if (data.link) {
          displayContent = (
            <div className='flex mt-8 gap-4 items-end'>
              {companyInfo}
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg self-end" onClick={() => window.open(data.link, "_blank")}>
                Verify Link
              </button>
            </div>
          );
        } else if (data.code) {
          displayContent = (
            <div className='flex mt-8 gap-4 items-end'>
              {companyInfo}
              <div onClick={() => {
                navigator.clipboard.writeText(data.code);
                toast.success("Copied to clipboard");
                }}
                className="relative px-4 py-2 border border-gray-400 rounded-lg bg-white hover:scale-[1.05] duration-75 cursor-pointer self-end">
                {data.code}
                <div className='p-1 rounded-lg bg-white text-gray-600 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%]'>
                  <DocumentDuplicateIcon className="w-5 h-5 cursor-pointer" onClick={
                    () => {navigator.clipboard.writeText(data.code);
                    toast.success("Copied to clipboard");
                    }} />
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
      toast.error(`Error retrieving verification data: ${error.message}`);
    }
  };

  return (
    <>
      <div className="relative flex flex-col min-h-screen">
        {/* SEO FOR ME below */}
        <a href="https://seefortune.co.uk" className='hidden'/>
        <Toaster />
        <div className='w-screen h-[300px] bg-white flex flex-col items-center justify-center px-[5%] py-2'>



          <div className='absolute top-0 left-0 w-screen flex items-center justify-between px-[5%] pt-2'>

            <div>

              <Image 
                src={logo} 
                alt="PhantomSign Logo" 
                width={50} 
                height={50}
                className=''
              />
              
            </div>

            <ul className='flex gap-8 md:gap-16 text-gray-600'>
              <li><a href="#about">What is this</a></li>
              <li><a href="#instructions">How to use</a></li>
            </ul>

          </div>




          <h1 className='text-green-600 text-[2.5em] md:text-[4em] font-bold relative'>Phantom<span className='text-gray-600'>Sign</span>
            {/* <span className='opacity-90 text-gray-600 hidden md:block text-[0.3em] font-medium absolute bottom-0 right-0 transform translate-y-[30%] translate-x-[50%] rotate-[-10deg] border-4 font-bold border-red-500 text-red-500 px-4 py-2 rounded-lg'>
              F*CK SPAM
            </span> */}
          </h1>
        </div>

        <div className="relative flex flex-col flex-grow items-center bg-gray-200">
          <div className='float-animation absolute'>
            <Image 
              src={logo} 
              alt="PhantomSign Logo" 
              width={100} 
              height={100}
              className='translate-y-[-80%]'
            />
          </div>
          <button
            className="shimmery-button simple-shadow absolute text-white text-[1.5em] font-bold py-2 px-6 rounded-lg flex items-center justify-center"
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
              <span className='flex items-center'>
                Generate Email
                <SparklesIcon className="w-5 h-5 ml-4 scale-[1.2]" />
              </span>
            )}
          </button>

          {email && (
            <div className='flex flex-col mt-8'>
              {/* <h2 className='text-center font-bold'>Email Address</h2> */}
              <div onClick={() => {
                navigator.clipboard.writeText(email);
                toast.success("Copied to clipboard");
                }} className="relative text-[1em] md:text-[1.4em] mt-4 px-4 py-2 border rounded-lg bg-white border border-gray-400 hover:scale-[1.05] duration-75 cursor-pointer">
                {email}
                <div className='p-1 rounded-lg bg-white text-gray-600 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%]'>
                  <DocumentDuplicateIcon
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(email);
                      toast.success("Copied to clipboard");
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {loadingEmail && (
            <div className='flex flex-col mt-8 items-center'>
              <svg className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-gray-200 border-t-white rounded-full" viewBox="0 0 24 24"></svg>
              <p className='mt-8'>Deleting email in</p>
              <p className='mt-2 text-[2em] text-gray-600'>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p>
            </div>
          )}

          {verificationData}
        </div>
      </div>

      <div id="about" className='relative flex flex-col min-h-[50vh]'></div>

      <div id="instructions" className='relative flex flex-col min-h-[50vh] bg-gray-200'></div>

    </>
  );
}

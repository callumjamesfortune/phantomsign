'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';
import { ExternalLinkIcon, DocumentDuplicateIcon, OfficeBuildingIcon, SparklesIcon } from '@heroicons/react/outline';
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';
import logo from '../../public/phantom.svg';

const COUNTDOWN_TIME = 300; // Countdown time in seconds (e.g., 300 seconds for 5 minutes)

export default function Home() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [verificationData, setVerificationData] = useState<string | JSX.Element>('');
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
  const [emailCount, setEmailCount] = useState<number>(0);

  useEffect(() => {
    const fetchEmailCount = async () => {
      const { count, error } = await supabase
        .from('generatedEmails')
        .select('*', { count: 'exact', head: true });
      if (error) {
        console.error('Error fetching email count:', error);
      } else {
        count && setEmailCount(count);
      }
    };

    fetchEmailCount();
  }, []);

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
      const emailAddress = data.emailAddress;
  
      // Log out the received email
      console.log('Generated email:', emailAddress);
  
      if (!emailAddress) {
        throw new Error('Failed to generate email');
      }
  
      setEmail(emailAddress);
  
      setLoadingInbox(false);
      setLoadingEmail(true);
      //pollForVerificationData(data.inboxId);
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
            <div className='flex flex-col'>
              <p className='mt-8 text-center'>Email received</p>
              <div className='flex flex-col md:flex-row mt-8 gap-4 items-end'>
                {companyInfo}
                <button
                  className="w-full md:w-[auto] bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg self-end flex items-center"
                  onClick={() => window.open(data.link, "_blank")}
                >
                  Verify Link
                  <ExternalLinkIcon className="w-5 h-5 ml-2" />
                </button>
              </div>
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
      <div className="relative flex flex-col min-h-[100svh]">
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
                className=']'
              />
            </div>
            <ul className='flex pr-2 md:pr-[auto] gap-8 md:gap-16 text-gray-600 font-bold'>
              <li><a href="#about">What is this</a></li>
              <li><a href="#instructions">How to use</a></li>
            </ul>
          </div>
          <h1 className='text-green-600 text-[2.5em] md:text-[4em] font-bold relative'>Phantom<span className='text-gray-600'>Sign</span>
          </h1>
        </div>
        <div className="relative flex flex-col items-center bg-gray-200 flex-grow">

          <div className='absolute'>
            <div className='w-full flex justify-center float-animation absolute -translate-y-[50%] -top-[80px]'>
              <Image 
                src={logo} 
                alt="PhantomSign Logo" 
                width={100} 
                height={100}
                className=''
              />
            </div>
            <button
              className="shimmery-button z-[1000] simple-shadow absolute -translate-y-[50%] text-white text-[1.5em] font-bold py-2 px-6 rounded-lg flex items-center justify-center"
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
          </div>

          <div className='relative w-full flex-grow flex flex-col items-center justify-center'>

            <div className='w-full flex flex-col items-center'>
              {!email && !loadingInbox && (
                <></>
              )}

              {!email && !loadingInbox && emailCount > 0 && (
                <div className='flex flex-col md:flex-row gap-12 py-12 pb-8'>

                  <div className='flex flex-col items-center bg-white rounded-lg simple-shadow p-4 w-[180px]' style={{ aspectRatio: 1 }}>
                    <h2 className='text-[1em]'>Codes found</h2>
                    <h2 className='text-[4em] text-gray-600'>{emailCount}</h2>
                  </div>

                  <div className='flex flex-col items-center bg-white rounded-lg simple-shadow p-4 w-[180px]' style={{ aspectRatio: 1, transform: 'scale(1.2)' }}>
                    <h2 className='text-[1em]'>Emails generated</h2>
                    <h2 className='text-[4em] text-gray-600'>{emailCount}</h2>
                  </div>

                  <div className='flex flex-col items-center bg-white rounded-lg simple-shadow p-4 w-[180px]' style={{ aspectRatio: 1 }}>
                    <h2 className='text-[1em]'>Links found</h2>
                    <h2 className='text-[2em] md:text-[4em] text-gray-600'>{emailCount}</h2>
                  </div>

                </div>
              )}

              {email && (
                <div className='flex flex-col'>
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
                <div className='flex flex-col items-center mt-6'>
                  <svg className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full" viewBox="0 0 24 24"></svg>
                  <p className='mt-8'>Deleting email in</p>
                  <p className='mt-2 text-[2em] text-gray-600'>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</p>
                </div>
              )}

              {verificationData}
            </div>
          </div>
        </div>
      </div>

      <div className='flex flex-col md:flex-row justify-center items-start gap-8 px-[5%] pt-8'>
        <div id="about" className='relative flex flex-col p-6 bg-white rounded-lg shadow-lg w-full md:w-[45%] text-center'>
          <h1 className='text-[1.5em] font-bold mb-6'>What is PhantomSign?</h1>
          <p className='text-gray-600'>
            PhantomSign is your digital ally against spam and unwanted emails! 
            It creates secret email addresses that self-destruct after a set 
            time, keeping your main inbox clean. Use PhantomSign&apos;s temporary 
            addresses for sign-ups to hide your personal email from prying eyes 
            and pesky marketers. Plus, PhantomSign automatically extracts verification 
            codes or links from emails, saving you time. With a sprinkle of magic and a 
            dash of phantom stealth, PhantomSign keeps your online presence secure and 
            your inbox sparkling. Welcome to the future of email privacy!
          </p>
        </div>

        <div id="instructions" className='relative flex flex-col p-6 bg-white rounded-lg shadow-lg w-full md:w-[45%] text-center'>
          <h1 className='text-[1.5em] font-bold mb-6'>How does it work?</h1>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 font-bold">
                1
              </div>
              <p className='text-gray-600'>Click the &quot;Generate Email&quot; button to create a temporary email address.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 font-bold">
                2
              </div>
              <p className='text-gray-600'>Use this temporary email address for any online sign-ups or verifications.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 font-bold">
                3
              </div>
              <p className='text-gray-600'>PhantomSign monitors the inbox and automatically extracts verification codes or links from incoming emails, displaying them on the screen.</p>
            </div>
          </div>
        </div>
      </div>
      <footer className='bg-gray-200 text-gray-600 py-8 mt-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='text-center md:text-left'>
              <p>&copy; 2024 PhantomSign. All rights reserved.</p>
            </div>
            <div className='flex gap-4 mt-4 md:mt-0'>
              {/* <a href="#" className='hover:text-gray-400'>Privacy Policy</a>
              <a href="#" className='hover:text-gray-400'>Terms of Service</a>
              <a href="#" className='hover:text-gray-400'>Contact Us</a> */}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

// Home.tsx
'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect, useRef } from 'react';
import { ExternalLinkIcon, DocumentDuplicateIcon, OfficeBuildingIcon, SparklesIcon, BellIcon } from '@heroicons/react/outline';
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';
import logo from '../../public/phantom.svg';
import NotificationModal from './notificationModal';

const COUNTDOWN_TIME = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES!, 10) * 60 || 300; // Default to 300 seconds (5 minutes)
const POLLING_INTERVAL = 5000; // 5 seconds

interface EmailStats {
  generatedEmailsCount: number | null;
  codesFoundCount: number | null;
  linksFoundCount: number | null;
}

export default function Home() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState<string>('');
  const [verificationData, setVerificationData] = useState<string | JSX.Element>('');
  const [loadingInbox, setLoadingInbox] = useState<boolean>(false);
  const [loadingEmail, setLoadingEmail] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_TIME);
  const [emailStats, setEmailStats] = useState<EmailStats>({
    generatedEmailsCount: null,
    codesFoundCount: null,
    linksFoundCount: null,
  });
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const currentEmailRef = useRef<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchEmailStats = async () => {
      const { data, error } = await supabase
        .from('email_statistics')
        .select('generated_emails_count, codes_found_count, links_found_count')
        .eq('id', 1)
        .single();
      if (error) {
        console.error('Error fetching email stats:', error);
      } else {
        setEmailStats({
          generatedEmailsCount: data.generated_emails_count,
          codesFoundCount: data.codes_found_count,
          linksFoundCount: data.links_found_count,
        });
      }
    };

    fetchEmailStats();
  }, [supabase]);

  useEffect(() => {
    const updateCountdown = () => {
      if (endTimeRef.current !== null) {
        const remainingTime = Math.max(0, endTimeRef.current - Date.now());
        setCountdown(Math.floor(remainingTime / 1000));
        if (remainingTime <= 0) {
          if (currentEmailRef.current) deleteInbox(currentEmailRef.current);
          setLoadingEmail(false);
          window.location.reload();
        } else {
          requestAnimationFrame(updateCountdown);
        }
      }
    };

    if (loadingEmail) {
      endTimeRef.current = Date.now() + countdown * 1000;
      requestAnimationFrame(updateCountdown);
    }

    return () => {
      endTimeRef.current = null;
    };
  }, [loadingEmail]);

  useEffect(() => {
    const checkNotificationPermission = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        setIsNotificationEnabled(true);
      }
    };

    checkNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);

          const sw = await navigator.serviceWorker.ready;
          const subscription = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
          });

          await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ subscription }),
          });

          console.log('Push subscription successful:', subscription);
          setIsNotificationEnabled(true);
          setShowModal(false);
        } catch (error) {
          console.error('Push subscription error:', error);
        }
      }
    }
  };

  const deleteInbox = async (emailAddress: string) => {
    try {
      await fetch('/api/delete-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress }),
      });
      console.log(`Inbox for ${emailAddress} deleted.`);
    } catch (error: any) {
      console.error(`Error deleting inbox for ${emailAddress}:`, error.message);
    }
  };

  useEffect(() => {
    const poll = async () => {
      if (!currentEmailRef.current || !loadingEmail) {
        console.log('No current email to poll for or polling stopped.');
        return;
      }

      console.log(`Polling for email in inbox: ${currentEmailRef.current}`);
      try {
        const response = await fetch(`/api/get-verification-data?inboxId=${currentEmailRef.current}`);
        if (response.ok) {
          const data = await response.json();
          if (data.message === 'No email yet' || data.message === 'No email content found') {
            console.log(data.message);
            return;
          }

          if (data) {
            console.log('Data found:', data);
            let displayContent;
            const companyInfo = data.company ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-center font-bold">
                <OfficeBuildingIcon className="w-5 h-5" />
                {data.company}
              </div>
            ) : (
              <span className='px-4 py-2 rounded-lg bg-red-100 text-center font-bold'>Company information unavailable</span>
            );

            if (data.link) {
              displayContent = (
                <div className='flex flex-col justify-center'>
                  <p className='mt-8 text-center'>Email received</p>
                  <div className='flex flex-col md:flex-row mt-8 gap-4 items-center'>
                    {companyInfo}
                    <button
                      className="w-full md:w-[auto] bg-blue-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center"
                      onClick={() => window.open(data.link, '_blank')}
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
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(data.code);
                      toast.success('Copied to clipboard');
                    }}
                    className="relative px-4 py-2 border border-gray-400 rounded-lg bg-white hover:scale-[1.05] duration-75 cursor-pointer"
                  >
                    {data.code}
                    <div className='p-1 rounded-lg bg-white text-gray-600 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%]'>
                      <DocumentDuplicateIcon
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(data.code);
                          toast.success('Copied to clipboard');
                        }}
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
            deleteInbox(currentEmailRef.current!);
            setLoadingEmail(false);

            if ('Notification' in window && 'serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                console.log("SHOULD SEND HERE")
                registration.showNotification('New Email Received', {
                  body: 'We received an email to your temporary address.',
                  icon: '/phantom.svg',
                });
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Error retrieving verification data:', error.message);
        setVerificationData(`Error: ${error.message}`);
        setLoadingEmail(false);
        toast.error(`Error retrieving verification data: ${error.message}`);
      }
    };

    const startPolling = () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }

      const pollingLoop = async () => {
        if (!currentEmailRef.current || !loadingEmail) {
          return;
        }
        await poll();
        pollingTimeoutRef.current = setTimeout(pollingLoop, POLLING_INTERVAL);
      };

      pollingLoop();
    };

    startPolling();

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [email, loadingEmail]);

  const generateEmail = async () => {
    console.log('Generating email...');
    setLoadingInbox(true);
    setVerificationData('');
    setCountdown(COUNTDOWN_TIME);
    try {
      const response = await fetch('/api/generate-inbox', {
        method: 'GET',
      });
      const data = await response.json();
      const emailAddress = data.emailAddress;

      console.log('Generated email:', emailAddress);

      if (!emailAddress) {
        throw new Error('Failed to generate email');
      }

      setEmail(emailAddress);
      currentEmailRef.current = emailAddress;
      setLoadingInbox(false);
      setLoadingEmail(true);
      toast.success('Email generated successfully!');
    } catch (error: any) {
      console.error('Error generating email:', error.message);
      setVerificationData(`Error: ${error.message}`);
      setLoadingInbox(false);
      setLoadingEmail(false);
      toast.error(`Error generating email: ${error.message}`);
    }
  };

  return (
    <>
      {showModal && (
        <NotificationModal
          onEnable={requestNotificationPermission}
          onClose={() => setShowModal(false)}
        />
      )}
      <div className="relative flex flex-col min-h-[100svh]">
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
            <ul className='flex md:pr-[auto] gap-8 md:gap-16 text-gray-600 font-bold'>
              <li><a href="#about">What is this</a></li>
              <li><a href="#instructions">How to use</a></li>
            </ul>
            {!isNotificationEnabled && (
              <button
                className="bg-gray-200 text-gray-600 text-[1em] font-bold py-2 px-2 rounded-lg flex items-center justify-center"
                onClick={() => setShowModal(true)}
              >
                <BellIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          <h1 className='text-green-600 text-[2.5em] md:text-[4em] font-bold relative'>Phantom<span className='text-gray-600'>Sign</span></h1>
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
              {!email && !loadingInbox && (
                <div className='flex flex-col md:flex-row gap-12 py-12 pb-8'>
                  <div className='flex flex-col items-center bg-white rounded-lg simple-shadow p-4 w-[180px]' style={{ aspectRatio: 1 }}>
                    <h2 className='text-[1em]'>Codes found</h2>
                    {emailStats.codesFoundCount === null ? (
                      <svg className="animate-spin h-10 w-10 my-8 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full" viewBox="0 0 24 24"></svg>
                    ) : (
                      <h2 className='text-[4em] text-gray-600'>{emailStats.codesFoundCount}</h2>
                    )}
                  </div>
                  <div className='flex flex-col items-center bg-white rounded-lg simple-shadow p-4 w-[180px]' style={{ aspectRatio: 1, transform: 'scale(1.2)' }}>
                    <h2 className='text-[1em]'>Emails generated</h2>
                    {emailStats.generatedEmailsCount === null ? (
                      <svg className="animate-spin h-10 w-10 my-8 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full" viewBox="0 0 24 24"></svg>
                    ) : (
                      <h2 className='text-[4em] text-gray-600'>{emailStats.generatedEmailsCount}</h2>
                    )}
                  </div>
                  <div className='flex flex-col items-center bg-white rounded-lg simple-shadow p-4 w-[180px]' style={{ aspectRatio: 1 }}>
                    <h2 className='text-[1em]'>Links found</h2>
                    {emailStats.linksFoundCount === null ? (
                      <svg className="animate-spin h-10 w-10 my-8 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full" viewBox="0 0 24 24"></svg>
                    ) : (
                      <h2 className='text-[4em] md:text-[4em] text-gray-600'>{emailStats.linksFoundCount}</h2>
                    )}
                  </div>
                </div>
              )}
              {email && (
                <div className='flex flex-col'>
                  <div onClick={() => {
                    navigator.clipboard.writeText(email);
                    toast.success("Copied to clipboard");
                    }} className="relative text-[1em] md:text-[1.4em] mt-4 px-4 py-2 border rounded-lg bg-white border border-gray-400 hover:scale-[1.05] duration-75 cursor-pointer self-end">
                    {email}
                    <div className='p-1 rounded-lg bg-white text-gray-600 absolute top-0 right-0 translate-y-[-50%] translate-x-[50%]'>
                      <DocumentDuplicateIcon
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(email);
                          toast.success('Copied to clipboard');
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
        <div id="about" className='relative flex flex-col p-6 bg-white rounded-lg w-full md:w-[45%] text-center'>
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
        <div id="instructions" className='relative flex flex-col p-6 bg-white rounded-lg w-full md:w-[45%] text-center'>
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
              {/* <a href="#" class='hover:text-gray-400'>Privacy Policy</a>
              <a href="#" class='hover:text-gray-400'>Terms of Service</a>
              <a href="#" class='hover:text-gray-400'>Contact Us</a> */}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

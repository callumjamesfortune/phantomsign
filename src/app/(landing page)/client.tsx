"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { CheckIcon } from "@heroicons/react/outline";
import Image from "next/image";
import logo from "../../../public/phantom.svg";
import { Toaster, toast } from "react-hot-toast";
import Link from "next/link";
import NotificationModal from "../notificationModal";
import Footer from "../components/footer";
import Confetti from 'react-confetti';
import { Metadata } from "next";
import { IoReload, IoCopyOutline } from "react-icons/io5";
import { RxOpenInNewWindow } from "react-icons/rx"
import { BiCopy } from "react-icons/bi"
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const metadata: Metadata = {
  title: "PhantomSign | Throwaway emails",
  description: "AI powered throwaway email addresses. Perfect for sign-up forms and quick verifications.",
};

interface EmailStats {
  generated_inboxes_count: number | null;
  codes_found_count: number | null;
  links_found_count: number | null;
}

interface LandingClientProps {
  user: User | null;
  emailStats: EmailStats | null;
  inboxFromCookie: string | null;
}

export default function LandingClient({ user, emailStats, inboxFromCookie }: LandingClientProps) {
  const COUNTDOWN_TIME = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES!, 10) * 60 || 300; // Default to 300 seconds (5 minutes)
  const POLLING_INTERVAL = 5000; // 5 seconds

  const [email, setEmail] = useState<string>("");
  const [verificationData, setVerificationData] = useState<string | JSX.Element | null>("");
  const [loadingInbox, setLoadingInbox] = useState<boolean>(false);
  const [loadingEmail, setLoadingEmail] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_TIME);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const currentEmailRef = useRef<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [confettiOpacity, setConfettiOpacity] = useState<number>(1);

  useEffect(() => {

    window.scrollTo(0,0);

    if (showConfetti) {
      const timeout = setTimeout(() => {
        setConfettiOpacity(0); // Start fading after 5 seconds
        setTimeout(() => {
          setShowConfetti(false); // Remove confetti after fade-out
          setConfettiOpacity(1); // Reset opacity for future uses
        }, 1000); // Duration of the fade-out effect
      }, 5000); // Display confetti for 5 seconds before fading

      return () => clearTimeout(timeout);
    }
  }, [showConfetti]);

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
      if ("Notification" in window && Notification.permission === "granted") {
        setIsNotificationEnabled(true);
      }
    };

    checkNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");

          const sw = await navigator.serviceWorker.ready;
          const subscription = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
          });

          await fetch("/api/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ subscription }),
          });

          setIsNotificationEnabled(true);
          setShowModal(false);
        } catch (error) {
          console.error("Push subscription error:", error);
        }
      }
    }
  };

  const deleteInbox = async (inbox: string) => {
    try {
      await fetch("/api/delete-inbox", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inbox }),
      });
    } catch (error: any) {
      console.error(`Error deleting inbox for ${inbox}:`, error.message);
    }
  };

  useEffect(() => {
    const poll = async () => {
      if (!currentEmailRef.current || !loadingEmail) {
        return;
      }

      try {
        const response = await fetch(
          `/api/poll-inbox?inbox=${currentEmailRef.current}`,
          { cache: "no-store" }
        );
        if (response.ok) {
          const data = await response.json();
          if (data.length === 0) {
        return;
          }

          const emailData = JSON.parse(data[0].processed_email);

          let displayContent;
          if (emailData.isVerificationEmail && emailData.verificationData) {
        displayContent = (
          <div className="flex flex-col text-left p-4">
            <h1 className="w-full flex justify-between">
          <span className="font-bold">From: {emailData.sender}</span>
          <a href={`/view-email?emailId=${data[0].id}`} className="underline text-gray-600">View full email</a>
            </h1>
            <h2 className="w-full text-gray-600 mb-4">Subject: {emailData.subject}</h2>
            
            {emailData.verificationData.type === "code" && (
          <div className="cursor-pointer bg-gray-200 px-4 py-1 rounded-md self-start flex gap-2 items-center" onClick={() => {
            navigator.clipboard.writeText(emailData.verificationData.value);
            toast.success("Copied to clipboard");
          }}>
            {emailData.verificationData.value} <BiCopy />
          </div>
            )}

            {emailData.verificationData.type === "link" && (
          <a href={emailData.verificationData.value} target="_blank" className="bg-gray-200 px-4 py-1 rounded-md self-start flex gap-2 items-center">
            Verify link <RxOpenInNewWindow />
          </a>
            )}
          </div>
        );
          } else {
        displayContent = (
          <div className="flex flex-col text-left p-4">
            <h1 className="w-full flex justify-between">
          <span className="font-bold">From: {emailData.sender}</span>
          <a href={`/view-email?emailId=${data[0].id}`} className="underline text-gray-600">View full email</a>
            </h1>
            <h2 className="w-full text-gray-600 mb-4">Subject: {emailData.subject}</h2>
            <p dangerouslySetInnerHTML={{ __html: emailData.body }}></p>
          </div>
        );
          }

          setVerificationData(displayContent);
          setLoadingEmail(false);

          if ("Notification" in window && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("New Email Received", {
            body: "We received an email to your temporary address.",
            icon: "/phantom.svg",
          });
        });
          }

          // Show confetti when verification data is found
          // setShowConfetti(true);
          // setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
        } else if (response.status === 404) {
          console.error("Inbox not found");
          let displayContent = (
        <div className="flex mt-8 gap-4 items-center">
          <span className="px-4 py-2 rounded-md bg-red-600 text-center font-bold text-white">
            Something went wrong
          </span>
        </div>
          );
          setVerificationData(displayContent);
          setLoadingEmail(false);
          toast.error("Inbox not found");
        }
      } catch (error: any) {
        let displayContent = (
          <div className="flex gap-4 items-center">
        <span className="px-4 py-2 rounded-md bg-red-600 text-center font-bold text-white">
          Something went wrong
        </span>
          </div>
        );
        setVerificationData(displayContent);
      }

      setLoadingEmail(false);

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

  useEffect(() => {

    if(inboxFromCookie) {

      let expiry = JSON.parse(inboxFromCookie).expiry;
      let inbox = JSON.parse(inboxFromCookie).inbox;

      if(expiry > (Date.now() / 1000)) {

        setEmail(inbox);
        currentEmailRef.current = inbox;
        setLoadingInbox(false);
        setLoadingEmail(true);
        setCountdown(expiry - (Date.now()/1000)); // Reset the countdown timer
        endTimeRef.current = (expiry * 1000); // Update the end time reference

      } else {

        generateEmail();

      }

    } else {
      generateEmail();
    }

  }, [])

  const generateEmail = async () => {
    setLoadingInbox(true);
    setVerificationData("");

    try {
      const response = await fetch("/api/generate-inbox", {
        method: "POST",
        cache: "no-store",
      });
      const data = await response.json();
      const emailAddress = data.inbox;


      if (!emailAddress) {
        throw new Error("Failed to generate email");
      }

      setEmail(emailAddress);
      currentEmailRef.current = emailAddress;
      setLoadingInbox(false);
      setLoadingEmail(true);
      setCountdown(COUNTDOWN_TIME); // Reset the countdown timer
      endTimeRef.current = Date.now() + (COUNTDOWN_TIME+1) * 1000; // Update the end time reference
      toast.success("Inbox created!");
    } catch (error: any) {
      console.error("Error generating inbox:", error.message);
      setVerificationData(`Error: ${error.message}`);
      setLoadingInbox(false);
      setLoadingEmail(false);
      toast.error(`Error generating email: ${error.message}`);
    }
  };

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

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
        <div className="w-screen h-[350px] bg-white flex flex-col items-center justify-center px-[5%] py-2">
          <div className="absolute top-0 left-0 w-screen flex items-center justify-between px-[5%] pt-2">
            <div className="flex items-center gap-4 text-gray-600 font-bold">
              <Image
                src={logo}
                alt="PhantomSign Logo"
                width={50}
                height={50}
                className=""
              />
              <span className="hidden md:block">{user?.email}</span>
            </div>
            <ul className="flex items-center md:pr-[auto] gap-6 md:gap-12 text-gray-600 font-bold">
              <li>
                <span className="cursor-pointer" onClick={() => {document.getElementById("about")?.scrollIntoView()}}>About</span>
              </li>
              <li>
                <span className="cursor-pointer" onClick={() => {document.getElementById("api")?.scrollIntoView()}}>API</span>
              </li>
              <Link
                className="bg-gray-700 border border-black text-white px-4 py-2 rounded-md"
                href="/dashboard/keys"
              >
                Developers
              </Link>
            </ul>
          </div>
          <h1 className="text-green-600 text-[2.5em] md:text-[4em] font-bold relative">
            Phantom<span className="text-gray-600">Sign</span>
          </h1>

          <h3 className="flex gap-4">
            <span className="flex gap-4 text-gray-600"><CheckIcon className="w-[20px] text-green-600"/>{emailStats?.generated_inboxes_count} inboxes created</span>
            <span className="flex gap-4 text-gray-600"><CheckIcon className="w-[20px] text-green-600"/>{(emailStats?.codes_found_count || 0) + (emailStats?.links_found_count || 0)} codes found</span>
          </h3>
        </div>
        <div className="relative flex flex-col items-center bg-gray-100 px-[5%] border-t border-b border-gray-300 flex-grow">
          <div className="absolute w-full">
            <div className="w-full flex justify-center float-animation absolute -translate-y-[50%] -top-[80px]">
              <Image
                src={logo}
                alt="PhantomSign Logo"
                width={100}
                height={100}
                className=""
              />
            </div>
              <div
                className="z-[1000] absolute left-[50%] -translate-y-[50%] -translate-x-[50%] flex gap-4 items-stretch text-[1.1em] md:text-[1.4em] rounded-md cursor-pointer self-end"
              >
                <button className="hidden md:block px-3 py-2 bg-green-600 border border-green-700 text-white flex items-center justify-center rounded-md duration-75 hover:scale-[1.05]" onClick={generateEmail}><IoReload className="w-[30px]"/></button>
                <div className="px-4 py-2 border border-gray-400 bg-white rounded-md duration-75 hover:scale-[1.05]" onClick={() => {
                  navigator.clipboard.writeText(email);
                  toast.success("Copied to clipboard");
                }}>{email || "Generating..."}</div>

                <div className="px-3 py-2 bg-gray-700 border border-black text-white flex items-center justify-center rounded-md duration-75 hover:scale-[1.05]" onClick={() => {
                  navigator.clipboard.writeText(email);
                  toast.success("Copied to clipboard");
                }}><IoCopyOutline className="w-[30px]"/></div>
              </div>
          </div>
          <div className="relative w-full flex-grow flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">

              <div className="w-full flex flex-col-reverse md:flex-row justify-center gap-16 py-[60px] md:py-[auto]">

                <div className="w-full md:w-1/2">
      
                    <div className="flex flex-col items-center bg-white border border-gray-400 rounded-md">

                    <div className="w-full p-4 bg-gray-200 rounded-t-md flex justify-between">
                      <span>Inbox <span className="text-gray-600">&lt;{email || ""}&gt;</span></span>
                      <span className="tabular-nums">
                          {Math.floor(countdown / 60)}:
                          {String(countdown % 60).padStart(2, "0")}
                      </span>
                    </div>


                    {loadingEmail ? (<div className="w-full p-8 flex flex-col items-center">
                      
                      <svg
                        className="animate-spin h-8 w-8 mr-3 border-4 border-t-4 border-gray-200 border-t-gray-400 rounded-full"
                        viewBox="0 0 24 24"
                      ></svg>
                      
                      <p className="mt-8 text-[1em] text-gray-600">Awaiting a verification email...</p>
                      

                    </div>
                    ) :
                    <div className="w-full">{verificationData}</div>
                    }

                    </div>

                  </div>

              </div>




            </div>
          </div>
        </div>
      </div>
      <div
        id="about"
        className="bg-white flex flex-col w-full gap-8 px-[5%] py-8"
      >
        <div className="w-full flex items-center">
          <div className="w-full md:w-1/2 items-center bg-white rounded-md p-4 text-right">
            <h2 className="text-[1.5em] mb-2">Generate an email</h2>

            <p>
              PhantomSign will create a temporary email address that is valid
              for up to 5 minutes.
            </p>
          </div>
          <h1 className="text-gray-200 px-8 text-[4em]">1</h1>
        </div>

        <div className="w-full flex items-center justify-end">
          <h1 className="text-gray-200 px-8 text-[4em]">2</h1>
          <div className="w-full md:w-1/2 items-center bg-white rounded-md p-4">
            <h2 className="text-[1.5em] mb-2">Use it for signups</h2>

            <p>
              The PhantomSign email can be used to signup to a service of your
              choice that may require the email to be verified.
            </p>
          </div>
        </div>

        <div className="w-full flex items-center">
          <div className="w-full md:w-1/2 items-center bg-white rounded-md p-4 text-right">
            <h2 className="text-[1.5em] mb-2">Receive code or link</h2>

            <p>
              PhantomSign will try to extract the verification code or link from
              the verification email and output it straight to your screen.
            </p>

          </div>
          <h1 className="text-gray-200 px-8 text-[4em]">3</h1>
        </div>
      </div>

      <div
        id="api"
        className="bg-gray-100 border-t border-gray-300 min-h-screen w-full flex flex-col gap-8 px-[5%] py-8"
      >
        <div className="relative flex flex-col items-center p-6 w-full text-center text-black">

          <h1 className="text-[2.5em] md:text-[4em] font-bold mb-6">
            PhantomSign API
          </h1>
          <p className="text-black text-[1.2em] mb-8">
            PhantomSign offers a simple and effective API to extract
            verification codes and links from temporary email addresses.
          </p>

          <p className="text-black mb-8">
            All API requests require a valid API key, which should be provided as a header:
          </p>

          <p className="text-black mb-8">
            All endpoints are rate-limited to 20 requests/minute per IP
          </p>

          <div className="w-full flex flex-col md:flex-row items-center gap-4 justify-center mb-16">

            <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
              <span className="text-gray-600">x-api-key</span>
              <span>[API KEY]</span>
            </code>

            <Link
                className="bg-black text-white px-4 py-2 rounded-md"
                href="/dashboard/keys"
            >
              Generate an API key
            </Link>

          </div>

          <div className="w-full flex gap-8 flex-col md:flex-row">

            <div className="w-full md:w-1/3 flex flex-col gap-2">

              <h1 className="text-[1.4em] font-bold mb-4">Create inbox</h1>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">POST</span>
                <span>/api/generate-inbox</span>
              </code>

              <h2 className="font-bold">Responses</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;inbox&quot;: [email]</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">401</span>
                <span>&quot;error&quot;: [API key error]</span>
              </code>

            </div>

            <div className="w-full md:w-1/3 flex flex-col gap-2">

              <h1 className="text-[1.4em] font-bold mb-4">Poll inbox</h1>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-yellow-600">GET</span>
                <span>/api/poll-inbox?inbox=[email]</span>
              </code>

              <h2 className="font-bold">Responses</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;message&quot;: &quot;Awaiting email&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <div className="flex flex-col items-start">
                  <span>&#123;</span>
                  <span>&quot;code&quot;: [Verification code]</span>
                  <span>&quot;company&quot;: [Company name]</span>
                  <span>&#125;</span>
                </div>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <div className="flex flex-col items-start">
                  <span>&#123;</span>
                  <span>&quot;link&quot;: [Verification link]</span>
                  <span>&quot;company&quot;: [Company name]</span>
                  <span>&#125;</span>
                </div>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;message&quot;: &quot;Email lacks content&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">400</span>
                <span>&quot;error&quot;: &quot;No inbox provided&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">401</span>
                <span>&quot;error&quot;: [API key error]</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">404</span>
                <span>&quot;error&quot;: &quot;Inbox not found&quot;</span>
              </code>
              
            </div>

            <div className="w-full md:w-1/3 flex flex-col gap-2">

              <h1 className="text-[1.4em] font-bold mb-4">Delete inbox</h1>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">DELETE</span>
                <span>/api/delete-inbox</span>
              </code>

              <h2 className="font-bold">Request</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">Body</span>
                <span>&#123;&quot;inbox&quot;: [email]&#125;</span>
              </code>

              <h2 className="font-bold">Responses</h2>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-green-600">200</span>
                <span>&quot;message&quot;: &quot;Inbox deleted&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">400</span>
                <span>&quot;error&quot;: &quot;No inbox provided&quot;</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">403</span>
                <span>&quot;error&quot;: [API key error]</span>
              </code>

              <code className="bg-white flex gap-4 rounded-md border border-gray-400 px-4 py-2">
                <span className="text-red-600">404</span>
                <span>&quot;error&quot;: &quot;Inbox not found&quot;</span>
              </code>
              
            </div>

          </div>

          
        </div>
      </div>
      <Footer />
      {showConfetti && <Confetti
        numberOfPieces={500}
        recycle={false}
        style={{ width: "100vw", opacity: confettiOpacity, transition: "opacity 2s" }} // Add transition for fading effect
      />}
    </>
  );
}

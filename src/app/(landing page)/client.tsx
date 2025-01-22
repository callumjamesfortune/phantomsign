"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import logo from "../../../public/phantom.svg";
import { Toaster, toast } from "react-hot-toast";
import Link from "next/link";
import Footer from "../components/footer";
import { Metadata } from "next";
import { IoReload, IoCopyOutline } from "react-icons/io5";
import { RxOpenInNewWindow } from "react-icons/rx"
import { BiCopy } from "react-icons/bi"
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import * as Switch from "@radix-ui/react-switch";
import About from "./about";
import Api from "./api";
import { LandingClientProps } from "../types";

export const metadata: Metadata = {
  title: "PhantomSign | Throwaway emails",
  description: "AI powered throwaway email addresses. Perfect for sign-up forms and quick verifications.",
};

export default function LandingClient({ user, emailStats, inboxFromCookie }: LandingClientProps) {
  const COUNTDOWN_TIME = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES!, 10) * 60 || 300; // Default to 300 seconds (5 minutes)
  const POLLING_INTERVAL = 5000; // 2.5 seconds

  const [email, setEmail] = useState<string>("");
  const [verificationData, setVerificationData] = useState<string | JSX.Element | null>("");
  const [loadingEmail, setLoadingEmail] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(COUNTDOWN_TIME);
  const currentEmailRef = useRef<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const [isCountFinished, setIsCountFinished] = useState(false);
  const [deleteAfter, setDeleteAfter] = useState<boolean>(true);

  useEffect(() => {
    const updateCountdown = () => {
      if (endTimeRef.current !== null) {
        const remainingTime = Math.max(0, endTimeRef.current - Date.now());
        setCountdown(Math.floor(remainingTime / 1000));
        if (remainingTime <= 0 && deleteAfter != false) {
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

  const deleteInbox = async (inbox: string) => {
    try {
      await fetch(`/api/delete-inbox?$inbox=${inbox}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      });
    } catch (error: any) {
      console.error(`Error deleting inbox for ${inbox}:`, error.message);
    }
  };

  const ErrorTab = ({message}: {message: string}) => {

    const clearCookiesAndReload = () => {

      document.cookie = "phantomsign-inbox=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.reload();

    }


    return (
      <div className="w-full h-full flex flex-col gap-4 items-center justify-center py-8">
        <span className="px-4 py-2 rounded-md bg-red-600 text-center font-bold text-white">
          {message}
        </span>

        <button className="px-4 py-2 rounded-md text-gray-400 underline" onClick={clearCookiesAndReload}>Generate new inbox</button>
      </div>
    )
  }

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
          if (data.message && data.message === "Awaiting email" || data.length === 0) {
        return;
          }

          const emailData = JSON.parse(data[0].processed_email);
          const emailId = data[0].id;

          let displayContent;
          if (emailData.isVerificationEmail && emailData.verificationData) {
        displayContent = (
          <div className="flex flex-col text-left p-4">
            <h1 className="w-full flex justify-between">
          <span className="font-bold">From: {emailData.company || emailData.sender}</span>
          <a href={`/view-email?emailId=${emailId}`} className="underline text-gray-600">View full email</a>
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
          <a href={emailData.verificationData.value} target="_blank" className="bg-green-600 text-white px-4 py-1 rounded-md self-start flex gap-2 items-center">
            Verify link <RxOpenInNewWindow />
          </a>
            )}
          </div>
        );
          } else {
        displayContent = (
          <div className="flex flex-col text-left p-4">
            <h1 className="w-full flex justify-between">
          <span className="font-bold">From: {emailData.company || emailData.sender}</span>
          <a href={`/view-email?emailId=${emailId}`} className="underline text-gray-600">View full email</a>
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
            <ErrorTab message="Inbox not found" />
            // <div className="w-full h-full flex gap-4 items-center justify-center py-8">
            //   <span className="px-4 py-2 rounded-md bg-red-600 text-center font-bold text-white">
            //     Inbox not found
            //   </span>
            // </div>
          );
          setVerificationData(displayContent);
          setLoadingEmail(false);
          toast.error("Inbox not found");
        }
      } catch (error: any) {
        let displayContent = (
          <ErrorTab message="Something went wrong" />
          // <div className="w-full h-full flex gap-4 items-center justify-center py-8">
          //   <span className="px-4 py-2 rounded-md bg-red-600 text-center font-bold text-white">
          //     Something went wrong
          //   </span>
          // </div>
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
        // setLoadingInbox(false);
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
    // setLoadingInbox(true);
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
      //setLoadingInbox(false);
      setLoadingEmail(true);
      setCountdown(COUNTDOWN_TIME); // Reset the countdown timer
      endTimeRef.current = Date.now() + (COUNTDOWN_TIME+1) * 1000; // Update the end time reference
      toast.success("Inbox created!");
    } catch (error: any) {
      console.error("Error generating inbox:", error.message);
      setVerificationData(`Error: ${error.message}`);
      // setLoadingInbox(false);
      setLoadingEmail(false);
      toast.error(`Error generating email: ${error.message}`);
    }
  };

  return (
    <>
      <div className="relative flex flex-col min-h-[100svh]">
        <Toaster />

        <div
  className="w-screen h-[350px] bg-white flex flex-col items-center justify-center px-[5%] py-2 "
  style={{
    backgroundImage: `radial-gradient(lightgray 10%, transparent 11%)`,
    backgroundSize: "15px 15px",
  }}
>
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
                className="text-gray-600"
                href="/dashboard/keys"
              >
                Developers
              </Link>
            </ul>
          </div>
          <h1 className="text-green-600 text-[2.5em] md:text-[4em] font-[800] relative">
            Phantom<span className="text-gray-600">Sign</span>
          </h1>

          <h3 className="flex gap-4 items-center">
          
          <div className="flex items-center justify-center">
            <span className="flex transition-[0.5s] gap-4 text-gray-600 font-bold text-[2em]">
              {emailStats?.generated_inboxes_count && (
                <CountUp
                className="transition-[0.5s]"
                  end={emailStats.generated_inboxes_count}
                  onEnd={() => setIsCountFinished(true)} // Trigger on count completion
                />
              )}
              
              {/* The motion span will animate into view */}
              <motion.span
                className={`text-gray-600 flex items-center font-semibold text-[0.8em]`}
                initial={{ x: 50, opacity: 0 }}
                animate={{ 
                  x: isCountFinished ? 0 : 80,
                  opacity: isCountFinished ? 1 : 0
                }}
                transition={{ duration: 0.05 }}
              >
                {isCountFinished && "Inboxes created!"}
              </motion.span>
            </span>
          </div>

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
                <button className="hidden md:flex px-3 py-2 bg-green-600 border border-green-700 text-white flex items-center justify-center rounded-md duration-75 hover:scale-[1.05]" onClick={generateEmail}><IoReload className="w-[30px]"/></button>
                <div className="px-4 py-2 border border-gray-400 bg-white rounded-md duration-75 hover:scale-[1.05]" onClick={() => {
                  navigator.clipboard.writeText(email);
                  toast.success("Copied to clipboard");
                }}>{email || "Generating..."}</div>

                <div className="hidden md:flex px-3 py-2 bg-gray-700 border border-black text-white flex items-center justify-center rounded-md duration-75 hover:scale-[1.05]" onClick={() => {
                  navigator.clipboard.writeText(email);
                  toast.success("Copied to clipboard");
                }}><IoCopyOutline className="w-[30px]"/></div>
              </div>
          </div>

          <div className="mt-[50px] flex justify-center items-center z-10 w-full">
            <div className="flex items-center gap-2">
              <Switch.Root defaultChecked={true} className="SwitchRoot" id="airplane-mode" onCheckedChange={(checked) => {setDeleteAfter(checked)}}>
                <Switch.Thumb className="SwitchThumb" />
              </Switch.Root>
              <label>Delete after {process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES} minutes</label>
            </div>
            
          </div>

          <div className="relative w-full flex-grow flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">

              <div className="w-full flex flex-col-reverse md:flex-row justify-center gap-16 py-[60px] md:py-[auto]">

                <div className="w-full md:w-1/2">
      
                    <div className="flex flex-col items-center bg-white border border-gray-400 rounded-md">

                    <div className="w-full p-4 bg-gray-200 rounded-t-md flex justify-between">
                      <span>Inbox <span className="text-gray-600">&lt;{email.split("@")[0] || ""}&gt;</span></span>
                      {deleteAfter && <span className="tabular-nums">
                          <span className="mr-1">Deleting in</span> 
                          {Math.floor(countdown / 60)}:
                          {String(countdown % 60).padStart(2, "0")}
                      </span>}
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
      
      <About />

      <Api />

      <Footer />
    </>
  );
}

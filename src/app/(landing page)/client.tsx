"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  SparklesIcon,
  OfficeBuildingIcon,
  DocumentDuplicateIcon,
  ExternalLinkIcon,
} from "@heroicons/react/outline";
import Image from "next/image";
import logo from "../../../public/phantom.svg";
import { Toaster, toast } from "react-hot-toast";
import Link from "next/link";
import NotificationModal from "../notificationModal";
import Footer from "../components/footer";
import Confetti from 'react-confetti';

interface EmailStats {
  generated_emails_count: number | null;
  codes_found_count: number | null;
  links_found_count: number | null;
}

interface LandingClientProps {
  user: User | null;
  emailStats: EmailStats | null;
}

export default function LandingClient({ user, emailStats }: LandingClientProps) {
  const COUNTDOWN_TIME = parseInt(process.env.NEXT_PUBLIC_DELETE_AFTER_MINUTES!, 10) * 60 || 300; // Default to 300 seconds (5 minutes)
  const POLLING_INTERVAL = 5000; // 5 seconds

  const [email, setEmail] = useState<string>("");
  const [verificationData, setVerificationData] = useState<string | JSX.Element>("");
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
          console.log("Service Worker registered:", registration);

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

          console.log("Push subscription successful:", subscription);
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
      console.log(`Inbox for ${inbox} deleted.`);
    } catch (error: any) {
      console.error(`Error deleting inbox for ${inbox}:`, error.message);
    }
  };

  useEffect(() => {
    const poll = async () => {
      if (!currentEmailRef.current || !loadingEmail) {
        console.log("No current email to poll for or polling stopped.");
        return;
      }

      console.log(`Polling for email in inbox: ${currentEmailRef.current}`);
      try {
        const response = await fetch(
          `/api/poll-inbox?inbox=${currentEmailRef.current}`,
          { cache: "no-store" }
        );
        if (response.ok) {
          const data = await response.json();
          if (
            data.message === "Awaiting email" ||
            data.message === "Email lacks content"
          ) {
            console.log(data.message);
            return;
          }

          if (data) {
            console.log("Data found:", data);
            let displayContent;
            const companyInfo = data.company ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-md bg-white text-center font-bold">
                <OfficeBuildingIcon className="w-5 h-5" />
                {data.company}
              </div>
            ) : (
              <span className="px-4 py-2 rounded-md bg-red-100 text-center font-bold">
                Company information unavailable
              </span>
            );

            if (data.link) {
              displayContent = (
                <div className="flex flex-col justify-center">
                  <p className="mt-8 text-center font-bold"><span className="text-[1.4em] mr-4">🎉</span> Email received <span className="text-[1.4em] ml-4">🎉</span> </p>
                  <div className="flex flex-col md:flex-row mt-8 gap-4 items-center">
                    {companyInfo}
                    <button
                      className="w-full md:w-[auto] bg-blue-500 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"
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
                <div className="flex flex-col justify-center">
                  <p className="mt-8 text-center font-bold">Email received 🎉 </p>
                  <div className="flex mt-8 gap-4 items-end">
                    {companyInfo}
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(data.code);
                        toast.success("Copied to clipboard");
                      }}
                      className="relative flex items-stretch border border-gray-400 rounded-md bg-white hover:scale-[1.05] duration-75 cursor-pointer"
                    >
                      <div className="px-4 py-2">{data.code}</div>
                      <div className="px-2 md:px-4 grid place-content-center flex-grow rounded-r-md bg-gray-100 border-l border-gray-400 text-gray-600">
                      <DocumentDuplicateIcon
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              displayContent = (
                <div className="flex mt-8 gap-4 items-center">
                  <span className="px-4 py-2 rounded-md bg-gray-100 text-center font-bold">
                    No verification code or link found
                  </span>
                </div>
              );
            }

            setVerificationData(displayContent);
            setLoadingEmail(false);

            if ("Notification" in window && "serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                console.log("SHOULD SEND HERE");
                registration.showNotification("New Email Received", {
                  body: "We received an email to your temporary address.",
                  icon: "/phantom.svg",
                });
              });
            }

            // Show confetti when verification data is found
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000); // Stop confetti after 5 seconds
          }
        } else if (response.status === 404) {
          console.error("Inbox not found");
          setVerificationData(`Error: Inbox not found`);
          setLoadingEmail(false);
          toast.error("Inbox not found");
        }
      } catch (error: any) {
        console.error("Error retrieving verification data:", error.message);
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
    console.log("Generating email...");
    setLoadingInbox(true);
    setVerificationData("");
    setCountdown(COUNTDOWN_TIME); // Reset the countdown timer
    endTimeRef.current = Date.now() + COUNTDOWN_TIME * 1000; // Update the end time reference

    try {
      const response = await fetch("/api/generate-inbox", {
        method: "POST",
        cache: "no-store",
      });
      const data = await response.json();
      const emailAddress = data.inbox;

      console.log("Generated email:", emailAddress);

      if (!emailAddress) {
        throw new Error("Failed to generate email");
      }

      setEmail(emailAddress);
      currentEmailRef.current = emailAddress;
      setLoadingInbox(false);
      setLoadingEmail(true);
      toast.success("Email generated successfully!");
    } catch (error: any) {
      console.error("Error generating email:", error.message);
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
        <div className="w-screen h-[300px] bg-white flex flex-col items-center justify-center px-[5%] py-2">
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
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#api">API</a>
              </li>
              <Link
                className="bg-black text-white px-4 py-2 rounded-md"
                href="/dashboard"
              >
                {user ? "Dashboard" : "Login"}
              </Link>
            </ul>
          </div>
          <h1 className="text-green-600 text-[2.5em] md:text-[4em] font-bold relative">
            Phantom<span className="text-gray-600">Sign</span>
          </h1>
        </div>
        <div className="relative flex flex-col items-center bg-gray-200 flex-grow">
          <div className="absolute">
            <div className="w-full flex justify-center float-animation absolute -translate-y-[50%] -top-[80px]">
              <Image
                src={logo}
                alt="PhantomSign Logo"
                width={100}
                height={100}
                className=""
              />
            </div>
            <button
              className="shimmery-button z-[1000] simple-shadow absolute -translate-y-[50%] text-white text-[1.5em] font-bold py-2 px-6 rounded-md flex items-center justify-center"
              onClick={generateEmail}
              disabled={loadingInbox}
            >
              {loadingInbox ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3 border-4 border-t-4 border-gray-200 border-t-white rounded-full"
                    viewBox="0 0 24 24"
                  ></svg>
                  Generating...
                </>
              ) : email ? (
                "Regenerate Email"
              ) : (
                <span className="flex items-center">
                  Generate Email
                  <SparklesIcon className="w-5 h-5 ml-4 scale-[1.2]" />
                </span>
              )}
            </button>
          </div>
          <div className="relative w-full flex-grow flex flex-col items-center justify-center">
            <div className="w-full flex flex-col items-center">
              {!email && !loadingInbox && <></>}
              {!email && !loadingInbox && (
                <div className="flex flex-col md:flex-row gap-12 py-12 pb-8">
                  <div
                    className="flex flex-col items-center bg-white rounded-md simple-shadow p-4 w-[180px]"
                    style={{ aspectRatio: 1 }}
                  >
                    <h2 className="text-[1em]">Codes found</h2>
                    {emailStats?.codes_found_count === null ? (
                      <svg
                        className="animate-spin h-10 w-10 my-8 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full"
                        viewBox="0 0 24 24"
                      ></svg>
                    ) : (
                      <h2 className="text-[4em] text-gray-600">
                        {emailStats?.codes_found_count}
                      </h2>
                    )}
                  </div>
                  <div
                    className="flex flex-col items-center bg-white rounded-md simple-shadow p-4 w-[180px]"
                    style={{ aspectRatio: 1, transform: "scale(1.2)" }}
                  >
                    <h2 className="text-[1em]">Emails generated</h2>
                    {emailStats?.generated_emails_count === null ? (
                      <svg
                        className="animate-spin h-10 w-10 my-8 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full"
                        viewBox="0 0 24 24"
                      ></svg>
                    ) : (
                      <h2 className="text-[4em] text-gray-600">
                        {emailStats?.generated_emails_count}
                      </h2>
                    )}
                  </div>
                  <div
                    className="flex flex-col items-center bg-white rounded-md simple-shadow p-4 w-[180px]"
                    style={{ aspectRatio: 1 }}
                  >
                    <h2 className="text-[1em]">Links found</h2>
                    {emailStats?.links_found_count === null ? (
                      <svg
                        className="animate-spin h-10 w-10 my-8 border-4 border-t-4 border-gray-200 border-t-green-600 rounded-full"
                        viewBox="0 0 24 24"
                      ></svg>
                    ) : (
                      <h2 className="text-[4em] md:text-[4em] text-gray-600">
                        {emailStats?.links_found_count}
                      </h2>
                    )}
                  </div>
                </div>
              )}
              {(email && !loadingInbox) && (
                <div className="flex flex-col">
                  <div
                    onClick={() => {
                      navigator.clipboard.writeText(email);
                      toast.success("Copied to clipboard");
                    }}
                    className="relative flex items-stretch text-[1em] md:text-[1.4em] mt-4 border rounded-md bg-white border border-gray-400 hover:scale-[1.05] duration-75 cursor-pointer self-end"
                  >
                    <div className="px-4 py-2">{email}</div>
                    <div className="px-2 md:px-4 grid place-content-center flex-grow rounded-r-md bg-gray-100 border-l border-gray-400 text-gray-600">
                      <DocumentDuplicateIcon
                        className="w-5 h-5 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
              {loadingEmail && (
                <div className="flex flex-col items-center mt-8">
                  <svg
                    className="animate-spin h-8 w-8 mr-3 border-4 border-t-4 border-gray-200 border-t-gray-400 rounded-full"
                    viewBox="0 0 24 24"
                  ></svg>
                  
                  <p className="mt-8">Awaiting an email...</p>
                  <p className="mt-2 text-[2em] text-gray-600 tabular-nums">
                    {Math.floor(countdown / 60)}:
                    {String(countdown % 60).padStart(2, "0")}
                  </p>
                </div>
              )}
              {verificationData}
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
        className="bg-gray-200 min-h-screen w-full flex flex-col gap-8 px-[5%] pt-8"
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

        <Footer />
      </div>
      {showConfetti && <Confetti
        numberOfPieces={500}
        recycle={false}
        style={{ width: "100vw", opacity: confettiOpacity, transition: "opacity 2s" }} // Add transition for fading effect
      />}
    </>
  );
}

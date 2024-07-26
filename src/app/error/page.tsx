'use client';

import { useRouter } from 'next/navigation';

export default function ErrorPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-md shadow-md text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong!</h1>
        <p className="text-gray-700 mb-6">An error occurred while processing your request. Please try again later.</p>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

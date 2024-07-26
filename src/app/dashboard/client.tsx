'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { SparklesIcon, KeyIcon, LogoutIcon } from '@heroicons/react/outline';
import Image from 'next/image';
import logo from '../../../public/phantom.svg';

interface DashboardClientProps {
  user: User;
  initialApiKeys: string[];
}

export default function DashboardClient({ user, initialApiKeys }: DashboardClientProps) {
  const [apiKeys, setApiKeys] = useState(initialApiKeys);
  const router = useRouter();

  const handleCreateApiKey = async () => {
    const response = await fetch('/api/generate-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const result = await response.json();

    if (response.ok) {
      setApiKeys((prevKeys) => [...prevKeys, result.apiKey]);
    } else {
      console.error('Error creating API key:', result.error);
    }
  };

  const handleLogout = async () => {
    const response = await fetch('/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      router.push('/');
    } else {
      console.error('Error logging out');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <Image src={logo} alt="PhantomSign Logo" width={50} height={50} />
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <p className="text-gray-700 mb-4">Hello, {user.email}</p>
        <div className="flex flex-col items-start">
          <button
            onClick={handleCreateApiKey}
            className="flex items-center px-4 py-2 mb-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
          >
            <KeyIcon className="w-5 h-5 mr-2" />
            Create API Key
          </button>
          <ul className="w-full">
            {apiKeys.map((key, index) => (
              <li
                key={index}
                className="flex items-center justify-between bg-gray-100 p-2 mb-2 rounded-lg"
              >
                <span className="text-gray-800">{key}</span>
                <SparklesIcon className="w-5 h-5 text-yellow-500" />
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 mt-6 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600"
        >
          <LogoutIcon className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}

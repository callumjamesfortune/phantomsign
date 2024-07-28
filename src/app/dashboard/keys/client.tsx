'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import logo from '../../../../public/phantom.svg';
import { Toaster, toast } from 'react-hot-toast';
import AuthenticatedNavigation from '../../components/authenticatedNavigation';
import Link from 'next/link';
import { generateApiKey, deleteApiKey } from './actions'; // Import server actions
import Footer from 'src/app/components/footer';

interface ApiKey {
  id: string;
  api_key: string;
  description: string;
  expires_at: string;
}

interface KeysClientProps {
  user: User;
  initialApiKeys: ApiKey[];
}

export default function KeysClient({ user, initialApiKeys }: KeysClientProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set('description', description);
    formData.set('expires_at', expiresAt);

    try {
      const result = await generateApiKey(formData);
      if (result.apiKey) {
        setApiKeys((prevKeys) => [
          ...prevKeys,
          {
            id: result.id,
            api_key: result.apiKey as string,
            description: result.description as string,
            expires_at: result.expiresAt as string,
          },
        ]);
        setDescription('');
        setExpiresAt('');
        toast.success('API key generated successfully!');
      } else {
        toast.error('Failed to generate API key');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      await deleteApiKey(id);
      setApiKeys((prevKeys) => prevKeys.filter((key) => key.id !== id));
      toast.success('API key deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    }
  };

  return (
    <div className="w-screen px-[5%] min-h-screen flex flex-col items-center bg-white">
      <Toaster />
      <AuthenticatedNavigation user={user} />
      <h1 className='w-full text-[1.5em] font-bold text-left mt-4'>API Keys</h1>
      <h2 className='w-full text-gray-600 text-[1em] font-bold text-left mt-2'>Create API keys for your applications.</h2>

      <div className='w-full flex flex-grow flex-col md:flex-row gap-4 items-start mt-6'>
        <div className="w-full max-w-3xl bg-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">New key</h1>
          </div>
          <form onSubmit={handleCreateApiKey} className="flex flex-col">
            <label htmlFor="description" className="block mb-2">Description:</label>
            <input
              id="description"
              name="description"
              placeholder='What app is it for?'
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-4"
            />
            <label htmlFor="expires_at" className="block mb-2">Expires At:</label>
            <input
              id="expires_at"
              name="expires_at"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-4"
            />
            <button
              type="submit"
              className="flex items-center px-4 py-2 self-start bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
            >
              Create API Key
            </button>
          </form>
        </div>

        {apiKeys.length > 0 ?
          <ul className="w-full">
            {apiKeys.map((key) => (
              <li key={key.id} className="flex items-center justify-between bg-gray-200 px-2 pl-4 py-2 mb-2 rounded-md">
                <div>
                  <p className="text-gray-800">{key.api_key}</p>
                  <p className="text-gray-600 text-sm">{key.description || "No description"}</p>
                  <p className="text-gray-600 text-sm">Expires At: {key.expires_at}</p>
                </div>
                <button onClick={() => handleDeleteApiKey(key.id)} className="flex items-center px-4 py-2 bg-red-500 text-white font-bold rounded-md hover:bg-red-600">
                  Revoke
                </button>
              </li>
            ))}
          </ul>
          :
          <h2 className=''>No Keys yet...</h2>
        }
      </div>

      <Footer />
    </div>
  );
}

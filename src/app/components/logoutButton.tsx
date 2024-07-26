// src/app/components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { LogoutIcon } from '@heroicons/react/outline';
import { toast } from 'react-hot-toast';
import { logout } from '../actions/logout';

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
      const response = await logout();
      if (response?.error) {
        toast.error(response.error);
      } else {
        router.push('/');
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center px-4 py-2 mt-6 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600"
      disabled={isPending}
    >
      <LogoutIcon className="w-5 h-5 mr-2" />
      Logout
    </button>
  );
}

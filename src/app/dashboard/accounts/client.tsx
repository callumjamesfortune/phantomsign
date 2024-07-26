'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SparklesIcon, KeyIcon } from '@heroicons/react/outline';
import Image from 'next/image';
import logo from '../../../public/phantom.svg';
import { toast } from 'react-hot-toast';
import AuthenticatedNavigation from 'src/app/components/authenticatedNavigation';
import Link from 'next/link';

interface AccountsClientProps {
  user: User;
}

export default function AccountsClient({ user }: AccountsClientProps) {

  return (
    <div className="w-screen px-[5%] min-h-screen flex flex-col items-center bg-white">
      <div className="w-full">
      <AuthenticatedNavigation />

        <p className="text-gray-700 mb-4 font-bold mt-8">Hello, {user.email?.split("@")[0]}</p>

        
      </div>
    </div>
  );
}

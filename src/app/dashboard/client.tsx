'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SparklesIcon, KeyIcon } from '@heroicons/react/outline';
import Image from 'next/image';
import logo from '../../../public/phantom.svg';
import { toast } from 'react-hot-toast';
import AuthenticatedNavigation from '../components/authenticatedNavigation';
import Link from 'next/link';

interface DashboardClientProps {
  user: User;
}

export default function DashboardClient({ user }: DashboardClientProps) {


  return (
    <div className="w-screen px-[5%] min-h-screen flex flex-col items-center bg-white">
      <div className="w-full">
      <AuthenticatedNavigation user={user}/>

        <p className="text-gray-700 mb-4 font-bold mt-8">Hello, {user.email?.split("@")[0]}</p>

        <div className='bg-gray-200 w-full'></div>

      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { SparklesIcon, KeyIcon } from '@heroicons/react/outline';
import Image from 'next/image';
import logo from '../../../public/phantom.svg';
import { toast } from 'react-hot-toast';
import AuthenticatedNavigation from '../components/authenticatedNavigation';
import Link from 'next/link';
import Footer from '../components/footer';

interface DashboardClientProps {
  user: User;
}

export default function DashboardClient({ user }: DashboardClientProps) {


  return (
    <div className="w-screen px-[5%] min-h-screen flex flex-col items-center bg-white">
      <AuthenticatedNavigation user={user}/>
      <div className="w-full flex-grow">
        <h1 className='w-full text-[1.5em] font-bold text-left mt-4'>Dashboard</h1>
        <h2 className='w-full text-gray-600 text-[1em] font-bold text-left mt-2'>An overview of your usage.</h2>


        <div className='bg-gray-200 w-full'></div>

      </div>

      <Footer />

    </div>
  );
}

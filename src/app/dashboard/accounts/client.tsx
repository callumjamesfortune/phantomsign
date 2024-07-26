'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';
import logo from '../../../../public/phantom.svg';
import { toast } from 'react-hot-toast';
import AuthenticatedNavigation from '../../components/authenticatedNavigation';
import Link from 'next/link';

interface KeysClientProps {
  user: User;
}

export default function AccountsClient({ user }: KeysClientProps) {


  return (
    <div className="w-screen px-[5%] min-h-screen flex flex-col items-center bg-white">
      <AuthenticatedNavigation />

      <h1 className='w-full text-[1.5em] font-bold text-left mt-4'>Accounts</h1>
      <h2 className='w-full text-gray-600 text-[1em] font-bold text-left mt-2'>All of your saved accounts in one place.</h2>

        <div className='w-full flex flex-col md:flex-row gap-4 items-start mt-6'>
            

        </div>

    </div>
  );
}

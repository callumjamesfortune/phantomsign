'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { loginOrSignUp } from './actions';
import Link from 'next/link';
import logo from "../../../public/phantom.svg"
import Image from 'next/image';

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('name');

    if (action) {
      formData.set('action', action);
      try {
        const response = await loginOrSignUp(formData);
        
        if (response.status !== 200) {
          toast.error(response.error || 'An error occurred');
        } else {
          toast.success(action === 'login' ? 'Logged in successfully!' : 'Signed up successfully!');
          router.push('/dashboard');
        }
      } catch (error: any) {
        toast.error(error.message || 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error('No action specified');
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <Toaster />
      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <Link href="/" className='absolute top-4 left-6 font-bold' >Back</Link>

        <div className="bg-white p-8 rounded-md w-full max-w-md">

          <div className='w-full flex items-center justify-center mb-8'>
            <Image
                  src={logo}
                  alt="PhantomSign Logo"
                  width={50}
                  height={50}
                  className=""
            />
          </div>

          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login or Sign Up</h2>
          <h3 className="mb-6 text-gray-600 text-center">Don&apos;t even try to use a PhantomSign email.</h3>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700">Email:</label>
              <input id="email" name="email" type="email" required className="w-full px-3 py-2 border rounded-md"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700">Password:</label>
              <input id="password" name="password" type="password" required className="w-full px-3 py-2 border rounded-md"/>
            </div>
            <div className="flex justify-between">
              <button type="submit" name="login" className="w-[48%] py-2 px-4 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600" disabled={isSubmitting}>Log in</button>
              <button type="submit" name="signup" className="w-[48%] py-2 px-4 bg-green-500 text-white font-bold rounded-md hover:bg-green-600" disabled={isSubmitting}>Sign up</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

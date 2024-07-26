'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { loginOrSignUp } from './actions';

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
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login or Sign Up</h2>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700">Email:</label>
              <input id="email" name="email" type="email" required className="w-full px-3 py-2 border rounded-lg"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-700">Password:</label>
              <input id="password" name="password" type="password" required className="w-full px-3 py-2 border rounded-lg"/>
            </div>
            <div className="flex justify-between">
              <button type="submit" name="login" className="w-[48%] py-2 px-4 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600" disabled={isSubmitting}>Log in</button>
              <button type="submit" name="signup" className="w-[48%] py-2 px-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600" disabled={isSubmitting}>Sign up</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

import { login, signup } from './actions';
import { SparklesIcon, LoginIcon, UserAddIcon } from '@heroicons/react/outline';
import Image from 'next/image';
import logo from '../../../public/phantom.svg';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-center mb-6">
          <Image src={logo} alt="PhantomSign Logo" width={50} height={50} />
        </div>
        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-between items-center">
            <button
              formAction={login}
              className="flex items-center px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600"
            >
              <LoginIcon className="w-5 h-5 mr-2" />
              Log in
            </button>
            <button
              formAction={signup}
              className="flex items-center px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600"
            >
              <UserAddIcon className="w-5 h-5 mr-2" />
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

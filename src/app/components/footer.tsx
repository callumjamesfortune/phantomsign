import { User } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default function Footer() {
  
    return (

        <div className='w-full rounded-t-md p-4 py-8 flex items-center bg-white border-2 border-gray-200 justify-between'>
            <div className="w-1/2 text-center flex flex-col gap-2">
                <span>&copy; 2025 PhantomSign.com</span>
                <span>enquiries@phantomsign.com</span>
                <span>Built by <a href="https://github.com/callumjamesfortune" className="underline">Callum Fortune</a></span>
            </div>
            <div className="w-1/2 text-center flex flex-col gap-2">
                <Link href="/login" className="underline">Login</Link>
                <Link href="/dashboard" className="underline">Dashboard</Link>
                <Link href="/dashboard/keys" className="underline">API keys</Link>
            </div>
        </div>

    );
}
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./logoutButton";
import logo from "../../../public/phantom.svg"
import { User } from "@supabase/auth-helpers-nextjs";

export default function AuthenticatedNavigation({user}: {user: User}) {

  
    return (

        <div className='w-full flex items-center justify-between pt-2'>
            <div className="flex items-center gap-4 font-bold text-gray-600">
                <Link href="/">
                    <Image 
                    src={logo} 
                    alt="PhantomSign Logo" 
                    width={50} 
                    height={50}
                    className=''
                    />
                </Link>
                <span className="hidden md:block">{user && user.email}</span>
            </div>
            <ul className='flex items-center md:pr-[auto] gap-6 md:gap-12 text-gray-600 font-bold'>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/dashboard/keys">Keys</Link></li>
                <li><Link href="/dashboard/accounts">Accounts</Link></li>
                <LogoutButton />
            </ul>
        </div>

    );
}
import Image from "next/image";
import Link from "next/link";
import LogoutButton from "./logoutButton";
import logo from "../../../public/phantom.svg"

export default function AuthenticatedNavigation() {
  
    return (

        <div className='w-full flex items-center justify-between pt-2'>
            <div>
                <Image 
                src={logo} 
                alt="PhantomSign Logo" 
                width={50} 
                height={50}
                className=''
                />
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
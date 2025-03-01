"use client";

import Link from "next/link";
import Image from "next/image";
import GameSVG from "@/public/game.svg";
import BulletListSVG from "@/public/bullet-list.svg";
import ProfileSVG from "@/public/user.svg";
import CreateGameSVG from "@/public/plus.svg";


const Navbar = () => {


    return (
        <nav className="fixed bottom-0 left-0 w-full bg-navbar text-white flex justify-around items-end py-2 px-1 shadow-md rounded-t-3xl">
            <Link href="/create-lobby" className="flex flex-col items-center border-r-2 border-white py-1 px-4 hover:bg-lightGray hover:rounded-tl-3xl">
                <Image src={CreateGameSVG} width={24} height={24} alt="Leaderboard" />
                <span className="text-xs mt-2">Create Game</span>
            </Link>
            <Link href="/" className="flex flex-col items-center border-r-2 border-white px-5 py-1 hover:bg-lightGray">
                <Image src={GameSVG} width={24} height={24} alt="Games" />
                <span className="text-xs mt-2">Games</span>
            </Link>
            <Link href="/leaderboard" className="flex flex-col items-center border-r-2 border-white px-5 py-1 hover:bg-lightGray">
                <Image src={BulletListSVG} width={24} height={24} alt="Leaderboard" />
                <span className="text-xs mt-2">Leaderboard</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center px-5 py-1 hover:bg-lightGray hover:rounded-tr-3xl">
                <Image src={ProfileSVG} width={24} height={24} alt="Leaderboard" />

                <span className="text-xs mt-2">Profile</span>
            </Link>
        </nav>
    );
};

export default Navbar;

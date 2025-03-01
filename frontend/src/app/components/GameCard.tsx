"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import VsImage from "@/public/images/vs.jpg";

type GameProps = {
    id: number;
    bet: number;
    category: string;
    handleJoinLobby: (lobbyId: string) => void;
};

const GameCard = ({ id, bet, handleJoinLobby, category }: GameProps) => {
    const router = useRouter();

    const handleClick = () => {
        handleJoinLobby(`lobby_${id}`);
        router.push(`/lobby_/${id}`);
    };

    return (
        <div
            className="flex flex-col items-center justify-center cursor-pointer"
            onClick={handleClick} // ✅ Click event
        >
            <Image src={VsImage} width={200} height={200} alt="game" className="rounded-t-xl" />
            <div className="flex flex-col w-full gap-[8px] items-center justify-center text-xs bg-black py-[14px] px-[10px] rounded-b-xl">
                <p className="text-base text-white font-medium text-nowrap">Category: {category}</p>
                <div className="bg-orange px-1 py-1 rounded-[4px] flex flex-row items-center justify-center text-center w-full">
                    <p className="text-base text-white font-medium text-nowrap">Bet: {bet}</p>
                </div>
            </div>
        </div>
    );
};

export default GameCard;

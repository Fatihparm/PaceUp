"use client";

import { useState } from "react";
import GameCard from "./components/GameCard";

export default function Home() {
    const [activeTab, setActiveTab] = useState<"active" | "upcoming">("active");

    const activeGames = [
        { id: 101, bet: 500 },
        { id: 102, bet: 450 },
        { id: 103, bet: 400 },
        { id: 104, bet: 350 },
        { id: 105, bet: 300 },
        { id: 106, bet: 250 },
        { id: 107, bet: 200 },
        { id: 108, bet: 150 },
    ];

    const upcomingGames = [
        { id: 201, bet: 100 },
        { id: 202, bet: 90 },
        { id: 203, bet: 80 },
        { id: 204, bet: 70 },
    ];

    return (
        <div className="flex flex-col gap-6 p-6 mt-4 items-center">
            <h1 className="text-4xl font-semibold">Games</h1>
            <div className="flex gap-4 w-full justify-center">
                <button
                    className={`w-full text-lg font-medium px-4 py-2 rounded-lg ${activeTab === "active" ? "bg-linear-custom text-white" : "bg-gray"
                        }`}
                    onClick={() => setActiveTab("active")}
                >
                    Active Games
                </button>
                <button
                    className={`w-full text-lg font-medium px-4 py-2 rounded-lg ${activeTab === "upcoming" ? "bg-linear-custom text-white" : "bg-gray"
                        }`}
                    onClick={() => setActiveTab("upcoming")}
                >
                    Upcoming Games
                </button>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-2 gap-4">
                {(activeTab === "active" ? activeGames : upcomingGames).map((game) => (
                    <GameCard key={game.id} id={game.id} bet={game.bet} />
                ))}
            </div>
        </div>
    );
}

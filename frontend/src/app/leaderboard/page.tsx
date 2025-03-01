"use client"; // Çünkü state kullanıyoruz

import { useState } from "react";
import ListBox from "../components/leaderboard/ListBox";

const weeklyLeaders = [
    { nickname: "ronaldo", number: 1, points: 1000 },
    { nickname: "messi", number: 2, points: 900 },
    { nickname: "neymar", number: 3, points: 800 },
    { nickname: "mbappe", number: 4, points: 700 },
    { nickname: "viniciusjr", number: 5, points: 600 },
    { nickname: "haaland", number: 6, points: 500 },
    { nickname: "kevindebruyne", number: 7, points: 400 },
    { nickname: "aguero", number: 8, points: 300 },
];

const allTimeLeaders = [
    { nickname: "ronaldinho", number: 1, points: 15000 },
    { nickname: "zidane", number: 2, points: 14980 },
    { nickname: "beckham", number: 3, points: 14960 },
    { nickname: "hagi", number: 4, points: 14940 },
    { nickname: "casillas", number: 5, points: 14920 },
    { nickname: "cannavaro", number: 6, points: 14900 },
    { nickname: "pirlo", number: 7, points: 14880 },
    { nickname: "kaka", number: 8, points: 14860 },
];

export default function Leaderboard() {
    const [activeList, setActiveList] = useState<"weekly" | "allTime">("weekly");

    const leaders = activeList === "weekly" ? weeklyLeaders : allTimeLeaders;

    return (
        <div className="flex flex-col gap-8 p-4 w-full">
            <h1 className="text-2xl font-normal text-center">Leaderboard</h1>
            {/* Toggle Buttons */}
            <div className="flex justify-center gap-4 w-full ">
                <button
                    className={`w-full px-4 py-2 rounded-2xl font-medium ${activeList === "weekly" ? "bg-linear-custom text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setActiveList("weekly")}
                >
                    Weekly
                </button>
                <button
                    className={`w-full px-4 py-2 rounded-2xl font-medium ${activeList === "allTime" ? "bg-linear-custom text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setActiveList("allTime")}
                >
                    All Time
                </button>
            </div>

            {/* Leaderboard List */}
            <div className="flex flex-col gap-4">
                {leaders.map((player) => (
                    <ListBox key={player.number} {...player} />
                ))}
            </div>
        </div>
    );
}

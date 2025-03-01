"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Player = {
    wallet: string;
};

type Question = {
    question: {
        question: string;
        answer: number;
    };
    answers: Record<string, number>;
    correct: number;
};

type GameRecord = {
    bet_amount: number;
    game_id: number;
    players: Player[];
    questions: Question[];
    scores: Record<string, number>;
    timestamp: string;
    winner: string;
};

export default function GameRecordPage() {
    const pathname = usePathname();
    const path = pathname.split("/").pop();

    const [gameRecord, setGameRecord] = useState<GameRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleDropdown = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    useEffect(() => {
        if (!path) return;

        fetch(`http://172.86.68.11:5001/get_game_record/${path}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZWxlc3RpYTEzam5jbXI2ZnVqZDdsNm02N3k4NzRwNGtxcG1meGE3dWd5czV2YyIsIndhbGxldEFkZHJlc3MiOiJjZWxlc3RpYTEzam5jbXI2ZnVqZDdsNm02N3k4NzRwNGtxcG1meGE3dWd5czV2YyIsImlhdCI6MTc0MDgwOTgwNywiZXhwIjoxNzQwODEzNDA3fQ.zif6h00AQ3ASjsSzRAFmkTUDUYn01IK3ljYXy-YAf2U`,
                "Content-Type": "application/json",
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Error fetching data");
                return res.json();
            })
            .then((data) => {
                setGameRecord(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [path]);

    if (loading) return <p>Yükleniyor...</p>;
    if (error) return <p>Hata: {error}</p>;

    return (
        <div className="container w-full p-4 text-center mb-24">
            <h1 className=" text-2xl font-bold">Game Record: {gameRecord?.game_id}</h1>
            <div className="flex flex-row items-center mt-4 justify-center gap-4">
                <div className="flex flex-row items-center ">
                    <p className="text-orange text-lg font-semibold">Game ID : </p>
                    <p className="text-lg"> {gameRecord?.game_id}</p>
                </div>
                <div className="flex flex-row items-center">
                    <p className="text-orange text-lg font-semibold">Bet Amount : </p>
                    <p className="text-lg"> {gameRecord?.bet_amount}</p>
                </div>
            </div>

            <h2 className="text-orange text-xl font-bold mt-4">Players</h2>
            <div className="w-full overflow-hidden mt-2">
                <table className="w-full border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-3 text-center">Player</th>
                            <th className="border p-3 text-center">Score</th>
                            <th className="border p-3 text-center">Wallet Address</th>
                        </tr>
                    </thead>
                    <tbody>
                        {gameRecord?.players.map((player, index) => (
                            <tr key={index} className="border-b">
                                <td className="border p-3 text-center">Player {index + 1}</td>
                                <td className="border p-3 text-center">{gameRecord?.scores[player.wallet] || 0}</td>
                                <td className="border p-3 text-center break-all whitespace-normal">{player.wallet}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>





            <h2 className="text-xl font-bold my-4 text-orange">Questions</h2>

            <div className="space-y-2">
                {gameRecord?.questions.map((q, index) => (
                    <div key={index} className="border rounded-lg shadow-md">
                        <button
                            className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
                            onClick={() => toggleDropdown(index)}
                        >
                            <span className=" font-semibold">{q.question.question}</span>
                            <span>{openIndex === index ? "▲" : "▼"}</span>
                        </button>
                        {openIndex === index && (
                            <div className="p-3 border-t">
                                <p><strong>Correct Answer:</strong> {q.question.answer}</p>
                                <p><strong>Players Answers:</strong></p>
                                <ul className="ml-4 list-disc">
                                    {Object.entries(q.answers).map(([wallet, answer]) => (
                                        <li key={wallet}>{wallet}: {answer}</li>
                                    ))}
                                </ul>
                                <p><strong>Actual Correct Answer:</strong> {q.correct}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div>
                <h2 className="text-orange text-xl font-bold mt-4">Winner</h2>
                <p className="text-lg whitespace-normal text-wrap break-all">{gameRecord?.winner}</p>
            </div>
            <div>
                <h2 className="text-orange text-xl font-bold mt-4">Timestamp</h2>
                <p className="text-lg whitespace-normal text-wrap break-all">{gameRecord?.timestamp}</p>
            </div>
        </div>
    );
}

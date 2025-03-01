"use client";

import React, { useEffect, useState } from "react";
import Button from "../components/common/Button";
import { useRouter } from "next/navigation";

const betOptions = [5, 10, 25, 50, 100];
const topics = ["Sport", "History", "Geography", "General Culture", "Science", "Movies and TV Series"];

const CreateLobbyPage = () => {
    const [username, setUsername] = useState<string>("");
    const [bet, setBet] = useState<number>(betOptions[0]);
    const [topic, setTopic] = useState<string>(topics[0]);
    const [isPrivate, setIsPrivate] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedWallet = localStorage.getItem("username") || "";
        if (storedWallet) {
            try {
                const parsedWallet = JSON.parse(storedWallet);
                if (typeof parsedWallet === "object" && parsedWallet !== null) {
                    // Extract a string from the object (e.g., first key or a specific field)
                    setUsername(Object.keys(parsedWallet)[0] || "defaultUsername");
                } else {
                    setUsername(parsedWallet);
                }
            } catch {
                setUsername(storedWallet); // Treat as plain string if parsing fails
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("http://127.0.0.1:5001/create_lobby", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ username, bet: bet.toString(), topic }),
            });
            const data = await response.json();
            console.log("lobby id", data.lobby_id);
            router.push(`/lobby/${data.lobby_id}`);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6 p-6">
            <h2 className="text-3xl font-bold text-white">Create a Lobby</h2>

            {/* Bet Amount Selection */}
            <div className="flex flex-col items-start w-full gap-2 mt-2">
                <p className="text-white">Select Bet Amount:</p>
                <div className="flex gap-3">
                    {betOptions.map((amount) => (
                        <button
                            key={amount}
                            className={`px-4 py-2 rounded-lg ${bet === amount ? "bg-orange text-white" : "bg-gray-300"}`}
                            onClick={() => setBet(amount)}
                        >
                            {amount}
                        </button>
                    ))}
                </div>
            </div>

            <span className="w-full border-t-[1px] border-white border-dashed" />

            {/* Category Selection */}
            <div className="flex flex-col items-start gap-2">
                <p className="text-white">Select Category:</p>
                <div className="grid grid-cols-3 gap-3">
                    {topics.map((cat) => (
                        <button
                            key={cat}
                            className={`px-4 py-2 rounded-lg ${topic === cat ? "bg-orange text-white" : "bg-gray-300"}`}
                            onClick={() => setTopic(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            <span className="w-full border-t-[1px] border-white border-dashed" />

            {/* Private Lobby Selection */}
            <div className="flex items-center gap-4 w-full">
                <p className="text-white">Private Lobby:</p>
                <button
                    className={`px-4 py-2 rounded-lg ${isPrivate ? "bg-green-600 text-white" : "bg-gray-300"}`}
                    onClick={() => setIsPrivate(true)}
                >
                    Yes
                </button>
                <button
                    className={`px-4 py-2 rounded-lg ${!isPrivate ? "bg-red-500 text-white" : "bg-gray-300"}`}
                    onClick={() => setIsPrivate(false)}
                >
                    No
                </button>
            </div>

            <Button className="w-full" onClick={handleSubmit}>
                Create Lobby
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
                Cancel
            </Button>
        </div>
    );
};

export default CreateLobbyPage;
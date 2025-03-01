"use client";
import { useEffect, useState } from "react";
import { socket } from "@/utils/socket";
import Button from "../components/common/Button";
import Image from "next/image";

import KDB from "@/public/images/profile.jpg";
import Alisha from "@/public/images/alisha.jpg";
import { TextInput } from "../components/common/Inputs";

export default function GamePage() {
    const [players, setPlayers] = useState<string[]>([]);
    const [question, setQuestion] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [guess, setGuess] = useState("");


    useEffect(() => {
        // WebSocket bağlantısını dinle
        socket.on("player_joined", (data) => {
            setPlayers(data.players);
            setScores(data.scores);
        });

        socket.on("new_round", (data) => {
            setQuestion(data.question);
            setScores(data.scores);
        });

        socket.on("game_over", (data) => {
            alert(`Oyun bitti! Kazanan: ${data.winner}`);
            setScores(data.scores);
        });

        return () => {
            socket.off("player_joined");
            socket.off("new_round");
            socket.off("game_over");
        };
    }, []);

    const joinGame = () => {
        const username = prompt("Kullanıcı adınızı girin:");
        const topic = "General Culture"; // Sabit konu
        if (username) {
            socket.emit("join_game", { username, topic });
        }
    };

    const submitGuess = () => {
        if (guess) {
            socket.emit("submit_guess", { username: "test_user", guess });
            setGuess("");
        }
    };
    const playerList = Object.keys(scores);
    const scoresList = Object.values(scores);

    return (

        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Are you ready ?</h1>
            {players.length < 2 ? (
                <Button
                    onClick={joinGame}
                >
                    Game Join
                </Button>
            ) : (
                <>
                    {question && (
                        <div className="w-full flex flex-col items-center mt-14 h-screen text-white gap-8 px-6">
                            <h1 className=" text-3xl font-bold">Game ID</h1>
                            <div className=" flex flex-row items-center gap-5">
                                <div className="flex flex-col items-center justify-center gap-5">
                                    <Image
                                        src={KDB}
                                        alt="kdb"
                                        width={56}
                                        height={56}
                                        className="rounded-full"
                                    />
                                    <p>{playerList[0]}: {scoresList[0]}</p>

                                </div>
                                <p className="text-4xl bg-gradient-to-r from-[#8AD4EC] via-[#EF96FF] to-[#FFAA6C] text-transparent bg-clip-text">vs</p>
                                <div className="flex flex-col items-center justify-center gap-5">
                                    <Image
                                        src={Alisha}
                                        alt="alisha"
                                        width={56}
                                        height={56}
                                        className="rounded-full"
                                    />
                                    <p>{playerList[1]}: {scoresList[1]}</p>
                                </div>

                            </div>
                            <div className="w-full flex flex-col items-center justify-center gap-3">
                                <p className="text-sm text-textLabel">QUESTION</p>
                                <div className="flex items-center justify-center gap-5 bg-bg p-4 rounded-3xl w-full">
                                    <p>{question}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center ">
                                <p className="text-textLabel text-[48px] font-bold">15</p>
                                <p className="text-textLabel text-[16px] font-bold">SECOND</p>
                            </div>
                            <div className="w-full flex flex-col items-center justify-center gap-3">
                                <TextInput
                                    placeholder="Enter your answer"
                                    className="w-full bg-bg text-textLabel text-sm p-4 rounded-3xl"
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                />
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    onClick={submitGuess}
                                >
                                    Submit</Button>
                            </div>

                        </div>
                    )}
                </>
            )}
        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import KDB from "@/public/images/profile.jpg";
import Alisha from "@/public/images/alisha.jpg";
import Button from "../../components/common/Button";
import { TextInput } from "../../components/common/Inputs";
import { io } from "socket.io-client";

export default function GamePage() {
    const [question, setQuestion] = useState<string | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({});
    const [guess, setGuess] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [timer, setTimer] = useState<number | null>(null);
    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

    useEffect(() => {
        const newSocket = io("http://127.0.0.1:5001", {
            transports: ["websocket"],
        });
        setSocket(newSocket);

        newSocket.on("connect", () => {
            setIsConnected(true);
            console.log("Socket bağlandı!");
            newSocket.emit("join_lobby", { lobby_id: "test_lobby" }); // Dinamik lobby_id ekle
        });

        newSocket.on("connect_error", (error) => {
            setIsConnected(false);
            console.error("Bağlantı hatası:", error.message);
        });

        newSocket.on("player_joined", (data) => {
            console.log("Player joined:", data);
            setScores(data.scores);
        });

        newSocket.on("new_round", (data) => {
            console.log("Yeni tur verisi:", data);
            setQuestion(data.question);
            setScores(data.scores);
            setTimer(data.timer);
        });

        newSocket.on("game_over", (data) => {
            console.log("Game over:", data);
            alert(`Oyun bitti! Kazanan: ${data.winner}`);
            setScores(data.scores);
        });

        newSocket.on("disconnect", () => {
            setIsConnected(false);
            console.log("Socket disconnected!");
        });

        return () => {
            newSocket.off("connect");
            newSocket.off("connect_error");
            newSocket.off("player_joined");
            newSocket.off("new_round");
            newSocket.off("game_over");
            newSocket.off("disconnect");
            newSocket.disconnect();
        };
    }, [isConnected]);

    useEffect(() => {
        console.log("✅ Güncellenen soru:", question);
    }, [question]);

    useEffect(() => {
        if (timer === null || timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => (prev && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const submitGuess = () => {
        if (guess && socket) {
            socket.emit("submit_guess", { username: "test_user", guess });
            setGuess("");
        }
    };

    const playerList = Object.keys(scores);
    const scoresList = Object.values(scores);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <div className="w-full flex flex-col items-center mt-14 h-screen text-white gap-8 px-6">
                <h1 className="text-3xl font-bold">Game ID</h1>
                <div className="flex flex-row items-center gap-5">
                    <div className="flex flex-col items-center justify-center gap-5">
                        <Image src={KDB} alt="kdb" width={56} height={56} className="rounded-full" />
                        <p>{playerList[0] || "Player 1"}: {scoresList[0] || 0}</p>
                    </div>
                    <p className="text-4xl bg-gradient-to-r from-[#8AD4EC] via-[#EF96FF] to-[#FFAA6C] text-transparent bg-clip-text">vs</p>
                    <div className="flex flex-col items-center justify-center gap-5">
                        <Image src={Alisha} alt="alisha" width={56} height={56} className="rounded-full" />
                        <p>{playerList[1] || "Player 2"}: {scoresList[1] || 0}</p>
                    </div>
                </div>
                <div className="w-full flex flex-col items-center justify-center gap-3">
                    <p className="text-sm text-textLabel">QUESTION</p>
                    <div className="flex items-center justify-center gap-5 bg-bg p-4 rounded-3xl w-full">
                        {question ? <p>{question}</p> : <p>Question waiting...</p>}
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-textLabel text-[48px] font-bold">{timer !== null ? timer : 15}</p>
                    <p className="text-textLabel text-[16px] font-bold">SECOND</p>
                </div>
                <div className="w-full flex flex-col items-center justify-center gap-3">
                    <TextInput
                        placeholder="Enter your answer"
                        className="w-full bg-bg text-textLabel text-sm p-4 rounded-3xl"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                    />
                    <Button variant="primary" className="w-full" onClick={submitGuess}>
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    );
}
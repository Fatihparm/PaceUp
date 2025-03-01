"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:5001");


export default function JoinLobby() {
    const [lobbyId, setLobbyId] = useState("");
    const [username, setUsername] = useState("")
    const router = useRouter();

    useEffect(() => {
        setUsername(localStorage.getItem("username") || "")
        socket.on("lobby_update", () => {
            router.push(`/lobby/${lobbyId}`);
        });
        socket.on("error", (data) => {
            console.error(data.message);
        });

        return () => {
            socket.off("lobby_update");
            socket.off("error");
        };
    }, [lobbyId, router]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!lobbyId.trim()) return;
        console.log('username', username)
        socket.emit("join_lobby", { lobby_id: lobbyId, username: username });
    };

    return (
        <div className="flex flex-col items-center mt-10">
            <h1 className="text-2xl font-bold mb-4">Lobiye Katıl</h1>
            <input
                type="text"
                value={lobbyId}
                onChange={(e) => setLobbyId(e.target.value)}
                placeholder="Lobi ID giriniz"
                className="border rounded p-2 mb-2"
                required
            />
            <button
                onClick={handleJoin}
                className="bg-blue-500 text-white px-4 py-2 rounded">
                Katıl
            </button>
        </div>
    );
}

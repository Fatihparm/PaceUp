"use client";

import { useEffect, useState } from "react";

interface Lobby {
    status: string;
    players: { [key: string]: { id: string; name: string; score: number } };
    topic: string;
    bet: number;
}
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import GameCard from "../components/GameCard";
import Image from "next/image";
import VsImage from "@/public/images/vs.jpg";

const socket = io("http://127.0.0.1:5001");

const Lobbies = () => {
    const [activeTab, setActiveTab] = useState<"active" | "upcoming">("active");
    const [activeLobbies, setActiveLobbies] = useState<[string, Lobby][]>([]);
    const [upcomingLobbies, setUpcomingLobbies] = useState<[string, Lobby][]>([]);
    const [username, setUsername] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchLobbies = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5001/api/lobbies");
                const data = await response.json();

                const lobbiesArray = Object.entries(data) as [string, Lobby][];
                const active = lobbiesArray.filter(([, lobby]) => lobby.status === "waiting" && Object.keys(lobby.players).length < 2);
                const upcoming = lobbiesArray.filter(([, lobby]) => lobby.status === "upcoming");

                setActiveLobbies(active);
                setUpcomingLobbies(upcoming);
                setIsLoaded(true); // Veriler yüklendikten sonra state'i true yapın
            } catch (error) {
                console.error("Lobiler alınırken hata oluştu", error);
            }
        };

        fetchLobbies();

        socket.on("lobby_update", (data) => {
            const lobbiesArray = Object.entries(data.lobbies) as [string, Lobby][];
            const active = lobbiesArray.filter(([, lobby]) => lobby.status === "waiting" && Object.keys(lobby.players).length < 2);
            const upcoming = lobbiesArray.filter(([, lobby]) => lobby.status === "upcoming");

            setActiveLobbies(active);
            setUpcomingLobbies(upcoming);
        });

        return () => {
            socket.off("lobby_update");
        };
    }, []);

    useEffect(() => {
        const storedUsername = sessionStorage.getItem("username");
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    const handleJoinLobby = (lobbyId: string) => {
        // localStorage'den kullanıcı adını alıyoruz
        const storedUsername = localStorage.getItem("username");

        // Eğer kullanıcı adı yoksa, kullanıcıya bir uyarı veriyoruz
        if (!storedUsername) {
            alert("Please enter a username");
            return;
        }

        // Eğer kullanıcı adı varsa, onu kullanıyoruz
        socket.emit("join_lobby", { lobby_id: lobbyId, username: storedUsername });
        sessionStorage.setItem("username", storedUsername);
        console.log('username', username)
        console.log('storedUsername', storedUsername)

        socket.on("lobby_update", () => {
            router.push(`/lobby/${lobbyId}`);
        });

        socket.on("error", (data: { message: string }) => {
            console.error(data.message);
        });
    };

    if (!isLoaded) return <div>Loading...</div>; // Veriler yüklendiğinde render et

    return (
        <div className="flex flex-col gap-6 p-6 mt-4 items-center ">
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
            <div className={`w-full ${activeTab === "upcoming" ? "grid-cols-1" : "grid-cols-2 gap-4 grid"} `}>
                {activeTab === "active" ? (
                    activeLobbies.length > 0 ? (
                        activeLobbies.map(([lobbyId, lobby]) => (
                            <div
                                key={lobbyId}
                                className="flex flex-col items-center justify-center cursor-pointer"
                                onClick={() => handleJoinLobby(lobbyId)} // onClick eventini doğru şekilde kullanın
                            >
                                <Image src={VsImage} width={200} height={200} alt="game" className="rounded-t-xl" />
                                <div className="flex flex-col w-full gap-[8px] items-center justify-center text-xs bg-black py-[14px] px-[10px] rounded-b-xl">
                                    <p className="text-base text-white font-medium text-nowrap">Category: {lobby.topic}</p>
                                    <div className="bg-orange px-1 py-1 rounded-[4px] flex flex-row items-center justify-center text-center w-full">
                                        <p className="text-base text-white font-medium text-nowrap">Bet: {lobby.bet}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No active lobbies available.</p>
                    )
                ) : (
                    upcomingLobbies.length > 0 ? (
                        upcomingLobbies.map(([lobbyId, lobby]) => (
                            <div key={lobbyId}>
                                <GameCard
                                    handleJoinLobby={handleJoinLobby}
                                    key={lobbyId}
                                    id={lobby.bet}
                                    bet={lobby.bet}
                                    category={lobby.topic}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-xl">No upcoming games available.</p>
                    )
                )}
            </div>
        </div>
    );
};

export default Lobbies;

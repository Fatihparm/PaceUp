"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { SigningStargateClient } from "@cosmjs/stargate";
import { io } from "socket.io-client";

import Button from "../../components/common/Button";
import Image from "next/image";

import KDB from "@/public/images/profile.jpg";
import Alisha from "@/public/images/alisha.jpg";
import { LuBadgeCheck, LuBadgeMinus, LuShare2 } from "react-icons/lu";

// const SOCKET_SERVER_URL = "http://127.0.0.1:5001";

const MOCHA_RPC = "http://localhost:5001/proxy/rpc"; // Backend proxy
const MOCHA_CHAIN_ID = "mocha-4";
const TIA_DENOM = "utia";
const RECIPIENT_ADDRESS = "celestia1xr5924jtcek2c8ppqmg5ef9jyhpu6m5jnxs776";
const TRANSFER_AMOUNT = "500";



const LobbyPage = () => {
    // const socket = io("http://127.0.0.1:5001");

    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [lobbyData, setLobbyData] = useState<{ bet: number; topic: string, owner: string } | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const [readyStatus, setReadyStatus] = useState({ 1: false, 2: false });

    const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [username, setUsername] = useState("");

    const [players, setPlayers] = useState(1);
    const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);



    const lobbyId = pathname.split("/").pop();

    const handlePurchase = async () => {
        setLoading(true);
        setError(null);
        setTxHash(null);

        try {
            if (!window.keplr) {
                throw new Error("Please install the Keplr extension.");
            }

            await window.keplr.enable(MOCHA_CHAIN_ID);

            await window.keplr.experimentalSuggestChain({
                chainId: MOCHA_CHAIN_ID,
                chainName: "Mocha Testnet",
                rpc: MOCHA_RPC, // Proxy endpoint
                rest: "https://api-mocha.pops.one",
                bip44: { coinType: 118 },
                bech32Config: {
                    bech32PrefixAccAddr: "celestia",
                    bech32PrefixAccPub: "celestiapub",
                    bech32PrefixValAddr: "celestiavaloper",
                    bech32PrefixValPub: "celestiavaloperpub",
                    bech32PrefixConsAddr: "celestiavalcons",
                    bech32PrefixConsPub: "celestiavalconspub",
                },
                currencies: [
                    { coinDenom: "TIA", coinMinimalDenom: TIA_DENOM, coinDecimals: 6, coinGeckoId: "celestia" },
                ],
                feeCurrencies: [
                    { coinDenom: "TIA", coinMinimalDenom: TIA_DENOM, coinDecimals: 6, gasPriceStep: { low: 0.1, average: 0.2, high: 0.4 } },
                ],
                stakeCurrency: { coinDenom: "TIA", coinMinimalDenom: TIA_DENOM, coinDecimals: 6 },
            });

            const offlineSigner = window.keplr.getOfflineSigner(MOCHA_CHAIN_ID);
            const client = await SigningStargateClient.connectWithSigner(MOCHA_RPC, offlineSigner);
            const accounts = await offlineSigner.getAccounts();
            const senderAddress = accounts[0].address;

            const fee = {
                amount: [{ denom: TIA_DENOM, amount: "5000" }],
                gas: "200000",
            };

            const result = await client.sendTokens(
                senderAddress,
                RECIPIENT_ADDRESS,
                [{ denom: TIA_DENOM, amount: TRANSFER_AMOUNT }],
                fee,
                "Purchase transfer via Keplr"
            );

            if (result.code !== 0) {
                console.log('first');
            }

            setTxHash(result.transactionHash.startsWith("0x") ? result.transactionHash : "0x" + result.transactionHash);
            if (txHash) {
                sendTxHashToAPI(txHash); // API çağrısını burada yapıyoruz
            }
            handleReady();


        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "An error occurred during the transaction.");
            } else {
                setError("An unknown error occurred during the transaction.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isValid === true) {
            console.log("verificationMessage", verificationMessage);
        } else if (isValid === false) {
            console.log("calismadi");
        }
    }, [isValid, verificationMessage]);

    const sendTxHashToAPI = async (txHash: string) => {
        try {
            const response = await fetch("http://172.86.68.11:5001/verify_transfer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ tx_hash: txHash }),
            });

            if (!response.ok) {
                throw new Error("API request failed.");
            }
            const data = await response.json();
            console.log("Successfully sent to API:", txHash);
            window.alert("Transaction successful! Tx Hash: " + txHash);

            // isValid ve verificationMessage güncelleniyor
            setIsValid(data.valid ?? null);
            setVerificationMessage(data.message || "Unknown response");

            // Kullanıcının adresini al ve owner ile kıyasla
            const offlineSigner = window.keplr.getOfflineSigner(MOCHA_CHAIN_ID);
            const accounts = await offlineSigner.getAccounts();
            const userAddress = accounts[0].address;

            setReadyStatus((prev) => {
                const isPlayer1 = userAddress === lobbyData?.owner;
                const updatedStatus = { ...prev, [isPlayer1 ? 1 : 2]: true };
                if (updatedStatus[1] && updatedStatus[2]) {
                    if (socket) {
                        socket.emit("ready", { lobby_id: lobbyId });
                    }
                    router.push("/game-screen");
                }
                return updatedStatus;
            });
        } catch (error) {
            console.error("Error while sending to API:", error);
            setIsValid(false);
            setVerificationMessage("API verification failed");
        }
    };

    useEffect(() => {
        const username = localStorage.getItem("username");
        console.log('username', username)// JSON.parse kullanmadan direkt al
        if (username) {
            setUsername(username);
        }
    }, []);


    useEffect(() => {
        const newSocket = io("http://127.0.0.1:5001");
        setSocket(newSocket);

        newSocket.on("connect", () => console.log("Socket bağlandı"));
        newSocket.on("start_game", (data) => {
            console.log("Oyun başlıyor:", data);
            if (data?.lobby_id) router.push(`/game/${data.lobby_id}`);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [router]);

    useEffect(() => {
        if (!socket || !lobbyId) return;

        socket.emit("join_lobby", { username, lobby_id: lobbyId });

        socket.on("lobby_update", (data) => {
            console.log("Lobby update:", data);
            setReadyStatus((prev) => ({ ...prev, ...data.readyStatus }));
            if (data.players) setPlayers(data.players.length);
        });

        return () => {
            socket.off("lobby_update");
        };
    }, [socket, lobbyId, username]);

    const handleReady = () => {
        if (socket) {
            socket.emit("ready", { lobby_id: lobbyId, username });
        }
    };

    const { id } = useParams();
    // 1/2 kişi olarak başlar
    // const [readyStatus, setReadyStatus] = useState<{ [key: number]: boolean }>({
    //     1: false,
    //     2: false,
    // });

    useEffect(() => {
        // Eğer lobbyId yoksa, yüklemeye gerek yok
        if (!lobbyId) return;

        // API'den lobileri alıyoruz
        const fetchLobbies = async () => {
            try {
                const response = await fetch("http://127.0.0.1:5001/api/lobbies");
                const data = await response.json();

                // Lobby verilerini tarayıp lobbyId'ye eşleşen veriyi buluyoruz
                const foundLobby = Object.entries(data).find(
                    ([id]) => id === lobbyId
                );

                if (foundLobby) {
                    const [, lobby] = foundLobby; // Eşleşen lobby verisini alıyoruz
                    setLobbyData({
                        bet: (lobby as { bet: number; topic: string, owner: string }).bet,
                        topic: (lobby as { bet: number; topic: string, owner: string }).topic,
                        owner: (lobby as { bet: number; topic: string, owner: string }).owner,
                    });
                } else {
                    setError("Lobby not found");
                }
            } catch (error) {
                setError("Error fetching lobby data");
                console.error(error);
            }
        };

        fetchLobbies();
    }, [lobbyId]); // lobbyId değiştiğinde tekrar çalışsın



    const handleCopyLink = () => {
        // Panoya kopyalama işlemi
        if (typeof id === 'string') {
            navigator.clipboard.writeText(id)
                .then(() => {
                    alert('Invitation code successfully copied !');
                })
                .catch(err => {
                    console.error('Error copying invitation code', err);
                    alert('Copy operation failed');
                });
        } else {
            alert('Invalid invitation link');
        }
    };

    return (
        <div className="flex flex-col min-h-screen p-6 bg-gray-900 text-white">
            <div className="flex flex-row justify-center items-center gap-4 my-8">
                <h1 className="text-2xl font-bold ">Lobby Invite</h1>
                <LuShare2 className="text-2xl hover:text-orange"
                    onClick={handleCopyLink}
                />
            </div>

            <div className="flex flex-col justify-center p-6 bg-gray-900 text-white items-center">

                <div className="flex flex-row items-center gap-5">
                    <div className="flex flex-col items-center gap-3">
                        <Image
                            src={KDB}
                            alt="kdb"
                            width={56}
                            height={56}
                            className="rounded-full"
                        />
                        <div>
                            {readyStatus[1] === true ? <LuBadgeCheck className="text-green-500" /> : <LuBadgeMinus className="text-red-500" />}
                        </div>
                    </div>
                    <p className="text-4xl bg-gradient-to-r from-[#8AD4EC] via-[#EF96FF] to-[#FFAA6C] text-transparent bg-clip-text">vs</p>
                    <div className="flex flex-col items-center gap-3">
                        <Image
                            src={Alisha}
                            alt="alisha"
                            width={56}
                            height={56}
                            className="rounded-full"
                        />
                        <div>
                            {readyStatus[2] === true ? <LuBadgeCheck className="text-green-500" /> : <LuBadgeMinus className="text-red-500" />}
                        </div>
                    </div>
                </div>



                {/* Category & Bet Info */}
                <div className="text-lg bg-gray-800 px-4 py-2 rounded-lg mt-2 border-2 border-orange">
                    <p>Category : <span className="font-semibold text-orange">{lobbyData?.topic}</span></p>
                    <p>Bet Amount : <span className="font-semibold text-orange">{lobbyData?.bet}</span></p>
                </div>

                {/* Player Status */}
                <div className="flex flex-col gap-2 mt-6 w-full items-center">
                    <div className="text-lg">
                        <p>Players: {players}/2</p>
                        {/* <ul>
                            {players.map((player, index) => (
                                <li key={index} className="text-orange">{player}</li>
                            ))}
                        </ul> */}
                    </div>
                    <Button className="w-full" variant="ghost"
                        onClick={handlePurchase}>
                        {readyStatus[1] ? "Not Ready" : "Ready"}
                    </Button>
                    <p>
                        Payment Status:
                        {loading ? "Processing..." : txHash ? "Successful" : "Waiting"}
                    </p>

                </div>

                {txHash && (
                    <div className="flex flex-col w-full">
                        <h3>Transaction Successful!</h3>
                        <p className="text-wrap">Transaction Hash: {txHash}</p>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: "20px", color: "red" }}>
                        <h3>Error</h3>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LobbyPage;

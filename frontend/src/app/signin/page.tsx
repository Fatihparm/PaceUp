"use client";

import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import LoginImage from '@/public/images/login-image.png';
import Image from 'next/image';
import { useRouter } from "next/navigation";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        keplr: any;
    }
}

const CHAIN_ID = "mocha-4"; // Celestia Testnet Chain ID
const RPC_URL = "https://rpc-mocha.pops.one"; // Celestia Testnet RPC URL

const CelestiaWallet = () => {

    const router = useRouter();

    const [username, setusername] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [publicKeyBase64, setPublicKeyBase64] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const sendSignedDataToAPI = async () => {
        if (!username || !signature || !publicKeyBase64 || !message) {
            setError("You must sign first.");
            return;
        }

        const postData = {
            username,
            signature,
            publicKeyBase64,
            message,
        };

        try {
            const response = await fetch("http://127.0.0.1:5001/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                throw new Error("API request failed.");
            }

            const result = await response.json();
            console.log("API Response:", result);
            alert("Signature verification successful!");
        } catch (error) {
            console.error("Error sending data to the API:", error);
            setError("Error sending data to API.");
        }
    };

    useEffect(() => {
        const fetchAddress = async () => {
            if (typeof window !== "undefined" && window.keplr) {
                try {
                    await window.keplr.enable(CHAIN_ID);
                    const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
                    const accounts = await offlineSigner.getAccounts();
                    const address = accounts[0].address;
                    setusername(address);
                    localStorage.setItem('username', address);  // localStorage kaydetme burada yapılmalı
                } catch (err) {
                    console.error(err);
                    setError("Wallet connection failed.");
                }
            }
        };

        fetchAddress();
    }, []);

    const suggestCelestiaChain = async () => {
        if (!window.keplr) return;

        try {
            await window.keplr.experimentalSuggestChain({
                chainId: CHAIN_ID,
                chainName: "Celestia Mocha Testnet",
                rpc: RPC_URL,
                rest: "https://rest-mocha.pops.one",
                stakeCurrency: {
                    coinDenom: "TIA",
                    coinMinimalDenom: "utia",
                    coinDecimals: 6,
                },
                bip44: { coinType: 118 },
                bech32Config: {
                    bech32PrefixAccAddr: "celestia",
                    bech32PrefixAccPub: "celestia" + "pub",
                    bech32PrefixValAddr: "celestia" + "valoper",
                    bech32PrefixValPub: "celestia" + "valoperpub",
                    bech32PrefixConsAddr: "celestia" + "valcons",
                    bech32PrefixConsPub: "celestia" + "valconspub",
                },
                currencies: [
                    {
                        coinDenom: "TIA",
                        coinMinimalDenom: "utia",
                        coinDecimals: 6,
                    },
                ],
                feeCurrencies: [
                    {
                        coinDenom: "TIA",
                        coinMinimalDenom: "utia",
                        coinDecimals: 6,
                    },
                ],
                coinType: 118,
                gasPriceStep: {
                    low: 0.01,
                    average: 0.025,
                    high: 0.04,
                },
            });
        } catch (error) {
            console.error("Zincir eklenirken hata oluştu:", error);
            setError("Zincir eklenirken hata oluştu.");
        }
    };

    const connectWallet = async () => {
        if (!window.keplr) {
            setError("Keplr wallet is not installed. Please install it.");
            return;
        }

        try {
            await suggestCelestiaChain();
            await window.keplr.enable(CHAIN_ID);
            const offlineSigner = window.keplr.getOfflineSigner(CHAIN_ID);
            const accounts = await offlineSigner.getAccounts();
            setusername(accounts[0].address);
            localStorage.setItem('username', accounts[0].address);  // Cüzdan adresini kaydediyoruz
            setError(null);
        } catch (err) {
            setError("Wallet connection failed.");
            console.error(err);
        }
    };

    const signWithKeplr = async () => {
        if (!window.keplr) {
            setError("Keplr Wallet not found! Please install the Keplr plugin.");
            return;
        }

        const message = "Bu mesajı imzalayarak giriş yapıyorsunuz.";

        try {
            const accounts = await window.keplr.getKey(CHAIN_ID);
            const username = accounts.bech32Address;
            const signResult = await window.keplr.signArbitrary(CHAIN_ID, username, message);

            setSignature(signResult.signature);
            setPublicKeyBase64(signResult.pub_key.value);
            setMessage(message);
            setError(null);

            // Burada adresi kaydediyoruz
            localStorage.setItem('username', username);

            sendSignedDataToAPI();
            router.push("/");
        } catch (error) {
            setError("Error getting signature.");
            console.error(error);
        }
    };

    return (
        <div className='flex flex-col justify-center items-center h-screen gap-4 px-6'>
            <Image src={LoginImage} className='rounded' width={342} height={180} alt='Login Image' />
            <h1 className='text-4xl font-semibold'>Welcome Back  👋</h1>
            <p className='text-base'>Today is a new day. This is your day. Let&apos;s race.</p>
            <div className="bg-gray p-6 rounded-lg shadow-lg text-wrap w-full">
                {username ? (
                    <div className='flex flex-col gap-4 w-full items-center justify-center text-center'>
                        <h1 className="text-2xl font-bold mb-2">Please connect your wallet to log in</h1>
                        <Button
                            variant='primary'
                            className='w-full'
                            onClick={signWithKeplr}
                        >
                            Sign to message
                        </Button>
                    </div>
                ) : (
                    <div className='flex flex-col gap-4 w-full items-center justify-center text-center'>
                        <h1 className="text-xl font-medium mb-4">Please connect your wallet to login</h1>
                        <Button
                            variant='primary'
                            onClick={connectWallet}
                            className="w-full"
                        >
                            Connect Wallet
                        </Button>
                    </div>
                )}

                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    );
};

export default CelestiaWallet;

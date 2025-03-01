"use client"

import React, { useEffect, useState } from 'react';
import ProfileCard from '../components/common/ProfileCard';
import GameHistoryCard from '../components/game-history/GameHistoryCard';

interface GameHistory {
    block_height: number;
    game_id: string;
    is_player1: boolean;
    namespace: string;
    player1: string;
    player2: string;
}

const GameHistoryPage: React.FC = () => {
    const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);

    useEffect(() => {
        const fetchGameHistory = async () => {
            try {
                const response = await fetch('http://172.86.68.11:5001/get_player_history', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZWxlc3RpYTEzam5jbXI2ZnVqZDdsNm02N3k4NzRwNGtxcG1meGE3dWd5czV2YyIsIndhbGxldEFkZHJlc3MiOiJjZWxlc3RpYTEzam5jbXI2ZnVqZDdsNm02N3k4NzRwNGtxcG1meGE3dWd5czV2YyIsImlhdCI6MTc0MDc3MTg4OSwiZXhwIjoxNzQwNzc1NDg5fQ.eQfXBzKH7w6-rVBnHu-D8gW59k9k4Yp4ezBP9o7JX4w`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch');
                const data: GameHistory[] = await response.json();
                setGameHistory(data);
            } catch (error) {
                console.error('Error fetching game history:', error);
            }
        };

        fetchGameHistory();
    }, []);

    return (
        <div className='flex flex-col gap-4 items-center p-6'>
            <h1 className='text-2xl text-white '>Game History</h1>
            <ProfileCard />
            <div className='flex flex-col gap-[10px] w-full mt-10'>
                {gameHistory.length > 0 ? (
                    gameHistory.map((game, index) => (
                        <GameHistoryCard
                            key={game.game_id || index}
                            date={`Block Height: ${game.block_height}`}
                            result={game.is_player1 ? 'Player 1' : 'Player 2'}
                            game_id={game.game_id}
                        />
                    ))
                ) : (
                    <p className="text-white">No game history available.</p>
                )}
            </div>
        </div>
    );
};

export default GameHistoryPage;

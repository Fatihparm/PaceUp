import Image from 'next/image'
import React from 'react'
import GameIcon from '@/public/game.png'

type GameHistoryProps = {
    date: string
    result: string
    game_id: string
}

const GameHistoryCard = ({ date, game_id }: GameHistoryProps) => {
    return (
        <div className='flex flex-row w-full bg-bg rounded-2xl px-5 py-[10px] justify-between items-center'>
            <div className='flex flex-row items-center gap-5  w-full justify-between'>
                <div className='flex flex-row items-center gap-5'>
                    <Image src={GameIcon} alt='game' className='w-10 h-10 ' />
                    <p className='text-sm font-medium text-white'>{date}</p>
                </div>
                <div className='flex flex-row gap-1 '>
                    <p className='text-sm font-medium text-white'>Result:</p>
                    {/* <p className={`text-sm font-medium ${result === "win" ? "text-green-500" : "text-red-500"}`}>
                        {result === "win" ? `+ ${bet}` : `- ${bet}`}
                    </p> */}
                    <p className='text-sm font-medium'>{game_id}</p>

                </div>
            </div>
        </div>
    )
}

export default GameHistoryCard
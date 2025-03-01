import Image, { StaticImageData } from 'next/image'
import React from 'react'
import AvatarImg from '@/public/images/avatar.jpg'
import GoldMedal from '@/public/medals/gold.svg'
import SilverMedal from '@/public/medals/silver.svg'
import BronzeMedal from '@/public/medals/bronze.svg'

type ListBoxProps = {
    number: number
    nickname: string
    avatar?: string
    points: number
}
const avatarMap: { [key: number]: StaticImageData } = {
    1: GoldMedal,
    2: SilverMedal,
    3: BronzeMedal,
};

const ListBox: React.FC<ListBoxProps> = ({ number, avatar, points, nickname }) => {
    return (
        <div className='w-full flex flex-row gap-4 p-4 bg-[#1F1F1F] rounded-[20px] items-center justify-between'>
            <div className='w-6 h-6 rounded-full border-[#696969] border-2 flex items-center justify-center'>
                <p className='text-xs font-medium text-[#696969]'>{number}</p>
            </div>
            <div className='flex flex-row items-center w-full justify-between'>
                <div className='flex items-center gap-4'>
                    <Image
                        src={avatar || AvatarImg}
                        alt='profile'
                        className='w-10 h-10 rounded-full' />
                    <div className='flex flex-col gap-1 '>
                        <p className='text-sm font-medium text-white'>@ {nickname}</p>
                        <p className='text-xs font-medium text-[#858494]'>{points}</p>
                    </div>
                </div>
                {avatarMap[number] && (
                    <Image src={avatarMap[number]} alt="profile" className="w-10 h-10 " />
                )}
            </div>

        </div>
    )
}

export default ListBox
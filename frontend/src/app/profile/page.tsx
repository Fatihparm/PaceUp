"use client";

import React from 'react'
import ProfileCard from '../components/common/ProfileCard'
import ProfileListBoxes from '../components/profile/ProfileListBoxes'
import GameIcon from '@/public/game-icon.svg'
import SettingsIcon from '@/public/set.svg'
import SupportIcon from '@/public/sup.svg'
import SignOutIcon from '@/public/sign-out.svg'
import { useRouter } from 'next/navigation'


const ProfilePage = () => {
    const router = useRouter();

    return (
        <div className='flex flex-col gap-4 items-center p-6'>
            <h1 className='text-2xl text-white '>Profile</h1>
            <ProfileCard />
            <div className='flex flex-col gap-5 w-full mt-10'>
                <ProfileListBoxes
                    avatar={GameIcon}
                    text='Game History'
                    detail
                    onClick={() => router.push("/game-history")}
                />
                <ProfileListBoxes avatar={SettingsIcon} text='Settings' detail />
                <ProfileListBoxes avatar={SupportIcon} text='Support' detail />
                <ProfileListBoxes avatar={SignOutIcon} text='Sign Out' />
            </div>
        </div>
    )
}

export default ProfilePage
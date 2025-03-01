import Image from 'next/image'
import React from 'react'

import ProfileImg from '@/public/images/profile.jpg'


const ProfileCard = () => {
    return (
        <div className='bg-[#1B1B1B] gap-5 rounded-3xl flex flex-row px-8 py-4 w-full'>
            <Image
                src={ProfileImg}
                width={80}
                height={80}
                className='rounded-2xl'
                alt='profile-image' />
            <div className='flex flex-col gap-2 w-full justify-center'>
                <h2 className='text-white text-xl'>Kevin De Bruyne</h2>
                <p className='text-gray-400 text-base'>
                    kdb17@gmail.com
                </p>
            </div>
        </div>
    )
}

export default ProfileCard
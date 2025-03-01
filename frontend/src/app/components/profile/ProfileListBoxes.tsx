import Image, { StaticImageData } from 'next/image'
import React from 'react'
import RightArrowSVG from '@/public/right-arrow.svg'

type Props = {
    avatar: StaticImageData | string
    text: string
    detail?: boolean
    onClick?: () => void
}

const ProfileListBoxes = ({ avatar, text, detail, onClick }: Props) => {
    return (
        <div
            className='flex flex-row w-full bg-bg rounded-2xl px-5 py-[10px] justify-between items-center cursor-pointer'
            onClick={onClick}
        >
            <div className='flex flex-row items-center gap-5'>
                <Image
                    src={avatar}
                    alt='profile'
                    className='w-10 h-10 rounded-full'
                />
                <p className='text-sm font-medium text-white'>{text}</p>
            </div>
            {detail && <Image src={RightArrowSVG} alt='right-arrow' />}
        </div>
    )
}

export default ProfileListBoxes

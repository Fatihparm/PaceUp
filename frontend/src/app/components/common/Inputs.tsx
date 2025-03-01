"use client";

import React, { ComponentPropsWithRef } from "react";
import { twMerge } from "tailwind-merge";

export type InputValidationProps = {
    error?: string;
};

export const TextInput = React.forwardRef<
    HTMLInputElement,
    ComponentPropsWithRef<"input"> & InputValidationProps
>(({ className, onClick, error, ...rest }, ref) => {
    function focusAndClick(e: React.MouseEvent<HTMLInputElement, MouseEvent>) {
        e.currentTarget.value = e.currentTarget.value + "";
        onClick?.(e);
    }

    return (
        <input
            ref={ref}
            onClick={focusAndClick}
            className={twMerge(
                "w-full h-[42px] rounded-[50px] py-4 pl-4 text-sm font-medium text-textGray bg-gray placeholder:text-textGray",
                "outline outline-1 outline-inputStroke focus-visible:outline-black",
                error &&
                "outline-red-500 focus-visible:outline-red-500 ",
                className
            )}
            {...rest}
        />
    );
});

TextInput.displayName = "TextInput";
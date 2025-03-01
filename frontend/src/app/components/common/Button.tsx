import { twMerge } from "tailwind-merge";
import Spinner from '@/public/spinner.svg';

import * as React from "react";
import clsx from "clsx";

type ButtonProps = {
    isLoading?: boolean;
    variant?: "primary" | "ghost" | "white";
} & React.ComponentPropsWithRef<"button">;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            className,
            disabled: buttonDisabled,
            isLoading = false,
            variant = "primary",
            ...rest
        },
        ref
    ) => {
        const disabled = isLoading || buttonDisabled;

        return (
            <button
                ref={ref}
                type="button"
                disabled={disabled}
                className={twMerge(
                    "items-center rounded-[50px] px-[14px] py-2.5 text-base font-medium",
                    //#region  //*=========== Variants ===========
                    [
                        variant === "primary" && [
                            "bg-linear-custom text-white",
                            "hover:opacity-70",
                        ],
                        variant === "ghost" && [
                            "bg-gray text-white",
                            "hover:opacity-50",
                        ],
                        variant === "white" && [
                            "bg-white text-black",
                            "hover:opacity-70",
                        ],
                    ],
                    //#endregion  //*======== Variants ===========
                    "disabled:cursor-not-allowed",
                    isLoading &&
                    "relative text-transparent transition-none disabled:cursor-wait disabled:text-transparent [&>*:not(.loading)]:invisible",
                    className
                )}
                {...rest}
            >
                {isLoading && (
                    <div
                        className={clsx(
                            "loading absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                            variant == "primary" && "text-white",
                            variant == "ghost" && "text-black dark:text-darkText"
                        )}
                    >
                        <Spinner className="animate-spin" />

                    </div>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;

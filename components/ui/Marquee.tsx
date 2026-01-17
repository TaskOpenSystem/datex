"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React from "react";

interface MarqueeProps {
    className?: string;
    reverse?: boolean;
    pauseOnHover?: boolean;
    children?: React.ReactNode;
    vertical?: boolean;
    repeat?: number;
    duration?: number;
}

export default function Marquee({
    className,
    reverse,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    duration = 20,
    ...props
}: MarqueeProps) {
    return (
        <div
            {...props}
            className={cn(
                "group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
                {
                    "flex-row": !vertical,
                    "flex-col": vertical,
                },
                className
            )}
            style={{
                "--duration": `${duration}s`,
            } as React.CSSProperties}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: reverse ? "-100%" : "0%" }}
                        animate={{ x: reverse ? "0%" : "-100%" }}
                        transition={{
                            duration,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
                            "animate-marquee flex-row": !vertical,
                            "animate-marquee-vertical flex-col": vertical,
                            "group-hover:[animation-play-state:paused]": pauseOnHover,
                            "[animation-direction:reverse]": reverse,
                        })}
                    >
                        {children}
                    </motion.div>
                ))}
        </div>
    );
}

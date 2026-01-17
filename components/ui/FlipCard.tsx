"use client";

import { motion } from "motion/react";
import React from "react";
import { cn } from "@/lib/utils";

interface FlipCardProps {
    children: React.ReactNode;
    backChildren: React.ReactNode;
    className?: string;
    href?: string;
    duration?: number;
}

export default function FlipCard({
    children,
    backChildren,
    className,
    href,
    duration = 0.6,
    ...props
}: FlipCardProps & React.ComponentProps<"a"> & React.ComponentProps<"button">) {
    const Tag = href ? "a" : "button";

    return (
        <Tag
            href={href}
            className={cn(
                "group/card relative block h-14 w-48 cursor-pointer border-none bg-transparent p-0",
                className
            )}
            style={{ perspective: 1000 }}
            {...props}
        >
            <motion.div
                className="relative h-full w-full transition-all duration-500 [transform-style:preserve-3d] group-hover/card:[transform:rotateX(180deg)]"
            >
                {/* Front */}
                <div className="absolute inset-0 h-full w-full [backface-visibility:hidden]">
                    {children}
                </div>

                {/* Back */}
                <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateX(180deg)]">
                    {backChildren}
                </div>
            </motion.div>
        </Tag>
    );
}

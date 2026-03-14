"use client";

import { cn } from "@/lib/utils";
import React from "react";

export function FeaturesSectionWithHoverEffects({
    items,
    selectedId,
    onSelect
}: {
    items: Array<{ id: string; name: string; description: string; icon: React.ReactNode; color: string }>;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10 py-4 w-full mx-auto">
            {items.map((item, index) => (
                <Feature
                    key={item.id}
                    {...item}
                    index={index}
                    isSelected={selectedId === item.id}
                    onClick={() => onSelect(item.id)}
                />
            ))}
        </div>
    );
}

const Feature = ({
    name,
    description,
    icon,
    index,
    color,
    isSelected,
    onClick,
}: {
    name: string;
    description: string;
    icon: React.ReactNode;
    index: number;
    color: string;
    isSelected?: boolean;
    onClick?: () => void;
}) => {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex flex-col py-10 relative group/feature border-neutral-800 cursor-pointer",
                "border-b md:border-b-0",
                "md:border-r",
                (index % 2 === 0) ? "md:border-l" : "",
                (index < 4) ? "md:border-b" : "",
                (index % 3 === 0) ? "lg:border-l" : "lg:border-l-0",
                (index < 3) ? "lg:border-b" : "lg:border-b-0"
            )}
        >
            {index < 4 && (
                <div className={cn(
                    "transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-800 to-transparent pointer-events-none",
                    isSelected ? "opacity-100" : "opacity-0 group-hover/feature:opacity-100"
                )} />
            )}
            {index >= 4 && (
                <div className={cn(
                    "transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-800 to-transparent pointer-events-none",
                    isSelected ? "opacity-100" : "opacity-0 group-hover/feature:opacity-100"
                )} />
            )}
            <div className={cn("mb-4 relative z-10 px-10 text-neutral-400", color)}>
                {icon}
            </div>
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div className={cn(
                    "absolute left-0 inset-y-0 w-1 rounded-tr-full rounded-br-full transition-all duration-200 origin-center",
                    isSelected ? "h-8 bg-blue-500" : "h-6 bg-neutral-700 group-hover/feature:h-8 group-hover/feature:bg-blue-500"
                )} />
                <span className={cn(
                    "transition duration-200 inline-block text-neutral-100",
                    isSelected ? "translate-x-2" : "group-hover/feature:translate-x-2"
                )}>
                    {name}
                </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-xs relative z-10 px-10">
                {description}
            </p>
        </div>
    );
};

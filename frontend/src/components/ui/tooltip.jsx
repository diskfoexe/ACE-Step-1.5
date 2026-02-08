import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function TooltipProvider({
    ...props
}) {
    return <TooltipPrimitive.Provider {...props} />;
}

function Tooltip({
    ...props
}) {
    return (
        <TooltipPrimitive.Root {...props} />
    );
}

function TooltipTrigger({
    ...props
}) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 4,
    showArrow = false,
    ...props
}) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    "bg-popover text-popover-foreground z-50 w-fit max-w-64 rounded-md border px-3 py-1.5 text-xs shadow-md",
                    className
                )}
                {...props}>
                {props.children}
                {showArrow && (
                    <TooltipPrimitive.Arrow
                        className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45" />
                )}
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

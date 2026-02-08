import { HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function SettingsLabel({ label, tooltip, className, htmlFor }) {
    if (!tooltip) return <Label className={className} htmlFor={htmlFor}>{label}</Label>

    return (
        <div className="flex items-center gap-1.5 mb-1.5">
            <Label className={cn("text-sm font-medium text-muted-foreground flex items-center gap-1.5", className)} htmlFor={htmlFor}>
                {label}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/30 hover:text-muted-foreground cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-[200px] text-center">
                        {tooltip}
                    </TooltipContent>
                </Tooltip>
            </Label>
        </div>
    )
}

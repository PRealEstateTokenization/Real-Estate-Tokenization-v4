import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

function TooltipProvider({ delayDuration = 150, ...props }) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delayDuration={delayDuration} {...props} />
}
function Tooltip(props) { return <TooltipPrimitive.Root data-slot="tooltip" {...props} /> }
function TooltipTrigger(props) { return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} /> }
function TooltipContent({ className, sideOffset = 6, children, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn('z-50 max-w-xs rounded-lg bg-foreground px-3 py-1.5 text-xs text-background animate-in fade-in-0 zoom-in-95', className)}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent }

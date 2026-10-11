import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

function Label({ className, ...props }) {
  return <LabelPrimitive.Root data-slot="label" className={cn('text-sm font-semibold leading-none text-foreground/85 select-none', className)} {...props} />
}

export { Label }

import { cn } from "../lib/utils"

interface StatusIndicatorProps {
  status: 'safe' | 'warning' | 'critical' | 'stable'
  label?: string
  className?: string
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const configs = {
    safe: { color: 'bg-enterprise-green', text: 'text-enterprise-green', label: 'Optimal' },
    stable: { color: 'bg-enterprise-blue', text: 'text-enterprise-blue', label: 'Stable' },
    warning: { color: 'bg-orange-500', text: 'text-orange-500', label: 'At Risk' },
    critical: { color: 'bg-destructive', text: 'text-destructive', label: 'Critical' },
  }

  const config = configs[status]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-2 w-2">
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color)}></span>
        <span className={cn("relative inline-flex rounded-full h-2 w-2", config.color)}></span>
      </div>
      {label && <span className={cn("text-xs font-semibold uppercase tracking-wider", config.text)}>{label || config.label}</span>}
    </div>
  )
}

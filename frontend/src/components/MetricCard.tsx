import { LucideIcon } from "lucide-react"
import { cn } from "../lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function MetricCard({ title, value, unit, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white p-6 rounded-xl border border-enterprise-border shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-enterprise-muted uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-slate-50 rounded-lg text-enterprise-blue border border-slate-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-enterprise-text tracking-tight">{value}</span>
        {unit && <span className="text-sm font-medium text-enterprise-muted">{unit}</span>}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded",
            trend.isPositive ? "bg-green-50 text-enterprise-green" : "bg-red-50 text-destructive"
          )}>
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-enterprise-muted">vs last 30m</span>
        </div>
      )}
    </div>
  )
}

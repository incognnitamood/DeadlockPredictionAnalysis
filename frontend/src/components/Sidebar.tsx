import { NavLink } from "react-router-dom"
import { 
  LayoutDashboard, 
  Activity, 
  Share2, 
  Upload, 
  BarChart3, 
  Info,
  ShieldCheck
} from "lucide-react"
import { cn } from "../lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Activity, label: "Live Prediction", path: "/live" },
  { icon: Share2, label: "Resource Graph", path: "/graph" },
  { icon: Upload, label: "Dataset Upload", path: "/upload" },
  { icon: BarChart3, label: "Model Insights", path: "/insights" },
  { icon: Info, label: "About Project", path: "/about" },
]

export function Sidebar() {
  return (
    <div className="w-64 bg-enterprise-dark h-full flex flex-col border-r border-enterprise-darkSecondary">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-enterprise-blue rounded flex items-center justify-center">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <span className="text-white font-bold tracking-tight text-lg">SystemGuard</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
              isActive 
                ? "bg-enterprise-blue text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-enterprise-darkSecondary text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
        System Analysis v1.0.4
      </div>
    </div>
  )
}

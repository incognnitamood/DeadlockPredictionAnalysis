import { Bell, Search, User, Settings, LogOut } from "lucide-react"

export function Topbar() {
  return (
    <header className="h-16 border-b border-enterprise-border bg-white flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-enterprise-muted" />
          <input 
            type="text" 
            placeholder="Search resources, nodes, or alerts..."
            className="w-full pl-10 pr-4 py-2 bg-enterprise-gray rounded-md border-none text-sm focus:ring-1 focus:ring-enterprise-blue transition-all"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button className="relative p-2 text-enterprise-muted hover:text-enterprise-text hover:bg-enterprise-gray rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-enterprise-border mx-1"></div>
        
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-enterprise-text">Admin User</span>
            <span className="text-[11px] text-enterprise-muted">System Administrator</span>
          </div>
          <button className="w-9 h-9 bg-enterprise-gray rounded-full flex items-center justify-center text-enterprise-muted hover:text-enterprise-blue hover:bg-blue-50 transition-all border border-enterprise-border">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

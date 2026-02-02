import { useState, useEffect } from "react"
import { Shield, Activity, Clock, ChevronRight } from "lucide-react"
import { StatusIndicator } from "../components/StatusIndicator"
import { cn } from "../lib/utils"

interface Prediction {
  id: string
  timestamp: string
  resource: string
  requestingNode: string
  confidence: number
  status: 'safe' | 'warning' | 'critical'
}

export function LivePrediction() {
  const [predictions, setPredictions] = useState<Prediction[]>([
    { id: '1', timestamp: '14:20:05', resource: 'GPU_01', requestingNode: 'Worker-7', confidence: 98.2, status: 'safe' },
    { id: '2', timestamp: '14:20:02', resource: 'MEM_POOL', requestingNode: 'Worker-2', confidence: 85.4, status: 'warning' },
    { id: '3', timestamp: '14:19:58', resource: 'DISK_ROOT', requestingNode: 'Master', confidence: 99.1, status: 'safe' },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const resources = ['GPU_01', 'MEM_POOL', 'DISK_ROOT', 'NET_INTERFACE', 'I/O_BRIDGE']
      const nodes = ['Worker-1', 'Worker-2', 'Worker-7', 'Master', 'Node-Delta']
      const statuses: ('safe' | 'warning' | 'critical')[] = ['safe', 'safe', 'safe', 'warning', 'safe']
      
      const newPrediction: Prediction = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString('en-GB'),
        resource: resources[Math.floor(Math.random() * resources.length)],
        requestingNode: nodes[Math.floor(Math.random() * nodes.length)],
        confidence: Number((Math.random() * 20 + 80).toFixed(1)),
        status: statuses[Math.floor(Math.random() * statuses.length)],
      }

      setPredictions(prev => [newPrediction, ...prev.slice(0, 9)])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-enterprise-text tracking-tight">Live Inference Engine</h1>
          <p className="text-sm text-enterprise-muted">Real-time predictive analysis of system resource requests.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-enterprise-border shadow-sm">
          <span className="text-xs font-medium text-enterprise-muted uppercase tracking-wider">Engine Status:</span>
          <StatusIndicator status="safe" label="Operational" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-enterprise-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-enterprise-border bg-slate-50/50">
              <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider">Inference Stream</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30 text-[11px] font-bold text-enterprise-muted uppercase tracking-widest border-b border-enterprise-border">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Resource</th>
                    <th className="px-6 py-3">Source Node</th>
                    <th className="px-6 py-3">Confidence</th>
                    <th className="px-6 py-3 text-right">Prediction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enterprise-border">
                  {predictions.map((p) => (
                    <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-enterprise-muted flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {p.timestamp}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-enterprise-text">{p.resource}</td>
                      <td className="px-6 py-4 text-sm text-enterprise-muted">{p.requestingNode}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-enterprise-blue rounded-full" 
                              style={{ width: `${p.confidence}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-enterprise-muted">{p.confidence}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusIndicator status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-enterprise-dark p-6 rounded-xl border border-enterprise-darkSecondary text-white space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="text-enterprise-blue w-6 h-6" />
              <h3 className="text-lg font-semibold tracking-tight">Active Safeguards</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Deadlock Prevention', active: true },
                { label: 'Resource Quota Enforcement', active: true },
                { label: 'Priority Escalation Check', active: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-sm font-medium text-slate-300">{item.label}</span>
                  <div className={cn(
                    "w-8 h-4 rounded-full relative transition-colors",
                    item.active ? "bg-enterprise-blue" : "bg-slate-600"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-2 h-2 rounded-full bg-white transition-all",
                      item.active ? "left-5" : "left-1"
                    )}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider">Model Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-enterprise-muted">Current Model</span>
                <span className="font-mono font-medium">RF-Predict-v4.2</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-4">
                <span className="text-enterprise-muted">Training Set Size</span>
                <span className="font-medium">2,450,120 samples</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-4">
                <span className="text-enterprise-muted">Avg Inference Time</span>
                <span className="font-medium">12.4ms</span>
              </div>
              <button className="w-full mt-2 py-2 text-xs font-semibold text-enterprise-blue bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 flex items-center justify-center gap-1 group">
                Model Details <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

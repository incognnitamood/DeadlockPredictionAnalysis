import { useState, useEffect } from "react"
import { Cpu, Database, HardDrive, Zap } from "lucide-react"
import { MetricCard } from "../components/MetricCard"
import { ResourceChart } from "../components/ResourceChart"

const generateInitialData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    time: `${i}:00`,
    cpu: Math.floor(Math.random() * 40) + 20,
    memory: Math.floor(Math.random() * 30) + 40,
    disk: Math.floor(Math.random() * 20) + 10,
  }));
};

export function Dashboard() {
  const [data, setData] = useState(generateInitialData(20));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const lastTime = prev[prev.length - 1].time;
        const [h, m] = lastTime.split(':').map(Number);
        const nextM = (m + 5) % 60;
        const nextH = nextM === 0 ? (h + 1) % 24 : h;
        
        newData.push({
          time: `${nextH}:${nextM < 10 ? '0' + nextM : nextM}`,
          cpu: Math.floor(Math.random() * 40) + 20,
          memory: Math.floor(Math.random() * 30) + 40,
          disk: Math.floor(Math.random() * 20) + 10,
        });
        return newData;
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const latest = data[data.length - 1];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-enterprise-text tracking-tight">System Performance</h1>
        <p className="text-sm text-enterprise-muted">Real-time monitoring and resource analysis metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="CPU Usage" 
          value={latest.cpu} 
          unit="%" 
          icon={Cpu} 
          trend={{ value: 2.4, isPositive: true }} 
        />
        <MetricCard 
          title="Memory Usage" 
          value={latest.memory} 
          unit="%" 
          icon={Database} 
          trend={{ value: 0.8, isPositive: false }} 
        />
        <MetricCard 
          title="Disk I/O" 
          value={latest.disk} 
          unit="MB/s" 
          icon={HardDrive} 
          trend={{ value: 12.1, isPositive: true }} 
        />
        <MetricCard 
          title="Inference Latency" 
          value="42" 
          unit="ms" 
          icon={Zap} 
          trend={{ value: 4.2, isPositive: false }} 
          className="bg-enterprise-dark border-enterprise-darkSecondary [&_*]:text-white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ResourceChart 
          data={data} 
          title="CPU Load Factor" 
          dataKey="cpu" 
          color="#3B82F6" 
        />
        <ResourceChart 
          data={data} 
          title="Memory Consumption" 
          dataKey="memory" 
          color="#10B981" 
        />
      </div>

      <div className="bg-white rounded-xl border border-enterprise-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-enterprise-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider">Recent System Alerts</h3>
          <button className="text-xs font-semibold text-enterprise-blue hover:underline">View all history</button>
        </div>
        <div className="divide-y divide-enterprise-border">
          {[
            { id: 1, type: 'Warning', msg: 'High memory usage detected on Node-04', time: '2m ago', color: 'text-orange-500 bg-orange-50' },
            { id: 2, type: 'Alert', msg: 'Disk capacity exceeding 85% on Cluster-B', time: '14m ago', color: 'text-destructive bg-red-50' },
            { id: 3, type: 'Info', msg: 'New model weights successfully deployed', time: '1h ago', color: 'text-enterprise-blue bg-blue-50' },
          ].map(alert => (
            <div key={alert.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <span className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", alert.color)}>
                {alert.type}
              </span>
              <span className="flex-1 text-sm text-enterprise-text">{alert.msg}</span>
              <span className="text-xs text-enterprise-muted">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

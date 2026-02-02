import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"

const distributionData = [
  { name: 'Safe', value: 65, color: '#10B981' },
  { name: 'Warning', value: 25, color: '#F59E0B' },
  { name: 'Critical', value: 10, color: '#EF4444' },
];

const featureImportance = [
  { name: 'CPU Usage', score: 94 },
  { name: 'Memory Pressure', score: 88 },
  { name: 'Disk Latency', score: 72 },
  { name: 'Network Jitter', score: 45 },
  { name: 'Thread Count', score: 38 },
];

export function ModelInsights() {
  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-enterprise-text tracking-tight">Model Analysis & Insights</h1>
        <p className="text-sm text-enterprise-muted">Deep dive into model performance, risk distribution, and feature analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-enterprise-blue rounded-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-enterprise-text">98.4%</div>
            <div className="text-xs font-semibold text-enterprise-muted uppercase tracking-wider">Accuracy</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-enterprise-green rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-enterprise-text">97.2%</div>
            <div className="text-xs font-semibold text-enterprise-muted uppercase tracking-wider">F1 Score</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-500 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-enterprise-text">1.2ms</div>
            <div className="text-xs font-semibold text-enterprise-muted uppercase tracking-wider">Drift Latency</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-destructive rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-enterprise-text">0.04%</div>
            <div className="text-xs font-semibold text-enterprise-muted uppercase tracking-wider">False Negatives</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider mb-6">Risk Distribution</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider mb-6">Feature Importance</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featureImportance}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-enterprise-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-enterprise-border">
          <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider">Model Training History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-enterprise-muted uppercase tracking-widest border-b border-enterprise-border">
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">Training Date</th>
                <th className="px-6 py-4">Sample Size</th>
                <th className="px-6 py-4">Precision</th>
                <th className="px-6 py-4">Recall</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-enterprise-border">
              {[
                { v: 'v4.2.0', date: '2024-12-15', size: '2.4M', p: '0.985', r: '0.972', current: true },
                { v: 'v4.1.8', date: '2024-11-20', size: '1.8M', p: '0.962', r: '0.941', current: false },
                { v: 'v4.1.2', date: '2024-10-05', size: '1.2M', p: '0.948', r: '0.925', current: false },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-enterprise-text">{row.v}</td>
                  <td className="px-6 py-4 text-sm text-enterprise-muted">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-enterprise-text">{row.size}</td>
                  <td className="px-6 py-4 text-sm text-enterprise-text">{row.p}</td>
                  <td className="px-6 py-4 text-sm text-enterprise-text">{row.r}</td>
                  <td className="px-6 py-4 text-right">
                    {row.current ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-enterprise-blue text-white">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-enterprise-muted">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

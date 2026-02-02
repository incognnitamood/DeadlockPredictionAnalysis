import { useState } from "react"
import { Upload, FileText, CheckCircle2, AlertCircle, X, Eye, Trash2 } from "lucide-react"
import { cn } from "../lib/utils"

interface FileItem {
  id: string
  name: string
  size: string
  status: 'uploading' | 'completed' | 'error'
  progress: number
}

export function DatasetUpload() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: '1', name: 'cluster_data_2024_Q4.csv', size: '2.4 MB', status: 'completed', progress: 100 },
    { id: '2', name: 'node_usage_logs.csv', size: '840 KB', status: 'completed', progress: 100 },
  ])
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const mockData = [
    { id: 1, node: 'Worker-1', cpu: 45, mem: 62, disk: 12, label: 'Safe' },
    { id: 2, node: 'Worker-2', cpu: 89, mem: 94, disk: 45, label: 'Critical' },
    { id: 3, node: 'Master', cpu: 12, mem: 24, disk: 8, label: 'Safe' },
    { id: 4, node: 'Worker-7', cpu: 67, mem: 72, disk: 30, label: 'Warning' },
    { id: 5, node: 'Node-Delta', cpu: 34, mem: 41, disk: 15, label: 'Safe' },
  ]

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-enterprise-text tracking-tight">Dataset Management</h1>
        <p className="text-sm text-enterprise-muted">Upload and prepare system logs for model training and analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-12 rounded-xl border-2 border-dashed border-enterprise-border flex flex-col items-center justify-center gap-4 hover:border-enterprise-blue hover:bg-blue-50/30 transition-all group cursor-pointer">
            <div className="w-16 h-16 bg-enterprise-gray rounded-full flex items-center justify-center text-enterprise-muted group-hover:text-enterprise-blue group-hover:scale-110 transition-all">
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-enterprise-text">Click or drag files to upload</p>
              <p className="text-sm text-enterprise-muted mt-1">Support CSV, JSON, and Parquet formats (Max 50MB)</p>
            </div>
            <button className="mt-2 px-6 py-2 bg-white border border-enterprise-border rounded-lg text-sm font-semibold text-enterprise-text shadow-sm group-hover:border-enterprise-blue transition-all">
              Browse Files
            </button>
          </div>

          <div className="bg-white rounded-xl border border-enterprise-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-enterprise-border bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider">File Repository</h3>
              <span className="text-xs text-enterprise-muted font-medium">{files.length} Files stored</span>
            </div>
            <div className="divide-y divide-enterprise-border">
              {files.map((file) => (
                <div key={file.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="p-2 bg-slate-100 rounded text-enterprise-muted">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-enterprise-text truncate">{file.name}</span>
                      <span className="text-xs text-enterprise-muted">{file.size}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-enterprise-blue rounded-full" 
                          style={{ width: `${file.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-enterprise-green uppercase tracking-wider">Ready</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setIsPreviewOpen(true)}
                      className="p-2 text-enterprise-muted hover:text-enterprise-blue hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview Data"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-enterprise-muted hover:text-destructive hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-enterprise-border shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-enterprise-text uppercase tracking-wider">Upload Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-enterprise-muted">Storage Usage</span>
                <span className="text-xs font-bold text-enterprise-text">3.2 MB / 1.0 GB</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-enterprise-blue w-[0.32%] rounded-full"></div>
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <div className="text-xl font-bold text-enterprise-text">12</div>
                  <div className="text-[10px] text-enterprise-muted font-bold uppercase tracking-widest mt-1">Total Logs</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <div className="text-xl font-bold text-enterprise-text">4.8k</div>
                  <div className="text-[10px] text-enterprise-muted font-bold uppercase tracking-widest mt-1">Data Points</div>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <button className="w-full py-2.5 bg-enterprise-dark text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2">
                Analyze Datasets
              </button>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 text-enterprise-blue">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-bold tracking-tight">Best Practices</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ensure your CSV files contain consistent headers: <code className="bg-blue-100 px-1 rounded text-enterprise-blue font-mono font-bold">timestamp</code>, <code className="bg-blue-100 px-1 rounded text-enterprise-blue font-mono font-bold">node_id</code>, and <code className="bg-blue-100 px-1 rounded text-enterprise-blue font-mono font-bold">usage_metrics</code>.
            </p>
          </div>
        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-enterprise-border max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-enterprise-border flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-enterprise-blue/10 rounded-lg text-enterprise-blue">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-enterprise-text leading-tight">Data Preview</h3>
                  <p className="text-xs text-enterprise-muted">cluster_data_2024_Q4.csv (showing first 5 rows)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 text-enterprise-muted hover:text-enterprise-text hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-enterprise-muted uppercase tracking-widest border-b border-enterprise-border sticky top-0">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Node Name</th>
                    <th className="px-6 py-4">CPU (%)</th>
                    <th className="px-6 py-4">MEM (%)</th>
                    <th className="px-6 py-4">DISK (%)</th>
                    <th className="px-6 py-4 text-right">Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-enterprise-border">
                  {mockData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-enterprise-muted">{row.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-enterprise-text">{row.node}</td>
                      <td className="px-6 py-4 text-sm text-enterprise-text">{row.cpu}</td>
                      <td className="px-6 py-4 text-sm text-enterprise-text">{row.mem}</td>
                      <td className="px-6 py-4 text-sm text-enterprise-text">{row.disk}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          row.label === 'Safe' ? "bg-green-50 text-enterprise-green" :
                          row.label === 'Warning' ? "bg-orange-50 text-orange-500" :
                          "bg-red-50 text-destructive"
                        )}>
                          {row.label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-enterprise-border bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="px-6 py-2 border border-enterprise-border rounded-lg text-sm font-semibold text-enterprise-text hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-enterprise-blue text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-600 transition-colors">
                Confirm & Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

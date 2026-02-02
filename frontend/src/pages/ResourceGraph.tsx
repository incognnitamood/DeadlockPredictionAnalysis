import { useState, useMemo } from "react"
import { Share2, Filter, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

interface Node {
  id: string
  label: string
  type: 'resource' | 'process'
  x: number
  y: number
}

interface Edge {
  source: string
  target: string
  type: 'allocated' | 'requested'
}

export function ResourceGraph() {
  const [nodes] = useState<Node[]>([
    { id: 'r1', label: 'GPU_01', type: 'resource', x: 200, y: 150 },
    { id: 'r2', label: 'MEM_POOL', type: 'resource', x: 400, y: 150 },
    { id: 'r3', label: 'DISK_01', type: 'resource', x: 600, y: 150 },
    { id: 'p1', label: 'Worker-1', type: 'process', x: 200, y: 350 },
    { id: 'p2', label: 'Worker-2', type: 'process', x: 400, y: 350 },
    { id: 'p3', label: 'Master', type: 'process', x: 600, y: 350 },
    { id: 'p4', label: 'Worker-7', type: 'process', x: 300, y: 250 },
  ])

  const [edges] = useState<Edge[]>([
    { source: 'p1', target: 'r1', type: 'allocated' },
    { source: 'p2', target: 'r2', type: 'allocated' },
    { source: 'p3', target: 'r3', type: 'allocated' },
    { source: 'p4', target: 'r1', type: 'requested' },
    { source: 'p4', target: 'r2', type: 'requested' },
    { source: 'p1', target: 'r2', type: 'requested' },
  ])

  return (
    <div className="p-8 space-y-8 h-full flex flex-col max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-enterprise-text tracking-tight">Resource Allocation Graph</h1>
          <p className="text-sm text-enterprise-muted">Visualizing node-to-resource dependencies and potential deadlocks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-white border border-enterprise-border rounded-lg text-enterprise-muted hover:text-enterprise-text transition-colors">
            <Filter className="w-4 h-4" />
          </button>
          <div className="h-8 w-px bg-enterprise-border mx-1"></div>
          <button className="flex items-center gap-2 px-4 py-2 bg-enterprise-blue text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-600 transition-colors">
            <Share2 className="w-4 h-4" />
            Export Graph
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[500px] bg-white rounded-xl border border-enterprise-border shadow-sm relative overflow-hidden flex flex-col">
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <button className="p-2 bg-white/90 border border-enterprise-border rounded-md shadow-sm hover:bg-slate-50 transition-colors">
            <ZoomIn className="w-4 h-4 text-enterprise-text" />
          </button>
          <button className="p-2 bg-white/90 border border-enterprise-border rounded-md shadow-sm hover:bg-slate-50 transition-colors">
            <ZoomOut className="w-4 h-4 text-enterprise-text" />
          </button>
          <button className="p-2 bg-white/90 border border-enterprise-border rounded-md shadow-sm hover:bg-slate-50 transition-colors">
            <Maximize2 className="w-4 h-4 text-enterprise-text" />
          </button>
        </div>

        <div className="absolute top-4 right-4 z-10 bg-white/90 p-3 rounded-lg border border-enterprise-border shadow-sm space-y-3">
          <h4 className="text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-enterprise-blue"></div>
              <span className="text-xs text-enterprise-text">Resource</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-enterprise-green"></div>
              <span className="text-xs text-enterprise-text">Node / Process</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-slate-300"></div>
              <span className="text-xs text-enterprise-text">Allocated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-destructive border-t border-dashed border-destructive"></div>
              <span className="text-xs text-enterprise-text">Requested (Pending)</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] relative cursor-grab active:cursor-grabbing">
          <svg className="w-full h-full">
            <defs>
              <marker id="arrowhead-alloc" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orientation="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#94A3B8" />
              </marker>
              <marker id="arrowhead-req" markerWidth="10" markerHeight="7" refX="20" refY="3.5" orientation="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#EF4444" />
              </marker>
            </defs>
            
            {edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source)!
              const target = nodes.find(n => n.id === edge.target)!
              return (
                <line 
                  key={i}
                  x1={source.x} y1={source.y}
                  x2={target.x} y2={target.y}
                  stroke={edge.type === 'allocated' ? '#94A3B8' : '#EF4444'}
                  strokeWidth={edge.type === 'allocated' ? 1.5 : 2}
                  strokeDasharray={edge.type === 'requested' ? '5,5' : '0'}
                  markerEnd={`url(#arrowhead-${edge.type === 'allocated' ? 'alloc' : 'req'})`}
                />
              )
            })}

            {nodes.map((node) => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                {node.type === 'resource' ? (
                  <rect 
                    x="-20" y="-20" width="40" height="40" rx="4"
                    fill="#3B82F6" className="shadow-sm"
                  />
                ) : (
                  <circle 
                    r="18" fill="#10B981" className="shadow-sm"
                  />
                )}
                <text 
                  y="35" textAnchor="middle" 
                  className="text-[10px] font-bold fill-enterprise-text tracking-tight uppercase"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="p-4 border-t border-enterprise-border bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-enterprise-muted italic">Click and drag nodes to rearrange layout (simulated)</span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-enterprise-text">Total Edges:</span>
              <span className="text-xs text-enterprise-muted">{edges.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-enterprise-text">Potential Cycles:</span>
              <span className="text-xs text-destructive font-bold">1 Detected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function About() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-enterprise-text mb-4">About Project</h1>
      <div className="prose prose-slate max-w-3xl">
        <p className="text-enterprise-muted mb-4">
          This system provides real-time predictive analysis for resource allocation and deadlock detection. 
          Built with an enterprise-first mindset, it focuses on high-fidelity monitoring and status verification.
        </p>
        <h2 className="text-xl font-medium text-enterprise-text mb-2">Tech Stack</h2>
        <ul className="list-disc list-inside text-enterprise-muted space-y-1">
          <li>React + Vite for the frontend</li>
          <li>TailwindCSS for clean enterprise styling</li>
          <li>Random Forest models for predictive analysis</li>
          <li>Recharts for high-performance data visualization</li>
        </ul>
      </div>
    </div>
  )
}

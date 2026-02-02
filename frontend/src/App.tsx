import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { DashboardLayout } from "./layout/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import { LivePrediction } from "./pages/LivePrediction"
import { ResourceGraph } from "./pages/ResourceGraph"
import { DatasetUpload } from "./pages/DatasetUpload"
import { ModelInsights } from "./pages/ModelInsights"
import { About } from "./pages/About"

export function App() {
  return (
    <Router>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/live" element={<LivePrediction />} />
          <Route path="/graph" element={<ResourceGraph />} />
          <Route path="/upload" element={<DatasetUpload />} />
          <Route path="/insights" element={<ModelInsights />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

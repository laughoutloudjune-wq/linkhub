import { Navigate, Route, Routes } from 'react-router-dom'
import PublicPage from './pages/PublicPage'
import Login from './pages/Login'
import DashboardLayout from './pages/DashboardLayout'
import DashboardOverview from './pages/DashboardOverview'
import DashboardLinks from './pages/DashboardLinks'
import DashboardSettings from './pages/DashboardSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="links" element={<DashboardLinks />} />
        <Route path="settings" element={<DashboardSettings />} />
      </Route>
      <Route path="/:slug" element={<PublicPage />} />
    </Routes>
  )
}

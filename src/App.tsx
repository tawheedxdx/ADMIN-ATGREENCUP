import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { useAuthStore } from '@/store/authStore'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import ApprovalQueue from '@/pages/ApprovalQueue'
import ProductionEntries from '@/pages/ProductionEntries'
import Issues from '@/pages/Issues'
import Employees from '@/pages/Employees'
import Machines from '@/pages/Machines'
import Products from '@/pages/Products'
import UnitsShifts from '@/pages/UnitsShifts'
import Reports from '@/pages/Reports'
import Salaries from '@/pages/Salaries'
import AuditLogs from '@/pages/AuditLogs'
import Settings from '@/pages/Settings'

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-graphite-950 text-graphite-100 flex flex-col font-sans">
              <MobileHeader />
              <MobileDrawer />

              <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-20 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/approvals" element={<ApprovalQueue />} />
                  <Route path="/entries" element={<ProductionEntries />} />
                  <Route path="/issues" element={<Issues />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/machines" element={<Machines />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/units-shifts" element={<UnitsShifts />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/salaries" element={<Salaries />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>

              <MobileNavbar />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

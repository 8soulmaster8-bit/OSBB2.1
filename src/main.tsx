import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Bills from './pages/Bills'
import Meters from './pages/Meters'
import Requests from './pages/Requests'
import AuthProvider, { useAuth } from './contexts/AuthContext'
import AdminApp, { checkAdminAuth } from './pages/AdminApp'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminBills from './pages/AdminBills'
import AdminRequests from './pages/AdminRequests'
import './index.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!checkAdminAuth()) {
    return <Navigate to="/admin/login" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <App />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="bills" element={<Bills />} />
        <Route path="meters" element={<Meters />} />
        <Route path="requests" element={<Requests />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin onLogin={() => window.location.href = '/admin'} />} />
      <Route path="/admin" element={
        <AdminRoute>
          <AdminApp />
        </AdminRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="bills" element={<AdminBills />} />
        <Route path="requests" element={<AdminRequests />} />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

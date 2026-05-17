import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App            from './App.jsx'
import AdminLogin     from './admin/AdminLogin.jsx'
import AdminDashboard from './admin/AdminDashboard.jsx'
import ProtectedRoute from './admin/ProtectedRoute.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/*"           element={<App />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
)

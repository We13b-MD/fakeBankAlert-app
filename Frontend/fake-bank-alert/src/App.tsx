import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/ui/layouts/Navbar'
import Footer from './components/ui/Footer'
import { Toaster } from 'sonner'
import GoogleCallback from './pages/GoogleCallBack'

// Lazy-loaded pages/components
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./alerts/dashboard/dashboard'))
const CreateAlert = lazy(() => import('./alerts/CreateAlert'))
const AlertDetails = lazy(() => import('./alerts/dashboard/AlertDetails'))
const AlertsHistory = lazy(() => import('./alerts/AlertHistory'))
const HeroSection = lazy(() => import('./components/ui/layouts/Herosection'))
const Settings = lazy(() => import('./settings/settings'))
const AlertCardExample = lazy(() => import('./components/ui/layouts/AlertCard'))



function App() {
 
  return (
    <Router>
      <Navbar />
      <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HeroSection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<GoogleCallback />} />

          {/* Dashboard / Protected Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-alert" element={<CreateAlert />} />
          <Route path="/alerts/:id" element={<AlertDetails />} />
          <Route path="/alerts-history" element={<AlertsHistory />} />
          <Route path="/settings" element={<Settings />} />
         
          {/* Example / UI demo */}
        </Routes>
      </Suspense>
      <Footer />
      
      {/* Sonner Toast Container */}
      <Toaster 
        position="top-right" 
        richColors 
        expand={true}
        closeButton
      />
    </Router>
  )
}

export default App

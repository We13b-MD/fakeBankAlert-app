import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/ui/layouts/Navbar'
import Footer from './components/ui/Footer'
import { Toaster } from 'sonner'
import GoogleCallback from './pages/GoogleCallBack'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy-loaded pages/components
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./alerts/dashboard/dashboard'))
const CreateAlert = lazy(() => import('./alerts/CreateAlert'))
const AlertDetails = lazy(() => import('./alerts/dashboard/AlertDetails'))
const AlertsHistory = lazy(() => import('./alerts/AlertHistory'))
const HeroSection = lazy(() => import('./components/ui/layouts/Herosection'))
const Settings = lazy(() => import('./settings/settings'))
const FAQs = lazy(() => import('./pages/FAQs'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const NotFound = lazy(() => import('./pages/NotFound'))



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
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Protected Routes — redirects to /login if not authenticated */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-alert" element={<ProtectedRoute><CreateAlert /></ProtectedRoute>} />
          <Route path="/alerts/:id" element={<ProtectedRoute><AlertDetails /></ProtectedRoute>} />
          <Route path="/alerts-history" element={<ProtectedRoute><AlertsHistory /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
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

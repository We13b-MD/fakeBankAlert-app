import { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/auth/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { authToasts } from '@/utils.ts/toast.helper';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = useCallback(async () => {

    if (!email || !password) {
      authToasts.loginError('Email and password are required')
      return
    }

    try {
      setLoading(true)

      const res = await authApi.login({ email, password })
      const { user, token } = res.data

      // Store auth globally
      setAuth(user, token)

      // Redirect back to where the user intended to go (if provided)
      const from = (location.state as any)?.from || '/dashboard'
      navigate(from, { replace: true })
      // Redirect

    } catch (err: any) {
      authToasts.loginError(err?.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }, [email, password, navigate, setAuth])

  const handleGoogleLogin = useCallback(() => {
    // Redirect to backend Google OAuth
    const API = import.meta.env.VITE_API_BASE_URL || 'https://fakebankalert-app-1.onrender.com';
    window.location.href = `${API}/api/auth/google`
  }, [])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleLogin()
    },
    [handleLogin]
  )


  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-4 rounded-2xl shadow-lg">
              <Shield className="w-10 h-10 text-teal-500" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Fake Bank Alert Detector
          </h1>
          <p className="text-slate-600 text-lg">
            Detect fake bank alerts instantly
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Enter Name or Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter Name or Email"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Login Button */}
            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500 font-medium">OR</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 border-2 border-slate-300 hover:bg-slate-50 font-semibold text-base"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-sm text-slate-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-8 text-xs text-slate-500">
          🔒 Protected by advanced fraud detection technology
        </p>
      </div>
    </div>
  );
}
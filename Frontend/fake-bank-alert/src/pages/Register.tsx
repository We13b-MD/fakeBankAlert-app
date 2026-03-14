import { useCallback, useState } from 'react';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/auth/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authToasts } from '@/utils.ts/toast.helper';
import { Link } from 'react-router-dom';
export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track which fields have been touched (for validation)
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  // Track which field is currently focused
  const [focused, setFocused] = useState<string | null>(null);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // Field validation
  const fieldErrors = {
    fullName: touched.fullName && !fullName ? 'Full name is required' : '',
    email: touched.email && !email ? 'Email is required' : 
           touched.email && email && !/\S+@\S+\.\S+/.test(email) ? 'Invalid email format' : '',
    password: touched.password && !password ? 'Password is required' :
              touched.password && password && password.length < 6 ? 'Password must be at least 6 characters' : '',
    confirmPassword: touched.confirmPassword && !confirmPassword ? 'Please confirm password' :
                     touched.confirmPassword && confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFocused(null);
  };

  const handleFocus = (field: string) => {
    setFocused(field);
  };

  const handleRegister = useCallback(async () => {
    setError(null);

    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (!fullName || !email || !password || !confirmPassword) {
      setError('All fields are required');
      authToasts.registerError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      authToasts.registerError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      authToasts.registerError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      const res = await authApi.register({
        fullName,
        email,
        password
      });

      const { user, token } = res.data;

      setAuth(user, token);
      authToasts.registerSuccess();

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Registration failed. Try again.';
      setError(errorMessage);
      authToasts.registerError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fullName, email, password, confirmPassword, navigate, setAuth]);

  const handleGoogleRegister = useCallback(() => {
    window.location.href = '/api/auth/google';
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRegister();
    },
    [handleRegister]
  );

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
            Create your account
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
          <div className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    fieldErrors.fullName 
                      ? 'text-red-500' 
                      : focused === 'fullName' 
                      ? 'text-teal-600' 
                      : 'text-slate-400'
                  }`} 
                />
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  onFocus={() => handleFocus('fullName')}
                  onKeyPress={handleKeyPress}
                  placeholder="John Doe"
                  className={`pl-10 h-12 transition-all duration-200 ${
                    fieldErrors.fullName
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : focused === 'fullName'
                      ? 'border-teal-600 ring-2 ring-teal-100'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  disabled={loading}
                />
                {fieldErrors.fullName && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              {fieldErrors.fullName && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    fieldErrors.email 
                      ? 'text-red-500' 
                      : focused === 'email' 
                      ? 'text-teal-600' 
                      : 'text-slate-400'
                  }`} 
                />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  onFocus={() => handleFocus('email')}
                  onKeyPress={handleKeyPress}
                  placeholder="you@example.com"
                  className={`pl-10 h-12 transition-all duration-200 ${
                    fieldErrors.email
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : focused === 'email'
                      ? 'border-teal-600 ring-2 ring-teal-100'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              {fieldErrors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    fieldErrors.password 
                      ? 'text-red-500' 
                      : focused === 'password' 
                      ? 'text-teal-600' 
                      : 'text-slate-400'
                  }`} 
                />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  onFocus={() => handleFocus('password')}
                  onKeyPress={handleKeyPress}
                  placeholder="Create a strong password"
                  className={`pl-10 h-12 transition-all duration-200 ${
                    fieldErrors.password
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : focused === 'password'
                      ? 'border-teal-600 ring-2 ring-teal-100'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  disabled={loading}
                />
                {fieldErrors.password && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock 
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    fieldErrors.confirmPassword 
                      ? 'text-red-500' 
                      : focused === 'confirmPassword' 
                      ? 'text-teal-600' 
                      : 'text-slate-400'
                  }`} 
                />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  onFocus={() => handleFocus('confirmPassword')}
                  onKeyPress={handleKeyPress}
                  placeholder="Re-enter your password"
                  className={`pl-10 h-12 transition-all duration-200 ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50'
                      : focused === 'confirmPassword'
                      ? 'border-teal-600 ring-2 ring-teal-100'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  disabled={loading}
                />
                {fieldErrors.confirmPassword && (
                  <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                )}
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base transition-colors"
            >
             {loading ? (
    <span className="flex items-center justify-center gap-1">
      <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </span>
  ) : (
    'Register'
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

          {/* Google Register */}
          <Button
            onClick={handleGoogleRegister}
            variant="outline"
            disabled={loading}
            className="w-full h-12 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 font-semibold text-base transition-all"
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

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-slate-600">
            Already have an account?{' '}
             <Link 
    to="/login"  
    className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors"
  >
    login
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
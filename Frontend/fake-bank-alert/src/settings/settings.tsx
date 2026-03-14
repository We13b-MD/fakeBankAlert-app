import { useState, useEffect } from 'react';
import { Camera, Mail, User, Lock, Trash2, ChevronRight, Shield, Loader2, CheckCircle2, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth.store';
import { getUserProfile, updateProfile, changePassword, deleteAccount } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

// ── Toast / Feedback Component ──
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border animate-slide-in
      ${type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
        : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      }
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Inline Error Component ──
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
      <span className="text-xs text-red-500">{message}</span>
    </div>
  );
}

export default function Settings() {
  const [avatarHovered, setAvatarHovered] = useState(false);
  const { user, setAuth, clearAuth, token } = useAuthStore();
  const navigate = useNavigate();

  // ── Profile State ──
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [nameError, setNameError] = useState('');

  // ── Password State ──
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ old?: string; new?: string; confirm?: string }>({});
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Delete Account State ──
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Toast State ──
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Fetch Profile on Mount ──
  useEffect(() => {
    const fetchProfile = async () => {
      setProfileLoading(true);
      setProfileError('');
      try {
        const data = await getUserProfile();
        const fetchedUser = data.user;
        setProfileName(fetchedUser.name || '');
        setProfileEmail(fetchedUser.email || fetchedUser.googleEmail || '');
      } catch (err: any) {
        setProfileError(err.message || 'Failed to load profile');
        // Fallback to auth store data
        if (user) {
          setProfileName(user.name || '');
          setProfileEmail(user.email || '');
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // ── Get User Initials ──
  const getUserInitials = () => {
    if (profileName) {
      return profileName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profileEmail?.[0]?.toUpperCase() || 'U';
  };

  // ── Save Profile ──
  const handleSaveProfile = async () => {
    setNameError('');

    // Validate
    if (!profileName.trim()) {
      setNameError('Name is required');
      return;
    }
    if (profileName.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    setProfileSaving(true);
    try {
      const data = await updateProfile({ name: profileName.trim() });

      // Update auth store with new user info
      if (token && data.user) {
        setAuth(
          {
            id: data.user._id || data.user.id,
            name: data.user.name,
            email: data.user.email || data.user.googleEmail,
            role: data.user.role,
          },
          token
        );
      }

      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Change Password ──
  const handleChangePassword = async () => {
    const errors: { old?: string; new?: string; confirm?: string } = {};

    if (!oldPassword) errors.old = 'Current password is required';
    if (!newPassword) {
      errors.new = 'New password is required';
    } else if (newPassword.length < 6) {
      errors.new = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      errors.confirm = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }
    if (oldPassword && newPassword && oldPassword === newPassword) {
      errors.new = 'New password must be different from old password';
    }

    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPasswordSaving(true);
    try {
      await changePassword({ oldPassword, newPassword });
      setToast({ message: 'Password changed successfully!', type: 'success' });
      setPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err: any) {
      // Map the backend error to the appropriate field
      const msg = err.message || 'Failed to change password';
      if (msg.toLowerCase().includes('old password') || msg.toLowerCase().includes('incorrect')) {
        setPasswordErrors({ old: msg });
      } else {
        setToast({ message: msg, type: 'error' });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteAccount();
      clearAuth();
      navigate('/login');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Loading Skeleton ──
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="mb-8">
            <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-slate-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-36 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-11 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your account and preferences</p>
          </div>

          {/* Profile Load Error Banner */}
          {profileError && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span className="text-sm">{profileError}</span>
            </div>
          )}

          {/* ── PROFILE SECTION ── */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Section Label */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Profile</h2>
            </div>

            <div className="px-6 py-6 space-y-6">

              {/* Avatar */}
              <div className="flex items-center gap-5">
                <div
                  className="relative cursor-pointer"
                  onMouseEnter={() => setAvatarHovered(true)}
                  onMouseLeave={() => setAvatarHovered(false)}
                >
                  {/* Avatar circle */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white text-2xl font-bold select-none shadow-md">
                    {getUserInitials()}
                  </div>

                  {/* Hover overlay */}
                  <div
                    className={`absolute inset-0 rounded-full bg-black flex items-center justify-center transition-opacity duration-200 ${avatarHovered ? 'opacity-50' : 'opacity-0'}`}
                  />
                  <Camera
                    className={`absolute inset-0 m-auto w-6 h-6 text-white transition-opacity duration-200 ${avatarHovered ? 'opacity-100' : 'opacity-0'}`}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">{profileName || 'User'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{profileEmail}</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={profileName}
                    onChange={(e) => {
                      setProfileName(e.target.value);
                      if (nameError) setNameError('');
                    }}
                    className={`pl-9 h-11 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white transition-colors ${nameError ? 'border-red-300 focus:border-red-400' : ''}`}
                    placeholder="Enter your full name"
                  />
                </div>
                <FieldError message={nameError} />
              </div>

              {/* Email — read only */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-600 text-sm font-medium">Email</Label>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Read only</span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={profileEmail}
                    readOnly
                    className="pl-9 h-11 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold disabled:opacity-60"
              >
                {profileSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>

            </div>
          </section>

          {/* ── ACCOUNT SECTION ── */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="px-6 pt-5 pb-3 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Account</h2>
            </div>

            {/* Change Password Button */}
            <button
              onClick={() => {
                setPasswordModalOpen(true);
                setPasswordErrors({});
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">Change Password</p>
                  <p className="text-xs text-slate-400">Update your password</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* Connected — Google */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  {/* Google icon */}
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Google</p>
                  <p className="text-xs text-slate-400">{profileEmail}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">Connected</span>
            </div>

          </section>

          {/* ── DANGER ZONE ── */}
          <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">

            <div className="px-6 pt-5 pb-3 border-b border-red-50">
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-widest">Danger Zone</h2>
            </div>

            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Delete Account</p>
                <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => {
                  setDeleteModalOpen(true);
                  setDeleteConfirmText('');
                  setDeleteError('');
                }}
                className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>

          </section>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-400 pb-6">
            <Shield className="w-3 h-3 inline mr-1" />
            Your data is encrypted and protected
          </p>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── CHANGE PASSWORD MODAL ──                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPasswordModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 p-6 animate-modal-in">
            {/* Close button */}
            <button
              onClick={() => setPasswordModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-400">Enter your current and new password</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Old Password */}
              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-medium">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      if (passwordErrors.old) setPasswordErrors(prev => ({ ...prev, old: undefined }));
                    }}
                    placeholder="Enter current password"
                    className={`h-11 pr-10 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white transition-colors ${passwordErrors.old ? 'border-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={passwordErrors.old} />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.new) setPasswordErrors(prev => ({ ...prev, new: undefined }));
                    }}
                    placeholder="Enter new password"
                    className={`h-11 pr-10 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white transition-colors ${passwordErrors.new ? 'border-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={passwordErrors.new} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordErrors.confirm) setPasswordErrors(prev => ({ ...prev, confirm: undefined }));
                    }}
                    placeholder="Confirm new password"
                    className={`h-11 pr-10 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white transition-colors ${passwordErrors.confirm ? 'border-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError message={passwordErrors.confirm} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setPasswordModalOpen(false)}
                className="flex-1 h-11 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold disabled:opacity-60"
              >
                {passwordSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating…
                  </span>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── DELETE ACCOUNT MODAL ──                            */}
      {/* ══════════════════════════════════════════════════════ */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-md mx-4 p-6 animate-modal-in">
            {/* Close button */}
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Account</h3>
                <p className="text-xs text-slate-400">This action is irreversible</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-800 leading-relaxed">
                This will <strong>permanently delete</strong> your account, all your alerts, and associated data. This action <strong>cannot be undone</strong>.
              </p>
            </div>

            <div className="space-y-1.5 mb-5">
              <Label className="text-slate-600 text-sm font-medium">
                Type <span className="font-mono text-red-500 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> to confirm
              </Label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  if (deleteError) setDeleteError('');
                }}
                placeholder="Type DELETE here"
                className={`h-11 bg-slate-50 border-slate-200 text-slate-800 focus:bg-white transition-colors font-mono ${deleteError ? 'border-red-300' : ''}`}
              />
              <FieldError message={deleteError} />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 h-11 font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-40"
              >
                {deleteLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting…
                  </span>
                ) : (
                  'Delete My Account'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-modal-in {
          animation: modalIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
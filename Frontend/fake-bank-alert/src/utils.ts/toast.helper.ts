// utils/toast.helper.ts
import { toast } from 'sonner';

/**
 * Reusable toast notifications with consistent styling and timing
 * Using Sonner toast library
 */
export const showToast = {
  /**
   * Success toast - Shows for 2 seconds
   */
  success: (title: string, description?: string) => {
    toast.success(title, {
      description,
      duration: 2000,
    });
  },

  /**
   * Error toast - Shows for 3 seconds (users need more time to read errors)
   */
  error: (title: string, description?: string) => {
    toast.error(title, {
      description,
      duration: 3000,
    });
  },

  /**
   * Info toast - Shows for 3 seconds
   */
  info: (title: string, description?: string) => {
    toast.info(title, {
      description,
      duration: 3000,
    });
  },

  /**
   * Warning toast - Shows for 3 seconds
   */
  warning: (title: string, description?: string) => {
    toast.warning(title, {
      description,
      duration: 3000,
    });
  },

  /**
   * Custom toast with full control
   */
  custom: (message: string, options?: {
    description?: string;
    duration?: number;
  }) => {
    toast(message, options);
  },
};

/**
 * Common toast messages for authentication
 */
export const authToasts = {
  loginSuccess: () => showToast.success('Login Successful! 🎉', 'Welcome back! Redirecting to dashboard...'),
  
  registerSuccess: () => showToast.success('Registration Successful! 🎉', 'Your account has been created. Redirecting...'),
  
  logoutSuccess: () => showToast.success('Logged Out', 'You have been successfully logged out.'),
  
  loginError: (message?: string) => showToast.error('Login Failed', message || 'Please check your credentials and try again.'),
  
  registerError: (message?: string) => showToast.error('Registration Failed', message || 'Please try again.'),
  
  unauthorizedError: () => showToast.error('Unauthorized', 'Please log in to continue.'),
  
  sessionExpired: () => showToast.warning('Session Expired', 'Your session has expired. Please log in again.'),
};

/**
 * Common toast messages for bank alert detection
 */
export const alertToasts = {
  detectionSuccess: () => showToast.success('Analysis Complete', 'Alert has been analyzed successfully.'),
  
  fakeBankAlert: () => showToast.error('Fake Alert Detected! ⚠️', 'This appears to be a fraudulent bank alert.'),
  
  genuineAlert: () => showToast.success('Genuine Alert ✓', 'This alert appears to be legitimate.'),
  
  analysisError: (message?: string) => showToast.error('Analysis Failed', message || 'Unable to analyze the alert. Please try again.'),
  
  uploadSuccess: () => showToast.success('Upload Successful', 'Your alert has been uploaded for analysis.'),
  
  uploadError: (message?: string) => showToast.error('Upload Failed', message || 'Failed to upload alert. Please try again.'),
};

/**
 * Generic success/error handlers
 */
export const genericToasts = {
  saveSuccess: () => showToast.success('Saved Successfully', 'Your changes have been saved.'),
  
  saveError: () => showToast.error('Save Failed', 'Unable to save changes. Please try again.'),
  
  deleteSuccess: () => showToast.success('Deleted Successfully', 'Item has been deleted.'),
  
  deleteError: () => showToast.error('Delete Failed', 'Unable to delete item. Please try again.'),
  
  networkError: () => showToast.error('Network Error', 'Please check your internet connection and try again.'),
  
  serverError: () => showToast.error('Server Error', 'Something went wrong on our end. Please try again later.'),
};
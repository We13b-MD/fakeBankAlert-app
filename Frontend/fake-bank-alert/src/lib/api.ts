// Helper to get token from Zustand persisted storage



function getAuthToken(): string | null {
    const stored = localStorage.getItem('auth-storage');
    if (!stored) return null;
    try {
        const parsed = JSON.parse(stored);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
}

// Custom error for phone verification requirement
export class PhoneVerificationRequiredError extends Error {
    code = 'PHONE_VERIFICATION_REQUIRED';
    constructor() {
        super('Phone verification required');
        this.name = 'PhoneVerificationRequiredError';
    }
}

export async function detectTextAlert(text: string) {
    const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/detect-text`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ text }),
        }
    );



    if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        // Check if it's a phone verification error
        if (res.status === 403 && data.code === 'PHONE_VERIFICATION_REQUIRED') {
            throw new PhoneVerificationRequiredError();
        }

        throw new Error(data.message || 'Failed to analyze alert');
    }

    return res.json();
}




//detectImageAlert


export async function detectImageAlert(imageFile: File) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/detect-image`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${getAuthToken()}`
                // DO NOT set Content-Type here
            },
            body: formData,
        }
    );

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (res.status === 403 && data.code === "PHONE_VERIFICATION_REQUIRED") {
            throw new PhoneVerificationRequiredError();
        }

        throw new Error(data.message || "Failed to analyze image");
    }

    return res.json();
}
// Create Alert API function
export interface CreateAlertPayload {
    bankName: string;
    accountNumber: string;
    amount: number;
    transactionType: 'credit' | 'debit';
    description?: string;
    balanceAfterTransaction?: number;
    alertType?: 'sms' | 'email' | 'push';
}

export async function createAlert(payload: CreateAlertPayload) {
    const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/alerts/create`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(payload),
        }
    );

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (res.status === 403 && data.code === 'PHONE_VERIFICATION_REQUIRED') {
            throw new PhoneVerificationRequiredError();
        }

        throw new Error(data.message || 'Failed to create alert');
    }

    return res.json();
}

// Phone verification API functions
export async function startPhoneVerification(phoneNumber: string) {
    const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/verify/start`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ phoneNumber }),
        }
    );

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
}

export async function confirmPhoneVerification(otp: string) {
    const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/verify/confirm`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ otp }),
        }
    );

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to verify OTP');
    }
    return data;
}


/*export const getDashboardStats = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/dashboard/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  return response.json();
};*/


export const getDashboardStats = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/dashboard/stats`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
    }

    return response.json();
};

export const getRecentAlertDetails = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/dashboard/recent`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch recent alert details');
    }

    return response.json();
};


// ── Add this to your existing @/lib/api file ──

// Fetch all alerts for history page
/*export const getAllAlerts = async () => {
  const response = await axios.get('/api/alerts'); // update endpoint to match your backend
  return response.data;
};*/




// ✅ Use existing /my-alerts route instead of /alerts
export const getAllAlerts = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alerts/my-alerts`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch alerts');
    }

    return response.json();
};


// ── Settings API Functions ──

// Get current user profile
export const getUserProfile = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    return response.json();
};

// Update user profile (name)
export const updateProfile = async (data: { name?: string }) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update profile');
    }

    return response.json();
};

// Change password
export const changePassword = async (data: { oldPassword: string; newPassword: string }) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to change password');
    }

    return response.json();
};

// Delete account
export const deleteAccount = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/delete`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete account');
    }

    return response.json();
};
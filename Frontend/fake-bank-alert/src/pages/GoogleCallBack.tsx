import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleCallback() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((state) => state.setAuth)

    useEffect(() => {
        // Only run if we're actually on the callback route
        if (!window.location.pathname.includes('/auth/callback')) {
            return;
        }

        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const error = params.get('error')

        if (error) {
            navigate('/login?error=Google authentication failed', { replace: true })
            return
        }

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]))

                setAuth(
                    {
                        id: payload.id,
                        email: payload.email,
                        role: payload.role,
                        name: payload.name
                    },
                    token
                )

                navigate('/dashboard', { replace: true })
            } catch (err) {
                navigate('/login?error=Authentication failed', { replace: true })
            }
        } else {
            navigate('/login', { replace: true })
        }
    }, [navigate, setAuth])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing Google Sign-In...</p>
            </div>
        </div>
    )
}
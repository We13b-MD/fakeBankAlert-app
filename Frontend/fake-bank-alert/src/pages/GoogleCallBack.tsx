import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";

export default function GoogleCallback(){
    const navigate = useNavigate()
    const setAuth = useAuthStore((state)=> state.setAuth)

    useEffect(()=>{
        // ✅ Only run if we're actually on the callback route
        if (!window.location.pathname.includes('/auth/callback')) {
            return;
        }

        console.log('=== GOOGLE CALLBACK ===')
        console.log('Full URL:', window.location.href)
        
        const params = new URLSearchParams(window.location.search)
        const token = params.get('token')
        const error = params.get('error')

        console.log('Token:', token ? 'Present' : 'Missing')
        console.log('Error:', error)

        if(error){
            console.log('Redirecting due to error')
            navigate('/login?error=Google authentication failed', { replace: true })
            return
        }

        if(token){
            try{
                console.log('Decoding token...')
                const payload = JSON.parse(atob(token.split('.')[1]))
                console.log('Decoded payload:', payload)

                setAuth(
                    {
                        id:payload.id,
                        email:payload.email,
                        role:payload.role,
                        name:payload.name
                    },
                    token
                )
                
                console.log('Auth set successfully')
                console.log('Navigating to dashboard...')
                navigate('/dashboard', { replace: true })
            }catch(err){
                console.error('Token parsing error:', err)
                navigate('/login?error=Authentication failed', { replace: true })
            }
        }else{
            console.log('No token found, redirecting to login')
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
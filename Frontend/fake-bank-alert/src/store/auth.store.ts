/*import {create} from 'zustand'

interface User{
    id:string
    name:string
    email:string
}

interface AuthState{
    user:User | null
    token:string | null
    isAuthenticated : boolean
    setAuth:(user:User, token:string)=> void 
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),
}))*/



import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role:string
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      
      // Set authentication data
      setAuth: (user, token) => {
        set({ user, token });
      },
      
      // Clear authentication (logout)
      clearAuth: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-storage', // Key in localStorage
    }
  )
);
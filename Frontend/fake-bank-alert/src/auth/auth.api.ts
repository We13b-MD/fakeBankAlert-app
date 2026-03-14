import axios from "axios";

export interface LoginPayload{
    email:string;
    password:string;
}

export interface RegisterPayload{
    fullName:string;
    email:string;
    password:string;
}

export const authApi = {
    login:(data:LoginPayload) =>
        axios.post('/api/auth/login',data),

    register:(data:RegisterPayload)=>
        axios.post('/api/auth/register', data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axios.put("/api/auth/change-password", data),

         updateProfile: (data: { name?: string; avatar?: string }) =>
    axios.put('/api/auth/update-profile', data),

         deleteAccount:()=>
            axios.delete('/api/auth/delete')

      
    }

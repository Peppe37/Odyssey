import api from './client';

export interface User {
    id: number;
    email: string;
    username: string;
    total_badges: number;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export const login = async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post<AuthResponse>('/token', formData);
    return response.data;
};

export const register = async (email: string, username: string, password: string): Promise<User> => {
    const response = await api.post<User>('/register', { email, username, password });
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
};

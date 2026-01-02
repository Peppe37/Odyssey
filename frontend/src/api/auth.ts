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

export const login = async (
    username: string,
    password: string,
    captchaToken: string = ''
): Promise<AuthResponse> => {
    // Use /login endpoint with JSON body when captcha is provided
    if (captchaToken) {
        const response = await api.post<AuthResponse>('/login', {
            username,
            password,
            captcha_token: captchaToken
        });
        return response.data;
    }

    // Fallback to /token endpoint for OAuth2 form data (backward compatibility)
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post<AuthResponse>('/token', formData);
    return response.data;
};

export const register = async (
    email: string,
    username: string,
    password: string,
    acceptTerms: boolean = true,
    captchaToken: string = ''
): Promise<User> => {
    const response = await api.post<User>('/register', {
        email,
        username,
        password,
        accept_terms: acceptTerms,
        captcha_token: captchaToken
    });
    return response.data;
};

export const getMe = async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
};

export const getGoogleAuthUrl = (): string => {
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    return `${apiUrl}/auth/google`;
};

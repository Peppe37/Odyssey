import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { Map, UserPlus } from 'lucide-react';

declare global {
    interface Window {
        turnstile: {
            render: (container: HTMLElement, options: {
                sitekey: string;
                callback: (token: string) => void;
                'error-callback'?: () => void;
                'expired-callback'?: () => void;
                theme?: 'light' | 'dark' | 'auto';
            }) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
    }
}

// Use dev key in development, production key otherwise
const TURNSTILE_SITE_KEY = import.meta.env.DEV
    ? (import.meta.env.VITE_TURNSTILE_SITE_KEY_DEV || import.meta.env.VITE_TURNSTILE_SITE_KEY || '')
    : (import.meta.env.VITE_TURNSTILE_SITE_KEY || '');
const API_URL = import.meta.env.VITE_API_URL || '/api';

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [captchaToken, setCaptchaToken] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const turnstileRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Load Turnstile script
        if (!document.getElementById('turnstile-script')) {
            const script = document.createElement('script');
            script.id = 'turnstile-script';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);

            script.onload = () => {
                initTurnstile();
            };
        } else if (window.turnstile) {
            initTurnstile();
        }

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
            }
        };
    }, []);

    const initTurnstile = () => {
        if (turnstileRef.current && window.turnstile && TURNSTILE_SITE_KEY) {
            widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
                sitekey: TURNSTILE_SITE_KEY,
                callback: (token: string) => {
                    setCaptchaToken(token);
                },
                'error-callback': () => {
                    setError('Captcha verification failed. Please refresh the page.');
                },
                'expired-callback': () => {
                    setCaptchaToken('');
                },
                theme: 'dark',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!acceptTerms) {
            setError('You must accept the Terms and Conditions and Privacy Policy');
            return;
        }

        if (!captchaToken && TURNSTILE_SITE_KEY) {
            setError('Please complete the captcha verification');
            return;
        }

        setIsLoading(true);
        try {
            await register(email, username, password, acceptTerms, captchaToken);
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed');
            // Reset captcha on error
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
                setCaptchaToken('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-6">
            <div className="w-full max-w-md space-y-5 bg-slate-800 p-5 sm:p-8 rounded-xl border border-slate-700 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                        <Map className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400" />
                    </div>
                    <h2 className="mt-4 sm:mt-6 text-2xl sm:text-3xl font-bold text-white">Begin your Odyssey</h2>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Google Sign-In Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-600 rounded-lg text-white bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-slate-800 text-slate-400">or register with email</span>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <input
                                id="username"
                                type="text"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <label htmlFor="accept-terms" className="flex items-start gap-3 cursor-pointer py-2">
                        <div className="flex items-center pt-0.5">
                            <input
                                id="accept-terms"
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="h-5 w-5 rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-800"
                            />
                        </div>
                        <span className="text-sm text-slate-300">
                            I accept the{' '}
                            <Link to="/legal" className="text-purple-400 hover:text-purple-300 underline">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link to="/legal" className="text-purple-400 hover:text-purple-300 underline">
                                Privacy Policy
                            </Link>
                        </span>
                    </label>

                    {/* Turnstile Captcha */}
                    {TURNSTILE_SITE_KEY && (
                        <div className="flex justify-center">
                            <div ref={turnstileRef}></div>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || (!captchaToken && !!TURNSTILE_SITE_KEY)}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                <UserPlus className="h-5 w-5 text-purple-300 group-hover:text-purple-200" aria-hidden="true" />
                            </span>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm">
                    <span className="text-gray-400">Already have an account? </span>
                    <Link to="/login" className="font-medium text-purple-400 hover:text-purple-300">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

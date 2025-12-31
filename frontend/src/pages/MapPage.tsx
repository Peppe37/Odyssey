import React from 'react';
import { useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent';
import { useAuth } from '../context/AuthContext';
import { LogIn, User } from 'lucide-react';

const MapPage: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="h-full w-full relative">
            <div className="absolute top-4 left-4 z-[1000] bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 shadow-lg pointer-events-auto">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Odyssey
                </h1>
                <p className="text-sm text-gray-300">Your personal atlas</p>

                <div className="mt-4 pt-4 border-t border-white/10">
                    {isAuthenticated && user ? (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-white">
                                <User className="h-4 w-4" />
                                <span className="text-sm font-medium">{user.username}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                        >
                            <LogIn className="h-4 w-4" />
                            <span>Sign in</span>
                        </button>
                    )}
                </div>
            </div>
            <MapComponent />
        </div>
    );
};

export default MapPage;

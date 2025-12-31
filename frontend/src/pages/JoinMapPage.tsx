import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMapInfoForJoin, joinMap, type MapInfo } from '../api/maps';
import { Map as MapIcon, Users, LogIn, UserPlus, Check, Loader2 } from 'lucide-react';

const JoinMapPage: React.FC = () => {
    const { mapId } = useParams<{ mapId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const loadMapInfo = async () => {
            if (!mapId) return;
            try {
                const info = await getMapInfoForJoin(parseInt(mapId));
                setMapInfo(info);
            } catch (e: any) {
                setError(e.response?.data?.detail || 'Map not found');
            } finally {
                setLoading(false);
            }
        };
        loadMapInfo();
    }, [mapId]);

    const handleJoin = async () => {
        if (!mapId) return;
        setJoining(true);
        setError('');
        try {
            await joinMap(parseInt(mapId));
            setSuccess(true);
            setTimeout(() => navigate(`/maps/${mapId}`), 1500);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to join');
        } finally {
            setJoining(false);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (error && !mapInfo) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-xl mb-4">{error}</div>
                    <Link to="/home" className="text-blue-400 hover:underline">Go to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-md text-center shadow-2xl">
                <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                    <MapIcon className="h-8 w-8 text-blue-400" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Join Map</h1>
                <p className="text-gray-400 mb-6">You've been invited to join a map</p>

                {mapInfo && (
                    <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                        <h2 className="text-xl font-semibold text-white">{mapInfo.name}</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${mapInfo.type === 'Collaborative' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                {mapInfo.type}
                            </span>
                        </p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center justify-center">
                            <Users className="h-4 w-4 mr-1" />
                            Created by {mapInfo.creator_username}
                        </p>
                    </div>
                )}

                {success ? (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400 flex items-center justify-center">
                        <Check className="h-5 w-5 mr-2" />
                        Successfully joined! Redirecting...
                    </div>
                ) : isAuthenticated ? (
                    <div className="space-y-3">
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                        <button
                            onClick={handleJoin}
                            disabled={joining}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {joining ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5 mr-2" />
                                    Join This Map
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => navigate('/home')}
                            className="w-full text-gray-400 hover:text-white py-2 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-gray-400 text-sm mb-4">Please log in or register to join this map</p>
                        <Link
                            to={`/login?redirect=/join/${mapId}`}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                        >
                            <LogIn className="h-5 w-5 mr-2" />
                            Log In
                        </Link>
                        <Link
                            to={`/register?redirect=/join/${mapId}`}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                        >
                            <UserPlus className="h-5 w-5 mr-2" />
                            Create Account
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinMapPage;

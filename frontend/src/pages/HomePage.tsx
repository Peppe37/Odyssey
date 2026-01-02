import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMaps, createMap, deleteMap, leaveMap, getUserStats, getNotificationCount, type OdysseyMap, type UserStats, type NotificationCount } from '../api/maps';
import { Map as MapIcon, Plus, Trash2, Users, Swords, LogOut, MapPin, Globe, Building2, Trophy, Bell, DoorOpen, User as UserIcon, Lock } from 'lucide-react';

const HomePage: React.FC = () => {
    const { user, isAuthenticated, logout, isLoading } = useAuth();
    const navigate = useNavigate();
    const [maps, setMaps] = useState<OdysseyMap[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMapName, setNewMapName] = useState('');
    const [newMapType, setNewMapType] = useState<'Collaborative' | 'Competitive' | 'Personal'>('Collaborative');
    const [notifCount, setNotifCount] = useState<NotificationCount | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    const loadData = async () => {
        try {
            const [mapsData, statsData, notifData] = await Promise.all([
                getMaps(),
                getUserStats(),
                getNotificationCount()
            ]);
            setMaps(mapsData);
            setStats(statsData);
            setNotifCount(notifData);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMap = async () => {
        if (!newMapName.trim()) return;
        try {
            await createMap(newMapName, newMapType);
            setNewMapName('');
            setShowCreateModal(false);
            loadData();
        } catch (error) {
            console.error('Failed to create map', error);
        }
    };

    const handleDeleteMap = async (id: number) => {
        if (!confirm('Are you sure you want to delete this map?')) return;
        try {
            await deleteMap(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete map', error);
        }
    };

    const handleLeaveMap = async (mapId: number) => {
        if (!confirm('Are you sure you want to leave this map?')) return;
        try {
            await leaveMap(mapId);
            loadData();
        } catch (error) {
            console.error('Failed to leave map', error);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="bg-slate-800 border-b border-slate-700">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <MapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Odyssey
                        </h1>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-4">
                        {/* Hide welcome text on mobile */}
                        <span className="hidden sm:block text-gray-300">Welcome, <span className="text-white font-medium">{user?.username}</span></span>
                        <Link to={`/profile/${user?.id}`} className="relative p-2 text-gray-400 hover:text-white transition-colors group" title="My Profile">
                            <UserIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Link>
                        <Link to="/leaderboard" className="relative p-2 text-gray-400 hover:text-white transition-colors group" title="Leaderboard">
                            <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                        </Link>
                        <Link to="/notifications" className="relative p-2 text-gray-400 hover:text-white transition-colors group" title="Notifications">
                            <Bell className="h-5 w-5" />
                            {notifCount && notifCount.unread > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                    {notifCount.unread > 9 ? '9+' : notifCount.unread}
                                </span>
                            )}
                        </Link>
                        <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Banner */}
            {stats && (
                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-slate-700">
                    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.total_points}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-400">Total Points</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.unique_cities}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-400">Cities</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.unique_countries}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-400">Countries</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                                    <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-lg sm:text-2xl font-bold text-white">{stats.total_badges}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-400">Badges</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold">Your Odysseys</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg transition-all shadow-lg shadow-blue-500/25"
                    >
                        <Plus className="h-5 w-5" />
                        <span>New Odyssey</span>
                    </button>
                </div>

                {maps.length === 0 ? (
                    <div className="text-center py-16">
                        <MapIcon className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No odysseys yet. Create your first one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {maps.map((map) => (
                            <div
                                key={map.id}
                                className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer group"
                                onClick={() => navigate(`/maps/${map.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {map.name}
                                        </h3>
                                        <div className="flex items-center space-x-2 mt-2">
                                            {map.type === 'Collaborative' && (
                                                <span className="flex items-center text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    Collaborative
                                                </span>
                                            )}
                                            {map.type === 'Competitive' && (
                                                <span className="flex items-center text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded">
                                                    <Swords className="h-3 w-3 mr-1" />
                                                    Competitive
                                                </span>
                                            )}
                                            {map.type === 'Personal' && (
                                                <span className="flex items-center text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Personal
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {map.creator_id === user?.id ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMap(map.id);
                                            }}
                                            className="text-gray-500 hover:text-red-400 transition-colors p-1"
                                            title="Delete map"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleLeaveMap(map.id);
                                            }}
                                            className="text-gray-500 hover:text-orange-400 transition-colors p-1"
                                            title="Leave map"
                                        >
                                            <DoorOpen className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Map Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Create New Odyssey</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newMapName}
                                    onChange={(e) => setNewMapName(e.target.value)}
                                    placeholder="e.g., Kiss Map, Food Quest..."
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setNewMapType('Collaborative')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${newMapType === 'Collaborative'
                                            ? 'bg-green-500/20 border-green-500 text-green-400'
                                            : 'border-slate-600 text-gray-400 hover:border-slate-500'
                                            }`}
                                    >
                                        <Users className="h-4 w-4 mb-1" />
                                        <span className="text-xs">Collaborative</span>
                                    </button>
                                    <button
                                        onClick={() => setNewMapType('Competitive')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${newMapType === 'Competitive'
                                            ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                            : 'border-slate-600 text-gray-400 hover:border-slate-500'
                                            }`}
                                    >
                                        <Swords className="h-4 w-4 mb-1" />
                                        <span className="text-xs">Competitive</span>
                                    </button>
                                    <button
                                        onClick={() => setNewMapType('Personal')}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${newMapType === 'Personal'
                                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                            : 'border-slate-600 text-gray-400 hover:border-slate-500'
                                            }`}
                                    >
                                        <Lock className="h-4 w-4 mb-1" />
                                        <span className="text-xs">Personal</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateMap}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;

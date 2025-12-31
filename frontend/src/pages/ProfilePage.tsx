import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPublicProfile, updateProfile, type PublicProfile, type UpdateProfileData } from '../api/maps';
import { ArrowLeft, Trophy, Calendar, Loader2, Edit2, Save, X, Globe } from 'lucide-react';
import BadgesDisplay from '../components/BadgesDisplay';

const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<UpdateProfileData>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // If userId is 'me', redirect to actual ID
    useEffect(() => {
        if (userId === 'me' && user) {
            navigate(`/profile/${user.id}`, { replace: true });
        }
    }, [userId, user, navigate]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const loadProfile = useCallback(async () => {
        if (!userId || userId === 'me') return;
        setLoading(true);
        try {
            const data = await getPublicProfile(parseInt(userId));
            setProfile(data);
            setEditForm({
                username: data.user.username,
                bio: data.user.bio || '',
                password: ''
            });
        } catch (e) {
            console.error('Failed to load profile', e);
            // Redirect to home if user not found
            navigate('/home');
        } finally {
            setLoading(false);
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            loadProfile();
        }
    }, [isAuthenticated, loadProfile]);

    const handleSaveProfile = async () => {
        setSaving(true);
        setError('');
        try {
            // Only send fields that changed (simple check) or just send all non-empty
            const dataToSend: UpdateProfileData = {};
            if (editForm.username !== profile?.user.username) dataToSend.username = editForm.username;
            if (editForm.bio !== profile?.user.bio) dataToSend.bio = editForm.bio;
            if (editForm.password) dataToSend.password = editForm.password;

            if (Object.keys(dataToSend).length === 0) {
                setShowEditModal(false);
                setSaving(false);
                return;
            }

            await updateProfile(dataToSend);
            setShowEditModal(false);
            loadProfile(); // Reload to see changes
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    const isOwnProfile = user?.id === profile.user.id;

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-bold">User Profile</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* User Header */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 mb-8 border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

                    <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8 relative z-10">
                        {/* Avatar Placeholder */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 md:mb-0 border-4 border-slate-800">
                            {profile.user.username.charAt(0).toUpperCase()}
                        </div>

                        <div className="text-center md:text-left flex-1 w-full">
                            <div className="flex flex-col md:flex-row items-center justify-between mb-2">
                                <h2 className="text-3xl font-bold text-white mb-2 md:mb-0">{profile.user.username}</h2>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                )}
                            </div>

                            {/* Bio Section */}
                            {profile.user.bio && (
                                <p className="text-gray-300 mb-4 max-w-2xl text-sm italic border-l-2 border-slate-600 pl-3">
                                    "{profile.user.bio}"
                                </p>
                            )}
                            {!profile.user.bio && isOwnProfile && (
                                <p className="text-gray-500 mb-4 text-sm italic cursor-pointer hover:text-gray-400" onClick={() => setShowEditModal(true)}>
                                    Tap to add a bio...
                                </p>
                            )}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 text-sm mb-6">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1.5" />
                                    Joined {new Date(profile.user.joined_at).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                    <Trophy className="h-4 w-4 mr-1.5 text-yellow-500" />
                                    Level {Math.floor(profile.stats.total_points / 5) + 1}
                                </div>
                                {profile.stats.global_rank_points && (
                                    <div className="flex items-center text-blue-400">
                                        <Globe className="h-4 w-4 mr-1.5" />
                                        Global Rank: #{profile.stats.global_rank_points}
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto md:mx-0">
                                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center hover:bg-slate-800 transition-colors">
                                    <div className="text-2xl font-bold text-blue-400">{profile.stats.total_points}</div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Points</div>
                                    {profile.stats.global_rank_points && <div className="text-[10px] text-blue-500/70">#{profile.stats.global_rank_points}</div>}
                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center hover:bg-slate-800 transition-colors">
                                    <div className="text-2xl font-bold text-green-400">{profile.stats.unique_countries}</div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Countries</div>
                                    {profile.stats.global_rank_countries && <div className="text-[10px] text-green-500/70">#{profile.stats.global_rank_countries}</div>}

                                </div>
                                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center hover:bg-slate-800 transition-colors">
                                    <div className="text-2xl font-bold text-purple-400">{profile.stats.unique_continents}</div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">Continents</div>
                                    {profile.stats.global_rank_continents && <div className="text-[10px] text-purple-500/70">#{profile.stats.global_rank_continents}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center">
                        <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                        Badges Collection
                    </h3>
                    <BadgesDisplay stats={{ ...profile.stats, badges_by_category: profile.stats.badges_by_category }} />
                </div>
            </main>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">{error}</div>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                    placeholder="Tell us about your travels..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">New Password (Empty to keep current)</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-8">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;

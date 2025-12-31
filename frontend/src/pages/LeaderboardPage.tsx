import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getEnhancedUserStats, type LeaderboardEntry, type EnhancedUserStats } from '../api/maps';
import { ArrowLeft, Trophy, MapPin, Globe, Loader2, Medal } from 'lucide-react';

const LeaderboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, user } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [myStats, setMyStats] = useState<EnhancedUserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'points' | 'countries' | 'continents'>('points');

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [leaderboardData, statsData] = await Promise.all([
                getLeaderboard(sortBy),
                getEnhancedUserStats()
            ]);
            setEntries(leaderboardData);
            setMyStats(statsData);
        } catch (e) {
            console.error('Failed to load data', e);
        } finally {
            setLoading(false);
        }
    }, [sortBy]);

    useEffect(() => {
        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated, loadData]);

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return 'text-yellow-400';
            case 1: return 'text-gray-300';
            case 2: return 'text-amber-600';
            default: return 'text-slate-600';
        }
    };

    const getMyRank = () => {
        if (!myStats) return null;
        if (sortBy === 'points') return myStats.global_rank_points;
        if (sortBy === 'countries') return myStats.global_rank_countries;
        if (sortBy === 'continents') return myStats.global_rank_continents;
        return null;
    };

    const getMyValue = () => {
        if (!myStats) return 0;
        if (sortBy === 'points') return myStats.total_points;
        if (sortBy === 'countries') return myStats.unique_countries;
        if (sortBy === 'continents') return myStats.unique_continents;
        return 0;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 sticky top-0 z-10 flex-none">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center space-x-2">
                            <Trophy className="h-5 w-5 text-yellow-400" />
                            <h1 className="text-xl font-bold">Leaderboard</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6 flex-1 w-full pb-24">
                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-800 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setSortBy('points')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'points' ? 'bg-slate-700 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
                    >
                        <Trophy className="h-4 w-4" />
                        <span>Travelers</span>
                    </button>
                    <button
                        onClick={() => setSortBy('countries')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'countries' ? 'bg-slate-700 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
                    >
                        <Globe className="h-4 w-4" />
                        <span>Explorers</span>
                    </button>
                    <button
                        onClick={() => setSortBy('continents')}
                        className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-colors ${sortBy === 'continents' ? 'bg-slate-700 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}
                    >
                        <MapPin className="h-4 w-4" />
                        <span>Pioneers</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {entries.map((entry, index) => (
                            <div
                                key={entry.user_id}
                                onClick={() => navigate(`/profile/${entry.user_id}`)}
                                className={`bg-slate-800 rounded-xl border p-4 transition-all cursor-pointer group flex items-center ${entry.user_id === user?.id
                                        ? 'border-blue-500/50 bg-blue-500/10'
                                        : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-750'
                                    }`}
                            >
                                <div className="w-8 flex justify-center mr-4">
                                    {index < 3 ? (
                                        <Medal className={`h-6 w-6 ${getMedalColor(index)}`} />
                                    ) : (
                                        <span className={`font-mono font-bold ${entry.user_id === user?.id ? 'text-blue-400' : 'text-gray-500'}`}>
                                            #{index + 1}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <span className={`font-semibold transition-colors ${entry.user_id === user?.id ? 'text-blue-400' : 'text-white group-hover:text-blue-400'
                                            }`}>
                                            {entry.username} {entry.user_id === user?.id && '(You)'}
                                        </span>
                                        {entry.total_badges > 0 && (
                                            <span className="bg-yellow-500/10 text-yellow-400 text-xs px-1.5 py-0.5 rounded border border-yellow-500/20">
                                                {entry.total_badges} 🏅
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 flex space-x-3">
                                        <span>{entry.unique_countries} Countries</span>
                                        <span>•</span>
                                        <span>{entry.unique_continents} Continents</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-bold ${entry.user_id === user?.id ? 'text-blue-400' : 'text-white'}`}>
                                        {sortBy === 'points' && entry.total_points}
                                        {sortBy === 'countries' && entry.unique_countries}
                                        {sortBy === 'continents' && entry.unique_continents}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase font-medium">
                                        {sortBy === 'points' ? 'Points' : sortBy}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {entries.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No users found in ranking.
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Sticky User Footer */}
            {myStats && !loading && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 shadow-2xl z-20">
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg border-2 border-slate-700">
                                {user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Your Rank</div>
                                <div className="text-lg font-bold text-white flex items-center">
                                    #{getMyRank()}
                                    <span className="text-xs font-normal text-gray-500 ml-2">global</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-blue-400">
                                {getMyValue()}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">
                                {sortBy === 'points' ? 'Points' : sortBy}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaderboardPage;

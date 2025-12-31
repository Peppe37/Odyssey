import React, { useState, useEffect } from 'react';
import { X, Search, User, Link2, Copy, Check, Loader2, UserPlus } from 'lucide-react';
import { searchUsers, inviteParticipant, type UserSearchResult } from '../api/maps';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mapId: number;
    mapName: string;
}

const InviteModal: React.FC<InviteModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    mapId,
    mapName
}) => {
    const [mode, setMode] = useState<'search' | 'link'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [copied, setCopied] = useState(false);

    // Generate invite link (in real app this would be a token-based link)
    const inviteLink = `${window.location.origin}/join/${mapId}`;

    // Debounced user search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 1) {
                setSearchLoading(true);
                try {
                    const results = await searchUsers(searchQuery);
                    setSuggestions(results);
                } catch (e) {
                    console.error('Search error:', e);
                    setSuggestions([]);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleInviteUser = async (username: string) => {
        setError('');
        setSuccess('');
        setInviting(true);

        try {
            await inviteParticipant(mapId, username);
            setSuccess(`${username} has been invited!`);
            setSearchQuery('');
            setSuggestions([]);
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (e: any) {
            setError(e.response?.data?.detail || 'Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    const resetState = () => {
        setSearchQuery('');
        setSuggestions([]);
        setError('');
        setSuccess('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000]">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <UserPlus className="h-5 w-5 mr-2 text-blue-400" />
                        Invite to {mapName}
                    </h3>
                    <button onClick={() => { resetState(); onClose(); }} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setMode('search')}
                        className={`flex-1 py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 ${mode === 'search' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        <User className="h-4 w-4" />
                        <span>Search User</span>
                    </button>
                    <button
                        onClick={() => setMode('link')}
                        className={`flex-1 py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-2 ${mode === 'link' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        <Link2 className="h-4 w-4" />
                        <span>Share Link</span>
                    </button>
                </div>

                {mode === 'search' ? (
                    <div>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by username..."
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
                            )}
                        </div>

                        {/* User suggestions */}
                        {suggestions.length > 0 && (
                            <div className="mt-2 bg-slate-700 border border-slate-600 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                {suggestions.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleInviteUser(user.username)}
                                        disabled={inviting}
                                        className="w-full text-left px-3 py-2.5 hover:bg-slate-600 text-white flex items-center justify-between border-b border-slate-600 last:border-0 disabled:opacity-50"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <User className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <span className="font-medium">{user.username}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">Click to invite</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {searchQuery.length > 0 && suggestions.length === 0 && !searchLoading && (
                            <p className="mt-3 text-gray-400 text-sm text-center">No users found matching "{searchQuery}"</p>
                        )}
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-400 text-sm mb-3">
                            Share this link with others to invite them to your map:
                        </p>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                            />
                            <button
                                onClick={handleCopyLink}
                                className={`px-3 py-2 rounded-lg transition-colors ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Note: Users will need an account to join.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mt-3 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg p-2 flex items-center">
                        <Check className="h-4 w-4 mr-2" />
                        {success}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => { resetState(); onClose(); }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;

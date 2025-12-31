import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
    acceptInvite, declineInvite, type Notification
} from '../api/maps';
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Award, UserPlus, Loader2, X } from 'lucide-react';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (e) {
            console.error('Failed to load notifications', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
        }
    }, [isAuthenticated, loadNotifications]);

    const handleMarkRead = async (id: number) => {
        try {
            await markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (e) {
            console.error('Failed to mark as read', e);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) {
            console.error('Failed to mark all as read', e);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteNotification(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (e) {
            console.error('Failed to delete notification', e);
        }
    };

    const handleAcceptInvite = async (notification: Notification) => {
        if (!notification.data?.map_id) return;
        setActionLoading(notification.id);
        try {
            await acceptInvite(notification.data.map_id, notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
            // Navigate to the map
            navigate(`/maps/${notification.data.map_id}`);
        } catch (e: any) {
            console.error('Failed to accept invite', e);
            alert(e.response?.data?.detail || 'Failed to accept invite');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeclineInvite = async (notification: Notification) => {
        if (!notification.data?.map_id) return;
        setActionLoading(notification.id);
        try {
            await declineInvite(notification.data.map_id, notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        } catch (e: any) {
            console.error('Failed to decline invite', e);
        } finally {
            setActionLoading(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'invite': return <UserPlus className="h-5 w-5 text-blue-400" />;
            case 'achievement': return <Award className="h-5 w-5 text-yellow-400" />;
            default: return <Bell className="h-5 w-5 text-gray-400" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center space-x-2">
                            <Bell className="h-5 w-5 text-blue-400" />
                            <h1 className="text-xl font-bold">Notifications</h1>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                            )}
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-sm text-blue-400 hover:text-blue-300 flex items-center">
                            <CheckCheck className="h-4 w-4 mr-1" />
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-6">
                {notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">No notifications yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-slate-800 rounded-xl border p-4 ${notification.read ? 'border-slate-700' : 'border-blue-500/30 bg-blue-500/5'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="mt-0.5">{getIcon(notification.type)}</div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">{notification.title}</p>
                                            <p className="text-sm text-gray-400">{notification.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>

                                            {/* Accept/Decline buttons for pending invites */}
                                            {notification.type === 'invite' && !notification.read && (
                                                <div className="flex space-x-2 mt-3">
                                                    <button
                                                        onClick={() => handleAcceptInvite(notification)}
                                                        disabled={actionLoading === notification.id}
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                                                    >
                                                        {actionLoading === notification.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Check className="h-4 w-4" />
                                                                <span>Accept</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeclineInvite(notification)}
                                                        disabled={actionLoading === notification.id}
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-sm transition-colors disabled:opacity-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                        <span>Decline</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {!notification.read && notification.type !== 'invite' && (
                                            <button
                                                onClick={() => handleMarkRead(notification.id)}
                                                className="text-blue-400 hover:text-blue-300 p-1"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            className="text-gray-500 hover:text-red-400 p-1"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default NotificationsPage;

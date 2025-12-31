import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getPointsPaginated, deletePoint, getMap, getParticipants,
    updateParticipantColor, removeParticipant, getRoutes, createRoute, deleteRoute, updateRoute, getPoints,
    type OdysseyMap, type Point, type PaginatedPointsResponse, type Participant, type Route
} from '../api/maps';
import { ArrowLeft, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X, Check, MapPin, Users, Crosshair, Palette, Waypoints, Plus } from 'lucide-react';
import AddPointModal from '../components/AddPointModal';

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#F43F5E"];

const PointsManagementPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuth();

    const [map, setMap] = useState<OdysseyMap | null>(null);
    const [data, setData] = useState<PaginatedPointsResponse | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [allPoints, setAllPoints] = useState<Point[]>([]); // For route creation selectors
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'points' | 'members' | 'routes'>('points');

    // Filters & pagination
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('timestamp');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Point Edit state (Modal)
    const [editingPoint, setEditingPoint] = useState<Point | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Route Edit state (Inline)
    const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
    const [editRouteStart, setEditRouteStart] = useState<string>('');
    const [editRouteEnd, setEditRouteEnd] = useState<string>('');
    const [routeSaving, setRouteSaving] = useState(false);

    // Color picker state
    const [colorPickerFor, setColorPickerFor] = useState<number | null>(null);

    // Route create state
    const [startPointId, setStartPointId] = useState<string>('');
    const [endPointId, setEndPointId] = useState<string>('');
    const [routeCreating, setRouteCreating] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [mapData, pointsData, participantsData, routesData, allPointsData] = await Promise.all([
                getMap(parseInt(id)),
                getPointsPaginated(parseInt(id), { page, search, sort_by: sortBy, sort_order: sortOrder, limit: 15 }),
                getParticipants(parseInt(id)),
                getRoutes(parseInt(id)),
                getPoints(parseInt(id))
            ]);
            setMap(mapData);
            setData(pointsData);
            setParticipants(participantsData);
            setRoutes(routesData);
            setAllPoints(allPointsData);
        } catch (error) {
            console.error('Failed to load data', error);
            navigate('/home');
        } finally {
            setLoading(false);
        }
    }, [id, page, search, sortBy, sortOrder, navigate]);

    useEffect(() => {
        if (isAuthenticated && id) {
            loadData();
        }
    }, [isAuthenticated, id, loadData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadData();
    };

    const handleDelete = async (pointId: number) => {
        if (!id || !confirm('Delete this point?')) return;
        try {
            await deletePoint(parseInt(id), pointId);
            loadData();
        } catch (error) {
            console.error('Failed to delete point', error);
        }
    };

    const handleEditPoint = (point: Point) => {
        setEditingPoint(point);
        setShowEditModal(true);
    };

    const handleFindPoint = (point: Point) => {
        navigate(`/maps/${id}?lat=${point.latitude}&lng=${point.longitude}&zoom=15`);
    };

    const handleColorChange = async (userId: number, color: string) => {
        if (!id) return;
        try {
            await updateParticipantColor(parseInt(id), userId, color);
            setColorPickerFor(null);
            loadData();
        } catch (error) {
            console.error('Failed to update color', error);
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!id || !confirm('Remove this member? Their points will be deleted.')) return;
        try {
            await removeParticipant(parseInt(id), userId);
            loadData();
        } catch (error) {
            console.error('Failed to remove member', error);
        }
    };

    const handleCreateRoute = async () => {
        if (!id || !startPointId || !endPointId) return;
        if (startPointId === endPointId) {
            alert('Start and end points must be different');
            return;
        }
        setRouteCreating(true);
        try {
            await createRoute(parseInt(id), parseInt(startPointId), parseInt(endPointId));
            setStartPointId('');
            setEndPointId('');
            loadData();
        } catch (error) {
            console.error('Failed to create route', error);
            alert('Failed to create route');
        } finally {
            setRouteCreating(false);
        }
    };

    const handleDeleteRoute = async (routeId: number) => {
        if (!id || !confirm('Delete this route?')) return;
        try {
            await deleteRoute(parseInt(id), routeId);
            loadData();
        } catch (error) {
            console.error('Failed to delete route', error);
        }
    };

    // Route Editing
    const startEditRoute = (route: Route) => {
        setEditingRouteId(route.id);
        setEditRouteStart(route.start_point_id.toString());
        setEditRouteEnd(route.end_point_id.toString());
    };

    const cancelEditRoute = () => {
        setEditingRouteId(null);
        setEditRouteStart('');
        setEditRouteEnd('');
    };

    const saveEditRoute = async () => {
        if (!id || !editingRouteId || !editRouteStart || !editRouteEnd) return;
        if (editRouteStart === editRouteEnd) {
            alert('Start and end points must be different');
            return;
        }
        setRouteSaving(true);
        try {
            await updateRoute(parseInt(id), editingRouteId, parseInt(editRouteStart), parseInt(editRouteEnd));
            cancelEditRoute();
            loadData();
        } catch (error: any) {
            console.error('Failed to update route', error);
            const msg = error.response?.data?.detail || 'Failed to update route';
            alert(`Error: ${msg}`);
        } finally {
            setRouteSaving(false);
        }
    };


    const isOwner = map?.creator_id === user?.id;

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    // Helper to get point name
    const getPointLabel = (pointId: number) => {
        const p = allPoints.find(pt => pt.id === pointId);
        if (!p) return `Unknown Point (${pointId})`;
        return `${p.city || 'Unknown'} (${p.country || '?'})`;
    };

    const sortedPoints = [...allPoints].sort((a, b) => (a.city || '').localeCompare(b.city || ''));

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(`/maps/${id}`)} className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-bold">Manage: {map?.name}</h1>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-4 py-4">
                <div className="flex space-x-2 border-b border-slate-700 pb-2">
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg ${activeTab === 'points' ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <MapPin className="h-4 w-4" />
                        <span>Points</span>
                    </button>
                    {isOwner && (
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg ${activeTab === 'members' ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Users className="h-4 w-4" />
                            <span>Members</span>
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('routes')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg ${activeTab === 'routes' ? 'bg-slate-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Waypoints className="h-4 w-4" />
                        <span>Routes</span>
                    </button>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 pb-8">
                {activeTab === 'points' ? (
                    <>
                        {/* Search & Sort */}
                        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 mb-6">
                            <div className="flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by city or country..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
                            >
                                <option value="timestamp">Date</option>
                                <option value="city">City</option>
                                <option value="country">Country</option>
                            </select>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2"
                            >
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                            </select>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
                                Search
                            </button>
                        </form>

                        {/* Points Table */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">City</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Country</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Category</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-300">Date</th>
                                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {data?.items.map((point) => (
                                        <tr key={point.id} className="hover:bg-slate-700/30">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="h-4 w-4 text-blue-400" />
                                                    <span className="text-white">{point.city || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">{point.country || '-'}</td>
                                            <td className="px-4 py-3 text-gray-300">{point.category || '-'}</td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">
                                                {point.timestamp ? new Date(point.timestamp).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end space-x-2">
                                                    {/* Find button for all points */}
                                                    <button
                                                        onClick={() => handleFindPoint(point)}
                                                        className="text-cyan-400 hover:text-cyan-300 p-1"
                                                        title="Find on map"
                                                    >
                                                        <Crosshair className="h-4 w-4" />
                                                    </button>
                                                    {point.user_id === user?.id && (
                                                        <>
                                                            <button onClick={() => handleEditPoint(point)} className="text-blue-400 hover:text-blue-300 p-1">
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button onClick={() => handleDelete(point.id)} className="text-red-400 hover:text-red-300 p-1">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {data && data.pages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                                    <span className="text-sm text-gray-400">
                                        Page {data.page} of {data.pages}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-2 rounded bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                                            disabled={page === data.pages}
                                            className="p-2 rounded bg-slate-700 text-white disabled:opacity-50 hover:bg-slate-600"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : activeTab === 'members' ? (
                    /* Members Tab */
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-lg font-semibold">Map Members</h3>
                            <p className="text-sm text-gray-400">Manage participants and their colors</p>
                        </div>
                        <div className="divide-y divide-slate-700">
                            {participants.map((p) => (
                                <div key={p.user_id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-white transition-all relative"
                                            style={{ backgroundColor: p.assigned_color || '#3B82F6' }}
                                            onClick={() => setColorPickerFor(colorPickerFor === p.user_id ? null : p.user_id)}
                                            title="Click to change color"
                                        >
                                            <Palette className="h-4 w-4 text-white/70 absolute inset-0 m-auto" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{p.username}</p>
                                            <p className="text-xs text-gray-400">{p.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {p.role !== 'Owner' && (
                                            <button
                                                onClick={() => handleRemoveMember(p.user_id)}
                                                className="text-red-400 hover:text-red-300 p-2"
                                                title="Remove member"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Color Picker Dropdown */}
                                    {colorPickerFor === p.user_id && (
                                        <div className="absolute mt-32 ml-4 bg-slate-700 rounded-lg p-2 shadow-lg z-10 flex flex-wrap gap-2 w-40">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorChange(p.user_id, color)}
                                                    className="w-6 h-6 rounded-full hover:ring-2 hover:ring-white transition-all"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Routes Tab */
                    <div className="space-y-6">
                        {/* Create Route */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center">
                                <Plus className="h-5 w-5 mr-2" />
                                Create New Route
                            </h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-400 mb-1">Start Point</label>
                                    <select
                                        value={startPointId}
                                        onChange={(e) => setStartPointId(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select start point</option>
                                        {sortedPoints.map(p => (
                                            <option key={p.id} value={p.id}>{getPointLabel(p.id)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-400 mb-1">End Point</label>
                                    <select
                                        value={endPointId}
                                        onChange={(e) => setEndPointId(e.target.value)}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select end point</option>
                                        {sortedPoints.map(p => (
                                            <option key={p.id} value={p.id}>{getPointLabel(p.id)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleCreateRoute}
                                        disabled={routeCreating || !startPointId || !endPointId}
                                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
                                    >
                                        {routeCreating ? 'Creating...' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Routes List */}
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <div className="p-4 border-b border-slate-700">
                                <h3 className="text-lg font-semibold">Existing Routes</h3>
                            </div>
                            <div className="divide-y divide-slate-700">
                                {routes.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                        No routes created yet.
                                    </div>
                                ) : (
                                    routes.map(route => {
                                        const start = allPoints.find(p => p.id === route.start_point_id);
                                        const end = allPoints.find(p => p.id === route.end_point_id);
                                        const isEditing = editingRouteId === route.id;

                                        return (
                                            <div key={route.id} className="p-4 flex items-center justify-between hover:bg-slate-700/30">
                                                <div className="flex items-center space-x-3 w-full">
                                                    <div className="w-8 h-1 rounded-full shrink-0" style={{ backgroundColor: route.color || '#fff' }}></div>

                                                    {isEditing ? (
                                                        <div className="flex flex-1 items-center space-x-2">
                                                            <select
                                                                value={editRouteStart}
                                                                onChange={(e) => setEditRouteStart(e.target.value)}
                                                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full"
                                                            >
                                                                {sortedPoints.map(p => <option key={p.id} value={p.id}>{getPointLabel(p.id)}</option>)}
                                                            </select>
                                                            <span className="text-gray-500">→</span>
                                                            <select
                                                                value={editRouteEnd}
                                                                onChange={(e) => setEditRouteEnd(e.target.value)}
                                                                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white w-full"
                                                            >
                                                                {sortedPoints.map(p => <option key={p.id} value={p.id}>{getPointLabel(p.id)}</option>)}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className="text-white flex-1">
                                                            <span className="font-medium">{start?.city || 'Unknown'}</span>
                                                            <span className="text-gray-500 mx-2">→</span>
                                                            <span className="font-medium">{end?.city || 'Unknown'}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-2 ml-4">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={saveEditRoute} disabled={routeSaving} className="text-green-400 hover:text-green-300 p-2 disabled:opacity-50"><Check className="h-4 w-4" /></button>
                                                            <button onClick={cancelEditRoute} className="text-gray-400 hover:text-white p-2"><X className="h-4 w-4" /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {(route.user_id === user?.id) && (
                                                                <>
                                                                    <button onClick={() => startEditRoute(route)} className="text-blue-400 hover:text-blue-300 p-2"><Edit2 className="h-4 w-4" /></button>
                                                                    <button onClick={() => handleDeleteRoute(route.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="h-4 w-4" /></button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {id && (
                <AddPointModal
                    isOpen={showEditModal}
                    onClose={() => { setShowEditModal(false); setEditingPoint(null); }}
                    onSuccess={loadData}
                    mapId={parseInt(id)}
                    point={editingPoint}
                />
            )}
        </div>
    );
};

export default PointsManagementPage;

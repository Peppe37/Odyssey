import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap, Polyline } from 'react-leaflet';
import { useAuth } from '../context/AuthContext';
import {
    getMap, getPoints, deletePoint, getParticipants, getEnhancedUserStats, getRoutes,
    type OdysseyMap, type Point, type Participant, type EnhancedUserStats, type Route
} from '../api/maps';
import BadgesDisplay from '../components/BadgesDisplay';
import AddPointModal from '../components/AddPointModal';
import InviteModal from '../components/InviteModal';
import { ArrowLeft, UserPlus, Trash2, Users, Trophy, MapPin, Globe, Building2, Award, Crosshair, List, Globe2, Map as MapIcon, Filter } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Lazy load 3D globe
const Globe3DView = lazy(() => import('../components/Globe3DView'));

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Categories config
export const CATEGORIES = [
    { name: 'Restaurant', icon: '🍽️', color: '#EF4444' },
    { name: 'Hotel', icon: '🏨', color: '#3B82F6' },
    { name: 'Monument', icon: '🏛️', color: '#F59E0B' },
    { name: 'Nature', icon: '🌲', color: '#10B981' },
    { name: 'House', icon: '🏠', color: '#8B5CF6' },
    { name: 'Shop', icon: '🛍️', color: '#F43F5E' },
    { name: 'Other', icon: '📍', color: '#64748B' }
];

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Click handler component
const ClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

// Location marker component
const LocationMarker: React.FC<{ position: [number, number] | null }> = ({ position }) => {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 13);
        }
    }, [position, map]);

    if (!position) return null;

    const locationIcon = L.divIcon({
        className: 'current-location-marker',
        html: `<div style="width: 20px; height: 20px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
            <div style="width: 10px; height: 10px; background: #3B82F6; border-radius: 50%; border: 2px solid white;"></div>
        </div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    return <Marker position={position} icon={locationIcon} />;
};

// FlyToPoint component for navigating to specific coordinates
const FlyToPoint: React.FC<{ lat: number | null; lng: number | null; zoom: number }> = ({ lat, lng, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (lat !== null && lng !== null) {
            map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
        }
    }, [lat, lng, zoom, map]);

    return null;
};

const MapDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated, isLoading } = useAuth();

    // Parse URL params for Find functionality
    const focusLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const focusLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const focusZoom = searchParams.get('zoom') ? parseInt(searchParams.get('zoom')!) : 15;

    const [map, setMap] = useState<OdysseyMap | null>(null);
    const [points, setPoints] = useState<Point[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]); // Routes state
    const [userStats, setUserStats] = useState<EnhancedUserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showStatsPanel, setShowStatsPanel] = useState(true);
    const [showBadgesPanel, setShowBadgesPanel] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
    const [locatingUser, setLocatingUser] = useState(false);
    const [showAddPointModal, setShowAddPointModal] = useState(false);
    const [pendingPoint, setPendingPoint] = useState<{ lat: number; lng: number } | null>(null);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

    // Filtering state
    const [filterCategory, setFilterCategory] = useState<string | null>(null);

    useEffect(() => {
        if (map) {
            document.title = `${map.name} | Odyssey`;
        } else {
            document.title = 'Odyssey';
        }
    }, [map]);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            const [mapData, pointsData, participantsData, statsData, routesData] = await Promise.all([
                getMap(parseInt(id)),
                getPoints(parseInt(id)),
                getParticipants(parseInt(id)),
                getEnhancedUserStats(),
                getRoutes(parseInt(id))
            ]);
            setMap(mapData);
            setPoints(pointsData);
            setParticipants(participantsData);
            setUserStats(statsData);
            setRoutes(routesData);
        } catch (error) {
            console.error('Failed to load map data', error);
            navigate('/home');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (isAuthenticated && id) {
            loadData();
        }
    }, [isAuthenticated, id, loadData]);

    const handleMapClick = (lat: number, lng: number) => {
        if (lat < -85 || lat > 85 || lng < -180 || lng > 180) return;
        setPendingPoint({ lat, lng });
        setShowAddPointModal(true);
    };

    const handleDeletePoint = async (pointId: number) => {
        if (!id) return;
        try {
            await deletePoint(parseInt(id), pointId);
            loadData();
        } catch (error) {
            console.error('Failed to delete point', error);
        }
    };

    const handleLocateMe = () => {
        setLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation([position.coords.latitude, position.coords.longitude]);
                setLocatingUser(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Unable to get your location.');
                setLocatingUser(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const getParticipantInfo = (userId: number) => participants.find(p => p.user_id === userId);

    const getLeaderboard = () => {
        const pointsByUser: Record<number, number> = {};
        points.forEach(p => { pointsByUser[p.user_id] = (pointsByUser[p.user_id] || 0) + 1; });
        return participants.map(p => ({ ...p, pointCount: pointsByUser[p.user_id] || 0 })).sort((a, b) => b.pointCount - a.pointCount);
    };

    const getCategoryIcon = (categoryName?: string) => {
        if (!categoryName) return null;
        return CATEGORIES.find(c => c.name === categoryName)?.icon;
    };

    // Filter points
    const filteredPoints = filterCategory
        ? points.filter(p => p.category === filterCategory)
        : points;

    if (isLoading || loading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>;
    }

    const leaderboard = getLeaderboard();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/home')} className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
                    <h1 className="text-lg font-semibold">{map?.name}</h1>
                    <span className={`text-xs px-2 py-1 rounded ${map?.type === 'Collaborative' ? 'bg-green-500/20 text-green-400' :
                        map?.type === 'Competitive' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                        }`}>{map?.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Filter Dropdown */}
                    <div className="relative group">
                        <button className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${filterCategory ? 'bg-indigo-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                            <Filter className="h-4 w-4" />
                            <span>{filterCategory || 'All'}</span>
                        </button>
                        <div className="absolute top-full right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2 hidden group-hover:block w-40 z-50">
                            <button onClick={() => setFilterCategory(null)} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm">All Categories</button>
                            {CATEGORIES.map(cat => (
                                <button key={cat.name} onClick={() => setFilterCategory(cat.name)} className="w-full text-left px-3 py-2 rounded hover:bg-slate-700 text-sm flex items-center">
                                    <span className="mr-2">{cat.icon}</span> {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')} className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm ${viewMode === '3d' ? 'bg-purple-600' : 'bg-slate-700 hover:bg-slate-600'}`}>
                        {viewMode === '2d' ? <Globe2 className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                        <span>{viewMode === '2d' ? '3D' : '2D'}</span>
                    </button>
                    <button onClick={() => navigate(`/maps/${id}/points`)} className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm"><List className="h-4 w-4" /><span>Manage</span></button>
                    <button onClick={() => { setShowBadgesPanel(!showBadgesPanel); setShowStatsPanel(false); }} className={`px-3 py-1.5 rounded-lg text-sm ${showBadgesPanel ? 'bg-yellow-600' : 'bg-slate-700 hover:bg-slate-600'}`}><Award className="h-4 w-4" /></button>
                    <button onClick={() => { setShowStatsPanel(!showStatsPanel); setShowBadgesPanel(false); }} className={`px-3 py-1.5 rounded-lg text-sm ${showStatsPanel ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}>Stats</button>

                    {map?.type !== 'Personal' && map?.creator_id === user?.id && (
                        <button onClick={() => setShowInviteModal(true)} className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm"><UserPlus className="h-4 w-4" /><span>Invite</span></button>
                    )}
                </div>
            </header>

            <div className="flex-1 relative">
                {viewMode === '2d' ? (
                    <MapContainer center={[41.9028, 12.4964]} zoom={5} minZoom={2} maxBounds={[[-85, -180], [85, 180]]} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
                        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" noWrap={true} />
                        <ClickHandler onMapClick={handleMapClick} />
                        <LocationMarker position={currentLocation} />
                        <FlyToPoint lat={focusLat} lng={focusLng} zoom={focusZoom} />

                        {/* Routes rendering */}
                        {routes.map(route => {
                            const start = points.find(p => p.id === route.start_point_id);
                            const end = points.find(p => p.id === route.end_point_id);
                            if (start && end) {
                                // Filter routes if category filter is active (optional, maybe only show routes between visible points)
                                if (filterCategory && (start.category !== filterCategory || end.category !== filterCategory)) return null;

                                return (
                                    <Polyline
                                        key={route.id}
                                        positions={[[start.latitude, start.longitude], [end.latitude, end.longitude]]}
                                        pathOptions={{ color: route.color || '#fff', weight: 3, dashArray: '10, 10', opacity: 0.7 }}
                                    />
                                );
                            }
                            return null;
                        })}

                        {filteredPoints.map((point) => {
                            const pInfo = getParticipantInfo(point.user_id);
                            const color = pInfo?.assigned_color || '#3B82F6';
                            const catIcon = getCategoryIcon(point.category);

                            // Custom DivIcon
                            const customIconHtml = catIcon
                                ? `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px;">${catIcon}</div>`
                                : `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`;

                            const customIcon = L.divIcon({
                                className: 'custom-marker',
                                html: customIconHtml,
                                iconSize: catIcon ? [32, 32] : [24, 24],
                                iconAnchor: catIcon ? [16, 16] : [12, 12]
                            });

                            return (
                                <React.Fragment key={point.id}>
                                    {!filterCategory && <Circle center={[point.latitude, point.longitude]} radius={5000} pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 1 }} />}
                                    <Marker position={[point.latitude, point.longitude]} icon={customIcon}>
                                        <Popup>
                                            <div className="text-slate-900 min-w-[200px] max-w-[250px]">
                                                {point.photo_path && (
                                                    <div className="mb-2 rounded-lg overflow-hidden h-32 w-full bg-slate-200 relative flex items-center justify-center">
                                                        <img
                                                            src={`${API_URL}/uploads/${point.photo_path}`}
                                                            alt={point.city || 'Location'}
                                                            className="object-cover w-full h-full"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                            }}
                                                        />
                                                        {/* Fallback text if image fails/hidden */}
                                                        {/* We can't easily show fallback if we just hide img. 
                                                            Better approach: If error, hide img and show div below it? 
                                                            Or just let the bg-slate-200 be the placeholder. */}
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-semibold text-lg leading-tight">{point.city || 'Unknown'}</p>
                                                    {point.category && <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">{point.category}</span>}
                                                </div>
                                                {point.description && (
                                                    <p className="text-sm text-gray-700 italic mb-2">"{point.description}"</p>
                                                )}
                                                {point.country && <p className="text-xs text-gray-500">{point.country}</p>}
                                                <p className="text-xs text-gray-400 mt-1">by {pInfo?.username || 'Unknown'}</p>
                                                {point.user_id === user?.id && (
                                                    <button onClick={() => handleDeletePoint(point.id)} className="text-red-500 text-xs mt-2 flex items-center hover:text-red-600"><Trash2 className="h-3 w-3 mr-1" /> Delete</button>
                                                )}
                                            </div>
                                        </Popup>
                                    </Marker>
                                </React.Fragment>
                            );
                        })}
                    </MapContainer>
                ) : (
                    <Suspense fallback={<div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">Loading 3D Globe...</div>}>
                        <Globe3DView points={filteredPoints} participants={participants} />
                    </Suspense>
                )}

                {viewMode === '2d' && (
                    <button onClick={handleLocateMe} disabled={locatingUser} className="absolute bottom-20 right-4 z-[1000] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg disabled:opacity-50" title="Find my location">
                        <Crosshair className={`h-5 w-5 ${locatingUser ? 'animate-spin' : ''}`} />
                    </button>
                )}

                {showStatsPanel && userStats && (
                    <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 z-[1000] w-72">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center"><Award className="h-4 w-4 mr-2 text-yellow-400" />Your Stats</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-700/50 rounded-lg p-3 text-center"><MapPin className="h-5 w-5 mx-auto text-blue-400 mb-1" /><p className="text-xl font-bold text-white">{userStats.total_points}</p><p className="text-xs text-gray-400">Points</p></div>
                            <div className="bg-slate-700/50 rounded-lg p-3 text-center"><Building2 className="h-5 w-5 mx-auto text-green-400 mb-1" /><p className="text-xl font-bold text-white">{userStats.unique_cities}</p><p className="text-xs text-gray-400">Cities</p></div>
                            <div className="bg-slate-700/50 rounded-lg p-3 text-center"><Globe className="h-5 w-5 mx-auto text-purple-400 mb-1" /><p className="text-xl font-bold text-white">{userStats.unique_countries}</p><p className="text-xs text-gray-400">Countries</p></div>
                            <div className="bg-slate-700/50 rounded-lg p-3 text-center"><Trophy className="h-5 w-5 mx-auto text-yellow-400 mb-1" /><p className="text-xl font-bold text-white">{userStats.total_badges}</p><p className="text-xs text-gray-400">Badges</p></div>
                        </div>
                    </div>
                )}

                {showBadgesPanel && userStats && (
                    <div className="absolute top-4 right-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 z-[1000] w-80 max-h-[80vh] overflow-y-auto">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center"><Award className="h-4 w-4 mr-2 text-yellow-400" />Your Badges</h4>
                        <BadgesDisplay stats={userStats} />
                    </div>
                )}

                {map?.type !== 'Personal' && (
                    <div className="absolute bottom-4 left-4 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 z-[1000] min-w-[200px]">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                            {map?.type === 'Competitive' ? <><Trophy className="h-4 w-4 mr-2 text-yellow-400" />Leaderboard</> : <><Users className="h-4 w-4 mr-2 text-blue-400" />Participants</>}
                        </h4>
                        <div className="space-y-2">
                            {leaderboard.map((p, idx) => (
                                <div key={p.user_id} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        {map?.type === 'Competitive' && <span className={`text-xs font-bold w-5 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-500'}`}>#{idx + 1}</span>}
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.assigned_color || '#3B82F6' }} />
                                        <span className="text-sm text-white">{p.username}</span>
                                    </div>
                                    {map?.type === 'Competitive' && <span className="text-sm text-gray-400 font-medium">{p.pointCount} pts</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {id && (
                <AddPointModal isOpen={showAddPointModal} onClose={() => { setShowAddPointModal(false); setPendingPoint(null); }} onSuccess={loadData} mapId={parseInt(id)} initialLat={pendingPoint?.lat} initialLng={pendingPoint?.lng} />
            )}

            {id && map && (
                <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} onSuccess={loadData} mapId={parseInt(id)} mapName={map.name} />
            )}

            <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
    );
};

export default MapDetailPage;

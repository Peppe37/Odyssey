import api from './client';

export interface OdysseyMap {
    id: number;
    name: string;
    type: string;
    creator_id: number;
}

export interface Point {
    id: number;
    map_id: number;
    user_id: number;
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
    country?: string;
    continent?: string;
    timestamp?: string;
    // New fields
    category?: string;
    description?: string;
    photo_path?: string;
}

export interface Route {
    id: number;
    map_id: number;
    user_id: number;
    start_point_id: number;
    end_point_id: number;
    color: string;
}

export interface Participant {
    user_id: number;
    username: string;
    role: string;
    assigned_color?: string;
}

// --- Maps ---
export const getMaps = async (): Promise<OdysseyMap[]> => {
    const response = await api.get<OdysseyMap[]>('/maps');
    return response.data;
};

export const getMap = async (id: number): Promise<OdysseyMap> => {
    const response = await api.get<OdysseyMap>(`/maps/${id}`);
    return response.data;
};

export const createMap = async (name: string, type: string = 'Collaborative'): Promise<OdysseyMap> => {
    const response = await api.post<OdysseyMap>('/maps', { name, type });
    return response.data;
};

export const deleteMap = async (id: number): Promise<void> => {
    await api.delete(`/maps/${id}`);
};

// --- Points ---
export const getPoints = async (mapId: number): Promise<Point[]> => {
    const response = await api.get<Point[]>(`/maps/${mapId}/points`);
    return response.data;
};

// Modified to accept FormData for file uploads
export const addPoint = async (mapId: number, formData: FormData): Promise<Point> => {
    const response = await api.post<Point>(`/maps/${mapId}/points`, formData);
    return response.data;
};

export const deletePoint = async (mapId: number, pointId: number): Promise<void> => {
    await api.delete(`/maps/${mapId}/points/${pointId}`);
};

// --- Routes ---
export const getRoutes = async (mapId: number): Promise<Route[]> => {
    const response = await api.get<Route[]>(`/maps/${mapId}/routes`);
    return response.data;
};

export const createRoute = async (mapId: number, startPointId: number, endPointId: number): Promise<Route> => {
    const response = await api.post<Route>(`/maps/${mapId}/routes`, {
        start_point_id: startPointId,
        end_point_id: endPointId
    });
    return response.data;
};

export const deleteRoute = async (mapId: number, routeId: number): Promise<void> => {
    await api.delete(`/maps/${mapId}/routes/${routeId}`);
};

// --- Participants ---
export const getParticipants = async (mapId: number): Promise<Participant[]> => {
    const response = await api.get<Participant[]>(`/maps/${mapId}/participants`);
    return response.data;
};

export const inviteParticipant = async (mapId: number, username: string): Promise<Participant> => {
    const response = await api.post<Participant>(`/maps/${mapId}/participants`, { username });
    return response.data;
};

export const removeParticipant = async (mapId: number, userId: number): Promise<void> => {
    await api.delete(`/maps/${mapId}/participants/${userId}`);
};

// --- User Stats & Achievements ---
export interface Achievement {
    type: string;
    level: number;
    rank: string;
}

export const getUserAchievements = async (): Promise<Achievement[]> => {
    const response = await api.get<Achievement[]>('/users/me/achievements');
    return response.data;
};

// --- Paginated Points ---
export interface PaginatedPointsResponse {
    items: Point[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface PointsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    country?: string;
    city?: string;
    category?: string;
}

export const getPointsPaginated = async (mapId: number, params: PointsQueryParams = {}): Promise<PaginatedPointsResponse> => {
    const response = await api.get<PaginatedPointsResponse>(`/maps/${mapId}/points/paginated`, { params });
    return response.data;
};

// --- Enhanced Stats ---
export interface BadgeInfo {
    level: number;
    rank: string;
}

export interface EnhancedUserStats {
    total_points: number;
    unique_cities: number;
    unique_regions: number;
    unique_countries: number;
    unique_continents: number;
    cities_list: string[];
    regions_list: string[];
    countries_list: string[];
    continents_list: string[];
    badges_by_category: {
        cities: BadgeInfo[];
        regions: BadgeInfo[];
        countries: BadgeInfo[];
        continents: BadgeInfo[];
    };
    next_milestones: {
        cities: number;
        regions: number;
        countries: number;
        continents: number;
    };
    total_badges: number;
    global_rank_points?: number;
    global_rank_countries?: number;
    global_rank_continents?: number;
}

export const getEnhancedUserStats = async (): Promise<EnhancedUserStats> => {
    const response = await api.get<EnhancedUserStats>('/users/me/stats');
    return response.data;
};

// --- City Search ---
export interface CityResult {
    display_name: string;
    city?: string;
    country?: string;
    latitude: number;
    longitude: number;
}

export const searchCities = async (query: string): Promise<CityResult[]> => {
    if (query.length < 2) return [];
    const response = await api.get<CityResult[]>('/geocode/search', { params: { q: query } });
    return response.data;
};

// --- Notifications ---
export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, any> | null;
    read: boolean;
    created_at: string;
}

export interface NotificationCount {
    unread: number;
    total: number;
}

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications');
    return response.data;
};

export const getNotificationCount = async (): Promise<NotificationCount> => {
    const response = await api.get<NotificationCount>('/notifications/count');
    return response.data;
};

export const markNotificationRead = async (id: number): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await api.put('/notifications/read-all');
};

export const deleteNotification = async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
};

// --- Map Info for Join ---
export interface MapInfo {
    id: number;
    name: string;
    type: string;
    creator_username: string;
}

export const getMapInfoForJoin = async (mapId: number): Promise<MapInfo> => {
    const response = await api.get<MapInfo>(`/users/map-info/${mapId}`);
    return response.data;
};

// --- Self Join ---
export const joinMap = async (mapId: number): Promise<void> => {
    await api.post(`/maps/${mapId}/join`);
};

// --- Invite Actions ---
export const acceptInvite = async (mapId: number, notificationId: number): Promise<void> => {
    await api.post(`/maps/${mapId}/participants/accept/${notificationId}`);
};

export const declineInvite = async (mapId: number, notificationId: number): Promise<void> => {
    await api.post(`/maps/${mapId}/participants/decline/${notificationId}`);
};

// --- Leave Map ---
export const leaveMap = async (mapId: number): Promise<void> => {
    await api.delete(`/maps/${mapId}/participants/leave`);
};

// --- Participant Management ---
export const updateParticipantColor = async (mapId: number, userId: number, color: string): Promise<void> => {
    await api.put(`/maps/${mapId}/participants/${userId}/color`, { color });
};
// --- Leaderboard & Profile ---
export interface LeaderboardEntry {
    user_id: number;
    username: string;
    total_points: number;
    unique_countries: number;
    unique_continents: number;
    total_badges: number;
}

export interface PublicProfile {
    user: {
        id: number;
        username: string;
        joined_at: string;
        bio?: string;
    };
    stats: EnhancedUserStats;
}

export interface UpdateProfileData {
    username?: string;
    password?: string;
    bio?: string;
}

export const getLeaderboard = async (sortBy: string = 'points', limit: number = 50): Promise<LeaderboardEntry[]> => {
    const response = await api.get<LeaderboardEntry[]>('/users/leaderboard', { params: { sort_by: sortBy, limit } });
    return response.data;
};

export const getPublicProfile = async (userId: number): Promise<PublicProfile> => {
    const response = await api.get<PublicProfile>(`/users/${userId}/profile`);
    return response.data;
};

export interface UpdateProfileResponse {
    message: string;
    user: { username: string; bio: string };
    password_changed: boolean;
}

export const updateProfile = async (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
    const response = await api.put<UpdateProfileResponse>('/users/me', data);
    return response.data;
};

// --- Missing Exports & Functions ---

// 1. UserStats Alias (for backward compatibility if needed, or simply pointing to EnhancedUserStats)
export type UserStats = EnhancedUserStats;
export const getUserStats = getEnhancedUserStats;

// 2. User Search
export interface UserSearchResult {
    id: number;
    username: string;
}

export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
    // Assuming backend has /users/search endpoint
    const response = await api.get<UserSearchResult[]>('/users/search', { params: { q: query } });
    return response.data;
};

// 3. Update Point
export interface PointUpdateData {
    latitude?: number;
    longitude?: number;
    city?: string;
    category?: string;
    description?: string;
    // For file, we use FormData, so this interface is less relevant for the call itself but good for type checking parts of it
}

// Check if data is FormData or object. If object, convert to FormData? 
// Or just enforce FormData for updatePoint to handle files. 
// For simplicity, let's allow both or just change signature to take FormData for maximum flexibility.
export const updatePoint = async (mapId: number, pointId: number, data: FormData): Promise<void> => {
    await api.put(`/maps/${mapId}/points/${pointId}`, data);
};

export const updateRoute = async (mapId: number, routeId: number, startPointId: number, endPointId: number): Promise<void> => {
    await api.put(`/maps/${mapId}/routes/${routeId}`, {
        start_point_id: startPointId,
        end_point_id: endPointId
    });
};

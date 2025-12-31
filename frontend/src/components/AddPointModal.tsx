import React, { useState, useEffect } from 'react';
import { X, MapPin, Search, Check, Loader2, Upload, Edit } from 'lucide-react';
import { searchCities, addPoint, updatePoint, type CityResult, type Point } from '../api/maps';
import { CATEGORIES } from '../pages/MapDetailPage'; // Import categories from Map Detail

interface AddPointModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    mapId: number;
    initialLat?: number;
    initialLng?: number;
    point?: Point | null; // For editing
}

const AddPointModal: React.FC<AddPointModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    mapId,
    initialLat,
    initialLng,
    point
}) => {
    const [mode, setMode] = useState<'coords' | 'city'>('city');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');
    const [citySearch, setCitySearch] = useState('');
    const [suggestions, setSuggestions] = useState<CityResult[]>([]);
    const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);

    // New fields
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Initialize
    useEffect(() => {
        if (point) {
            setLat(point.latitude.toString());
            setLng(point.longitude.toString());
            setCategory(point.category || '');
            setDescription(point.description || '');
            setMode('coords'); // defaulting edit to coords/manual or city if available? Coords is safer.
            if (point.city) setCitySearch(point.city);
            if (point.photo_path) {
                setPreviewUrl(`${API_URL}/uploads/${point.photo_path}`);
            } else {
                setPreviewUrl(null);
            }
        } else if (initialLat !== undefined && initialLng !== undefined) {
            setLat(initialLat.toFixed(6));
            setLng(initialLng.toFixed(6));
            setMode('coords');
            setCategory('');
            setDescription('');
            setPreviewUrl(null);
        } else {
            // Reset if purely new open
        }
    }, [point, initialLat, initialLng, isOpen]);

    // Debounced city search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (citySearch.length >= 2 && mode === 'city') {
                setSearchLoading(true);
                try {
                    const results = await searchCities(citySearch);
                    setSuggestions(results);
                } catch (e) {
                    console.error('Search error:', e);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [citySearch, mode]);

    const handleSelectCity = (city: CityResult) => {
        setSelectedCity(city);
        setCitySearch(city.display_name);
        setLat(city.latitude.toString());
        setLng(city.longitude.toString());
        setSuggestions([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        let finalLat: number;
        let finalLng: number;

        if (mode === 'city' && selectedCity) {
            finalLat = selectedCity.latitude;
            finalLng = selectedCity.longitude;
        } else {
            finalLat = parseFloat(lat);
            finalLng = parseFloat(lng);
        }

        // Validate
        if (isNaN(finalLat) || isNaN(finalLng)) {
            setError('Invalid coordinates');
            setLoading(false);
            return;
        }
        if (finalLat < -90 || finalLat > 90) {
            setError('Latitude must be between -90 and 90');
            setLoading(false);
            return;
        }
        if (finalLng < -180 || finalLng > 180) {
            setError('Longitude must be between -180 and 180');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('latitude', finalLat.toString());
            formData.append('longitude', finalLng.toString());
            if (category) formData.append('category', category);
            if (description) formData.append('description', description);
            if (file) formData.append('photo', file);
            if (mode === 'city' && selectedCity) {
                // Optionally send city name if we want to override reverse geocoding
                // formData.append('city', selectedCity.city || selectedCity.display_name.split(',')[0]);
            }

            if (point) {
                await updatePoint(mapId, point.id, formData);
            } else {
                await addPoint(mapId, formData);
            }
            onSuccess();
            onClose();
            resetForm();
        } catch (e: any) {
            setError(e.response?.data?.detail || `Failed to ${point ? 'update' : 'add'} point`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setLat('');
        setLng('');
        setCitySearch('');
        setSelectedCity(null);
        setSuggestions([]);
        setError('');
        setCategory('');
        setDescription('');
        setFile(null);
        // Only revoke if created locally
        // if (previewUrl && !previewUrl.startsWith('http')) URL.revokeObjectURL(previewUrl); 
        setPreviewUrl(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        {point ? <Edit className="h-5 w-5 mr-2 text-blue-400" /> : <MapPin className="h-5 w-5 mr-2 text-blue-400" />}
                        {point ? 'Edit Point' : 'Add Point'}
                    </h3>
                    <button onClick={() => { resetForm(); onClose(); }} className="text-gray-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setMode('city')}
                        className={`flex-1 py-2 rounded-lg transition-colors text-sm ${mode === 'city' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        Search City
                    </button>
                    <button
                        onClick={() => setMode('coords')}
                        className={`flex-1 py-2 rounded-lg transition-colors text-sm ${mode === 'coords' ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}`}
                    >
                        Coordinates
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Location Input */}
                    {mode === 'city' ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={citySearch}
                                onChange={(e) => { setCitySearch(e.target.value); setSelectedCity(null); }}
                                placeholder="Search for a city..."
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-3 h-4 w-4 text-gray-400 animate-spin" />
                            )}

                            {/* Suggestions */}
                            {suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                                    {suggestions.map((city, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelectCity(city)}
                                            className="w-full text-left px-3 py-2 hover:bg-slate-600 text-sm text-white border-b border-slate-600 last:border-0"
                                        >
                                            <div className="font-medium">{city.city || city.display_name.split(',')[0]}</div>
                                            <div className="text-xs text-gray-400 truncate">{city.display_name}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedCity && (
                                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center text-green-400 text-sm">
                                    <Check className="h-4 w-4 mr-2" />
                                    Selected: {selectedCity.city || selectedCity.display_name.split(',')[0]}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex space-x-2">
                            <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} className="w-full bg-slate-700 rounded-lg px-3 py-2 text-white" placeholder="Latitude" />
                            <input type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} className="w-full bg-slate-700 rounded-lg px-3 py-2 text-white" placeholder="Longitude" />
                        </div>
                    )}

                    {/* Category Dropdown */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.name}
                                    onClick={() => setCategory(category === cat.name ? '' : cat.name)}
                                    className={`flex items-center justify-center p-2 rounded-lg border transition-all text-sm ${category === cat.name
                                        ? `bg-slate-600 border-${cat.color.replace('#', '')} text-white ring-2 ring-blue-500`
                                        : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                                        }`}
                                >
                                    <span className="mr-2">{cat.icon}</span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"
                            placeholder="Add a note or memory..."
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Photo (Optional)</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors relative overflow-hidden">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-xs text-gray-400">Click to upload image</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            {previewUrl && (
                                <button
                                    onClick={(e) => { e.preventDefault(); setFile(null); setPreviewUrl(null); }}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </label>
                    </div>

                </div>

                {error && (
                    <div className="mt-3 text-red-400 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (mode === 'city' && !selectedCity) || (mode === 'coords' && (!lat || !lng))}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {point ? 'Save Changes' : 'Add Point'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPointModal;

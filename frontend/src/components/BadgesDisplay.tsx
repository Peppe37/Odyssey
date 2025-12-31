import React from 'react';
import { Award, Building2, MapPin, Globe, Compass } from 'lucide-react';
import type { EnhancedUserStats, BadgeInfo } from '../api/maps';

interface BadgesDisplayProps {
    stats: EnhancedUserStats;
}

const CATEGORY_CONFIG = {
    cities: { label: 'Cities', icon: Building2, color: 'blue' },
    regions: { label: 'Regions', icon: MapPin, color: 'green' },
    countries: { label: 'Countries', icon: Globe, color: 'purple' },
    continents: { label: 'Continents', icon: Compass, color: 'orange' }
};

const BadgesDisplay: React.FC<BadgesDisplayProps> = ({ stats }) => {
    const getCounts = () => ({
        cities: stats.unique_cities,
        regions: stats.unique_regions,
        countries: stats.unique_countries,
        continents: stats.unique_continents
    });

    const counts = getCounts();

    return (
        <div className="space-y-4">
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const category = key as keyof typeof CATEGORY_CONFIG;
                const Icon = config.icon;
                const badges = stats.badges_by_category[category] || [];
                const count = counts[category];
                const nextMilestone = stats.next_milestones[category];
                const progress = Math.min((count / nextMilestone) * 100, 100);
                const latestBadge = badges[badges.length - 1];

                return (
                    <div key={category} className="bg-slate-700/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <Icon className={`h-5 w-5 text-${config.color}-400`} />
                                <span className="font-medium text-white">{config.label}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-white">{count}</span>
                                <span className="text-sm text-gray-400">/ {nextMilestone}</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-slate-600 rounded-full overflow-hidden mb-2">
                            <div
                                className={`h-full bg-${config.color}-500 transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Badges earned */}
                        {badges.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {badges.map((badge: BadgeInfo, idx: number) => (
                                    <span
                                        key={idx}
                                        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-${config.color}-500/20 text-${config.color}-300`}
                                    >
                                        <Award className="h-3 w-3 mr-1" />
                                        {badge.rank}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Current rank */}
                        {latestBadge && (
                            <p className="text-xs text-gray-400 mt-1">
                                Current rank: <span className="text-white font-medium">{latestBadge.rank}</span>
                            </p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default BadgesDisplay;

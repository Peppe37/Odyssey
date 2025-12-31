import React, { useEffect, useRef } from 'react';
import Globe from 'globe.gl';
import type { Point, Participant } from '../api/maps';

interface Globe3DViewProps {
    points: Point[];
    participants: Participant[];
    onPointClick?: (point: Point) => void;
}

const Globe3DView: React.FC<Globe3DViewProps> = ({ points, participants, onPointClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const globeRef = useRef<any>(null);

    const getParticipantColor = (userId: number): string => {
        const p = participants.find(p => p.user_id === userId);
        return p?.assigned_color || '#3B82F6';
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize globe
        globeRef.current = (Globe as any)()
            (containerRef.current)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
            .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
            .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
            .pointsData(points.map(p => ({
                lat: p.latitude,
                lng: p.longitude,
                size: 0.5,
                color: getParticipantColor(p.user_id),
                label: `${p.city || 'Unknown'}, ${p.country || ''}`,
                point: p
            })))
            .pointAltitude(0.01)
            .pointColor('color')
            .pointRadius('size')
            .pointLabel('label')
            .onPointClick((d: any) => {
                if (onPointClick && d.point) {
                    onPointClick(d.point);
                }
            });

        // Auto-rotate
        globeRef.current.controls().autoRotate = true;
        globeRef.current.controls().autoRotateSpeed = 0.5;

        // Handle resize
        const handleResize = () => {
            if (containerRef.current && globeRef.current) {
                globeRef.current.width(containerRef.current.clientWidth);
                globeRef.current.height(containerRef.current.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (globeRef.current) {
                globeRef.current._destructor && globeRef.current._destructor();
            }
        };
    }, []);

    // Update points when they change
    useEffect(() => {
        if (globeRef.current) {
            globeRef.current.pointsData(points.map(p => ({
                lat: p.latitude,
                lng: p.longitude,
                size: 0.5,
                color: getParticipantColor(p.user_id),
                label: `${p.city || 'Unknown'}, ${p.country || ''}`,
                point: p
            })));
        }
    }, [points, participants]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-slate-900"
            style={{ minHeight: '400px' }}
        />
    );
};

export default Globe3DView;

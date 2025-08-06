'use client';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useMemo, useEffect, useState } from 'react';
import { Competitor, Place, SelectedPlace } from '../../lib/types';

interface PulseDataPoint {
  position: [number, number];
  id?: string;
  pid?: string;
  name: string;
  isMyPlace: boolean;
}

interface PulseLayerProps {
  selectedPlaces: SelectedPlace[];
  myPlace: Place | null;
  filteredCompetitors: Competitor[];
}

export function usePulseLayer({ selectedPlaces, myPlace, filteredCompetitors }: PulseLayerProps) {
  const [pulseRadius, setPulseRadius] = useState(20);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseRadius(prev => prev >= 35 ? 20 : prev + 1);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const pulseLayer = useMemo(() => {
    const pulseData: PulseDataPoint[] = [];
    
    if (myPlace && selectedPlaces.some(p => ('id' in p.place && p.place.id === myPlace.id) || p.place.name === myPlace.name)) {
      pulseData.push({
        ...myPlace,
        position: [myPlace.longitude, myPlace.latitude],
        isMyPlace: true
      });
    }
    
    filteredCompetitors.forEach(competitor => {
      if (selectedPlaces.some(p => ('pid' in p.place && p.place.pid === competitor.pid))) {
        pulseData.push({
          ...competitor,
          position: [competitor.longitude, competitor.latitude],
          isMyPlace: false
        });
      }
    });

    if (pulseData.length === 0) return null;

    return new ScatterplotLayer({
      id: 'pulse-layer',
      data: pulseData,
      pickable: false,
      opacity: 0.3,
      stroked: false,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: pulseRadius,
      radiusMaxPixels: pulseRadius,
      getPosition: (d: PulseDataPoint) => d.position,
      getRadius: pulseRadius,
      getFillColor: (_d: PulseDataPoint) => {
        const baseColor = '#FFD700';
        const hex = baseColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        const opacity = Math.max(0.1, 0.4 - (pulseRadius - 20) * 0.02);
        return [r, g, b, Math.floor(opacity * 255)];
      }
    });
  }, [selectedPlaces, myPlace, filteredCompetitors, pulseRadius]);

  return pulseLayer;
}
'use client';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useMemo } from 'react';
import type { TransformedPlace } from '../../lib/types/api';

interface RadiusIndicatorProps {
  myPlace: TransformedPlace | null;
  radius: number; // in km
  isVisible: boolean;
}

export const useRadiusIndicator = ({ myPlace, radius, isVisible }: RadiusIndicatorProps) => {
  return useMemo(() => {
    if (!myPlace || !isVisible || radius <= 0) {
      return null;
    }

    // More accurate radius calculation for visualization
    // 1 degree latitude = 111 km (approximately)
    // 1 degree longitude = 111 km * cos(latitude) (varies by latitude)
    const lat = myPlace.latitude;
    const radiusInDegreesLat = radius / 111;
    const radiusInDegreesLng = radius / (111 * Math.cos(lat * Math.PI / 180));
    
    // Use the larger of the two for a more conservative circle
    const radiusInDegrees = Math.max(radiusInDegreesLat, radiusInDegreesLng);

    return new ScatterplotLayer({
      id: 'radius-indicator',
      data: [myPlace],
      pickable: false,
      opacity: 0.15,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 10,
      radiusMaxPixels: 2000, // Increase max for larger radius
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 4,
      getPosition: (d: TransformedPlace) => [d.longitude, d.latitude],
      // More accurate radius calculation in meters for deck.gl
      getRadius: () => radius * 1000, // Convert km to meters for deck.gl
      getFillColor: [33, 150, 243, 25], // Light blue with low alpha
      getLineColor: [33, 150, 243, 120], // Blue border with medium alpha
      getLineWidth: 2,
      // Add animation properties
      transitions: {
        getRadius: {
          duration: 300,
          easing: (t: number) => t * t * (3 - 2 * t), // Smooth ease
        },
        getFillColor: {
          duration: 200,
        },
        getLineColor: {
          duration: 200,
        },
      },
      // Add pulsing effect
      updateTriggers: {
        getRadius: [radius],
        getFillColor: [radius],
        getLineColor: [radius],
      },
      // Use geographic coordinate system for accurate radius
      coordinateSystem: 1, // COORDINATE_SYSTEM.LNGLAT
      radiusUnits: 'meters',
    });
  }, [myPlace, radius, isVisible]);
};

// Alternative: More accurate radius circle using multiple points
export const useAccurateRadiusIndicator = ({ myPlace, radius, isVisible }: RadiusIndicatorProps) => {
  return useMemo(() => {
    if (!myPlace || !isVisible || radius <= 0) {
      return null;
    }

    // Create circle points around the center
    const createCirclePoints = (centerLng: number, centerLat: number, radiusKm: number, segments = 64): [number, number][] => {
      const points: [number, number][] = [];
      const radiusInDegrees = radiusKm / 111; // Rough conversion

      for (let i = 0; i <= segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        const lng = centerLng + radiusInDegrees * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
        const lat = centerLat + radiusInDegrees * Math.sin(angle);
        points.push([lng, lat]);
      }
      return points;
    };

    const circlePoints = createCirclePoints(myPlace.longitude, myPlace.latitude, radius);

    interface CirclePoint {
      position: [number, number];
      id: number;
    }

    return new ScatterplotLayer({
      id: 'accurate-radius-indicator',
      data: circlePoints.map((point, index): CirclePoint => ({
        position: point,
        id: index,
      })),
      pickable: false,
      opacity: 0.6,
      stroked: false,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 1,
      radiusMaxPixels: 3,
      getPosition: (d: CirclePoint) => d.position,
      getRadius: 50,
      getFillColor: [33, 150, 243, 60], // Semi-transparent blue
      transitions: {
        getFillColor: {
          duration: 300,
        },
      },
    });
  }, [myPlace, radius, isVisible]);
};
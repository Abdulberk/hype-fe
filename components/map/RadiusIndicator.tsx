'use client';
import { ScatterplotLayer } from '@deck.gl/layers';
import { useMemo } from 'react';
import type { TransformedPlace } from '../../lib/types/api';

interface RadiusIndicatorProps {
  myPlace: TransformedPlace | null;
  radius: number;
  isVisible: boolean;
}

export const useRadiusIndicator = ({ myPlace, radius, isVisible }: RadiusIndicatorProps) => {
  return useMemo(() => {
    if (!myPlace || !isVisible || radius <= 0) {
      return null;
    }

    const lat = myPlace.latitude;
    const radiusInDegreesLat = radius / 111;
    const radiusInDegreesLng = radius / (111 * Math.cos(lat * Math.PI / 180));
    
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
      radiusMaxPixels: 2000,
      lineWidthMinPixels: 2,
      lineWidthMaxPixels: 4,
      getPosition: (d: TransformedPlace) => [d.longitude, d.latitude],
      getRadius: () => radius * 1000,
      getFillColor: [33, 150, 243, 25],
      getLineColor: [33, 150, 243, 120],
      getLineWidth: 2,
      transitions: {
        getRadius: {
          duration: 300,
          easing: (t: number) => t * t * (3 - 2 * t),
        },
        getFillColor: {
          duration: 200,
        },
        getLineColor: {
          duration: 200,
        },
      },
      updateTriggers: {
        getRadius: [radius],
        getFillColor: [radius],
        getLineColor: [radius],
      },
      coordinateSystem: 1,
      radiusUnits: 'meters',
    });
  }, [myPlace, radius, isVisible]);
};

export const useAccurateRadiusIndicator = ({ myPlace, radius, isVisible }: RadiusIndicatorProps) => {
  return useMemo(() => {
    if (!myPlace || !isVisible || radius <= 0) {
      return null;
    }

    const createCirclePoints = (centerLng: number, centerLat: number, radiusKm: number, segments = 64): [number, number][] => {
      const points: [number, number][] = [];
      const radiusInDegrees = radiusKm / 111;

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
      getFillColor: [33, 150, 243, 60],
      transitions: {
        getFillColor: {
          duration: 300,
        },
      },
    });
  }, [myPlace, radius, isVisible]);
};
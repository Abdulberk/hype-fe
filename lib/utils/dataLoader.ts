import {
  Competitor,
  HomeZipcodes
} from '../types';

/**
 * Filter competitors by industries
 */
export function filterCompetitorsByIndustries(
  competitors: Competitor[],
  industries: string[]
): Competitor[] {
  if (industries.length === 0) return competitors;
  
  return competitors.filter(competitor => 
    industries.includes(competitor.sub_category)
  );
}

/**
 * Calculate percentiles for home zipcodes data
 */
export function calculatePercentiles(locations: Record<string, string>[]): {
  values: number[];
  percentiles: { min: number; max: number; color: string }[];
} {
  // Extract all percentage values
  const values: number[] = [];
  
  locations.forEach(location => {
    Object.values(location).forEach(percentage => {
      const value = parseFloat(String(percentage));
      if (!isNaN(value)) {
        values.push(value);
      }
    });
  });

  // Sort values
  values.sort((a, b) => a - b);

  if (values.length === 0) {
    return { values: [], percentiles: [] };
  }

  // Calculate percentile ranges
  const percentiles = [
    { min: 0, max: 20, color: '#E3F2FD' },
    { min: 20, max: 40, color: '#90CAF9' },
    { min: 40, max: 60, color: '#42A5F5' },
    { min: 60, max: 80, color: '#1E88E5' },
    { min: 80, max: 100, color: '#0D47A1' }
  ];

  // Calculate actual value ranges for each percentile
  const result = percentiles.map(p => {
    const minIndex = Math.floor((p.min / 100) * values.length);
    const maxIndex = Math.floor((p.max / 100) * values.length) - 1;
    
    return {
      min: values[minIndex] || 0,
      max: values[Math.max(maxIndex, minIndex)] || 0,
      color: p.color
    };
  });

  return { values, percentiles: result };
}

/**
 * Get color for home zipcode value based on percentiles
 */
export function getColorForValue(
  value: number,
  percentiles: { min: number; max: number; color: string }[]
): string {
  for (const percentile of percentiles) {
    if (value >= percentile.min && value <= percentile.max) {
      return percentile.color;
    }
  }
  
  // Default to first color if no match
  return percentiles[0]?.color || '#E3F2FD';
}
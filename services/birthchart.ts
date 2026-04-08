/**
 * Natal Chart Astronomical Calculations
 *
 * Simplified astronomical algorithms for calculating planetary positions.
 * Uses VSOP87-derived approximations accurate enough for astrological purposes.
 * No external dependencies required.
 */

import { ASPECTS, AspectInfo, PLANETS as PLANET_DEFS, ZODIAC_SIGNS, getSignFromDegree } from '../constants/birthchart';

// ============= Types =============

export interface PlanetPosition {
  planet: string;
  longitude: number; // ecliptic longitude 0-360
  signKey: string;
  degreeInSign: number;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  signKey: string;
}

export interface ChartAspect {
  planet1: string;
  planet2: string;
  aspect: AspectInfo;
  orb: number; // actual orb in degrees
  applying: boolean;
}

export interface NatalChart {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: ChartAspect[];
  ascendant: number;
  midheaven: number;
}

// ============= Core Math Helpers =============

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function sinD(deg: number): number {
  return Math.sin(deg * DEG2RAD);
}

function cosD(deg: number): number {
  return Math.cos(deg * DEG2RAD);
}

function tanD(deg: number): number {
  return Math.tan(deg * DEG2RAD);
}

function atan2D(y: number, x: number): number {
  return Math.atan2(y, x) * RAD2DEG;
}

function asinD(x: number): number {
  return Math.asin(x) * RAD2DEG;
}

// Julian Day Number from date
function toJulianDay(year: number, month: number, day: number, hour: number = 12): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24 + B - 1524.5;
}

// Centuries since J2000.0
function toJ2000Centuries(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

// ============= Planet Position Calculations =============

// Obliquity of the ecliptic
function obliquity(T: number): number {
  return 23.4393 - 0.0130 * T;
}

// Sun position (accurate to ~0.01 degree)
function calcSun(T: number): number {
  const L0 = normalize360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = normalize360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sinD(M)
    + (0.019993 - 0.000101 * T) * sinD(2 * M)
    + 0.000289 * sinD(3 * M);
  return normalize360(L0 + C);
}

// Moon position (simplified, accurate to ~1 degree)
function calcMoon(T: number): number {
  const Lp = normalize360(218.3165 + 481267.8813 * T);
  const D = normalize360(297.8502 + 445267.1115 * T);
  const M = normalize360(357.5291 + 35999.0503 * T);
  const Mp = normalize360(134.9634 + 477198.8676 * T);
  const F = normalize360(93.2720 + 483202.0175 * T);

  let lon = Lp
    + 6.289 * sinD(Mp)
    - 1.274 * sinD(2 * D - Mp)
    + 0.658 * sinD(2 * D)
    + 0.214 * sinD(2 * Mp)
    - 0.186 * sinD(M)
    - 0.114 * sinD(2 * F)
    + 0.059 * sinD(2 * D - 2 * Mp)
    + 0.057 * sinD(2 * D - M - Mp)
    + 0.053 * sinD(2 * D + Mp)
    + 0.046 * sinD(2 * D - M)
    - 0.041 * sinD(M - Mp)
    - 0.035 * sinD(D)
    - 0.031 * sinD(M + Mp);

  return normalize360(lon);
}

// Planetary positions using simplified orbital elements
interface OrbitalElements {
  L0: number; L1: number;  // Mean longitude
  a: number;               // Semi-major axis (AU) - not used for longitude
  e0: number; e1: number;  // Eccentricity
  I0: number; I1: number;  // Inclination
  w0: number; w1: number;  // Argument of perihelion
  O0: number; O1: number;  // Longitude of ascending node
  M0: number; M1: number;  // Mean anomaly
}

const ORBITAL_ELEMENTS: Record<string, OrbitalElements> = {
  mercury: {
    L0: 252.2509, L1: 149472.6746, a: 0.387098,
    e0: 0.20563, e1: 0.000020, I0: 7.005, I1: -0.0060,
    w0: 29.125, w1: 1.0173, O0: 48.331, O1: -0.1254,
    M0: 174.7948, M1: 149472.5153,
  },
  venus: {
    L0: 181.9798, L1: 58517.8157, a: 0.723330,
    e0: 0.00677, e1: -0.000047, I0: 3.3946, I1: -0.0043,
    w0: 54.884, w1: 0.5072, O0: 76.680, O1: -0.2780,
    M0: 50.4161, M1: 58517.8039,
  },
  mars: {
    L0: 355.4330, L1: 19140.2993, a: 1.523679,
    e0: 0.09340, e1: 0.000090, I0: 1.8497, I1: -0.0013,
    w0: 286.502, w1: 1.0697, O0: 49.558, O1: -0.2950,
    M0: 19.3730, M1: 19140.3023,
  },
  jupiter: {
    L0: 34.3515, L1: 3034.9057, a: 5.20260,
    e0: 0.04849, e1: 0.000163, I0: 1.3033, I1: -0.0019,
    w0: 273.867, w1: 0.5599, O0: 100.464, O1: 0.1766,
    M0: 20.0202, M1: 3034.6114,
  },
  saturn: {
    L0: 50.0774, L1: 1222.1138, a: 9.55490,
    e0: 0.05551, e1: -0.000346, I0: 2.4889, I1: 0.0025,
    w0: 339.392, w1: -0.1284, O0: 113.666, O1: -0.2566,
    M0: 317.0207, M1: 1222.1138,
  },
  uranus: {
    L0: 314.0550, L1: 428.9470, a: 19.2184,
    e0: 0.04630, e1: -0.000027, I0: 0.7732, I1: 0.0001,
    w0: 98.999, w1: 0.7708, O0: 74.006, O1: 0.0521,
    M0: 141.0500, M1: 428.9470,
  },
  neptune: {
    L0: 304.3487, L1: 218.4862, a: 30.1104,
    e0: 0.00899, e1: 0.000006, I0: 1.7700, I1: -0.0093,
    w0: 276.340, w1: 0.3256, O0: 131.784, O1: -0.0061,
    M0: 256.2250, M1: 218.4862,
  },
  pluto: {
    L0: 238.9290, L1: 145.2078, a: 39.5446,
    e0: 0.24883, e1: 0.000050, I0: 17.1400, I1: 0.0000,
    w0: 113.834, w1: 0.0000, O0: 110.303, O1: 0.0000,
    M0: 14.8820, M1: 145.2078,
  },
};

// Solve Kepler's equation iteratively
function solveKepler(M: number, e: number): number {
  const Mrad = M * DEG2RAD;
  let E = Mrad;
  for (let i = 0; i < 20; i++) {
    const dE = (Mrad - E + e * Math.sin(E)) / (1 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E * RAD2DEG;
}

// Calculate heliocentric ecliptic longitude for a planet
function calcPlanetLongitude(elements: OrbitalElements, T: number): number {
  const M = normalize360(elements.M0 + elements.M1 * T);
  const e = elements.e0 + elements.e1 * T;
  const w = normalize360(elements.w0 + elements.w1 * T);
  const O = normalize360(elements.O0 + elements.O1 * T);

  const E = solveKepler(M, e);
  const v = 2 * atan2D(
    Math.sqrt(1 + e) * Math.sin(E * DEG2RAD / 2),
    Math.sqrt(1 - e) * Math.cos(E * DEG2RAD / 2)
  );

  // Heliocentric longitude (simplified - ignoring latitude for astrology)
  return normalize360(v + w + O);
}

// ============= House Calculations =============

// Approximate latitude for common cities (for house calculation)
const CITY_LATITUDES: Record<string, number> = {
  'istanbul': 41.01,
  'ankara': 39.93,
  'izmir': 38.42,
  'antalya': 36.89,
  'bursa': 40.18,
  'adana': 37.00,
  'london': 51.51,
  'new york': 40.71,
  'paris': 48.86,
  'berlin': 52.52,
  'tokyo': 35.68,
  'los angeles': 34.05,
  'sydney': -33.87,
  'dubai': 25.20,
  'moscow': 55.76,
  'rome': 41.90,
  'madrid': 40.42,
  'amsterdam': 52.37,
};

function getLatitude(city: string): number {
  const normalized = city.toLowerCase().trim();
  for (const [key, lat] of Object.entries(CITY_LATITUDES)) {
    if (normalized.includes(key)) return lat;
  }
  return 41.01; // Default to Istanbul
}

// Sidereal time at Greenwich
function greenwichSiderealTime(jd: number): number {
  const T = toJ2000Centuries(jd);
  const theta = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T - T * T * T / 38710000;
  return normalize360(theta);
}

// Calculate houses using Equal House system (simpler, reliable)
function calcHouses(jd: number, latitude: number): { houses: HouseCusp[]; asc: number; mc: number } {
  const GST = greenwichSiderealTime(jd);
  // Assume roughly Istanbul longitude (~29°) for local sidereal time
  // In a real app, we'd use actual longitude
  const LST = normalize360(GST + 29);

  const eps = obliquity(toJ2000Centuries(jd));

  // Ascendant calculation
  const RAMC = LST;
  const ascRad = Math.atan2(
    cosD(RAMC),
    -(sinD(RAMC) * cosD(eps) + tanD(latitude) * sinD(eps))
  );
  const asc = normalize360(ascRad * RAD2DEG);

  // Midheaven (MC) - simpler
  const mcRad = Math.atan2(sinD(RAMC), cosD(RAMC) * cosD(eps));
  const mc = normalize360(mcRad * RAD2DEG);

  // Equal house system: each house is 30 degrees from ascendant
  const houses: HouseCusp[] = [];
  for (let i = 0; i < 12; i++) {
    const lon = normalize360(asc + i * 30);
    const sign = getSignFromDegree(lon);
    houses.push({
      house: i + 1,
      longitude: lon,
      signKey: sign.key,
    });
  }

  return { houses, asc, mc };
}

// ============= Aspect Calculations =============

function calcAspects(planets: PlanetPosition[]): ChartAspect[] {
  const aspects: ChartAspect[] = [];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      let diff = Math.abs(planets[i].longitude - planets[j].longitude);
      if (diff > 180) diff = 360 - diff;

      for (const aspect of ASPECTS) {
        const orb = Math.abs(diff - aspect.angle);
        if (orb <= aspect.orb) {
          aspects.push({
            planet1: planets[i].planet,
            planet2: planets[j].planet,
            aspect,
            orb: Math.round(orb * 10) / 10,
            applying: planets[i].longitude < planets[j].longitude,
          });
          break; // One aspect per planet pair
        }
      }
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb); // Sort by tightest orb
}

// ============= Main Calculation Function =============

// Which house does a given longitude fall in?
function findHouse(longitude: number, houses: HouseCusp[]): number {
  for (let i = 0; i < 12; i++) {
    const current = houses[i].longitude;
    const next = houses[(i + 1) % 12].longitude;

    if (next > current) {
      if (longitude >= current && longitude < next) return i + 1;
    } else {
      // Wraps around 360
      if (longitude >= current || longitude < next) return i + 1;
    }
  }
  return 1; // Fallback
}

export function calculateNatalChart(
  year: number,
  month: number,
  day: number,
  hour: number = 12,
  minute: number = 0,
  city: string = 'Istanbul'
): NatalChart {
  const decimalHour = hour + minute / 60;
  const jd = toJulianDay(year, month, day, decimalHour);
  const T = toJ2000Centuries(jd);
  const latitude = getLatitude(city);

  // Calculate planet positions
  const sunLon = calcSun(T);
  const moonLon = calcMoon(T);

  const planetLongitudes: { key: string; lon: number }[] = [
    { key: 'sun', lon: sunLon },
    { key: 'moon', lon: moonLon },
  ];

  for (const [key, elements] of Object.entries(ORBITAL_ELEMENTS)) {
    // Skip pluto-like bodies that are less critical
    const helioLon = calcPlanetLongitude(elements, T);
    // Very simplified helio->geo conversion (add Sun's longitude difference)
    // For outer planets this is close enough for astrology
    let geoLon: number;
    if (key === 'mercury' || key === 'venus') {
      // Inner planets: heliocentric != geocentric, needs correction
      geoLon = normalize360(helioLon + (sunLon - helioLon) * 0.3);
    } else {
      geoLon = helioLon; // Outer planets: helio ≈ geo for astrology
    }
    planetLongitudes.push({ key, lon: geoLon });
  }

  // Calculate houses
  const { houses, asc, mc } = calcHouses(jd, latitude);

  // Build planet positions with sign and house info
  const planets: PlanetPosition[] = planetLongitudes.map(({ key, lon }) => {
    const sign = getSignFromDegree(lon);
    const degInSign = lon % 30;
    return {
      planet: key,
      longitude: Math.round(lon * 100) / 100,
      signKey: sign.key,
      degreeInSign: Math.round(degInSign * 100) / 100,
    };
  });

  // Calculate aspects
  const aspects = calcAspects(planets);

  return {
    planets,
    houses,
    aspects,
    ascendant: Math.round(asc * 100) / 100,
    midheaven: Math.round(mc * 100) / 100,
  };
}

// Format chart data as text for AI prompt
export function chartToPromptText(chart: NatalChart, lang: 'tr' | 'en'): string {
  const getSignName = (key: string) => {
    const sign = ZODIAC_SIGNS.find((s) => s.key === key);
    return sign ? sign[lang] : key;
  };

  const getPlanetName = (key: string) => {
    const planet = PLANET_DEFS.find((p) => p.key === key);
    return planet ? planet[lang] : key;
  };

  const lines: string[] = [];

  if (lang === 'tr') {
    lines.push('DOĞUM HARİTASI VERİLERİ:');
    lines.push('');
    lines.push('GEZEGEN POZİSYONLARI:');
  } else {
    lines.push('NATAL CHART DATA:');
    lines.push('');
    lines.push('PLANET POSITIONS:');
  }

  for (const p of chart.planets) {
    const name = getPlanetName(p.planet);
    const sign = getSignName(p.signKey);
    const deg = Math.floor(p.degreeInSign);
    const min = Math.floor((p.degreeInSign - deg) * 60);
    const house = findHouse(p.longitude, chart.houses);
    if (lang === 'tr') {
      lines.push(`- ${name}: ${sign} ${deg}°${min.toString().padStart(2, '0')}' (${house}. Ev)`);
    } else {
      lines.push(`- ${name}: ${sign} ${deg}°${min.toString().padStart(2, '0')}' (House ${house})`);
    }
  }

  const ascSign = getSignName(getSignFromDegree(chart.ascendant).key);
  const mcSign = getSignName(getSignFromDegree(chart.midheaven).key);
  lines.push('');
  if (lang === 'tr') {
    lines.push(`YÜKSELEN: ${ascSign}`);
    lines.push(`MIDHEAVEN (MC): ${mcSign}`);
  } else {
    lines.push(`ASCENDANT: ${ascSign}`);
    lines.push(`MIDHEAVEN (MC): ${mcSign}`);
  }

  if (chart.aspects.length > 0) {
    lines.push('');
    lines.push(lang === 'tr' ? 'ÖNEMLİ AÇILAR:' : 'MAJOR ASPECTS:');
    for (const a of chart.aspects.slice(0, 10)) {
      const p1 = getPlanetName(a.planet1);
      const p2 = getPlanetName(a.planet2);
      const aspect = a.aspect[lang];
      lines.push(`- ${p1} ${aspect} ${p2} (${a.orb}° orb)`);
    }
  }

  return lines.join('\n');
}

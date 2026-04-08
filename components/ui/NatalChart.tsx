/**
 * NatalChart - Visual natal chart wheel using React Native Views
 * No SVG dependency required - uses absolute positioning and transforms
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { NatalChart as NatalChartData, PlanetPosition } from '../../services/birthchart';
import { ZODIAC_SIGNS, PLANETS, ASPECTS, getSignFromDegree } from '../../constants/birthchart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = Math.min(SCREEN_WIDTH - 48, 340);
const CENTER = CHART_SIZE / 2;
const OUTER_RADIUS = CHART_SIZE / 2 - 4;
const SIGN_RADIUS = OUTER_RADIUS - 22;
const HOUSE_RADIUS = OUTER_RADIUS - 44;
const PLANET_RADIUS = OUTER_RADIUS - 72;
const INNER_RADIUS = OUTER_RADIUS - 100;

interface NatalChartProps {
  chart: NatalChartData;
  lang: 'tr' | 'en';
}

// Convert astrological degree to x,y position
// In astrology, Aries starts at left (9 o'clock) and goes counter-clockwise
function degToXY(degree: number, radius: number): { x: number; y: number } {
  // Rotate so 0° Aries is at the left, counter-clockwise
  const angle = (180 - degree) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER - radius * Math.sin(angle),
  };
}

// Zodiac sign segment
function ZodiacSegment({ sign, index }: { sign: typeof ZODIAC_SIGNS[0]; index: number }) {
  const midDegree = sign.startDegree + 15; // Center of 30° segment
  const pos = degToXY(midDegree, SIGN_RADIUS);

  const elementBg: Record<string, string> = {
    fire: 'rgba(255, 99, 71, 0.15)',
    earth: 'rgba(139, 69, 19, 0.15)',
    air: 'rgba(135, 206, 235, 0.15)',
    water: 'rgba(70, 130, 180, 0.15)',
  };

  return (
    <View
      style={[
        styles.zodiacSymbol,
        {
          left: pos.x - 14,
          top: pos.y - 14,
          backgroundColor: elementBg[sign.element],
        },
      ]}
    >
      <Text style={styles.zodiacText}>{sign.symbol}</Text>
    </View>
  );
}

// Planet marker
function PlanetMarker({ position, lang }: { position: PlanetPosition; lang: 'tr' | 'en' }) {
  const planetInfo = PLANETS.find(p => p.key === position.planet);
  if (!planetInfo) return null;

  const pos = degToXY(position.longitude, PLANET_RADIUS);
  const deg = Math.floor(position.degreeInSign);

  return (
    <View style={[styles.planetMarker, { left: pos.x - 12, top: pos.y - 12 }]}>
      <Text style={[styles.planetGlyph, { color: planetInfo.color }]}>
        {planetInfo.symbol}
      </Text>
      <Text style={styles.planetDegree}>{deg}°</Text>
    </View>
  );
}

// House number label
function HouseLabel({ house, longitude }: { house: number; longitude: number }) {
  const pos = degToXY(longitude + 15, HOUSE_RADIUS); // Offset by 15° to center in house

  return (
    <View style={[styles.houseLabel, { left: pos.x - 8, top: pos.y - 8 }]}>
      <Text style={styles.houseLabelText}>{house}</Text>
    </View>
  );
}

// Aspect line between two planets
function AspectLine({ planet1Lon, planet2Lon, aspect }: {
  planet1Lon: number;
  planet2Lon: number;
  aspect: typeof ASPECTS[0];
}) {
  const pos1 = degToXY(planet1Lon, INNER_RADIUS);
  const pos2 = degToXY(planet2Lon, INNER_RADIUS);

  // Calculate line properties
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={[
        styles.aspectLine,
        {
          left: pos1.x,
          top: pos1.y,
          width: length,
          transform: [{ rotate: `${angle}deg` }],
          backgroundColor: aspect.color,
          opacity: aspect.nature === 'harmonious' ? 0.4 : 0.3,
        },
      ]}
    />
  );
}

// Tick marks for zodiac boundaries
function ZodiacTicks() {
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const degree = i * 30;
    const outer = degToXY(degree, OUTER_RADIUS - 2);
    const inner = degToXY(degree, SIGN_RADIUS - 10);

    const dx = inner.x - outer.x;
    const dy = inner.y - outer.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    ticks.push(
      <View
        key={`tick-${i}`}
        style={[
          styles.tick,
          {
            left: outer.x,
            top: outer.y,
            width: length,
            transform: [{ rotate: `${angle}deg` }],
          },
        ]}
      />
    );
  }
  return <>{ticks}</>;
}

export default function NatalChartWheel({ chart, lang }: NatalChartProps) {
  const ascSign = getSignFromDegree(chart.ascendant);

  return (
    <View style={styles.container}>
      {/* Chart circle */}
      <View style={[styles.chartCircle, { width: CHART_SIZE, height: CHART_SIZE }]}>
        {/* Outer ring */}
        <View style={[styles.outerRing, { width: CHART_SIZE - 8, height: CHART_SIZE - 8, borderRadius: (CHART_SIZE - 8) / 2 }]} />

        {/* Inner ring */}
        <View
          style={[
            styles.innerRing,
            {
              width: INNER_RADIUS * 2,
              height: INNER_RADIUS * 2,
              borderRadius: INNER_RADIUS,
              left: CENTER - INNER_RADIUS,
              top: CENTER - INNER_RADIUS,
            },
          ]}
        />

        {/* Zodiac boundary ticks */}
        <ZodiacTicks />

        {/* Zodiac signs */}
        {ZODIAC_SIGNS.map((sign, i) => (
          <ZodiacSegment key={sign.key} sign={sign} index={i} />
        ))}

        {/* House labels */}
        {chart.houses.map(h => (
          <HouseLabel key={h.house} house={h.house} longitude={h.longitude} />
        ))}

        {/* Aspect lines */}
        {chart.aspects.slice(0, 8).map((a, i) => {
          const p1 = chart.planets.find(p => p.planet === a.planet1);
          const p2 = chart.planets.find(p => p.planet === a.planet2);
          if (!p1 || !p2) return null;
          return (
            <AspectLine
              key={`aspect-${i}`}
              planet1Lon={p1.longitude}
              planet2Lon={p2.longitude}
              aspect={a.aspect}
            />
          );
        })}

        {/* Planet markers */}
        {chart.planets.map(p => (
          <PlanetMarker key={p.planet} position={p} lang={lang} />
        ))}

        {/* Center label */}
        <View style={styles.centerLabel}>
          <Text style={styles.ascLabel}>ASC</Text>
          <Text style={styles.ascSign}>{ascSign.symbol}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {chart.planets.slice(0, 5).map(p => {
          const info = PLANETS.find(pl => pl.key === p.planet);
          const sign = getSignFromDegree(p.longitude);
          if (!info) return null;
          return (
            <View key={p.planet} style={styles.legendItem}>
              <Text style={[styles.legendPlanet, { color: info.color }]}>{info.symbol}</Text>
              <Text style={styles.legendText}>
                {info[lang]} {sign.symbol} {Math.floor(p.degreeInSign)}°
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        {chart.planets.slice(5).map(p => {
          const info = PLANETS.find(pl => pl.key === p.planet);
          const sign = getSignFromDegree(p.longitude);
          if (!info) return null;
          return (
            <View key={p.planet} style={styles.legendItem}>
              <Text style={[styles.legendPlanet, { color: info.color }]}>{info.symbol}</Text>
              <Text style={styles.legendText}>
                {info[lang]} {sign.symbol} {Math.floor(p.degreeInSign)}°
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chartCircle: {
    position: 'relative',
  },
  outerRing: {
    position: 'absolute',
    left: 4,
    top: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 165, 116, 0.5)',
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.25)',
    backgroundColor: 'rgba(10, 10, 22, 0.6)',
  },
  tick: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(212, 165, 116, 0.3)',
    transformOrigin: 'left center',
  },
  zodiacSymbol: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zodiacText: {
    fontSize: 16,
    color: '#f0e6d3',
  },
  planetMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetGlyph: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planetDegree: {
    fontSize: 7,
    color: 'rgba(240, 230, 211, 0.6)',
    marginTop: -2,
  },
  houseLabel: {
    position: 'absolute',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  houseLabelText: {
    fontSize: 8,
    color: 'rgba(212, 165, 116, 0.5)',
    fontFamily: 'PlayfairDisplay-Regular',
  },
  aspectLine: {
    position: 'absolute',
    height: 1,
    transformOrigin: 'left center',
  },
  centerLabel: {
    position: 'absolute',
    left: CENTER - 22,
    top: CENTER - 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 116, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ascLabel: {
    fontSize: 8,
    color: '#d4a574',
    fontFamily: 'PlayfairDisplay-Bold',
    letterSpacing: 1,
  },
  ascSign: {
    fontSize: 18,
    color: '#f0e6d3',
    marginTop: -2,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 27, 78, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  legendPlanet: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  legendText: {
    fontSize: 10,
    color: '#f0e6d3',
    fontFamily: 'PlayfairDisplay-Regular',
  },
});

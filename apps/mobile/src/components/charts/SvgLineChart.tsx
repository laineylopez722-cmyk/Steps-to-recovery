/**
 * SVG Line Chart with gradient area fill
 * Reusable component for smooth trend visualization using react-native-svg.
 * Supports configurable colors, rolling average overlay, and axis labels.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';

export interface DataPoint {
  label: string;
  value: number;
}

interface SvgLineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  minValue?: number;
  maxValue: number;
  lineColor: string;
  gradientFrom: string;
  gradientTo?: string;
  showDots?: boolean;
  dotRadius?: number;
  showGrid?: boolean;
  gridLines?: number;
  rollingAverage?: number[];
  rollingAverageColor?: string;
  paddingHorizontal?: number;
  paddingVertical?: number;
  labelColor?: string;
}

function bezierCommand(point: [number, number], i: number, points: [number, number][]): string {
  const prev = points[i - 1] ?? point;
  const smoothing = 0.2;

  const cpStartX = prev[0] + (point[0] - (points[i - 2]?.[0] ?? prev[0])) * smoothing;
  const cpStartY = prev[1] + (point[1] - (points[i - 2]?.[1] ?? prev[1])) * smoothing;
  const cpEndX = point[0] - ((points[i + 1]?.[0] ?? point[0]) - prev[0]) * smoothing;
  const cpEndY = point[1] - ((points[i + 1]?.[1] ?? point[1]) - prev[1]) * smoothing;

  return `C ${cpStartX},${cpStartY} ${cpEndX},${cpEndY} ${point[0]},${point[1]}`;
}

function buildSmoothPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;

  return points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point[0]},${point[1]}`;
    return `${acc} ${bezierCommand(point, i, points)}`;
  }, '');
}

export const SvgLineChart = React.memo(function SvgLineChart({
  data,
  width,
  height,
  minValue = 0,
  maxValue,
  lineColor,
  gradientFrom,
  gradientTo = 'transparent',
  showDots = true,
  dotRadius = 3,
  showGrid = true,
  gridLines = 3,
  rollingAverage,
  rollingAverageColor,
  paddingHorizontal = 8,
  paddingVertical = 8,
  labelColor = 'rgba(255,255,255,0.3)',
}: SvgLineChartProps): React.ReactElement {
  const chartWidth = width - paddingHorizontal * 2;
  const chartHeight = height - paddingVertical * 2;

  const points = useMemo((): [number, number][] => {
    if (data.length === 0) return [];
    if (data.length === 1) {
      return [[paddingHorizontal + chartWidth / 2, paddingVertical + chartHeight / 2]];
    }
    return data.map((d, i) => {
      const x = paddingHorizontal + (i / (data.length - 1)) * chartWidth;
      const yRatio = (d.value - minValue) / (maxValue - minValue);
      const y = paddingVertical + chartHeight - yRatio * chartHeight;
      return [x, y] as [number, number];
    });
  }, [data, chartWidth, chartHeight, minValue, maxValue, paddingHorizontal, paddingVertical]);

  const rollingPoints = useMemo((): [number, number][] => {
    if (!rollingAverage || rollingAverage.length === 0) return [];
    return rollingAverage.map((val, i) => {
      const x = paddingHorizontal + (i / (rollingAverage.length - 1)) * chartWidth;
      const yRatio = (val - minValue) / (maxValue - minValue);
      const y = paddingVertical + chartHeight - yRatio * chartHeight;
      return [x, y] as [number, number];
    });
  }, [rollingAverage, chartWidth, chartHeight, minValue, maxValue, paddingHorizontal, paddingVertical]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = paddingVertical + chartHeight;
    return `${linePath} L ${points[points.length - 1][0]},${bottomY} L ${points[0][0]},${bottomY} Z`;
  }, [linePath, points, paddingVertical, chartHeight]);

  const rollingPath = useMemo(() => buildSmoothPath(rollingPoints), [rollingPoints]);

  const gridYPositions = useMemo(() => {
    if (!showGrid || gridLines <= 0) return [];
    return Array.from({ length: gridLines }, (_, i) => {
      return paddingVertical + ((i + 1) / (gridLines + 1)) * chartHeight;
    });
  }, [showGrid, gridLines, paddingVertical, chartHeight]);

  if (data.length === 0) return <View style={{ width, height }} />;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={gradientFrom} stopOpacity={0.4} />
          <Stop
            offset="1"
            stopColor={gradientTo === 'transparent' ? gradientFrom : gradientTo}
            stopOpacity={0.02}
          />
        </LinearGradient>
      </Defs>

      {/* Grid lines */}
      {gridYPositions.map((y, i) => (
        <Line
          key={`grid-${i}`}
          x1={paddingHorizontal}
          y1={y}
          x2={paddingHorizontal + chartWidth}
          y2={y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
      ))}

      {/* Area fill */}
      {areaPath ? <Path d={areaPath} fill="url(#areaGradient)" /> : null}

      {/* Rolling average line */}
      {rollingPath && rollingAverageColor ? (
        <Path
          d={rollingPath}
          fill="none"
          stroke={rollingAverageColor}
          strokeWidth={1.5}
          strokeDasharray="6,4"
          opacity={0.6}
        />
      ) : null}

      {/* Main line */}
      {linePath ? (
        <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" />
      ) : null}

      {/* Data point dots */}
      {showDots &&
        points.map((p, i) => (
          <Circle key={`dot-${i}`} cx={p[0]} cy={p[1]} r={dotRadius} fill={lineColor} opacity={0.9} />
        ))}

      {/* X-axis labels (first, middle, last) */}
      {data.length >= 3 && (
        <>
          <SvgText
            x={paddingHorizontal}
            y={height - 1}
            fontSize={9}
            fill={labelColor}
            textAnchor="start"
          >
            {data[0].label}
          </SvgText>
          <SvgText
            x={width / 2}
            y={height - 1}
            fontSize={9}
            fill={labelColor}
            textAnchor="middle"
          >
            {data[Math.floor(data.length / 2)].label}
          </SvgText>
          <SvgText
            x={width - paddingHorizontal}
            y={height - 1}
            fontSize={9}
            fill={labelColor}
            textAnchor="end"
          >
            {data[data.length - 1].label}
          </SvgText>
        </>
      )}
    </Svg>
  );
});

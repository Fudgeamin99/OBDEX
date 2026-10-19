import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { num, type MilePoint } from '@/lib/analysis';
import { brand, font, useTheme } from '@/lib/theme';

function niceStep(raw: number) {
  const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  const n = raw / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/** Recorded MOT mileage over time; both axes are linear in the data range. */
export function MileageChart({ points }: { points: MilePoint[] }) {
  const p = useTheme();
  const [W, setW] = useState(320);
  const H = 200, L = 38, R = 54, T = 12, B = 26;
  const t0 = points[0].t, t1 = points[points.length - 1].t;
  const max = Math.max(...points.map((q) => q.miles));
  const step = niceStep(max / 4);
  const top = Math.ceil(max / step) * step || step;
  const x = (t: number) => L + (t1 === t0 ? 0 : (t - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => T + (1 - v / top) * (H - T - B);
  const ticks: number[] = [];
  for (let v = 0; v <= top + 1; v += step) ticks.push(v);
  const y0 = new Date(t0).getUTCFullYear(), y1 = new Date(t1).getUTCFullYear();
  const every = Math.max(1, Math.ceil((y1 - y0 + 1) / 5));
  const years: number[] = [];
  for (let yr = y0; yr <= y1; yr += every) years.push(yr);
  const line = points.map((q, i) => `${i ? 'L' : 'M'}${x(q.t).toFixed(1)} ${y(q.miles).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width={W} height={H}>
        {ticks.map((v) => (
          <Line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={p.line} strokeWidth={1} />
        ))}
        {ticks.map((v) => (
          <SvgText key={'t' + v} x={L - 6} y={y(v) + 4} fontSize={10} fontFamily={font.regular} fill={p.textMuted} textAnchor="end">{v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}</SvgText>
        ))}
        {years.map((yr) => (
          <SvgText key={yr} x={x(Math.max(t0, Date.UTC(yr, 0, 1)))} y={H - 6} fontSize={10} fontFamily={font.regular} fill={p.textMuted} textAnchor="middle">{String(yr)}</SvgText>
        ))}
        <Path d={`${line} L${x(t1)} ${y(0)} L${x(t0)} ${y(0)} Z`} fill={brand.orange} fillOpacity={0.14} />
        <Path d={line} stroke={brand.orange} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((q, i) => (
          <Circle key={q.date} cx={x(q.t)} cy={y(q.miles)} r={q.drop || i === points.length - 1 ? 5 : 3.5}
            fill={q.drop ? p.bad : i === points.length - 1 ? brand.orange : p.bg} stroke={q.drop ? p.bad : brand.orange} strokeWidth={2} />
        ))}
        <SvgText x={x(last.t) + 9} y={y(last.miles) + 4} fontSize={11} fontFamily={font.semibold} fill={p.text}>{num(last.miles)}</SvgText>
      </Svg>
    </View>
  );
}

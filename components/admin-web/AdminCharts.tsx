import { useId, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  id: string;
  label: string;
  value: number;
  secondaryValue?: number;
};

type BreakdownItem = {
  id: string;
  label: string;
  value: number;
  color?: string;
  hint?: string;
};

function formatCompactNumber(value: number) {
  return Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function ChartCard({
  title,
  eyebrow,
  summaryLabel,
  summaryValue,
  summarySecondary,
  children,
}: {
  title: string;
  eyebrow?: string;
  summaryLabel?: string;
  summaryValue?: string;
  summarySecondary?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {summaryValue ? (
          <View style={styles.summary}>
            {summaryLabel ? <Text style={styles.summaryLabel}>{summaryLabel}</Text> : null}
            <Text style={styles.summaryValue}>{summaryValue}</Text>
            {summarySecondary ? <Text style={styles.summarySecondary}>{summarySecondary}</Text> : null}
          </View>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function WebChart({
  height = 280,
  children,
}: {
  height?: number;
  children: React.ReactNode;
}) {
  if (Platform.OS !== "web") {
    return (
      <View style={[styles.nativeFallback, { height }]}>
        <Text style={styles.nativeFallbackText}>Visualização disponível na versão web.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.chartWrap, { height }]}>
      <ResponsiveContainer width="100%" height="100%">
        {children as React.ReactElement}
      </ResponsiveContainer>
    </View>
  );
}

function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function AdminTrendChart({
  title,
  eyebrow,
  points,
  primaryLabel,
  secondaryLabel,
  primaryColor = "#38bdf8",
  secondaryColor = "#facc15",
}: {
  title: string;
  eyebrow?: string;
  points: TrendPoint[];
  primaryLabel: string;
  secondaryLabel?: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const [selectedId, setSelectedId] = useState(points[points.length - 1]?.id ?? "");
  const selected = useMemo(() => points.find((point) => point.id === selectedId) ?? points[points.length - 1] ?? null, [points, selectedId]);
  const chartId = useId().replace(/:/g, "");
  const primaryFillId = `primaryFill-${chartId}`;
  const secondaryFillId = `secondaryFill-${chartId}`;

  return (
    <ChartCard
      title={title}
      eyebrow={eyebrow}
      summaryLabel={selected?.label}
      summaryValue={selected ? formatCompactNumber(selected.value) : undefined}
      summarySecondary={
        secondaryLabel && typeof selected?.secondaryValue === "number"
          ? `${formatCompactNumber(selected.secondaryValue)} ${secondaryLabel.toLowerCase()}`
          : primaryLabel
      }
    >
      <ChartLegend
        items={[
          { label: primaryLabel, color: primaryColor },
          ...(secondaryLabel ? [{ label: secondaryLabel, color: secondaryColor }] : []),
        ]}
      />
      <WebChart>
        <AreaChart data={points} margin={{ top: 18, right: 18, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={primaryFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.45} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id={secondaryFillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.28} />
              <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#7f93ad" tickLine={false} axisLine={false} />
          <YAxis stroke="#7f93ad" tickLine={false} axisLine={false} width={36} />
          <Tooltip
            cursor={{ stroke: "rgba(125,211,252,0.35)", strokeWidth: 1 }}
            contentStyle={tooltipStyles.content}
            labelStyle={tooltipStyles.label}
            itemStyle={tooltipStyles.item}
          />
          {secondaryLabel ? (
            <Area type="monotone" dataKey="secondaryValue" stroke={secondaryColor} fill={`url(#${secondaryFillId})`} strokeWidth={2} />
          ) : null}
          <Area type="monotone" dataKey="value" stroke={primaryColor} fill={`url(#${primaryFillId})`} strokeWidth={3} />
        </AreaChart>
      </WebChart>
      <View style={styles.metricList}>
        {points.map((point) => {
          const active = point.id === selected?.id;
          return (
            <Pressable key={point.id} style={[styles.metricRow, active ? styles.metricRowActive : null]} onPress={() => setSelectedId(point.id)}>
              <Text style={styles.metricRowLabel}>{point.label}</Text>
              <Text style={styles.metricRowValue}>
                {formatCompactNumber(point.value)}
                {secondaryLabel && typeof point.secondaryValue === "number" ? ` • ${formatCompactNumber(point.secondaryValue)}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ChartCard>
  );
}

export function AdminBreakdownChart({
  title,
  eyebrow,
  items,
  totalLabel,
}: {
  title: string;
  eyebrow?: string;
  items: BreakdownItem[];
  totalLabel: string;
}) {
  const total = items.reduce((acc, item) => acc + Number(item.value || 0), 0);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const chartData = items.map((item) => ({ ...item, value: Number(item.value || 0) }));

  return (
    <ChartCard
      title={title}
      eyebrow={eyebrow}
      summaryLabel={totalLabel}
      summaryValue={formatCompactNumber(total)}
      summarySecondary={selected?.label}
    >
      <WebChart>
        <BarChart data={chartData} margin={{ top: 18, right: 18, left: 0, bottom: 0 }} barCategoryGap={18}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} />
          <XAxis dataKey="label" stroke="#7f93ad" tickLine={false} axisLine={false} />
          <YAxis stroke="#7f93ad" tickLine={false} axisLine={false} width={36} />
          <Tooltip
            cursor={{ fill: "rgba(125,211,252,0.08)" }}
            contentStyle={tooltipStyles.content}
            labelStyle={tooltipStyles.label}
            itemStyle={tooltipStyles.item}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {chartData.map((item) => (
              <Cell key={item.id} fill={item.color || "#38bdf8"} fillOpacity={selected?.id === item.id ? 1 : 0.75} />
            ))}
          </Bar>
        </BarChart>
      </WebChart>
      <View style={styles.metricList}>
        {items.map((item) => {
          const active = item.id === selected?.id;
          const percent = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;
          return (
            <Pressable key={item.id} style={[styles.metricRow, active ? styles.metricRowActive : null]} onPress={() => setSelectedId(item.id)}>
              <View style={styles.metricRowMain}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color || "#38bdf8" }]} />
                <Text style={styles.metricRowLabel}>{item.label}</Text>
              </View>
              <Text style={styles.metricRowValue}>
                {formatCompactNumber(item.value)} • {percent.toFixed(1)}%
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ChartCard>
  );
}

export function AdminHeatmapChart({
  title,
  eyebrow,
  items,
  accentColor = "#38bdf8",
}: {
  title: string;
  eyebrow?: string;
  items: { id: string; label: string; value: number }[];
  accentColor?: string;
}) {
  const [selectedId, setSelectedId] = useState(items[items.length - 1]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[items.length - 1] ?? null;
  const chartData = items.map((item) => ({ ...item, value: Number(item.value || 0) })).sort((a, b) => b.value - a.value);

  return (
    <ChartCard title={title} eyebrow={eyebrow} summaryLabel={selected?.label} summaryValue={selected ? formatCompactNumber(selected.value) : undefined}>
      <WebChart height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 12, left: 40, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.08)" horizontal={false} />
          <XAxis type="number" stroke="#7f93ad" tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" stroke="#d8e1ed" tickLine={false} axisLine={false} width={120} />
          <Tooltip
            cursor={{ fill: "rgba(125,211,252,0.08)" }}
            contentStyle={tooltipStyles.content}
            labelStyle={tooltipStyles.label}
            itemStyle={tooltipStyles.item}
          />
          <Bar dataKey="value" radius={[0, 10, 10, 0]}>
            {chartData.map((item) => (
              <Cell key={item.id} fill={accentColor} fillOpacity={selected?.id === item.id ? 1 : 0.58} />
            ))}
          </Bar>
        </BarChart>
      </WebChart>
      <View style={styles.metricGrid}>
        {items.map((item) => {
          const active = item.id === selected?.id;
          return (
            <Pressable key={item.id} style={[styles.metricTile, active ? styles.metricTileActive : null]} onPress={() => setSelectedId(item.id)}>
              <Text style={styles.metricTileLabel}>{item.label}</Text>
              <Text style={styles.metricTileValue}>{formatCompactNumber(item.value)}</Text>
            </Pressable>
          );
        })}
      </View>
    </ChartCard>
  );
}

export function AdminDonutChart({
  title,
  eyebrow,
  items,
  totalLabel,
}: {
  title: string;
  eyebrow?: string;
  items: BreakdownItem[];
  totalLabel: string;
}) {
  const total = items.reduce((acc, item) => acc + Number(item.value || 0), 0);
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "");
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const chartData = items.map((item) => ({ ...item, value: Number(item.value || 0) }));
  const selectedPercent = total > 0 ? ((Number(selected?.value || 0) / total) * 100).toFixed(1) : "0.0";

  return (
    <ChartCard
      title={title}
      eyebrow={eyebrow}
      summaryLabel={totalLabel}
      summaryValue={formatCompactNumber(total)}
      summarySecondary={selected?.label}
    >
      <WebChart height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={74}
            outerRadius={106}
            paddingAngle={3}
            stroke="rgba(8,14,28,0.94)"
            strokeWidth={3}
          >
            {chartData.map((item) => (
              <Cell key={item.id} fill={item.color || "#38bdf8"} fillOpacity={selected?.id === item.id ? 1 : 0.75} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;
                const cx = Number(viewBox.cx);
                const cy = Number(viewBox.cy);
                return (
                  <g>
                    <text x={cx} y={cy - 16} textAnchor="middle" fill="#b9cada" fontSize="11" fontWeight="800" letterSpacing="1">
                      {(selected?.label || totalLabel).toUpperCase()}
                    </text>
                    <text x={cx} y={cy + 14} textAnchor="middle" fill="#f8fafc" fontSize="28" fontWeight="900">
                      {formatCompactNumber(selected?.value || total)}
                    </text>
                    <text x={cx} y={cy + 34} textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="800">
                      {selectedPercent}%
                    </text>
                  </g>
                );
              }}
            />
          </Pie>
          <Tooltip contentStyle={tooltipStyles.content} labelStyle={tooltipStyles.label} itemStyle={tooltipStyles.item} />
        </PieChart>
      </WebChart>
      <View style={styles.metricList}>
        {items.map((item) => {
          const active = item.id === selected?.id;
          const percent = total > 0 ? (Number(item.value || 0) / total) * 100 : 0;
          return (
            <Pressable key={item.id} style={[styles.metricRow, active ? styles.metricRowActive : null]} onPress={() => setSelectedId(item.id)}>
              <View style={styles.metricRowMain}>
                <View style={[styles.legendSwatch, { backgroundColor: item.color || "#38bdf8" }]} />
                <Text style={styles.metricRowLabel}>{item.label}</Text>
              </View>
              <Text style={styles.metricRowValue}>
                {formatCompactNumber(item.value)} • {percent.toFixed(1)}%
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(8, 14, 28, 0.94)",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(94, 234, 212, 0.16)",
    padding: 22,
    gap: 18,
    overflow: "hidden",
    shadowColor: "#020617",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  copy: {
    flex: 1,
  },
  eyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
  },
  summary: {
    minWidth: 160,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(94, 234, 212, 0.14)",
    backgroundColor: "rgba(11, 18, 32, 0.88)",
  },
  summaryLabel: {
    color: "#93a9c7",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  summarySecondary: {
    color: "#9ec4df",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  chartWrap: {
    width: "100%",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(5, 10, 22, 0.42)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.08)",
    padding: 10,
  },
  nativeFallback: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13,20,34,0.72)",
  },
  nativeFallbackText: {
    color: "#cfe0f0",
    fontWeight: "700",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  legendText: {
    color: "#b4c6dd",
    fontSize: 12,
    fontWeight: "800",
  },
  metricList: {
    gap: 10,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    backgroundColor: "rgba(13, 20, 34, 0.72)",
  },
  metricRowActive: {
    borderColor: "rgba(125, 211, 252, 0.34)",
    backgroundColor: "rgba(56, 189, 248, 0.10)",
  },
  metricRowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  metricRowLabel: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "800",
    flexShrink: 1,
  },
  metricRowValue: {
    color: "#dbe6f3",
    fontSize: 12,
    fontWeight: "800",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  metricTile: {
    minWidth: 150,
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
    backgroundColor: "rgba(13,20,34,0.72)",
    padding: 14,
  },
  metricTileActive: {
    borderColor: "rgba(250,204,21,0.38)",
    backgroundColor: "rgba(250,204,21,0.10)",
  },
  metricTileLabel: {
    color: "#dbe6f3",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metricTileValue: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
});

const tooltipStyles = {
  content: {
    backgroundColor: "rgba(8,14,28,0.96)",
    border: "1px solid rgba(94,234,212,0.16)",
    borderRadius: "14px",
    color: "#f8fafc",
    boxShadow: "0 18px 50px rgba(2, 6, 23, 0.36)",
  } as React.CSSProperties,
  label: {
    color: "#f8fafc",
    fontWeight: 800,
  } as React.CSSProperties,
  item: {
    color: "#cfe0f0",
  } as React.CSSProperties,
};

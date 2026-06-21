import { useEffect, useState, type ComponentType, type ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type AdminChartsModule = typeof import("./AdminCharts");

type TrendProps = ComponentProps<AdminChartsModule["AdminTrendChart"]>;
type BreakdownProps = ComponentProps<AdminChartsModule["AdminBreakdownChart"]>;
type DonutProps = ComponentProps<AdminChartsModule["AdminDonutChart"]>;
type HeatmapProps = ComponentProps<AdminChartsModule["AdminHeatmapChart"]>;

let cachedModule: AdminChartsModule | null = null;

function useAdminChartsModule() {
  const [module, setModule] = useState<AdminChartsModule | null>(cachedModule);

  useEffect(() => {
    if (cachedModule) return;

    let active = true;

    Promise.resolve().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded = require("./AdminCharts") as AdminChartsModule;
      cachedModule = loaded;
      if (active) {
        setModule(loaded);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return module;
}

function ChartPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <ActivityIndicator color="#38bdf8" />
    </View>
  );
}

function createLazyChart<TProps>(pick: (module: AdminChartsModule) => ComponentType<TProps>) {
  return function LazyChart(props: TProps) {
    const module = useAdminChartsModule();

    if (!module) {
      return <ChartPlaceholder />;
    }

    const Chart = pick(module) as ComponentType<any>;
    return <Chart {...props} />;
  };
}

export const AdminTrendChart = createLazyChart<TrendProps>((module) => module.AdminTrendChart);
export const AdminBreakdownChart = createLazyChart<BreakdownProps>((module) => module.AdminBreakdownChart);
export const AdminDonutChart = createLazyChart<DonutProps>((module) => module.AdminDonutChart);
export const AdminHeatmapChart = createLazyChart<HeatmapProps>((module) => module.AdminHeatmapChart);

const styles = StyleSheet.create({
  placeholder: {
    minHeight: 280,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.14)",
    backgroundColor: "rgba(7, 14, 30, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});

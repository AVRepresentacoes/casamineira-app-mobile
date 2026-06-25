import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { businessDnaCatalog, businessDnaCategories, businessDnaSegments } from "@/src/business-dna/catalog";
import type { BusinessDna } from "@/src/business-dna/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const allCategories = ["Todas", ...businessDnaCategories];
const allSegments = ["Todos", ...businessDnaSegments];

function maturityLabel(value: BusinessDna["maturity"]) {
  const labels = {
    starter: "Starter",
    validated: "Validado",
    premium: "Premium",
    enterprise: "Enterprise",
  };
  return labels[value];
}

function BusinessDnaCard({ dna }: { dna: BusinessDna }) {
  const router = useRouter();

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/business-dna/${dna.slug}` as never)}>
      <View style={[styles.cardImage, { backgroundColor: dna.secondaryColor }]}>
        <View style={[styles.cardGlow, { backgroundColor: `${dna.primaryColor}33` }]} />
        <View style={[styles.cardIcon, { backgroundColor: `${dna.primaryColor}22`, borderColor: `${dna.primaryColor}66` }]}>
          <MaterialCommunityIcons name={dna.icon} size={30} color={dna.primaryColor} />
        </View>
        <Text style={styles.imagePlaceholder}>{dna.image.replace("placeholder://business-dna/", "")}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopline}>
          <Text style={styles.cardCategory}>{dna.category}</Text>
          <Text style={[styles.maturityBadge, { color: dna.primaryColor }]}>{maturityLabel(dna.maturity)}</Text>
        </View>
        <Text style={styles.cardTitle}>{dna.name} DNA™</Text>
        <Text style={styles.cardDescription}>{dna.description}</Text>

        <View style={styles.chipRow}>
          <Text style={styles.chip}>{dna.segment}</Text>
          <Text style={styles.chip}>{dna.averageImplementationTime}</Text>
        </View>

        <View style={styles.featurePreview}>
          {dna.defaultFeatures.slice(0, 3).map((feature) => (
            <View key={feature} style={styles.featurePill}>
              <MaterialCommunityIcons name="check" size={13} color="#86efac" />
              <Text style={styles.featurePillText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export default function BusinessDnaCatalogScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [segment, setSegment] = useState("Todos");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return businessDnaCatalog.filter((dna) => {
      const matchesSearch =
        !query ||
        [dna.name, dna.description, dna.commercialDescription, dna.category, dna.segment]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory = category === "Todas" || dna.category === category;
      const matchesSegment = segment === "Todos" || dna.segment === segment;
      return matchesSearch && matchesCategory && matchesSegment;
    });
  }, [category, search, segment]);

  return (
    <SaasProductShell
      title="Business DNA™"
      subtitle="Catálogo de modelos inteligentes por nicho, preparado para futura personalização assistida por IA."
    >
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.kicker}>Engine de modelos</Text>
        <Text style={styles.heroTitle}>Escolha uma base madura para criar sua empresa digital.</Text>
        <Text style={styles.heroText}>
          Cada Business DNA™ reúne fluxos, módulos, integrações e recursos premium para acelerar implantação sem começar do zero.
        </Text>
      </View>

      <View style={styles.filtersPanel}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nicho, categoria ou recurso..."
            placeholderTextColor="#64748b"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Categoria</Text>
          <View style={styles.filterChips}>
            {allCategories.map((item) => {
              const active = category === item;
              return (
                <Pressable key={item} style={[styles.filterChip, active ? styles.filterChipActive : null]} onPress={() => setCategory(item)}>
                  <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Segmento</Text>
          <View style={styles.filterChips}>
            {allSegments.map((item) => {
              const active = segment === item;
              return (
                <Pressable key={item} style={[styles.filterChip, active ? styles.filterChipActive : null]} onPress={() => setSegment(item)}>
                  <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.catalogHeader}>
        <Text style={styles.catalogTitle}>{filtered.length} Business DNA™ encontrados</Text>
        <Text style={styles.catalogHint}>Dados mockados e prontos para futura integração com IA e banco.</Text>
      </View>

      <View style={styles.grid}>
        {filtered.map((dna) => (
          <BusinessDnaCard key={dna.id} dna={dna} />
        ))}
      </View>

      {!filtered.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum Business DNA encontrado</Text>
          <Text style={styles.emptyText}>Ajuste a busca ou os filtros para visualizar outros modelos.</Text>
        </View>
      ) : null}
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.18)",
    backgroundColor: "rgba(12, 17, 31, 0.94)",
    padding: 28,
    minHeight: 220,
    justifyContent: "center",
  },
  heroGlow: {
    position: "absolute",
    right: -80,
    top: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "rgba(34, 211, 238, 0.14)",
  },
  kicker: {
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "900",
    marginTop: 12,
    maxWidth: 820,
  },
  heroText: {
    color: "#a8b5c7",
    fontSize: 16,
    lineHeight: 26,
    marginTop: 12,
    maxWidth: 860,
  },
  filtersPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 18,
    gap: 18,
  },
  searchBox: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(2, 6, 23, 0.30)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: "#f8fafc",
    minHeight: 48,
  },
  filterGroup: {
    gap: 10,
  },
  filterLabel: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  filterChipText: {
    color: "#cbd5e1",
    fontWeight: "900",
    fontSize: 12,
  },
  filterChipTextActive: {
    color: "#08101c",
  },
  catalogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    alignItems: "center",
  },
  catalogTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  catalogHint: {
    color: "#94a3b8",
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 300,
    maxWidth: 430,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.88)",
    overflow: "hidden",
  },
  cardImage: {
    minHeight: 138,
    padding: 18,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    right: -40,
    top: -60,
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  cardIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholder: {
    position: "absolute",
    right: 18,
    bottom: 16,
    color: "rgba(248, 250, 252, 0.28)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardBody: {
    padding: 18,
    gap: 12,
  },
  cardTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cardCategory: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  maturityBadge: {
    fontSize: 12,
    fontWeight: "900",
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "900",
  },
  cardDescription: {
    color: "#a8b5c7",
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    color: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  featurePreview: {
    gap: 8,
  },
  featurePill: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  featurePillText: {
    color: "#94a3b8",
    lineHeight: 18,
  },
  emptyState: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.12)",
    backgroundColor: "rgba(12, 17, 31, 0.86)",
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
  },
  emptyText: {
    color: "#94a3b8",
  },
});

import { SaasProductShell } from "@/components/saas/SaasProductShell";
import { colors, componentSizes, radii, shadows, spacing, webMotion } from "@/src/design-system/tokens";
import { marketplaceCategories, marketplaceSegments, premiumTemplates } from "@/src/template-marketplace/catalog";
import type { PremiumTemplate, TemplateBadge } from "@/src/template-marketplace/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

const segmentOptions = ["Todos", ...marketplaceSegments];
const categoryOptions = ["Todas", ...marketplaceCategories];
const popularityOptions = ["Todos", "Popular", "Premium", "Enterprise", "Novo"];
const salesOptions = ["Todos", "Mais vendidos"];
const noveltyOptions = ["Todos", "Novidades"];
const priceOptions = ["Todos", "Starter", "Premium", "Enterprise"];

function badgeColor(badge: TemplateBadge) {
  return {
    Novo: "#67e8f9",
    Popular: "#facc15",
    Premium: "#c084fc",
    Enterprise: "#fb7185",
  }[badge];
}

function RatingRow({ rating, downloads, deployments }: { rating: number; downloads: number; deployments: number }) {
  return (
    <View style={styles.ratingRow}>
      <Text style={styles.stars}>★★★★★</Text>
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      <Text style={styles.ratingMeta}>{downloads} downloads</Text>
      <Text style={styles.ratingMeta}>{deployments} implantações</Text>
    </View>
  );
}

function TemplateCard({ template }: { template: PremiumTemplate }) {
  const router = useRouter();
  const badge = badgeColor(template.badge);

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/marketplace/${template.slug}` as never)}>
      <View style={[styles.cardImage, { backgroundColor: template.secondaryColor }]}>
        <View style={[styles.cardGlow, { backgroundColor: `${template.primaryColor}33` }]} />
        <View style={[styles.templateIcon, { borderColor: `${template.primaryColor}66`, backgroundColor: `${template.primaryColor}20` }]}>
          <MaterialCommunityIcons name={template.icon} size={30} color={template.primaryColor} />
        </View>
        <View style={[styles.badge, { backgroundColor: `${badge}22`, borderColor: `${badge}77` }]}>
          <Text style={[styles.badgeText, { color: badge }]}>{template.badge}</Text>
        </View>
        <Text style={styles.placeholderText}>{template.image.replace("placeholder://templates/", "")}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardCategory}>{template.category}</Text>
          <Text style={styles.cardPrice}>{template.priceLabel}</Text>
        </View>
        <Text style={styles.cardTitle}>{template.name}</Text>
        <Text style={styles.cardDescription}>{template.description}</Text>
        <Text style={styles.dnaText}>{template.businessDnaName}</Text>
        <RatingRow rating={template.rating} downloads={template.downloads} deployments={template.deployments} />
        <View style={styles.metaGrid}>
          <Text style={styles.metaChip}>{template.modulesCount} módulos</Text>
          <Text style={styles.metaChip}>{template.averageImplementationTime}</Text>
          <Text style={styles.metaChip}>{template.compatibility.join(" / ")}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function FilterChips({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterChips}>
        {options.map((option) => {
          const active = value === option;
          return (
            <Pressable key={option} style={[styles.filterChip, active ? styles.filterChipActive : null]} onPress={() => onChange(option)}>
              <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TemplateMarketplaceScreen() {
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("Todos");
  const [category, setCategory] = useState("Todas");
  const [popularity, setPopularity] = useState("Todos");
  const [sales, setSales] = useState("Todos");
  const [novelty, setNovelty] = useState("Todos");
  const [price, setPrice] = useState("Todos");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return premiumTemplates
      .filter((template) => {
        const matchesSearch =
          !query ||
          [template.name, template.description, template.category, template.segment, template.businessDnaName]
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchesSegment = segment === "Todos" || template.segment === segment;
        const matchesCategory = category === "Todas" || template.category === category;
        const matchesPopularity = popularity === "Todos" || template.badge === popularity;
        const matchesSales = sales === "Todos" || template.isBestSeller;
        const matchesNovelty = novelty === "Todos" || template.isNew;
        const matchesPrice = price === "Todos" || template.priceTier === price;
        return matchesSearch && matchesSegment && matchesCategory && matchesPopularity && matchesSales && matchesNovelty && matchesPrice;
      })
      .sort((left, right) => right.popularityScore - left.popularityScore);
  }, [category, novelty, popularity, price, sales, search, segment]);

  const recommended = premiumTemplates.filter((template) => template.isBestSeller).slice(0, 3);

  return (
    <SaasProductShell
      title="Marketplace de Templates"
      subtitle="Escolha um projeto profissional pronto para acelerar a criação da sua empresa digital."
    >
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.kicker}>Templates Premium</Text>
        <Text style={styles.heroTitle}>Projetos prontos para virar empresas digitais.</Text>
        <Text style={styles.heroText}>
          Explore modelos com Business DNA™, módulos, integrações e contratos preparados para personalização futura com IA.
        </Text>
      </View>

      <View style={styles.filtersPanel}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar template, nicho ou Business DNA..."
            placeholderTextColor="#64748b"
            style={styles.searchInput}
          />
        </View>

        <FilterChips label="Segmento" value={segment} options={segmentOptions} onChange={setSegment} />
        <FilterChips label="Categoria" value={category} options={categoryOptions} onChange={setCategory} />
        <FilterChips label="Popularidade" value={popularity} options={popularityOptions} onChange={setPopularity} />
        <FilterChips label="Mais vendidos" value={sales} options={salesOptions} onChange={setSales} />
        <FilterChips label="Novidades" value={novelty} options={noveltyOptions} onChange={setNovelty} />
        <FilterChips label="Preço" value={price} options={priceOptions} onChange={setPrice} />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Curadoria</Text>
          <Text style={styles.sectionTitle}>Templates Recomendados</Text>
        </View>
        <Text style={styles.sectionMeta}>{recommended.length} destaques</Text>
      </View>
      <View style={styles.grid}>
        {recommended.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>Catálogo</Text>
          <Text style={styles.sectionTitle}>{filtered.length} templates encontrados</Text>
        </View>
        <Text style={styles.sectionMeta}>Somente layout, sem compra ativa</Text>
      </View>

      <View style={styles.grid}>
        {filtered.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </View>

      {!filtered.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nenhum template encontrado</Text>
          <Text style={styles.emptyText}>Ajuste a busca ou os filtros para visualizar outros projetos premium.</Text>
        </View>
      ) : null}
    </SaasProductShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    minHeight: 320,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    padding: 42,
    justifyContent: "center",
    ...shadows.card,
  },
  heroGlow: {
    position: "absolute",
    right: -90,
    top: -150,
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: "rgba(250, 204, 21, 0.14)",
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
    fontSize: 48,
    lineHeight: 54,
    fontWeight: "900",
    marginTop: 12,
    maxWidth: 860,
  },
  heroText: {
    color: "#a8b5c7",
    fontSize: 17,
    lineHeight: 28,
    marginTop: 14,
    maxWidth: 760,
  },
  filtersPanel: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    padding: componentSizes.cardPadding,
    gap: spacing.lg,
  },
  searchBox: {
    minHeight: componentSizes.inputHeight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(2, 6, 23, 0.34)",
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
    gap: 9,
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
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceSoft,
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
  sectionHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  sectionEyebrow: {
    color: "#67e8f9",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6,
  },
  sectionMeta: {
    color: "#94a3b8",
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 310,
    maxWidth: 430,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    overflow: "hidden",
    ...shadows.card,
    ...webMotion,
  },
  cardImage: {
    minHeight: 150,
    padding: spacing.lg,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    right: -40,
    top: -64,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  templateIcon: {
    width: 58,
    height: 58,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 16,
    right: 16,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  placeholderText: {
    position: "absolute",
    right: 18,
    bottom: 16,
    color: "rgba(248, 250, 252, 0.26)",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardBody: {
    padding: componentSizes.cardPadding,
    gap: spacing.sm,
  },
  cardHeader: {
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
  cardPrice: {
    color: "#fde68a",
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
  dnaText: {
    color: "#e0f2fe",
    fontWeight: "900",
  },
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  stars: {
    color: "#facc15",
    fontSize: 13,
    fontWeight: "900",
  },
  ratingText: {
    color: "#f8fafc",
    fontWeight: "900",
  },
  ratingMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    color: "#dbeafe",
    borderRadius: radii.sm,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyState: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
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

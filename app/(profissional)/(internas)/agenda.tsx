import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import PressableScale from "@/components/PressableScale";
import { supabase } from "@/lib/supabase";

type Slot = {
  id: string;
  dia: string;
  inicio: string;
  fim: string;
  ativo: boolean;
};

const STORAGE_PREFIX = "agenda_profissional_";
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const HORARIO_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function hasOverlap(existing: Slot[], candidate: Slot) {
  return existing.some((slot) => {
    if (!slot.ativo || slot.dia !== candidate.dia || slot.id === candidate.id) return false;
    return candidate.inicio < slot.fim && slot.inicio < candidate.fim;
  });
}

function sortSlots(list: Slot[]) {
  return [...list].sort((a, b) => {
    const dayDiff = DIAS_SEMANA.indexOf(a.dia) - DIAS_SEMANA.indexOf(b.dia);
    if (dayDiff !== 0) return dayDiff;
    return a.inicio.localeCompare(b.inicio);
  });
}

function isHorarioValido(valor: string) {
  return HORARIO_REGEX.test(valor.trim());
}

export default function AgendaProfissional() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [dia, setDia] = useState("Seg");
  const [inicio, setInicio] = useState("08:00");
  const [fim, setFim] = useState("12:00");

  const carregar = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || "default";
      const storageKey = `${STORAGE_PREFIX}${uid}`;
      const raw = await AsyncStorage.getItem(storageKey);
      if (!raw) {
        setSlots([]);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Slot[];
        setSlots(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSlots([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function persist(next: Slot[]) {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || "default";
      await AsyncStorage.setItem(`${STORAGE_PREFIX}${uid}`, JSON.stringify(next));
      setSlots(next);
    } finally {
      setSaving(false);
    }
  }

  async function adicionar() {
    if (!dia || !inicio || !fim) {
      Alert.alert("Atenção", "Preencha dia e horário.");
      return;
    }

    if (!DIAS_SEMANA.includes(dia)) {
      Alert.alert("Atenção", "Selecione um dia válido da semana.");
      return;
    }

    if (!isHorarioValido(inicio) || !isHorarioValido(fim)) {
      Alert.alert("Atenção", "Use o formato HH:MM, por exemplo 08:00.");
      return;
    }

    if (inicio >= fim) {
      Alert.alert("Atenção", "Horário inicial deve ser menor que o final.");
      return;
    }

    const novo: Slot = {
      id: String(Date.now()),
      dia,
      inicio,
      fim,
      ativo: true,
    };

    if (hasOverlap(slots, novo)) {
      Alert.alert("Conflito detectado", "Esse horário conflita com uma janela já ativa.");
      return;
    }

    await persist([novo, ...slots]);
  }

  async function toggle(id: string, ativo: boolean) {
    const next = slots.map((slot) => (slot.id === id ? { ...slot, ativo } : slot));
    await persist(next);
  }

  async function remover(id: string) {
    await persist(slots.filter((slot) => slot.id !== id));
  }

  const ativos = slots.filter((s) => s.ativo).length;
  const ordenados = sortSlots(slots);
  const horasAtivas = slots
    .filter((slot) => slot.ativo)
    .reduce((acc, slot) => {
      const [h1, m1] = slot.inicio.split(":").map(Number);
      const [h2, m2] = slot.fim.split(":").map(Number);
      return acc + Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
    }, 0);
  const diasCobertos = new Set(slots.filter((slot) => slot.ativo).map((slot) => slot.dia)).size;
  const proximaJanela = ordenados.find((slot) => slot.ativo) || null;
  const mapaSemanal = DIAS_SEMANA.map((diaSemana) => {
    const total = slots.filter((slot) => slot.dia === diaSemana).length;
    const ativosDia = slots.filter((slot) => slot.dia === diaSemana && slot.ativo).length;
    return { dia: diaSemana, total, ativos: ativosDia };
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.titleRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="calendar-outline" size={22} color="#0B0F1A" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>Planejamento operacional</Text>
            <Text style={styles.title}>Agenda Inteligente</Text>
          </View>
        </View>
        <Text style={styles.heroText}>
          Organize janelas de atendimento sem conflito e mantenha sua disponibilidade clara para captar melhores oportunidades.
        </Text>
        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaChip}>
            <Ionicons name="time-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{horasAtivas.toFixed(1)}h ativas</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="navigate-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>{diasCobertos} dias cobertos</Text>
          </View>
          <View style={styles.heroMetaChip}>
            <Ionicons name="sparkles-outline" size={14} color="#facc15" />
            <Text style={styles.heroMetaText}>
              {proximaJanela ? `${proximaJanela.dia} ${proximaJanela.inicio}-${proximaJanela.fim}` : "Sem janela ativa"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Janelas ativas</Text>
          <Text style={styles.statValue}>{ativos}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total cadastrado</Text>
          <Text style={styles.statValue}>{slots.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cobertura semanal</Text>
          <Text style={styles.statValue}>{diasCobertos}/7</Text>
        </View>
      </View>

      <View style={styles.boardCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Radar semanal</Text>
          <Text style={styles.sectionHint}>Disponibilidade por dia</Text>
        </View>
        <View style={styles.weekGrid}>
          {mapaSemanal.map((item) => (
            <View key={item.dia} style={[styles.weekDayCard, item.ativos > 0 && styles.weekDayCardActive]}>
              <Text style={[styles.weekDayLabel, item.ativos > 0 && styles.weekDayLabelActive]}>{item.dia}</Text>
              <Text style={[styles.weekDayValue, item.ativos > 0 && styles.weekDayValueActive]}>{item.ativos}</Text>
              <Text style={styles.weekDayMeta}>{item.total} janelas</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nova janela de atendimento</Text>
          <Text style={styles.sectionHint}>Cadastro rápido</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChipRow}>
          {DIAS_SEMANA.map((item) => (
            <PressableScale
              key={item}
              style={[styles.dayChip, dia === item && styles.dayChipActive]}
              onPress={() => setDia(item)}
            >
              <Text style={[styles.dayChipText, dia === item && styles.dayChipTextActive]}>{item}</Text>
            </PressableScale>
          ))}
        </ScrollView>
        <TextInput value={dia} onChangeText={setDia} placeholder="Dia (ex: Seg)" placeholderTextColor="#6b7280" style={styles.input} />
        <TextInput value={inicio} onChangeText={setInicio} placeholder="Início (HH:MM)" placeholderTextColor="#6b7280" style={styles.input} />
        <TextInput value={fim} onChangeText={setFim} placeholder="Fim (HH:MM)" placeholderTextColor="#6b7280" style={styles.input} />

        <PressableScale style={[styles.primaryBtn, saving && { opacity: 0.65 }]} onPress={adicionar} disabled={saving}>
          <Text style={styles.primaryText}>{saving ? "Salvando..." : "Adicionar janela"}</Text>
        </PressableScale>
      </View>

      <View style={styles.boardCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda operacional</Text>
          <Text style={styles.sectionHint}>Gestão das janelas</Text>
        </View>
        <Text style={styles.boardText}>
          Ative ou pause janelas conforme sua capacidade real. Uma agenda consistente melhora resposta comercial e reduz conflito de atendimento.
        </Text>
      </View>

      <FlatList
        data={ordenados}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 12 }}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma janela cadastrada ainda.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.slotBadge}>
              <Text style={styles.slotBadgeText}>{item.dia}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.inicio} às {item.fim}</Text>
              <Text style={styles.itemMeta}>{item.ativo ? "Disponível para ofertas" : "Indisponível"}</Text>
            </View>
            <Switch value={item.ativo} onValueChange={(value) => toggle(item.id, value)} thumbColor="#facc15" />
            <PressableScale onPress={() => remover(item.id)}>
              <Ionicons name="trash-outline" size={20} color="#f87171" />
            </PressableScale>
          </View>
        )}
      />

      <Text style={styles.tip}>Dica: mantenha janelas sem conflito para melhorar sua taxa de aceite.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020617" },
  heroCard: {
    backgroundColor: "#081121",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#26466f",
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -14,
    right: -10,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#facc1514",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: "#facc15",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  title: { color: "#f8fafc", fontSize: 24, fontWeight: "900" },
  heroText: { color: "#94a3b8", fontSize: 13, lineHeight: 20 },
  heroMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  heroMetaText: { color: "#e2e8f0", fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 18,
    padding: 12,
  },
  statLabel: { color: "#94a3b8", fontSize: 12 },
  statValue: { color: "#facc15", fontWeight: "900", fontSize: 22, marginTop: 6 },
  boardCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionHint: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
  },
  weekGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weekDayCard: {
    flexBasis: "23%",
    flexGrow: 1,
    minWidth: 72,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  weekDayCardActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  weekDayLabel: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  weekDayLabelActive: {
    color: "#0B0F1A",
  },
  weekDayValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 6,
  },
  weekDayValueActive: {
    color: "#0B0F1A",
  },
  weekDayMeta: {
    color: "#94a3b8",
    fontSize: 10,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
  },
  dayChipRow: { gap: 8, marginBottom: 10 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#0c172d",
    borderWidth: 1,
    borderColor: "#304767",
  },
  dayChipActive: {
    backgroundColor: "#facc15",
    borderColor: "#facc15",
  },
  dayChipText: { color: "#cbd5e1", fontSize: 12, fontWeight: "800" },
  dayChipTextActive: { color: "#0B0F1A" },
  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#304767",
    borderRadius: 16,
    color: "#e5e7eb",
    padding: 11,
    marginBottom: 9,
  },
  primaryBtn: { backgroundColor: "#facc15", borderRadius: 16, alignItems: "center", paddingVertical: 12 },
  primaryText: { color: "#000", fontWeight: "900" },
  boardText: {
    color: "#94a3b8",
    lineHeight: 20,
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: "#081121",
    borderWidth: 1,
    borderColor: "#26466f",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slotBadge: {
    minWidth: 44,
    backgroundColor: "#facc15",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  slotBadgeText: { color: "#0B0F1A", fontWeight: "900", fontSize: 11 },
  itemTitle: { color: "#e5e7eb", fontWeight: "800", fontSize: 15 },
  itemMeta: { color: "#94a3b8", marginTop: 4 },
  empty: { color: "#6b7280", textAlign: "center", marginTop: 20 },
  tip: { color: "#64748b", marginTop: 8, textAlign: "center" },
});

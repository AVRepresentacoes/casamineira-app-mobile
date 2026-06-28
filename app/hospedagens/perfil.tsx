import {
  calcularResumoJornada,
  formatMoney,
  listarMinhasReservasHospedagem,
  type CaminhoHospedagemReservaCliente,
} from "@/lib/caminhosHospedagens";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PROFILE_CACHE_KEY = "@hospedagens_cliente_profile_v1";

type ClienteProfile = {
  nomeCompleto: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  whatsapp: string;
  cidade: string;
  estado: string;
  documento: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  tipoJornada: string;
  restricoes: string;
  observacoesMedicas: string;
};

const EMPTY_PROFILE: ClienteProfile = {
  nomeCompleto: "",
  cpf: "",
  nascimento: "",
  telefone: "",
  whatsapp: "",
  cidade: "",
  estado: "",
  documento: "",
  contatoEmergenciaNome: "",
  contatoEmergenciaTelefone: "",
  tipoJornada: "A pé",
  restricoes: "",
  observacoesMedicas: "",
};

const REQUIRED_FIELDS: Array<keyof ClienteProfile> = [
  "nomeCompleto",
  "cpf",
  "nascimento",
  "telefone",
  "cidade",
  "estado",
  "contatoEmergenciaNome",
  "contatoEmergenciaTelefone",
];

export default function HospedagensPerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ClienteProfile>(EMPTY_PROFILE);
  const [reservas, setReservas] = useState<CaminhoHospedagemReservaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const resumo = calcularResumoJornada(reservas);

  const completion = useMemo(() => {
    const filled = REQUIRED_FIELDS.filter((key) => profile[key].trim()).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function load() {
        setLoading(true);
        const [{ data: userData }, reservasData, cachedProfile] = await Promise.all([
          supabase.auth.getUser(),
          listarMinhasReservasHospedagem(),
          AsyncStorage.getItem(PROFILE_CACHE_KEY),
        ]);

        if (!mounted) return;
        setEmail(userData.user?.email || "");
        setReservas(reservasData);

        if (cachedProfile) {
          try {
            setProfile({ ...EMPTY_PROFILE, ...JSON.parse(cachedProfile) });
          } catch {
            setProfile(EMPTY_PROFILE);
          }
        }

        setLoading(false);
      }

      void load();
      return () => {
        mounted = false;
      };
    }, []),
  );

  function updateField(key: keyof ClienteProfile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveProfile() {
    try {
      setSaving(true);
      await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
      Alert.alert("Cadastro atualizado", "Suas informações foram salvas neste aparelho. A estrutura já está pronta para sincronizar com o banco.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar seus dados agora.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sair do app", "Deseja encerrar sua sessão?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#12372A" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Minha conta</Text>
          <Text style={styles.title}>Cadastro do cliente</Text>
        </View>
        <Pressable style={styles.logoutIcon} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FFF9EA" />
        </Pressable>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={28} color="#12372A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{profile.nomeCompleto.trim() || "Cliente peregrino"}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completion}%` }]} />
          </View>
          <Text style={styles.progressText}>{completion}% do cadastro preenchido</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#12372A" />
      ) : (
        <View style={styles.statsGrid}>
          <Metric icon="bed-outline" label="Hospedagens" value={String(resumo.reservas)} />
          <Metric icon="wallet-outline" label="Gasto total" value={formatMoney(resumo.totalReservado)} />
          <Metric icon="trail-sign-outline" label="Km planejados" value={`${Math.round(resumo.kmPercorridos)} km`} />
        </View>
      )}

      <FormSection title="Dados pessoais" icon="id-card-outline">
        <Field label="Nome completo" value={profile.nomeCompleto} onChangeText={(value) => updateField("nomeCompleto", value)} placeholder="Ex.: Maria Aparecida Silva" />
        <Field label="CPF" value={profile.cpf} onChangeText={(value) => updateField("cpf", value)} placeholder="000.000.000-00" keyboardType="number-pad" />
        <Field label="Data de nascimento" value={profile.nascimento} onChangeText={(value) => updateField("nascimento", value)} placeholder="DD/MM/AAAA" />
        <Field label="Documento/RG" value={profile.documento} onChangeText={(value) => updateField("documento", value)} placeholder="RG ou documento com foto" />
      </FormSection>

      <FormSection title="Contato e origem" icon="call-outline">
        <Field label="Telefone" value={profile.telefone} onChangeText={(value) => updateField("telefone", value)} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <Field label="WhatsApp" value={profile.whatsapp} onChangeText={(value) => updateField("whatsapp", value)} placeholder="Pode ser o mesmo telefone" keyboardType="phone-pad" />
        <View style={styles.rowFields}>
          <View style={{ flex: 1 }}>
            <Field label="Cidade" value={profile.cidade} onChangeText={(value) => updateField("cidade", value)} placeholder="Sua cidade" />
          </View>
          <View style={{ width: 84 }}>
            <Field label="UF" value={profile.estado} onChangeText={(value) => updateField("estado", value.toUpperCase().slice(0, 2))} placeholder="MG" autoCapitalize="characters" />
          </View>
        </View>
      </FormSection>

      <FormSection title="Segurança na jornada" icon="shield-checkmark-outline">
        <Field label="Contato de emergência" value={profile.contatoEmergenciaNome} onChangeText={(value) => updateField("contatoEmergenciaNome", value)} placeholder="Nome de alguém de confiança" />
        <Field label="Telefone de emergência" value={profile.contatoEmergenciaTelefone} onChangeText={(value) => updateField("contatoEmergenciaTelefone", value)} placeholder="(00) 00000-0000" keyboardType="phone-pad" />
        <Field label="Restrições alimentares" value={profile.restricoes} onChangeText={(value) => updateField("restricoes", value)} placeholder="Ex.: sem lactose, vegetariano..." />
        <Field label="Observações médicas" value={profile.observacoesMedicas} onChangeText={(value) => updateField("observacoesMedicas", value)} placeholder="Alergias, remédios, cuidados importantes" multiline />
      </FormSection>

      <FormSection title="Preferências da peregrinação" icon="footsteps-outline">
        <Text style={styles.fieldLabel}>Tipo de jornada</Text>
        <View style={styles.segment}>
          {["A pé", "Bike", "Grupo"].map((option) => {
            const active = profile.tipoJornada === option;
            return (
              <Pressable key={option} style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={() => updateField("tipoJornada", option)}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </FormSection>

      <Pressable style={[styles.saveButton, saving && styles.disabled]} onPress={handleSaveProfile} disabled={saving}>
        {saving ? <ActivityIndicator color="#12372A" /> : <Text style={styles.saveButtonText}>Salvar cadastro</Text>}
      </Pressable>

      <View style={styles.menu}>
        <MenuItem icon="calendar-outline" label="Histórico de hospedagens" onPress={() => router.push("/hospedagens/minhas")} />
        <MenuItem icon="cash-outline" label="Controle de gastos" onPress={() => router.push("/hospedagens/gastos")} />
        <MenuItem icon="footsteps-outline" label="Km percorridos" onPress={() => router.push("/hospedagens/km")} />
        <MenuItem icon="map-outline" label="Favoritos e minha rota" onPress={() => router.push("/hospedagens/rota")} />
        <MenuItem icon="notifications-outline" label="Notificações" onPress={() => router.push("/hospedagens/notificacoes")} />
        <MenuItem icon="help-buoy-outline" label="Ajuda, suporte e ocorrências" onPress={() => router.push("/hospedagens/suporte")} />
        <MenuItem icon="information-circle-outline" label="Sobre o app" onPress={() => router.push("/hospedagens/sobre")} />
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={19} color="#7F1D1D" />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#D8A84F" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({
  label,
  multiline,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor="#8A7B61"
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={20} color="#D8A84F" />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#12372A" />
      <Text style={styles.menuText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#8A7B61" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  logoutIcon: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#12372A", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 25, fontWeight: "900" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#12372A", borderRadius: 8, padding: 16 },
  avatar: { width: 58, height: 58, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  profileName: { color: "#FFF9EA", fontSize: 18, fontWeight: "900" },
  profileEmail: { color: "#F7D58B", marginTop: 3 },
  progressTrack: { height: 8, backgroundColor: "rgba(255,249,234,0.18)", borderRadius: 8, overflow: "hidden", marginTop: 10 },
  progressFill: { height: "100%", backgroundColor: "#D8A84F", borderRadius: 8 },
  progressText: { color: "#FFF9EA", fontSize: 12, marginTop: 5, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 10 },
  metric: { flex: 1, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 12, gap: 4 },
  metricValue: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  metricLabel: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  formSection: { backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, padding: 14, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  field: { gap: 6 },
  fieldLabel: { color: "#315342", fontSize: 13, fontWeight: "900" },
  input: { minHeight: 48, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A", fontSize: 15 },
  textArea: { minHeight: 92, paddingTop: 12, textAlignVertical: "top" },
  rowFields: { flexDirection: "row", gap: 10 },
  segment: { flexDirection: "row", gap: 8 },
  segmentButton: { flex: 1, minHeight: 44, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", alignItems: "center", justifyContent: "center" },
  segmentButtonActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  segmentText: { color: "#315342", fontWeight: "900" },
  segmentTextActive: { color: "#FFF9EA" },
  saveButton: { minHeight: 54, borderRadius: 8, backgroundColor: "#D8A84F", alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#12372A", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  menu: { gap: 10 },
  menuItem: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFDF6", borderWidth: 1, borderColor: "#E5D9BD", borderRadius: 8, paddingHorizontal: 14 },
  menuText: { flex: 1, color: "#12372A", fontSize: 16, fontWeight: "900" },
  logoutButton: { minHeight: 54, borderRadius: 8, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FECACA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  logoutText: { color: "#7F1D1D", fontSize: 16, fontWeight: "900" },
});

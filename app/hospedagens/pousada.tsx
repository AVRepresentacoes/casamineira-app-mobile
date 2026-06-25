import {
  CAMINHOS_REGRAS_NEGOCIO,
  adicionarPainelPousadaQuarto,
  atualizarStatusReservaPainelPousada,
  atualizarPainelPousadaCadastro,
  atualizarPainelPousadaOperacao,
  atualizarPainelPousadaQuarto,
  atualizarPainelPousadaServico,
  atualizarPainelPousadaVisibilidade,
  buildPainelPousadaDisponibilidadeDemo,
  buildPainelPousadaReservasDemo,
  carregarPainelPousadaHospedagens,
  formatMoney,
  salvarPainelPousadaDisponibilidade,
  type CaminhoHospedagem,
  type CaminhoQuarto,
  type CaminhoServicoAdicional,
  type PainelPousadaDisponibilidade,
  type PainelPousadaReserva,
} from "@/lib/caminhosHospedagens";
import { logout } from "@/lib/auth";
import { uploadImageAsync } from "@/lib/uploadImage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  type StyleProp,
  Switch,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PanelTab = "dashboard" | "anuncio" | "reservas" | "quartos" | "calendario" | "financeiro" | "operacao";

const TABS: { key: PanelTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "dashboard", label: "Resumo", icon: "grid-outline" },
  { key: "anuncio", label: "Anúncio", icon: "home-outline" },
  { key: "reservas", label: "Reservas", icon: "calendar-outline" },
  { key: "quartos", label: "Quartos", icon: "bed-outline" },
  { key: "calendario", label: "Agenda", icon: "today-outline" },
  { key: "financeiro", label: "Financeiro", icon: "wallet-outline" },
  { key: "operacao", label: "Operação", icon: "settings-outline" },
];

function statusLabel(status: PainelPousadaReserva["status"]) {
  const map = {
    aguardando_pagamento: "Aguardando pagamento",
    confirmada: "Confirmada",
    checkin_hoje: "Check-in hoje",
    concluida: "Concluída",
    cancelada: "Cancelada",
  };
  return map[status];
}

function statusTone(status: PainelPousadaReserva["status"]) {
  if (status === "checkin_hoje") return "#0F6B4F";
  if (status === "confirmada") return "#12372A";
  if (status === "aguardando_pagamento") return "#A16207";
  if (status === "cancelada") return "#B91C1C";
  return "#4E7C59";
}

export default function PainelPousadaHospedagensScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<PanelTab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "demo">("demo");
  const [pousadaDbId, setPousadaDbId] = useState<string | null>(null);
  const [pousada, setPousada] = useState<CaminhoHospedagem | null>(null);
  const [reservas, setReservas] = useState<PainelPousadaReserva[]>([]);
  const [quartos, setQuartos] = useState<CaminhoQuarto[]>([]);
  const [servicos, setServicos] = useState<CaminhoServicoAdicional[]>([]);
  const [disponivel, setDisponivel] = useState(true);
  const [autoConfirmar, setAutoConfirmar] = useState(false);
  const [respostaRapida, setRespostaRapida] = useState("Olá! Sua reserva foi recebida. Vamos confirmar os detalhes da chegada e serviços adicionais.");
  const [gatewayStatus, setGatewayStatus] = useState("pendente");
  const [bloqueios, setBloqueios] = useState<PainelPousadaDisponibilidade[]>(buildPainelPousadaDisponibilidadeDemo());
  const [propertyForm, setPropertyForm] = useState({
    nome: "",
    cidade: "",
    uf: "MG",
    ramal: "",
    endereco: "",
    whatsapp: "",
    descricao: "",
  });
  const [newRoom, setNewRoom] = useState({
    nome: "",
    tipo: "privativo" as CaminhoQuarto["tipo"],
    capacidade: "2",
    diaria: "",
    descricao: "",
  });
  const [uploadingRoomId, setUploadingRoomId] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/(auth)/login");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        Alert.alert("Sair do painel?", "Para sair da área da pousada, use o botão de sair no topo da tela.", [
          { text: "Continuar no painel", style: "cancel" },
          { text: "Sair", style: "destructive", onPress: () => void handleLogout() },
        ]);
        return true;
      });

      return () => subscription.remove();
    }, [handleLogout]),
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    carregarPainelPousadaHospedagens()
      .then((data) => {
        if (!mounted) return;
        setSource(data.source);
        setPousadaDbId(data.pousadaDbId);
        setPousada(data.pousada);
        setPropertyForm({
          nome: data.pousada.nome,
          cidade: data.pousada.cidade,
          uf: data.pousada.uf,
          ramal: data.pousada.ramal,
          endereco: data.pousada.endereco,
          whatsapp: data.pousada.whatsapp,
          descricao: data.pousada.descricao,
        });
        setReservas(data.reservas);
        setQuartos(data.quartos);
        setServicos(data.servicos);
        setBloqueios(data.disponibilidade);
        setDisponivel(data.visivel);
        setAutoConfirmar(data.autoConfirmar);
        setRespostaRapida(data.respostaRapida);
        setGatewayStatus(data.gatewayStatus);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const reservasAtivas = reservas.filter((item) => !["cancelada"].includes(item.status));
    const gmv = reservasAtivas.reduce((sum, item) => sum + item.total + item.extras, 0);
    const sinais = reservasAtivas.reduce((sum, item) => sum + item.sinal, 0);
    const comissao = reservasAtivas.reduce((sum, item) => sum + item.comissao, 0);
    const repasse = reservasAtivas.reduce((sum, item) => sum + item.repasseInicial, 0);
    const chegada = reservasAtivas.reduce((sum, item) => sum + item.restanteNaChegada, 0);
    const pendentes = reservas.filter((item) => item.status === "aguardando_pagamento").length;
    return { reservas: reservasAtivas.length, gmv, sinais, comissao, repasse, chegada, pendentes };
  }, [reservas]);

  function updateRoomPrice(id: string, value: string) {
    const price = Number(value.replace(",", "."));
    setQuartos((current) => current.map((item) => (item.id === id ? { ...item, diaria: Number.isFinite(price) ? price : item.diaria } : item)));
    if (Number.isFinite(price)) void atualizarPainelPousadaQuarto(pousadaDbId, id, { diaria: price });
  }

  function updateRoomField(id: string, payload: Partial<CaminhoQuarto>) {
    setQuartos((current) => current.map((item) => (item.id === id ? { ...item, ...payload } : item)));
    void atualizarPainelPousadaQuarto(pousadaDbId, id, payload);
  }

  async function handleSaveProperty() {
    const next = {
      ...propertyForm,
      uf: propertyForm.uf.toUpperCase().slice(0, 2) as "MG" | "SP",
    };
    setPousada((current) => (current ? { ...current, ...next } : current));
    await atualizarPainelPousadaCadastro(pousadaDbId, next);
    Alert.alert("Anúncio atualizado", "As informações da pousada foram salvas.");
  }

  async function handleAddRoom() {
    const diaria = Number(newRoom.diaria.replace(",", "."));
    const capacidade = Number(newRoom.capacidade);
    if (!newRoom.nome.trim() || !Number.isFinite(diaria) || diaria <= 0 || !Number.isFinite(capacidade) || capacidade <= 0) {
      Alert.alert("Dados do quarto", "Informe nome, capacidade e diária válidos.");
      return;
    }

    const created = await adicionarPainelPousadaQuarto(pousadaDbId, {
      nome: newRoom.nome.trim(),
      tipo: newRoom.tipo,
      capacidade,
      diaria,
      descricao: newRoom.descricao.trim(),
      fotos: [],
    });

    const room: CaminhoQuarto =
      created || {
        id: `quarto-${Date.now()}`,
        nome: newRoom.nome.trim(),
        tipo: newRoom.tipo,
        capacidade,
        diaria,
        disponivel: true,
        descricao: newRoom.descricao.trim(),
        fotos: [],
      };

    setQuartos((current) => [room, ...current]);
    setNewRoom({ nome: "", tipo: "privativo", capacidade: "2", diaria: "", descricao: "" });
  }

  async function handleAddRoomPhoto(room: CaminhoQuarto) {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Autorize o acesso às fotos para enviar imagens do quarto.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      setUploadingRoomId(room.id);
      let photoUrl = result.assets[0].uri;
      try {
        photoUrl = await uploadImageAsync(result.assets[0].uri);
      } catch (uploadError) {
        console.log("HOSPEDAGENS ROOM PHOTO UPLOAD FALLBACK:", uploadError);
      }

      const fotos = [...(room.fotos || []), photoUrl].slice(0, 8);
      updateRoomField(room.id, { fotos });
    } finally {
      setUploadingRoomId(null);
    }
  }

  function toggleRoom(id: string) {
    setQuartos((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = !item.disponivel;
        void atualizarPainelPousadaQuarto(pousadaDbId, id, { disponivel: next });
        return { ...item, disponivel: next };
      }),
    );
  }

  function updateServicePrice(id: string, value: string) {
    const price = Number(value.replace(",", "."));
    setServicos((current) => current.map((item) => (item.id === id ? { ...item, preco: Number.isFinite(price) ? price : item.preco } : item)));
    if (Number.isFinite(price)) void atualizarPainelPousadaServico(pousadaDbId, id, { preco: price });
  }

  async function confirmReservation(id: string) {
    setReservas((current) => current.map((item) => (item.id === id ? { ...item, status: "confirmada" } : item)));
    try {
      await atualizarStatusReservaPainelPousada(id, "confirmada");
      Alert.alert("Reserva confirmada", "A reserva foi marcada como confirmada no painel da pousada.");
    } catch (error: any) {
      Alert.alert("Atenção", error?.message || "Não foi possível salvar a confirmação no banco.");
    }
  }

  function cancelReservation(id: string) {
    Alert.alert("Cancelar reserva", "Ao cancelar, o cliente recebe o sinal conforme política e a pousada pode gerar saldo negativo operacional.", [
      { text: "Manter", style: "cancel" },
      {
        text: "Cancelar reserva",
        style: "destructive",
        onPress: async () => {
          setReservas((current) => current.map((item) => (item.id === id ? { ...item, status: "cancelada" } : item)));
          try {
            await atualizarStatusReservaPainelPousada(id, "cancelada_pousada", "Cancelada no painel da pousada");
          } catch (error: any) {
            Alert.alert("Atenção", error?.message || "Não foi possível salvar o cancelamento no banco.");
          }
        },
      },
    ]);
  }

  function toggleDay(index: number) {
    setBloqueios((current) =>
      current.map((item, i) =>
        i === index
          ? item.status === "bloqueado"
            ? persistDay({ ...item, status: "livre", detalhe: "Disponível para venda" })
            : persistDay({ ...item, status: "bloqueado", detalhe: "Bloqueio manual" })
          : item,
      ),
    );
  }

  function persistDay(item: PainelPousadaDisponibilidade) {
    void salvarPainelPousadaDisponibilidade(pousadaDbId, item.dia, item.status, item.detalhe);
    return item;
  }

  function handleSetDisponivel(value: boolean) {
    setDisponivel(value);
    void atualizarPainelPousadaVisibilidade(pousadaDbId, value);
  }

  function handleSetAutoConfirmar(value: boolean) {
    setAutoConfirmar(value);
    void atualizarPainelPousadaOperacao(pousadaDbId, { autoConfirmar: value });
  }

  function handleSetRespostaRapida(value: string) {
    setRespostaRapida(value);
    void atualizarPainelPousadaOperacao(pousadaDbId, { respostaRapida: value });
  }

  if (loading || !pousada) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#12372A" size="large" />
        <Text style={styles.loadingText}>Carregando painel da pousada...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <View style={styles.panelBadge}>
          <Ionicons name="business-outline" size={21} color="#12372A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Painel da pousada</Text>
          <Text style={styles.title}>{pousada.nome}</Text>
          <Text style={styles.subtitle}>{pousada.cidade} - {pousada.uf} • {pousada.ramal}</Text>
        </View>
        <Pressable style={styles.adminButton} onPress={() => router.push("/hospedagens/admin")}>
          <Ionicons name="shield-checkmark-outline" size={19} color="#12372A" />
        </Pressable>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF9EA" />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroLabel}>Operação ativa</Text>
          <Text style={styles.heroTitle}>{disponivel ? "Sua pousada está visível para reservas" : "Sua pousada está pausada"}</Text>
          <Text style={styles.heroText}>Acompanhe reservas, disponibilidade, repasses, serviços extras e pendências comerciais em um só lugar.</Text>
        </View>
        <Switch value={disponivel} onValueChange={handleSetDisponivel} trackColor={{ false: "#8A7B61", true: "#F7D58B" }} thumbColor={disponivel ? "#12372A" : "#F7F0DF"} />
      </View>

      <View style={styles.sourceNotice}>
        <Ionicons name={source === "supabase" ? "cloud-done-outline" : "flask-outline"} size={17} color="#12372A" />
        <Text style={styles.sourceNoticeText}>
          {source === "supabase" ? "Painel conectado ao Supabase." : "Modo demonstração ativo até aplicar as migrations do painel."}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((item) => (
          <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => setTab(item.key)}>
            <Ionicons name={item.icon} size={17} color={tab === item.key ? "#F7D58B" : "#12372A"} />
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.scrollHint}>
        <Text style={styles.scrollHintText}>Deslize as abas para ver todo o painel</Text>
        <Ionicons name="chevron-forward" size={15} color="#4E7C59" />
      </View>

      {tab === "dashboard" ? (
        <DashboardTab
          metrics={metrics}
          reservas={reservas}
          quartos={quartos}
          onOpenAnuncio={() => setTab("anuncio")}
          onOpenQuartos={() => setTab("quartos")}
        />
      ) : null}
      {tab === "anuncio" ? (
        <AnuncioTab form={propertyForm} setForm={setPropertyForm} onSave={handleSaveProperty} />
      ) : null}
      {tab === "reservas" ? <ReservasTab reservas={reservas} onConfirm={confirmReservation} onCancel={cancelReservation} /> : null}
      {tab === "quartos" ? (
        <QuartosTab
          quartos={quartos}
          servicos={servicos}
          newRoom={newRoom}
          setNewRoom={setNewRoom}
          uploadingRoomId={uploadingRoomId}
          onAddRoom={handleAddRoom}
          onAddRoomPhoto={handleAddRoomPhoto}
          onToggleRoom={toggleRoom}
          onUpdateRoomField={updateRoomField}
          onUpdateRoomPrice={updateRoomPrice}
          onUpdateServicePrice={updateServicePrice}
        />
      ) : null}
      {tab === "calendario" ? <CalendarioTab bloqueios={bloqueios} onToggleDay={toggleDay} /> : null}
      {tab === "financeiro" ? <FinanceiroTab metrics={metrics} reservas={reservas} /> : null}
      {tab === "operacao" ? (
        <OperacaoTab
          autoConfirmar={autoConfirmar}
          setAutoConfirmar={handleSetAutoConfirmar}
          respostaRapida={respostaRapida}
          setRespostaRapida={handleSetRespostaRapida}
          gatewayStatus={gatewayStatus}
          pousadaDbId={pousadaDbId}
        />
      ) : null}
    </ScrollView>
  );
}

function DashboardTab({
  metrics,
  reservas,
  quartos,
  onOpenAnuncio,
  onOpenQuartos,
}: {
  metrics: any;
  reservas: PainelPousadaReserva[];
  quartos: CaminhoQuarto[];
  onOpenAnuncio: () => void;
  onOpenQuartos: () => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.kpiGrid}>
        <Kpi label="Reservas ativas" value={String(metrics.reservas)} icon="calendar-outline" />
        <Kpi label="GMV previsto" value={formatMoney(metrics.gmv)} icon="trending-up-outline" />
        <Kpi label="Repasse inicial" value={formatMoney(metrics.repasse)} icon="wallet-outline" />
        <Kpi label="Pendente sinal" value={String(metrics.pendentes)} icon="time-outline" />
      </View>

      <View style={styles.card}>
        <SectionTitle title="Central do anúncio" icon="storefront-outline" />
        <Text style={styles.sectionHint}>Atualize as informações da pousada, tipos de quarto, fotos, preços e serviços vendidos no app.</Text>
        <Pressable style={styles.primaryFullButton} onPress={onOpenAnuncio}>
          <Ionicons name="create-outline" size={18} color="#12372A" />
          <Text style={styles.primaryFullButtonText}>Editar informações da pousada</Text>
        </Pressable>
        <Pressable style={styles.outlineFullButton} onPress={onOpenQuartos}>
          <Ionicons name="images-outline" size={18} color="#12372A" />
          <Text style={styles.outlineFullButtonText}>Gerenciar quartos, fotos e preços</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Próximas ações" icon="flash-outline" />
        <ActionItem title="Confirmar check-in de hoje" description="1 cliente com chegada prevista para hoje." tone="#0F6B4F" />
        <ActionItem title="Revisar reserva aguardando sinal" description="Grupo Caminhar ainda não concluiu pagamento." tone="#A16207" />
        <ActionItem title="Atualizar disponibilidade" description={`${quartos.filter((item) => item.disponivel).length}/${quartos.length} quartos disponíveis.`} tone="#12372A" />
      </View>

      <View style={styles.card}>
        <SectionTitle title="Últimas reservas" icon="receipt-outline" />
        {reservas.slice(0, 3).map((item) => (
          <CompactReservation key={item.id} reserva={item} />
        ))}
      </View>
    </View>
  );
}

function ReservasTab({ reservas, onConfirm, onCancel }: { reservas: PainelPousadaReserva[]; onConfirm: (id: string) => void; onCancel: (id: string) => void }) {
  return (
    <View style={styles.stack}>
      {reservas.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.cliente}</Text>
              <Text style={styles.cardMeta}>{item.quarto} • {item.hospedes} hóspede(s)</Text>
            </View>
            <Badge label={statusLabel(item.status)} color={statusTone(item.status)} />
          </View>
          <InfoRow label="Check-in" value={item.checkin} />
          <InfoRow label="Check-out" value={item.checkout} />
          <InfoRow label="Sinal no app" value={formatMoney(item.sinal)} />
          <InfoRow label="A receber na chegada" value={formatMoney(item.restanteNaChegada)} />
          <Text style={styles.note}>{item.observacao}</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => Alert.alert("WhatsApp", `Contato do cliente: ${item.telefone}`)}>
              <Ionicons name="logo-whatsapp" size={16} color="#12372A" />
              <Text style={styles.secondaryButtonText}>Contato</Text>
            </Pressable>
            <Pressable style={styles.primaryMiniButton} onPress={() => onConfirm(item.id)}>
              <Text style={styles.primaryMiniButtonText}>Confirmar</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} onPress={() => onCancel(item.id)}>
              <Text style={styles.dangerButtonText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function AnuncioTab({
  form,
  setForm,
  onSave,
}: {
  form: {
    nome: string;
    cidade: string;
    uf: string;
    ramal: string;
    endereco: string;
    whatsapp: string;
    descricao: string;
  };
  setForm: Dispatch<SetStateAction<any>>;
  onSave: () => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle title="Informações do anúncio" icon="home-outline" />
        <Text style={styles.sectionHint}>Esses dados aparecem para o peregrino antes da reserva.</Text>
        <Field label="Nome comercial" value={form.nome} onChangeText={(value) => setForm((current: any) => ({ ...current, nome: value }))} placeholder="Nome da pousada" />
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Field label="Cidade" value={form.cidade} onChangeText={(value) => setForm((current: any) => ({ ...current, cidade: value }))} placeholder="Cidade" />
          </View>
          <View style={{ width: 82 }}>
            <Field label="UF" value={form.uf} onChangeText={(value) => setForm((current: any) => ({ ...current, uf: value.toUpperCase().slice(0, 2) }))} placeholder="MG" />
          </View>
        </View>
        <Field label="Ramal / trecho" value={form.ramal} onChangeText={(value) => setForm((current: any) => ({ ...current, ramal: value }))} placeholder="Ex.: Ramal Águas da Prata" />
        <Field label="Endereço" value={form.endereco} onChangeText={(value) => setForm((current: any) => ({ ...current, endereco: value }))} placeholder="Rua, número, bairro" />
        <Field label="WhatsApp comercial" value={form.whatsapp} onChangeText={(value) => setForm((current: any) => ({ ...current, whatsapp: value }))} placeholder="+55..." keyboardType="phone-pad" />
        <Field label="Descrição para venda" value={form.descricao} onChangeText={(value) => setForm((current: any) => ({ ...current, descricao: value }))} placeholder="Conte o que torna a hospedagem boa para o peregrino" multiline />
        <Pressable style={styles.primaryFullButton} onPress={onSave}>
          <Ionicons name="save-outline" size={17} color="#12372A" />
          <Text style={styles.primaryFullButtonText}>Salvar informações do anúncio</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Qualidade do anúncio" icon="sparkles-outline" />
        <Checklist label="Nome e endereço claros" done={Boolean(form.nome && form.endereco)} />
        <Checklist label="Descrição orientada ao peregrino" done={form.descricao.length > 60} />
        <Checklist label="WhatsApp comercial informado" done={Boolean(form.whatsapp)} />
        <Checklist label="Quartos com fotos reais" done={false} />
      </View>
    </View>
  );
}

function QuartosTab({
  quartos,
  servicos,
  newRoom,
  setNewRoom,
  uploadingRoomId,
  onAddRoom,
  onAddRoomPhoto,
  onToggleRoom,
  onUpdateRoomField,
  onUpdateRoomPrice,
  onUpdateServicePrice,
}: {
  quartos: CaminhoQuarto[];
  servicos: CaminhoServicoAdicional[];
  newRoom: { nome: string; tipo: CaminhoQuarto["tipo"]; capacidade: string; diaria: string; descricao: string };
  setNewRoom: Dispatch<SetStateAction<any>>;
  uploadingRoomId: string | null;
  onAddRoom: () => void;
  onAddRoomPhoto: (room: CaminhoQuarto) => void;
  onToggleRoom: (id: string) => void;
  onUpdateRoomField: (id: string, payload: Partial<CaminhoQuarto>) => void;
  onUpdateRoomPrice: (id: string, value: string) => void;
  onUpdateServicePrice: (id: string, value: string) => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle title="Criar novo quarto" icon="add-circle-outline" />
        <Field label="Nome do quarto" value={newRoom.nome} onChangeText={(value) => setNewRoom((current: any) => ({ ...current, nome: value }))} placeholder="Ex.: Suíte casal com banheiro" />
        <View style={styles.roomTypeGrid}>
          {(["privativo", "compartilhado", "casal", "familia"] as CaminhoQuarto["tipo"][]).map((tipo) => (
            <Pressable key={tipo} style={[styles.roomTypeButton, newRoom.tipo === tipo && styles.roomTypeButtonActive]} onPress={() => setNewRoom((current: any) => ({ ...current, tipo }))}>
              <Text style={[styles.roomTypeText, newRoom.tipo === tipo && styles.roomTypeTextActive]}>{tipo}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.formRow}>
          <View style={{ flex: 1 }}>
            <Field label="Capacidade" value={newRoom.capacidade} onChangeText={(value) => setNewRoom((current: any) => ({ ...current, capacidade: value }))} placeholder="2" keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Diária" value={newRoom.diaria} onChangeText={(value) => setNewRoom((current: any) => ({ ...current, diaria: value }))} placeholder="140" keyboardType="numeric" />
          </View>
        </View>
        <Field label="Descrição do quarto" value={newRoom.descricao} onChangeText={(value) => setNewRoom((current: any) => ({ ...current, descricao: value }))} placeholder="Banheiro, ventilador, roupa de cama, vista, acessibilidade..." multiline />
        <Pressable style={styles.primaryFullButton} onPress={onAddRoom}>
          <Ionicons name="add-outline" size={18} color="#12372A" />
          <Text style={styles.primaryFullButtonText}>Adicionar quarto</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Quartos publicados" icon="bed-outline" />
        {quartos.map((item) => (
          <View key={item.id} style={styles.roomEditor}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.nome}</Text>
                <Text style={styles.cardMeta}>{item.capacidade} hóspede(s) • {item.tipo}</Text>
              </View>
              <Switch value={item.disponivel} onValueChange={() => onToggleRoom(item.id)} />
            </View>

            <Field label="Nome" value={item.nome} onChangeText={(value) => onUpdateRoomField(item.id, { nome: value })} placeholder="Nome do quarto" />
            <View style={styles.roomTypeGrid}>
              {(["privativo", "compartilhado", "casal", "familia"] as CaminhoQuarto["tipo"][]).map((tipo) => (
                <Pressable key={tipo} style={[styles.roomTypeButton, item.tipo === tipo && styles.roomTypeButtonActive]} onPress={() => onUpdateRoomField(item.id, { tipo })}>
                  <Text style={[styles.roomTypeText, item.tipo === tipo && styles.roomTypeTextActive]}>{tipo}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Field label="Capacidade" value={String(item.capacidade)} onChangeText={(value) => onUpdateRoomField(item.id, { capacidade: Number(value) || item.capacidade })} placeholder="2" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Diária" value={String(item.diaria)} onChangeText={(value) => onUpdateRoomPrice(item.id, value)} placeholder="140" keyboardType="numeric" />
              </View>
            </View>
            <Field label="Descrição" value={item.descricao || ""} onChangeText={(value) => onUpdateRoomField(item.id, { descricao: value })} placeholder="Detalhes úteis para decisão do hóspede" multiline />
            <View style={styles.photoStrip}>
              {(item.fotos || []).map((foto) => (
                <Image key={foto} source={{ uri: foto }} style={styles.roomPhoto} />
              ))}
              <Pressable style={styles.addPhotoButton} onPress={() => onAddRoomPhoto(item)} disabled={uploadingRoomId === item.id}>
                {uploadingRoomId === item.id ? <ActivityIndicator color="#12372A" /> : <Ionicons name="camera-outline" size={22} color="#12372A" />}
                <Text style={styles.addPhotoText}>{uploadingRoomId === item.id ? "Enviando" : "Foto"}</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <SectionTitle title="Serviços adicionais" icon="restaurant-outline" />
        {servicos.map((item) => (
          <View key={item.id} style={styles.editRow}>
            <View style={styles.serviceIcon}>
              <Ionicons name={item.icon} size={18} color="#12372A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitleSmall}>{item.nome}</Text>
              <Text style={styles.cardMeta}>{item.unidade} • {item.confirmacao}</Text>
            </View>
            <TextInput style={styles.priceInput} defaultValue={String(item.preco)} keyboardType="numeric" onEndEditing={(event) => onUpdateServicePrice(item.id, event.nativeEvent.text)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function CalendarioTab({ bloqueios, onToggleDay }: { bloqueios: PainelPousadaDisponibilidade[]; onToggleDay: (index: number) => void }) {
  return (
    <View style={styles.card}>
      <SectionTitle title="Calendário de disponibilidade" icon="today-outline" />
      <Text style={styles.sectionHint}>Toque em um dia para bloquear ou liberar manualmente.</Text>
      <View style={styles.calendarGrid}>
        {bloqueios.map((item, index) => (
          <Pressable key={item.dia} style={[styles.dayCard, styles[`day_${item.status}`]]} onPress={() => onToggleDay(index)}>
            <Text style={styles.dayDate}>{item.dia.slice(5)}</Text>
            <Text style={styles.dayStatus}>{item.status}</Text>
            <Text style={styles.dayDetail}>{item.detalhe}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function FinanceiroTab({ metrics, reservas }: { metrics: any; reservas: PainelPousadaReserva[] }) {
  const saldoNegativo = Number((reservas.filter((item) => item.status === "cancelada").reduce((sum, item) => sum + item.total, 0) * CAMINHOS_REGRAS_NEGOCIO.multaPousadaPercentual).toFixed(2));
  return (
    <View style={styles.stack}>
      <View style={styles.kpiGrid}>
        <Kpi label="Sinais recebidos" value={formatMoney(metrics.sinais)} icon="card-outline" />
        <Kpi label="Comissão app" value={formatMoney(metrics.comissao)} icon="pricetag-outline" />
        <Kpi label="A receber na pousada" value={formatMoney(metrics.chegada)} icon="cash-outline" />
        <Kpi label="Saldo negativo" value={formatMoney(saldoNegativo)} icon="alert-circle-outline" />
      </View>
      <View style={styles.card}>
        <SectionTitle title="Split e repasse" icon="swap-horizontal-outline" />
        <InfoRow label="Status da conta" value="Mercado Pago pendente de validação" />
        <InfoRow label="Comissão lançamento" value={`${Math.round(CAMINHOS_REGRAS_NEGOCIO.comissaoLancamentoPercentual * 100)}%`} />
        <InfoRow label="Comissão padrão futura" value={`${Math.round(CAMINHOS_REGRAS_NEGOCIO.comissaoPadraoPercentual * 100)}%`} />
        <InfoRow label="Próximo repasse previsto" value={formatMoney(metrics.repasse)} />
        <Text style={styles.note}>Quando o split real estiver ativo, a comissão será conciliada automaticamente e o repasse ficará visível por reserva.</Text>
      </View>
      <View style={styles.card}>
        <SectionTitle title="Extrato por reserva" icon="list-outline" />
        {reservas.map((item) => (
          <CompactReservation key={item.id} reserva={item} />
        ))}
      </View>
    </View>
  );
}

function OperacaoTab({
  autoConfirmar,
  setAutoConfirmar,
  respostaRapida,
  setRespostaRapida,
  gatewayStatus,
  pousadaDbId,
}: {
  autoConfirmar: boolean;
  setAutoConfirmar: (value: boolean) => void;
  respostaRapida: string;
  setRespostaRapida: (value: string) => void;
  gatewayStatus: string;
  pousadaDbId: string | null;
}) {
  const router = useRouter();
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle title="Configurações da operação" icon="settings-outline" />
        <InfoRow label="Status do split" value={gatewayStatus === "ativa" ? "Conta validada" : "Pendente de validação"} />
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleSmall}>Auto-confirmar reservas pagas</Text>
            <Text style={styles.cardMeta}>Use apenas se calendário e quartos estiverem sempre atualizados.</Text>
          </View>
          <Switch value={autoConfirmar} onValueChange={setAutoConfirmar} />
        </View>
        <Text style={styles.fieldLabel}>Resposta rápida para clientes</Text>
        <TextInput style={styles.textArea} multiline value={respostaRapida} onChangeText={setRespostaRapida} placeholderTextColor="#8A7B61" />
        <Pressable
          style={styles.primaryFullButton}
          onPress={() =>
            router.push({
              pathname: "/hospedagens/suporte-pousada",
              params: { pousadaId: pousadaDbId || "" },
            })
          }
        >
          <Ionicons name="help-buoy-outline" size={18} color="#12372A" />
          <Text style={styles.primaryFullButtonText}>Abrir suporte da pousada</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <SectionTitle title="Checklist de qualidade" icon="shield-checkmark-outline" />
        <Checklist label="Fotos dos quartos atualizadas" done />
        <Checklist label="Preços revisados para feriados" done={false} />
        <Checklist label="Horário de check-in informado" done />
        <Checklist label="Conta de split validada" done={false} />
        <Checklist label="Políticas do parceiro aceitas" done />
      </View>

      <View style={styles.card}>
        <SectionTitle title="Políticas importantes" icon="document-text-outline" />
        <Text style={styles.note}>Cancelamento ou descumprimento pela pousada gera reembolso integral ao cliente e saldo negativo operacional de 10% sobre o total da reserva.</Text>
        <Text style={styles.note}>Mantenha disponibilidade, preços e serviços atualizados para evitar conflitos e preservar a reputação da pousada.</Text>
      </View>
    </View>
  );
}

function Kpi({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.kpi}>
      <Ionicons name={icon} size={19} color="#F7D58B" />
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={20} color="#12372A" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function CompactReservation({ reserva }: { reserva: PainelPousadaReserva }) {
  return (
    <View style={styles.compact}>
      <View style={{ flex: 1 }}>
        <Text style={styles.compactTitle}>{reserva.cliente}</Text>
        <Text style={styles.cardMeta}>{reserva.checkin} • {reserva.quarto}</Text>
      </View>
      <Text style={styles.compactValue}>{formatMoney(reserva.total + reserva.extras)}</Text>
    </View>
  );
}

function ActionItem({ title, description, tone }: { title: string; description: string; tone: string }) {
  return (
    <View style={styles.actionItem}>
      <View style={[styles.actionDot, { backgroundColor: tone }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitleSmall}>{title}</Text>
        <Text style={styles.cardMeta}>{description}</Text>
      </View>
    </View>
  );
}

function Checklist({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.checkItem}>
      <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={20} color={done ? "#0F6B4F" : "#A16207"} />
      <Text style={styles.checkText}>{label}</Text>
    </View>
  );
}

function Field({
  label,
  multiline,
  style,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "phone-pad";
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, style]}>
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F7F0DF" },
  content: { padding: 16, gap: 16, paddingBottom: 36 },
  center: { flex: 1, backgroundColor: "#F7F0DF", alignItems: "center", justifyContent: "center", padding: 20, gap: 12 },
  loadingText: { color: "#12372A", fontWeight: "900" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  panelBadge: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  backButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5D9BD" },
  adminButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#D9A441" },
  logoutButton: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#12372A", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#4E7C59", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  title: { color: "#12372A", fontSize: 23, fontWeight: "900" },
  subtitle: { color: "#6B7280", fontWeight: "700", marginTop: 2 },
  hero: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#12372A", borderRadius: 8, padding: 16 },
  heroLabel: { color: "#F7D58B", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  heroTitle: { color: "#FFF9EA", fontSize: 20, lineHeight: 26, fontWeight: "900", marginTop: 5 },
  heroText: { color: "#E5D9BD", lineHeight: 20, marginTop: 5 },
  sourceNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF9EA", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 12 },
  sourceNoticeText: { color: "#12372A", fontWeight: "800", flex: 1, lineHeight: 19 },
  tabs: { gap: 8, paddingRight: 16 },
  scrollHint: { marginTop: -10, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3 },
  scrollHintText: { color: "#4E7C59", fontSize: 12, fontWeight: "800" },
  tab: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12 },
  tabActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  tabText: { color: "#12372A", fontWeight: "900" },
  tabTextActive: { color: "#F7D58B" },
  stack: { gap: 14 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "48.5%", minHeight: 112, backgroundColor: "#12372A", borderRadius: 8, padding: 14, gap: 6 },
  kpiValue: { color: "#FFF9EA", fontSize: 20, fontWeight: "900" },
  kpiLabel: { color: "#E5D9BD", fontSize: 12, fontWeight: "800" },
  card: { backgroundColor: "#FFFDF6", borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", padding: 14, gap: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: "#12372A", fontSize: 18, fontWeight: "900", flex: 1 },
  sectionHint: { color: "#6B7280", lineHeight: 19 },
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cardTitle: { color: "#12372A", fontSize: 17, fontWeight: "900" },
  cardTitleSmall: { color: "#12372A", fontSize: 15, fontWeight: "900" },
  cardMeta: { color: "#6B7280", lineHeight: 19, marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6 },
  badgeText: { color: "#FFF9EA", fontSize: 11, fontWeight: "900" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  infoLabel: { color: "#6B7280", flex: 1 },
  infoValue: { color: "#12372A", fontWeight: "900", textAlign: "right" },
  note: { color: "#4B5563", lineHeight: 20, backgroundColor: "#F7F0DF", borderRadius: 8, padding: 10 },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  secondaryButton: { minHeight: 40, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 10 },
  secondaryButtonText: { color: "#12372A", fontWeight: "900" },
  primaryMiniButton: { minHeight: 40, borderRadius: 8, backgroundColor: "#0F6B4F", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  primaryMiniButtonText: { color: "#FFF9EA", fontWeight: "900" },
  dangerButton: { minHeight: 40, borderRadius: 8, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  dangerButtonText: { color: "#991B1B", fontWeight: "900" },
  editRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  priceInput: { width: 76, minHeight: 42, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", color: "#12372A", fontWeight: "900", textAlign: "center" },
  serviceIcon: { width: 38, height: 38, borderRadius: 8, backgroundColor: "#F7D58B", alignItems: "center", justifyContent: "center" },
  formRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  field: { gap: 7 },
  input: { minHeight: 46, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", paddingHorizontal: 12, color: "#12372A", fontWeight: "800" },
  primaryFullButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#F7D58B", borderWidth: 1, borderColor: "#D9A441", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14 },
  primaryFullButtonText: { color: "#12372A", fontWeight: "900" },
  outlineFullButton: { minHeight: 48, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#D9A441", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 14 },
  outlineFullButtonText: { color: "#12372A", fontWeight: "900" },
  roomTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  roomTypeButton: { minHeight: 38, borderRadius: 8, borderWidth: 1, borderColor: "#E5D9BD", backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  roomTypeButtonActive: { backgroundColor: "#12372A", borderColor: "#12372A" },
  roomTypeText: { color: "#12372A", fontWeight: "900", textTransform: "capitalize" },
  roomTypeTextActive: { color: "#F7D58B" },
  roomEditor: { borderTopWidth: 1, borderTopColor: "#E5D9BD", paddingTop: 12, gap: 11 },
  photoStrip: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roomPhoto: { width: 92, height: 72, borderRadius: 8, backgroundColor: "#E5D9BD" },
  addPhotoButton: { width: 92, height: 72, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: "#D9A441", backgroundColor: "#FFF9EA", alignItems: "center", justifyContent: "center", gap: 4 },
  addPhotoText: { color: "#12372A", fontSize: 12, fontWeight: "900" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dayCard: { width: "48.5%", minHeight: 112, borderRadius: 8, borderWidth: 1, padding: 12, gap: 5 },
  day_livre: { backgroundColor: "#ECFDF3", borderColor: "#BBF7D0" },
  day_ocupado: { backgroundColor: "#FFF9EA", borderColor: "#F7D58B" },
  day_bloqueado: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  day_manutencao: { backgroundColor: "#E0F2FE", borderColor: "#7DD3FC" },
  dayDate: { color: "#12372A", fontSize: 18, fontWeight: "900" },
  dayStatus: { color: "#4E7C59", fontSize: 12, textTransform: "uppercase", fontWeight: "900" },
  dayDetail: { color: "#4B5563", lineHeight: 18, fontSize: 12 },
  compact: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#E5D9BD", paddingTop: 10 },
  compactTitle: { color: "#12372A", fontWeight: "900" },
  compactValue: { color: "#12372A", fontWeight: "900" },
  actionItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  actionDot: { width: 9, height: 9, borderRadius: 5, marginTop: 6 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fieldLabel: { color: "#315342", fontSize: 13, fontWeight: "900" },
  textArea: { minHeight: 100, borderRadius: 8, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#E5D9BD", padding: 12, color: "#12372A", textAlignVertical: "top" },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 9 },
  checkText: { color: "#12372A", fontWeight: "800", flex: 1 },
});

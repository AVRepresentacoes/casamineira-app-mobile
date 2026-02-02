import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Wallet = {
  id: string;
  user_id: string;
  saldo: number;
  bloqueado: number;
  created_at?: string | null;
  updated_at?: string | null;
};

function money(v: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

export default function CarteiraProfissional() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [pixKey, setPixKey] = useState("");
  const [valorSaque, setValorSaque] = useState("");

  const [saving, setSaving] = useState(false);

  const saldoDisponivel = useMemo(() => {
    const s = wallet?.saldo || 0;
    const b = wallet?.bloqueado || 0;
    return Math.max(0, Number(s) - Number(b));
  }, [wallet]);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data: userRes, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;

      const user = userRes?.user;
      if (!user) {
        setWallet(null);
        return;
      }

      // Busca wallet
      const { data: w, error: wErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wErr) throw wErr;

      // Se não existe, cria
      if (!w) {
        const { data: newW, error: cErr } = await supabase
          .from("wallets")
          .insert({
            user_id: user.id,
            saldo: 0,
            bloqueado: 0,
          })
          .select()
          .single();

        if (cErr) throw cErr;

        setWallet(newW as any);
      } else {
        setWallet(w as any);
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao carregar carteira");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const solicitarSaque = async () => {
    if (!wallet) return;

    const v = Number(String(valorSaque).replace(",", "."));

    if (!pixKey.trim()) {
      Alert.alert("Atenção", "Informe sua chave PIX.");
      return;
    }

    if (!v || v <= 0) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }

    if (v > saldoDisponivel) {
      Alert.alert("Saldo insuficiente", "Você não tem saldo disponível para esse saque.");
      return;
    }

    setSaving(true);
    try {
      const novoBloqueado = (wallet.bloqueado || 0) + v;

      const { error: upErr } = await supabase
        .from("wallets")
        .update({ bloqueado: novoBloqueado })
        .eq("id", wallet.id);

      if (upErr) throw upErr;

      setPixKey("");
      setValorSaque("");

      Alert.alert("Saque solicitado ✅", "Seu saque entrou como PENDENTE (simulado).");
      await fetchWallet();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao solicitar saque");
    } finally {
      setSaving(false);
    }
  };

  const liberarSaqueSimulado = async () => {
    if (!wallet) return;

    if ((wallet.bloqueado || 0) <= 0) {
      Alert.alert("Info", "Não tem saque pendente.");
      return;
    }

    setSaving(true);
    try {
      const valor = Number(wallet.bloqueado || 0);
      const novoSaldo = Math.max(0, (wallet.saldo || 0) - valor);

      const { error } = await supabase
        .from("wallets")
        .update({ saldo: novoSaldo, bloqueado: 0 })
        .eq("id", wallet.id);

      if (error) throw error;

      Alert.alert("Saque pago ✅", "Agora seu saldo foi descontado e o pendente zerou.");
      await fetchWallet();
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha ao liberar saque");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#facc15" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Carteira</Text>
        <Text style={styles.sub}>Saldo, bloqueios e saque PIX</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumo</Text>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Saldo total</Text>
          <Text style={styles.value}>{money(wallet?.saldo || 0)}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Bloqueado</Text>
          <Text style={[styles.value, { color: "#f87171" }]}>
            {money(wallet?.bloqueado || 0)}
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.label}>Disponível</Text>
          <Text style={[styles.value, { color: "#34d399" }]}>
            {money(saldoDisponivel)}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Solicitar Saque PIX</Text>

        <Text style={styles.help}>Chave PIX</Text>
        <TextInput
          placeholder="CPF / CNPJ / e-mail / celular / aleatória"
          placeholderTextColor="#6b7280"
          value={pixKey}
          onChangeText={setPixKey}
          style={styles.input}
        />

        <Text style={[styles.help, { marginTop: 10 }]}>Valor</Text>
        <TextInput
          placeholder="Ex: 50,00"
          placeholderTextColor="#6b7280"
          value={valorSaque}
          onChangeText={setValorSaque}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={solicitarSaque}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryText}>Solicitar saque</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={liberarSaqueSimulado}
        >
          <Text style={styles.secondaryText}>TESTE: Liberar saque (simulado)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#03040a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#03040a" },

  header: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  title: { color: "#facc15", fontSize: 22, fontWeight: "900" },
  sub: { color: "#9ca3af", marginTop: 4 },

  card: {
    marginHorizontal: 16,
    backgroundColor: "#071026",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },

  cardTitle: { color: "#e6e7e9", fontWeight: "900", fontSize: 16 },

  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  label: { color: "#9ca3af", fontWeight: "700" },
  value: { color: "#facc15", fontWeight: "900", fontSize: 15 },

  help: { color: "#9ca3af", marginTop: 12, fontWeight: "700" },

  input: {
    backgroundColor: "#03040a",
    borderWidth: 1,
    borderColor: "#0b1220",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#e6e7e9",
    marginTop: 8,
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#facc15",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#000", fontWeight: "900" },

  secondaryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#374151",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#03040a",
  },
  secondaryText: { color: "#9ca3af", fontWeight: "800" },
});

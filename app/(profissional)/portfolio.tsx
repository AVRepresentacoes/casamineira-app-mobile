import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Portfolio = {
  id: string;
  titulo: string;
  descricao: string;
  imagem_url: string;
};

export default function PortfolioProfissional() {
  const [lista, setLista] = useState<Portfolio[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { data } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    setLista(data || []);
  };

  const salvar = async () => {
    if (!titulo || !imagemUrl) {
      Alert.alert("Erro", "Informe título e imagem");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return;

    const { error } = await supabase.from("portfolio").insert({
      user_id: auth.user.id,
      titulo,
      descricao,
      imagem_url: imagemUrl,
    });

    if (error) {
      Alert.alert("Erro", error.message);
      return;
    }

    setTitulo("");
    setDescricao("");
    setImagemUrl("");
    carregar();
  };

  const excluir = async (id: string) => {
    await supabase.from("portfolio").delete().eq("id", id);
    carregar();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Portfólio</Text>

      <View style={styles.card}>
        <TextInput
          placeholder="Título do trabalho"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
        />
        <TextInput
          placeholder="Descrição"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={descricao}
          onChangeText={setDescricao}
        />
        <TextInput
          placeholder="URL da imagem"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={imagemUrl}
          onChangeText={setImagemUrl}
        />

        <TouchableOpacity style={styles.btn} onPress={salvar}>
          <Text style={styles.btnText}>Adicionar ao Portfólio</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.imagem_url }} style={styles.image} />
            <Text style={styles.itemTitle}>{item.titulo}</Text>
            <Text style={styles.itemDesc}>{item.descricao}</Text>

            <TouchableOpacity onPress={() => excluir(item.id)}>
              <Text style={styles.delete}>Excluir</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#03040a",
    padding: 16,
  },
  title: {
    color: "#facc15",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#071026",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#03040a",
    borderRadius: 12,
    padding: 12,
    color: "#e5e7eb",
    borderWidth: 1,
    borderColor: "#0b1220",
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#facc15",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: {
    color: "#000",
    fontWeight: "900",
  },
  item: {
    backgroundColor: "#071026",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0b1220",
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#000",
  },
  itemTitle: {
    color: "#e5e7eb",
    fontWeight: "900",
  },
  itemDesc: {
    color: "#9ca3af",
    marginTop: 4,
  },
  delete: {
    color: "#f87171",
    fontWeight: "800",
    marginTop: 10,
  },
});

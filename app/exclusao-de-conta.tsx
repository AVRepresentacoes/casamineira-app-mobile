import { SiteShell } from "@/components/site/SiteShell";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

const deletionSteps = [
  "Entre no app Casa Mineira Serviços com sua conta.",
  "Acesse Perfil > Meus dados.",
  "Toque em Excluir minha conta.",
  "Escolha o motivo, confirme a solicitação e aguarde a confirmação no app.",
];

const deletedData = [
  "Dados de cadastro da conta, como nome, e-mail, telefone e preferências de perfil.",
  "Dados operacionais vinculados ao uso da conta, quando não houver obrigação legal de retenção.",
  "Sessões de autenticação e acesso ao aplicativo.",
];

const retainedData = [
  "Registros fiscais, financeiros, antifraude, segurança e auditoria podem ser mantidos pelo prazo exigido pela legislação aplicável.",
  "Históricos necessários para resolver disputas, chargebacks, cumprimento contratual ou obrigações regulatórias podem ser retidos enquanto forem necessários.",
  "Dados agregados ou anonimizados podem permanecer para métricas, segurança e melhoria do serviço.",
];

export default function ExclusaoDeContaPage() {
  const supportEmail = "privacidade@casamineira.app";

  return (
    <SiteShell>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Casa Mineira Serviços</Text>
        <Text style={styles.title}>Exclusão de conta e dados</Text>
        <Text style={styles.description}>
          Esta página explica como solicitar a exclusão da conta criada no app Casa Mineira Serviços
          e quais dados são excluídos ou podem ser mantidos por obrigação legal.
        </Text>
      </View>

      <View style={styles.grid}>
        <InfoCard title="Como solicitar pelo app" items={deletionSteps} />
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Solicitação por e-mail</Text>
          <Text style={styles.cardText}>
            Se você não conseguir acessar o app, envie uma solicitação para o nosso canal de privacidade
            informando o e-mail cadastrado na conta.
          </Text>
          <Pressable
            style={styles.mailButton}
            onPress={() =>
              Linking.openURL(
                `mailto:${supportEmail}?subject=Solicitacao%20de%20exclusao%20de%20conta%20-%20Casa%20Mineira%20Servicos`
              )
            }
          >
            <Text style={styles.mailButtonText}>{supportEmail}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        <InfoCard title="Dados excluídos" items={deletedData} />
        <InfoCard title="Dados que podem ser retidos" items={retainedData} />
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Prazo de atendimento</Text>
        <Text style={styles.noticeText}>
          Solicitações válidas são processadas em até 15 dias úteis, salvo quando for necessário
          manter informações por obrigação legal, segurança, prevenção a fraudes, auditoria ou defesa de direitos.
        </Text>
      </View>
    </SiteShell>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.itemRow}>
          <View style={styles.dot} />
          <Text style={styles.itemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.24)",
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    padding: 28,
    gap: 12,
  },
  eyebrow: {
    color: "#facc15",
    fontWeight: "900",
    fontSize: 13,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 38,
    fontWeight: "900",
  },
  description: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 900,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    flex: 1,
    minWidth: 300,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    padding: 20,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },
  cardText: {
    color: "#cbd5e1",
    lineHeight: 23,
  },
  itemRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#facc15",
    marginTop: 8,
  },
  itemText: {
    color: "#cbd5e1",
    flex: 1,
    lineHeight: 22,
  },
  mailButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#facc15",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  mailButtonText: {
    color: "#08101c",
    fontWeight: "900",
  },
  notice: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.26)",
    backgroundColor: "rgba(113, 63, 18, 0.18)",
    padding: 20,
  },
  noticeTitle: {
    color: "#fef3c7",
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 8,
  },
  noticeText: {
    color: "#fde68a",
    lineHeight: 23,
  },
});

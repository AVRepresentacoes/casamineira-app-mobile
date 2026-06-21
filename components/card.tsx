export function Card({ children }: any) {
  return <div style={styles.card}>{children}</div>;
}

const styles = {
  card: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
};

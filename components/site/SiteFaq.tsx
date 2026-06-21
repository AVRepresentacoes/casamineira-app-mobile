import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function SiteFaq({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <Pressable key={item.question} style={[styles.card, open ? styles.cardOpen : null]} onPress={() => setOpenIndex(open ? -1 : index)}>
            <Text style={styles.question}>{item.question}</Text>
            {open ? <Text style={styles.answer}>{item.answer}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(148, 163, 184, 0.14)",
    backgroundColor: "rgba(9, 15, 31, 0.82)",
    padding: 20,
    gap: 12,
  },
  cardOpen: {
    borderColor: "rgba(103, 232, 249, 0.26)",
  },
  question: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "900",
  },
  answer: {
    color: "#96aac7",
    lineHeight: 24,
  },
});

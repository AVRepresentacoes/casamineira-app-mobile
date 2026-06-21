import * as FileSystem from "expo-file-system/legacy";
import { Platform, Share } from "react-native";

function normalizeCell(value: unknown) {
  const text = String(value ?? "");
  return text.replace(/;/g, ",").replace(/\n/g, " ").trim();
}

export function buildCsv(headers: string[], rows: Array<Array<unknown>>) {
  const lines = [
    headers.join(";"),
    ...rows.map((row) => row.map(normalizeCell).join(";")),
  ];
  return lines.join("\n");
}

export async function exportCsvFile(fileName: string, csvContent: string) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir) {
    throw new Error("Diretório de arquivo não disponível no dispositivo.");
  }

  const fileUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Share.share({
    title: fileName,
    message: "Relatório CSV",
    url: fileUri,
  });
}


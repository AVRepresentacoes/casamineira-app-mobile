import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system";

export async function uploadImageAsync(uri: string) {
  try {
    // Converte imagem para base64
   const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: "base64",
});

    // Converte para Blob
    const file = decode(base64);

    const fileName = `${Date.now()}.jpg`;
    const path = `uploads/${fileName}`;

    // Upload para Supabase Storage
    const { error } = await supabase.storage
      .from("imagens")
      .upload(path, file, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;

    // Pega URL pública
    const { data } = supabase.storage
      .from("imagens")
      .getPublicUrl(path);

    return data.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    throw error;
  }
}

// Função auxiliar para converter base64 → Uint8Array
function decode(base64: string) {
  const binary = global.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

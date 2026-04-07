// src/hooks/useStorageSetup.js
// Hook para verificar se o bucket 'documents' existe no Supabase Storage
// NOTA: A criação do bucket deve ser feita manualmente no Dashboard

import { useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function useStorageSetup() {
  useEffect(() => {
    const checkStorage = async () => {
      try {
        console.log("🔧 Verificando storage setup...");

        // Apenas verificar se o bucket existe
        const { data: buckets, error: listError } =
          await supabase.storage.listBuckets();

        if (listError) {
          console.warn(
            "⚠️ Não foi possível verificar buckets:",
            listError.message,
          );
          return;
        }

        const documentsBucketExists = buckets?.some(
          (b) => b.name === "documents",
        );

        if (!documentsBucketExists) {
          console.warn(
            "⚠️ ATENÇÃO: Bucket 'documents' não encontrado!\n" +
              "Para criar o bucket manualmente:\n" +
              "1. Abra: https://supabase.com/dashboard\n" +
              "2. Vá em Storage > Buckets > Create new bucket\n" +
              "3. Nome: 'documents'\n" +
              "4. Privacy: Private\n" +
              "5. Clique em 'Create Bucket'",
          );
        } else {
          console.log("✅ Bucket 'documents' já existe");
        }
      } catch (error) {
        console.warn("⚠️ Erro durante storage check:", error.message);
      }
    };

    checkStorage();
  }, []);
}

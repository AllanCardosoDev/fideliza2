// Script para criar bucket "documents" no Supabase Storage
// Execute este código no console do navegador (F12) na página da aplicação

async function createDocumentsBucket() {
  console.log("🔧 Tentando criar/verificar bucket 'documents'...");

  try {
    // Importar o cliente Supabase
    const { supabase } = await import("./src/services/supabaseClient.js");

    // 1. Tentar listar buckets para verificar se existe
    console.log("📋 Listando buckets existentes...");
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("❌ Erro ao listar buckets:", listError);
      return false;
    }

    console.log(
      "📦 Buckets encontrados:",
      buckets.map((b) => b.name),
    );

    const bucketExists = buckets.some((b) => b.name === "documents");

    if (bucketExists) {
      console.log("✅ Bucket 'documents' já existe!");
      return true;
    }

    // 2. Criar bucket se não existir
    console.log("🆕 Criando bucket 'documents'...");
    const { data: newBucket, error: createError } =
      await supabase.storage.createBucket("documents", {
        public: false,
        allowedMimeTypes: [
          "image/jpeg",
          "image/png",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        fileSizeLimit: 10485760, // 10MB
      });

    if (createError) {
      console.error("❌ Erro ao criar bucket:", createError);
      return false;
    }

    console.log("✅ Bucket 'documents' criado com sucesso!", newBucket);
    return true;
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return false;
  }
}

// Executar
createDocumentsBucket().then((success) => {
  if (success) {
    console.log("✅ Setup concluído! Agora tente fazer upload novamente.");
  } else {
    console.log(
      "❌ Falha no setup. Verifique o Supabase Dashboard manualmente.",
    );
  }
});

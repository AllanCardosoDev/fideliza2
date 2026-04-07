import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function DocumentUpload({
  clientId,
  clientType = "autonomo",
  onUploadSuccess,
  currentUser = null,
}) {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Documentos para Pessoa Física (PF/Autônomo)
  const DOCUMENT_TYPES_PF = [
    { label: "RG", required: true, recommended: true },
    { label: "CPF", required: true, recommended: true },
    { label: "CNH", required: false, recommended: true },
    { label: "Comprovante de Renda", required: true, recommended: true },
    { label: "Comprovante de Endereço", required: true, recommended: true },
    { label: "Extrato Bancário", required: false, recommended: true },
    { label: "Documento de Propriedade", required: false, recommended: false },
    { label: "Aval", required: false, recommended: false },
    { label: "Outros", required: false, recommended: false },
  ];

  // Documentos para Pessoa Jurídica (PJ/Empresa)
  const DOCUMENT_TYPES_PJ = [
    { label: "CNPJ", required: true, recommended: true },
    { label: "Inscrição Estadual", required: true, recommended: true },
    { label: "Contrato Social", required: true, recommended: true },
    {
      label: "Certificado de Condição de Microempreendedor",
      required: false,
      recommended: true,
    },
    { label: "Alvará de Funcionamento", required: true, recommended: true },
    {
      label: "Comprovante de Endereço Comercial",
      required: true,
      recommended: true,
    },
    { label: "Último Balanço Patrimonial", required: false, recommended: true },
    { label: "Extrato Bancário Empresa", required: false, recommended: true },
    {
      label: "Comprovante de Renda (Sócios)",
      required: false,
      recommended: true,
    },
    { label: "RG do(s) Sócio(s)", required: false, recommended: true },
    { label: "Outros", required: false, recommended: false },
  ];

  // Selecionar tipos baseado no client_type
  const DOCUMENT_TYPES =
    clientType === "empresa" ? DOCUMENT_TYPES_PJ : DOCUMENT_TYPES_PF;

  // Definir tipo padrão baseado no tipo de cliente
  useEffect(() => {
    if (selectedType === null) {
      setSelectedType(clientType === "empresa" ? "CNPJ" : "RG");
    }
  }, [clientType, selectedType]);

  // Buscar documentos do cliente
  useEffect(() => {
    if (clientId) {
      fetchDocuments();
    }
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", clientId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (file.size > 10 * 1024 * 1024) {
      const msg = "❌ Arquivo muito grande (máximo: 10MB)";
      setUploadError(msg);
      alert(msg);
      return;
    }

    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validTypes.includes(file.type)) {
      const msg = "❌ Tipo não permitido. Use: PDF, JPG, PNG, DOC, DOCX";
      setUploadError(msg);
      alert(msg);
      return;
    }

    try {
      setLoading(true);
      setUploadError(null);

      console.log("📤 Iniciando upload:", {
        clientId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        documentType: selectedType,
        employeeId: currentUser?.id || "sem-user",
      });

      // 1. Upload para Supabase Storage
      const timestamp = Date.now();
      const fileName = `client_${clientId}_${timestamp}_${file.name}`;
      const path = `${clientId}/${fileName}`;

      console.log("📁 Caminho do arquivo:", path);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file);

      if (uploadError) {
        console.error("❌ Erro de upload:", uploadError);

        // Verificar se é erro de bucket não encontrado
        if (
          uploadError.message?.includes("Bucket not found") ||
          uploadError.statusCode === 400
        ) {
          const errorMsg =
            "❌ ERRO: Bucket 'documents' não existe no Supabase!\n\n" +
            "Para resolver:\n" +
            "1. Abra: https://supabase.com/dashboard\n" +
            "2. Vá em: Storage > Create new bucket\n" +
            "3. Nome: 'documents' (minúsculas)\n" +
            "4. Privacy: 'Private'\n" +
            "5. Clique: Create Bucket\n\n" +
            "Depois recarregue a página (F5) e tente novamente.";
          throw new Error(errorMsg);
        }

        throw new Error(
          uploadError.message || "Erro ao fazer upload do arquivo",
        );
      }

      console.log("✅ Upload concluído:", uploadData);

      // 2. Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(path);

      console.log("🔗 URL pública:", publicUrl);

      if (!publicUrl) {
        throw new Error("Não foi possível obter a URL do arquivo");
      }

      // 3. Salvar metadados na tabela documents
      console.log("💾 Salvando documento no banco de dados:", {
        client_id: clientId,
        employee_id: currentUser?.id || null,
        document_type: selectedType,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      });

      const { data: dbData, error: dbError } = await supabase
        .from("documents")
        .insert([
          {
            client_id: clientId,
            employee_id: currentUser?.id || null,
            document_type: selectedType,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
          },
        ])
        .select();

      if (dbError) {
        console.error("❌ Erro ao salvar documento no BD:", dbError);
        throw new Error(
          dbError.message || "Erro ao salvar documento no banco de dados",
        );
      }

      console.log("✅ Documento salvo com sucesso no BD:", dbData);

      // ✅ Sucesso: Arquivo foi enviado e salvo!
      alert(
        "✅ Documento enviado e salvo com sucesso!\n\nArquivo: Storage/documents\nRegistro: Banco de Dados",
      );

      // Reset UI
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedType(clientType === "empresa" ? "CNPJ" : "RG");

      // Recarregar lista de documentos
      await fetchDocuments();

      // Chamar callback após tudo estar concluído
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error("❌ Erro ao fazer upload:", error);
      const errorMsg = error?.message || "Erro ao fazer upload do documento";
      setUploadError(errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Tem certeza que deseja deletar este documento?")) return;

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (error) {
        throw new Error(error.message || "Erro ao deletar documento");
      }

      alert("✅ Documento deletado");
      await fetchDocuments();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      const errorMsg = error?.message || "Erro ao deletar documento";
      setUploadError(errorMsg);
      alert(`❌ ${errorMsg}`);
    }
  };

  // Calcular documentos pendentes (obrigatórios não entregues)
  const uploadedTypes = documents.map((d) => d.document_type);
  const pendingDocs = DOCUMENT_TYPES.filter(
    (doc) => doc.required && !uploadedTypes.includes(doc.label),
  );
  const recommendedDocs = DOCUMENT_TYPES.filter(
    (doc) =>
      !doc.required && doc.recommended && !uploadedTypes.includes(doc.label),
  );

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        marginTop: "20px",
      }}
    >
      {/* Indicador de Tipo (PF/PJ) */}
      <div style={{ marginBottom: "15px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "600",
            backgroundColor: clientType === "empresa" ? "#c62828" : "#1976d2",
            color: "white",
          }}
        >
          {clientType === "empresa"
            ? "🏢 Pessoa Jurídica (Empresa)"
            : "👤 Pessoa Física"}
        </span>
      </div>

      {/* Erro de Upload */}
      {uploadError && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#ffebee",
            borderLeft: "4px solid #f44336",
            borderRadius: "4px",
            marginBottom: "15px",
            color: "#c62828",
            fontWeight: "500",
          }}
        >
          ❌ {uploadError}
        </div>
      )}

      {/* Aviso de Documentos Pendentes */}
      {pendingDocs.length > 0 && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff3cd",
            borderLeft: "4px solid #ff9800",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          <strong>⚠️ Documentos Obrigatórios Pendentes:</strong>
          <div style={{ marginTop: "8px" }}>
            {pendingDocs.map((doc) => (
              <div key={doc.label} style={{ fontSize: "14px", color: "#333" }}>
                • {doc.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso de Documentos Recomendados */}
      {recommendedDocs.length > 0 && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f5e9",
            borderLeft: "4px solid #4CAF50",
            borderRadius: "4px",
            marginBottom: "15px",
          }}
        >
          <strong>ℹ️ Documentos Recomendados Pendentes:</strong>
          <div style={{ marginTop: "8px" }}>
            {recommendedDocs.map((doc) => (
              <div key={doc.label} style={{ fontSize: "14px", color: "#333" }}>
                • {doc.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Upload */}
      <div style={{ marginBottom: "20px" }}>
        <h4>📤 Upload de Documentos</h4>

        <div style={{ marginBottom: "12px" }}>
          <label
            htmlFor="document-type-select"
            style={{ display: "block", marginBottom: "6px", fontWeight: "500" }}
          >
            Tipo de Documento *
          </label>
          <select
            id="document-type-select"
            value={selectedType || ""}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          >
            {DOCUMENT_TYPES.map((doc) => (
              <option key={doc.label} value={doc.label}>
                {doc.label}
                {doc.required ? " (Obrigatório)" : ""}
                {doc.recommended && !doc.required ? " (Recomendado)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador do tipo selecionado */}
        {DOCUMENT_TYPES.find((d) => d.label === selectedType) && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
              fontSize: "13px",
            }}
          >
            {DOCUMENT_TYPES.find((d) => d.label === selectedType)?.required && (
              <span
                style={{
                  backgroundColor: "#ff5252",
                  color: "white",
                  padding: "3px 8px",
                  borderRadius: "3px",
                }}
              >
                🔴 Obrigatório
              </span>
            )}
            {DOCUMENT_TYPES.find((d) => d.label === selectedType)
              ?.recommended && (
              <span
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  padding: "3px 8px",
                  borderRadius: "3px",
                }}
              >
                ✓ Recomendado
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <input
            id="file-input-document"
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            disabled={loading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          />
          <label htmlFor="file-input-document">
            <button
              type="button"
              onClick={() => loading || fileInputRef.current?.click()}
              disabled={loading}
              style={{
                padding: "10px 20px",
                backgroundColor: loading ? "#999" : "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳ Enviando..." : "📤 Upload"}
            </button>
          </label>
        </div>

        {loading && (
          <div
            style={{
              marginTop: "12px",
              padding: "10px",
              backgroundColor: "#e3f2fd",
              borderRadius: "4px",
              fontSize: "13px",
              color: "#1976d2",
              fontWeight: "500",
            }}
          >
            ⏳ Processando upload... Por favor, aguarde (não feche esta janela)
          </div>
        )}
      </div>

      {/* Lista de Documentos */}
      <div>
        <h4>📁 Documentos Anexados ({documents.length})</h4>
        {documents.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  padding: "12px",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#0066cc",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      📄 {doc.file_name}
                    </a>
                    <span
                      style={{
                        backgroundColor: "#e3f2fd",
                        color: "#1976d2",
                        padding: "2px 8px",
                        borderRadius: "3px",
                        fontSize: "11px",
                        fontWeight: "500",
                      }}
                    >
                      {doc.document_type}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "4px",
                    }}
                  >
                    {new Date(doc.uploaded_at).toLocaleDateString("pt-BR")} |{" "}
                    {(doc.file_size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  🗑️ Deletar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#999" }}>Nenhum documento anexado ainda</p>
        )}
      </div>
    </div>
  );
}

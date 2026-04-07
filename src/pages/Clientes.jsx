// src/pages/Clientes.jsx
import React, {
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { AppContext } from "../App";
import { DocumentUpload } from "../components/DocumentUpload";
import {
  maskCpfCnpj,
  maskPhone,
  validateCpfCnpj,
  fmt,
  calcPMT,
  getClientName,
  fetchCNPJData,
  fetchCEPData,
} from "../utils/helpers";
import { buildInstallments } from "../utils/finance";

// Using unified buildInstallments from finance.js

const STATUS_OPTS = [
  { value: "active", label: "Ativo", cls: "status-active" },
  { value: "inactive", label: "Inativo", cls: "status-inactive" },
  { value: "overdue", label: "Inadimplente", cls: "status-overdue" },
];

const EMPTY_FORM = {
  // Tab 1: Dados Pessoais
  name: "",
  cpf: "",
  cnpj: "",
  phone: "",
  email: "",

  // Tab 2: Endereço
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",

  // Tab 3: Dados Adicionais
  rg: "",
  profession: "",
  client_type: "autonomo",
  facebook: "",
  instagram: "",
  referral: false,
  referral_name: "",
  referral_phone: "",
  business_segment: "outro_segmento",

  // Status: Default to "inactive" (visually represents pending approval state)
  status: "inactive",
  notes: "",
  owner_id: "",
};

const CLIENT_TYPES = [
  { value: "autonomo", label: "Autônomo" },
  { value: "emprestimo", label: "Empréstimo" },
  { value: "investidor", label: "Investidor" },
  { value: "outro", label: "Outro" },
];

const BUSINESS_SEGMENTS = [
  { value: "autonomo", label: "Autônomo" },
  { value: "tech", label: "Tecnologia" },
  { value: "servicos", label: "Serviços" },
  { value: "saude", label: "Saúde" },
  { value: "construcao", label: "Construção" },
  { value: "transportes", label: "Transportes" },
  { value: "financeiro", label: "Financeiro" },
  { value: "comercio", label: "Comércio" },
  { value: "educacao", label: "Educação" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "agricola", label: "Agrícola" },
  { value: "industria", label: "Indústria" },
  { value: "outro_segmento", label: "Outro" },
];

function ClientForm({
  initial = EMPTY_FORM,
  currentUser,
  userRole,
  employees,
  onSave,
  onCancel,
  isSaving,
  editingClientId,
}) {
  const [form, setForm] = useState({
    ...initial,
    owner_id: initial.owner_id || currentUser?.id || "",
  });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(null);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório.";

    // CPF ou CNPJ - validar se preenchido
    const hasCPF = form.cpf.trim();
    const hasCNPJ = form.cnpj.trim();

    if (!hasCPF && !hasCNPJ) {
      e.cpf = "CPF ou CNPJ é obrigatório.";
    } else {
      if (hasCPF && !validateCpfCnpj(form.cpf)) {
        e.cpf = "CPF inválido.";
      }
      if (hasCNPJ && !validateCpfCnpj(form.cnpj)) {
        e.cnpj = "CNPJ inválido.";
      }
    }

    if (!form.phone.trim()) e.phone = "Telefone é obrigatório.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "E-mail inválido.";
    }
    if (!form.cep.trim()) e.cep = "CEP é obrigatório.";
    if (!form.street.trim()) e.street = "Rua é obrigatória.";
    if (!form.number.trim()) e.number = "Número é obrigatório.";
    if (!form.city.trim()) e.city = "Cidade é obrigatória.";
    if (!form.state.trim()) e.state = "Estado é obrigatório.";
    if (form.referral && !form.referral_name.trim())
      e.referral_name = "Nome da referência é obrigatório.";
    if (form.referral && !form.referral_phone.trim())
      e.referral_phone = "Telefone da referência é obrigatório.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const searchCPF = async () => {
    if (!form.cpf) return;
    setLoading("cpf");
    const data = await fetchCNPJData(form.cpf);
    if (data) {
      set("name", data.name);
      set("cep", data.address_parts.cep || "");
      set("street", data.address_parts.street || "");
      set("number", data.address_parts.number || "");
      set("complement", data.address_parts.complement || "");
      set("neighborhood", data.address_parts.neighborhood || "");
      set("city", data.address_parts.city || "");
      set("state", data.address_parts.state || "");
      if (data.phone) set("phone", maskPhone(data.phone));
    }
    setLoading(null);
  };

  const searchCNPJ = async () => {
    if (!form.cnpj) return;
    setLoading("cnpj");
    const data = await fetchCNPJData(form.cnpj);
    if (data) {
      set("name", data.name);
      set("cep", data.address_parts.cep || "");
      set("street", data.address_parts.street || "");
      set("number", data.address_parts.number || "");
      set("complement", data.address_parts.complement || "");
      set("neighborhood", data.address_parts.neighborhood || "");
      set("city", data.address_parts.city || "");
      set("state", data.address_parts.state || "");
      if (data.phone) set("phone", maskPhone(data.phone));
    }
    setLoading(null);
  };

  const searchCEP = async () => {
    if (!form.cep) return;
    setLoading("cep");
    const data = await fetchCEPData(form.cep);
    if (data) {
      set("street", data.street);
      set("neighborhood", data.neighborhood);
      set("city", data.city);
      set("state", data.state);
      set("complement", data.complement);
    }
    setLoading(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const profile = {
      rg: form.rg,
      cpf: form.cpf ? form.cpf.replace(/\D/g, "") : null,
      cnpj: form.cnpj ? form.cnpj.replace(/\D/g, "") : null,
      facebook: form.facebook,
      referral: form.referral,
      instagram: form.instagram,
      profession: form.profession,
      client_type: form.client_type,
      address_parts: {
        cep: form.cep.replace(/\D/g, ""),
        city: form.city,
        state: form.state,
        number: form.number,
        street: form.street,
        complement: form.complement,
        neighborhood: form.neighborhood,
      },
      referral_name: form.referral_name,
      referral_phone: form.referral_phone,
      business_segment: form.business_segment,
    };

    const payload = {
      name: form.name,
      cpf_cnpj: (form.cpf || form.cnpj).replace(/\D/g, ""),
      phone: form.phone,
      email: form.email,
      address: `${form.street}, ${form.number}, ${form.city}, ${form.state}`,
      status: form.status,
      notes: form.notes,
      profile: JSON.stringify(profile),
      created_by: initial.created_by || currentUser?.id || null,
      owner_id: form.owner_id || currentUser?.id || null,
    };
    onSave(payload);
  };

  // ── TAB 1: Dados Pessoais ──────────────────────
  const tab1Valid =
    form.name &&
    (validateCpfCnpj(form.cpf) || validateCpfCnpj(form.cnpj)) &&
    form.phone &&
    form.email;

  // ── TAB 2: Endereço ────────────────────────────
  const tab2Valid =
    form.cep && form.street && form.number && form.city && form.state;

  // ── TAB 3: Dados Adicionais ────────────────────
  const tab3Valid =
    !form.referral || (form.referral_name && form.referral_phone);

  return (
    <form className="modal-form modal-form-tabs" onSubmit={handleSubmit}>
      {/* Tab Navigation */}
      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === 0 ? "active" : ""} ${tab1Valid ? "valid" : ""}`}
          onClick={() => setActiveTab(0)}
        >
          <span>1. Dados Pessoais</span>
          {tab1Valid && <span className="tab-check">✓</span>}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 1 ? "active" : ""} ${tab2Valid ? "valid" : ""}`}
          onClick={() => setActiveTab(1)}
        >
          <span>2. Endereço</span>
          {tab2Valid && <span className="tab-check">✓</span>}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 2 ? "active" : ""} ${tab3Valid ? "valid" : ""}`}
          onClick={() => setActiveTab(2)}
        >
          <span>3. Dados Adicionais</span>
          {tab3Valid && <span className="tab-check">✓</span>}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 3 ? "active" : ""}`}
          onClick={() => setActiveTab(3)}
          title={
            editingClientId
              ? "Documentos do cliente"
              : "Salve o cliente para fazer upload de documentos"
          }
        >
          <span>4. Documentos</span>
        </button>
      </div>

      {/* Tab 1: Dados Pessoais */}
      {activeTab === 0 && (
        <div className="tab-content">
          <div className="form-row">
            <label>Nome Completo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nome completo"
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>CPF * 🔍</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={(e) => set("cpf", maskCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  className={errors.cpf && !form.cnpj ? "input-error" : ""}
                />
                <button
                  type="button"
                  onClick={searchCPF}
                  disabled={loading === "cpf" || !form.cpf}
                  className="btn btn-outline btn-sm"
                  title="Buscar dados do CPF"
                >
                  {loading === "cpf" ? "⟳" : "🔍"}
                </button>
              </div>
              {errors.cpf && !form.cnpj && (
                <span className="field-error">{errors.cpf}</span>
              )}
            </div>

            <div className="form-row">
              <label>CNPJ * 🔍</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => set("cnpj", maskCpfCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className={errors.cnpj && !form.cpf ? "input-error" : ""}
                />
                <button
                  type="button"
                  onClick={searchCNPJ}
                  disabled={loading === "cnpj" || !form.cnpj}
                  className="btn btn-outline btn-sm"
                  title="Buscar dados do CNPJ"
                >
                  {loading === "cnpj" ? "⟳" : "🔍"}
                </button>
              </div>
              {errors.cnpj && !form.cpf && (
                <span className="field-error">{errors.cnpj}</span>
              )}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Telefone *</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => set("phone", maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className={errors.phone ? "input-error" : ""}
              />
              {errors.phone && (
                <span className="field-error">{errors.phone}</span>
              )}
            </div>

            <div className="form-row">
              <label>E-mail *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@exemplo.com"
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>RG</label>
              <input
                type="text"
                value={form.rg}
                onChange={(e) => set("rg", e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>

            <div className="form-row">
              <label>Profissão</label>
              <input
                type="text"
                value={form.profession}
                onChange={(e) => set("profession", e.target.value)}
                placeholder="Sua profissão"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Tipo de Cliente</label>
              <select
                value={form.client_type}
                onChange={(e) => set("client_type", e.target.value)}
              >
                {CLIENT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Segmento de Negócio</label>
              <select
                value={form.business_segment}
                onChange={(e) => set("business_segment", e.target.value)}
              >
                {BUSINESS_SEGMENTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Endereço */}
      {activeTab === 1 && (
        <div className="tab-content">
          <div className="form-row">
            <label>CEP * 🔍</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => set("cep", e.target.value.replace(/\D/g, ""))}
                placeholder="00000-000"
                maxLength="8"
                className={errors.cep ? "input-error" : ""}
              />
              <button
                type="button"
                onClick={searchCEP}
                disabled={loading === "cep" || !form.cep}
                className="btn btn-outline btn-sm"
                title="Buscar CEP"
              >
                {loading === "cep" ? "⟳" : "🔍"}
              </button>
            </div>
            {errors.cep && <span className="field-error">{errors.cep}</span>}
          </div>

          <div className="form-row">
            <label>Rua / Logradouro *</label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
              placeholder="Rua, Avenida, etc"
              className={errors.street ? "input-error" : ""}
            />
            {errors.street && (
              <span className="field-error">{errors.street}</span>
            )}
          </div>

          <div className="form-row-3">
            <div className="form-row">
              <label>Número *</label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => set("number", e.target.value)}
                placeholder="123"
                className={errors.number ? "input-error" : ""}
              />
              {errors.number && (
                <span className="field-error">{errors.number}</span>
              )}
            </div>

            <div className="form-row">
              <label>Complemento</label>
              <input
                type="text"
                value={form.complement}
                onChange={(e) => set("complement", e.target.value)}
                placeholder="Apto, Bloco, etc"
              />
            </div>

            <div className="form-row">
              <label>Bairro</label>
              <input
                type="text"
                value={form.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
                placeholder="Bairro"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-row">
              <label>Cidade *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="São Paulo"
                className={errors.city ? "input-error" : ""}
              />
              {errors.city && (
                <span className="field-error">{errors.city}</span>
              )}
            </div>

            <div className="form-row">
              <label>Estado *</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => set("state", e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength="2"
                className={errors.state ? "input-error" : ""}
              />
              {errors.state && (
                <span className="field-error">{errors.state}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dados Adicionais */}
      {activeTab === 2 && (
        <div className="tab-content">
          <div className="form-row-2">
            <div className="form-row">
              <label>Facebook</label>
              <input
                type="text"
                value={form.facebook}
                onChange={(e) => set("facebook", e.target.value)}
                placeholder="facebook.com/usuario"
              />
            </div>

            <div className="form-row">
              <label>Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="@usuario"
              />
            </div>
          </div>

          <div className="form-row">
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.referral}
                onChange={(e) => set("referral", e.target.checked)}
              />
              Tem referência?
            </label>
          </div>

          {form.referral && (
            <>
              <div className="form-row">
                <label>Nome da Referência *</label>
                <input
                  type="text"
                  value={form.referral_name}
                  onChange={(e) => set("referral_name", e.target.value)}
                  placeholder="Nome completo"
                  className={errors.referral_name ? "input-error" : ""}
                />
                {errors.referral_name && (
                  <span className="field-error">{errors.referral_name}</span>
                )}
              </div>

              <div className="form-row">
                <label>Telefone da Referência *</label>
                <input
                  type="text"
                  value={form.referral_phone}
                  onChange={(e) =>
                    set("referral_phone", maskPhone(e.target.value))
                  }
                  placeholder="(00) 00000-0000"
                  className={errors.referral_phone ? "input-error" : ""}
                />
                {errors.referral_phone && (
                  <span className="field-error">{errors.referral_phone}</span>
                )}
              </div>
            </>
          )}

          <div className="form-row">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {STATUS_OPTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Observações sobre o cliente..."
              rows={3}
            />
          </div>

          {(userRole === "admin" || userRole === "supervisor") && (
            <div
              className="form-row"
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px dashed var(--border)",
              }}
            >
              <label>Atribuir a Funcionário (Proprietário)</label>
              <select
                value={form.owner_id}
                onChange={(e) => set("owner_id", e.target.value)}
              >
                <option value="">Nenhum (Somente Admin)</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-dim)",
                  marginTop: 4,
                }}
              >
                Ao atribuir a um funcionário, ele terá acesso total ao cliente e
                a capacidade de criar empréstimos em seu nome.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Documentos */}
      {activeTab === 3 && (
        <div className="tab-content">
          {editingClientId ? (
            <DocumentUpload
              clientId={editingClientId}
              clientType={form.client_type}
              currentUser={currentUser}
              onUploadSuccess={() => {
                console.log("✅ Documento enviado com sucesso!");
              }}
            />
          ) : (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                marginTop: "20px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "10px" }}>📄</div>
              <h3>Documentos</h3>
              <p style={{ color: "#666", marginTop: "10px" }}>
                Salve o cliente antes de adicionar documentos.
              </p>
              <p style={{ fontSize: "13px", color: "#999", marginTop: "20px" }}>
                Após salvar, você poderá fazer upload de:
              </p>
              <div
                style={{
                  marginTop: "15px",
                  textAlign: "left",
                  display: "inline-block",
                  backgroundColor: "white",
                  padding: "15px 20px",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <strong>
                    Tipo:{" "}
                    {form.client_type === "empresa"
                      ? "Pessoa Jurídica"
                      : "Pessoa Física"}
                  </strong>
                </div>
                <div style={{ marginTop: "10px", color: "#666" }}>
                  {form.client_type === "empresa" ? (
                    <>
                      • CNPJ, Contrato Social, Alvará
                      <br />
                      • Inscrição Estadual, Comprovantes
                      <br />• Balanço Patrimonial, RG dos Sócios
                    </>
                  ) : (
                    <>
                      • RG, CPF, Comprovante de Renda
                      <br />
                      • Comprovante de Endereço
                      <br />• CNH, Extrato Bancário e mais
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
          disabled={activeTab === 0}
        >
          ← Voltar
        </button>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setActiveTab(Math.min(3, activeTab + 1))}
          disabled={activeTab === 3}
        >
          Próximo →
        </button>
        <button
          type="submit"
          className="btn btn-gold btn-sm"
          disabled={isSaving || loading}
        >
          {isSaving ? "Salvando..." : "Salvar Cliente"}
        </button>
      </div>
    </form>
  );
}

function Clientes() {
  const {
    clients,
    loans,
    openModal,
    closeModal,
    createClientRecord,
    editClientRecord,
    removeClientRecord,
    approveClient,
    rejectClient,
    addToast,
    currentUser,
    userRole,
    employees,
  } = useContext(AppContext);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Auto-filter para mostrar Inativos se veio do botão em Empréstimos
  useEffect(() => {
    const showInactiveOnly = localStorage.getItem("filterClientsInactive");
    if (showInactiveOnly) {
      setFilterStatus("inactive");
      localStorage.removeItem("filterClientsInactive");
    }
  }, []);

  // ── Today (fixed reference) ────────────────────────────────────────────────
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ── Generate all installments (same logic as Cobrancas/Dashboard/Emprestimos) ──────────────────
  const allInstallments = useMemo(
    () => buildInstallments(loans, today),
    [loans, today],
  );

  // ── Auto-update client status to "overdue" if has overdue installments ─────────────────────
  useEffect(() => {
    const overdueLoanIds = new Set();
    allInstallments
      .filter((i) => i.status === "overdue")
      .forEach((i) => {
        overdueLoanIds.add(i.loanId);
      });

    const clientIdsWithOverdue = new Set();
    loans.forEach((loan) => {
      if (overdueLoanIds.has(loan.id)) {
        clientIdsWithOverdue.add(loan.client_id);
      }
    });

    // Update clients that should be "overdue"
    clients.forEach((client) => {
      if (
        client.id &&
        clientIdsWithOverdue.has(client.id) &&
        client.status !== "overdue"
      ) {
        editClientRecord(client.id, { status: "overdue" });
      }
    });
  }, [allInstallments, loans, clients, editClientRecord]);

  // ── Auto-revert client status from "overdue" to "active" if no more overdue installments ─────
  useEffect(() => {
    clients.forEach((client) => {
      if (client.status === "overdue") {
        // Check if this client has any overdue installments
        const clientHasOverdue = allInstallments.some(
          (i) => i.status === "overdue" && i.clientId === client.id,
        );

        // If no overdue, revert to active
        if (!clientHasOverdue) {
          editClientRecord(client.id, { status: "active" });
        }
      }
    });
  }, [allInstallments, clients, editClientRecord]);

  // Access Control: Employees see only their own clients that are approved
  const accessibleClients = useMemo(() => {
    if (userRole === "employee" && currentUser?.id) {
      // Employee sees ONLY their own clients
      return clients.filter(
        (c) => c.created_by === currentUser.id || c.owner_id === currentUser.id,
      );
    }
    return clients; // Admin sees all
  }, [clients, currentUser, userRole]);

  // Pending clients (for admin approval)
  const pendingClients = useMemo(() => {
    return clients.filter((c) => c.approval_status === "pending");
  }, [clients]);

  // ── Count clients with overdue installments ──────────────────────────────────────
  const clientsWithOverdueCount = useMemo(() => {
    const accessibleClientIds = new Set(accessibleClients.map((c) => c.id));
    const overdueLoanIds = new Set();
    allInstallments
      .filter((i) => i.status === "overdue")
      .forEach((i) => {
        overdueLoanIds.add(i.loanId);
      });

    const clientIds = new Set();
    loans.forEach((loan) => {
      if (
        overdueLoanIds.has(loan.id) &&
        accessibleClientIds.has(loan.client_id)
      ) {
        clientIds.add(loan.client_id);
      }
    });
    return clientIds.size;
  }, [allInstallments, loans, accessibleClients]);

  // ── Clientes Inativos: aqueles com todos os empréstimos finalizados (paid) ──────────────
  const inactiveClientsIds = useMemo(() => {
    const ids = new Set();
    accessibleClients.forEach((client) => {
      const clientLoans = loans.filter((l) => l.client_id === client.id);
      if (clientLoans.length === 0) return; // Sem empréstimos, não é inativo

      // Todos os empréstimos devem estar "paid" para ser inativo
      const allPaid = clientLoans.every((l) => l.status === "paid");
      if (allPaid) ids.add(client.id);
    });
    return ids;
  }, [accessibleClients, loans]);

  const filtered = accessibleClients.filter((c) => {
    const matchSearch = [c.name, c.email, c.phone, c.cpf_cnpj, c.address]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    // Lógica: se filterStatus == "inactive", mostra apenas clientes finalizados
    let matchStatus = true;
    if (filterStatus === "inactive") {
      matchStatus = inactiveClientsIds.has(c.id);
    } else if (filterStatus) {
      matchStatus = c.status === filterStatus;
    }

    return matchSearch && matchStatus;
  });

  // Calculate outstanding balance per client from loans
  const clientBalance = useCallback(
    (clientId) => {
      return loans
        .filter(
          (l) =>
            l.client_id === clientId &&
            l.status !== "paid" &&
            l.status !== "cancelled",
        )
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    },
    [loans],
  );

  const handleAdd = () => {
    openModal(
      "Novo Cliente",
      <ClientForm
        currentUser={currentUser}
        userRole={userRole}
        employees={employees}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await createClientRecord(form);
            closeModal();
          } catch {
            // error handled in context
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
        editingClientId={null}
      />,
    );
  };

  const handleEdit = (client) => {
    // Parse profile JSON if it exists
    let profile = {};
    if (client.profile) {
      try {
        const parsed =
          typeof client.profile === "string"
            ? JSON.parse(client.profile)
            : client.profile;
        profile = parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        profile = {};
      }
    }

    // Extract address_parts
    const addressParts = profile.address_parts || {};

    openModal(
      "Editar Cliente",
      <ClientForm
        currentUser={currentUser}
        initial={{
          // Etapa 1: Dados Pessoais
          name: client.name || "",
          cpf: profile.cpf
            ? String(profile.cpf).includes(".")
              ? String(profile.cpf)
              : String(profile.cpf).replace(
                  /(\d{3})(\d{3})(\d{3})(\d{2})/,
                  "$1.$2.$3-$4",
                )
            : "",
          cnpj: profile.cnpj
            ? String(profile.cnpj).includes("/")
              ? String(profile.cnpj)
              : String(profile.cnpj).replace(
                  /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                  "$1.$2.$3/$4-$5",
                )
            : "",
          phone: client.phone || "",
          email: client.email || "",
          rg: profile.rg || "",
          profession: profile.profession || "",
          client_type: profile.client_type || "autonomo",

          // Etapa 2: Endereço
          cep: addressParts.cep || "",
          street: addressParts.street || "",
          number: addressParts.number || "",
          complement: addressParts.complement || "",
          neighborhood: addressParts.neighborhood || "",
          city: addressParts.city || "",
          state: addressParts.state || "",

          // Etapa 3: Dados Adicionais
          facebook: profile.facebook || "",
          instagram: profile.instagram || "",
          referral: profile.referral || false,
          referral_name: profile.referral_name || "",
          referral_phone: profile.referral_phone || "",
          business_segment: profile.business_segment || "outro_segmento",

          // Status e Observações
          notes: client.notes || "",
          status: client.status || "active",
          owner_id: String(client.owner_id || ""),
          created_by: client.created_by,
        }}
        userRole={userRole}
        employees={employees}
        editingClientId={client.id}
        onSave={async (form) => {
          setIsSaving(true);
          try {
            await editClientRecord(client.id, form);
            closeModal();
          } catch {
            // error handled in context
          } finally {
            setIsSaving(false);
          }
        }}
        onCancel={closeModal}
        isSaving={isSaving}
      />,
    );
  };

  const handleDelete = (client) => {
    openModal(
      "Confirmar Exclusão",
      <div className="modal-confirm">
        <p>
          Tem certeza que deseja excluir <strong>{client.name}</strong>?
        </p>
        <p className="text-dim">Esta ação não pode ser desfeita.</p>
        <div className="form-actions">
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={deletingId === client.id}
            onClick={async () => {
              setDeletingId(client.id);
              try {
                await removeClientRecord(client.id);
                closeModal();
              } catch {
                // error handled in context
              } finally {
                setDeletingId(null);
              }
            }}
          >
            {deletingId === client.id ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </div>,
    );
  };

  const handleViewLoans = (client) => {
    const clientLoans = loans.filter(
      (l) => l.client_id === client.id || l.client === client.name,
    );
    openModal(
      `Empréstimos — ${client.name}`,
      <div>
        {clientLoans.length === 0 ? (
          <p
            className="text-dim"
            style={{ padding: "20px", textAlign: "center" }}
          >
            Nenhum empréstimo para este cliente.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Valor</th>
                  <th>Parcelas</th>
                  <th>Pagas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientLoans.map((l) => (
                  <tr key={l.id}>
                    <td>{fmt(l.value)}</td>
                    <td>{l.installments}</td>
                    <td>{l.paid}</td>
                    <td>
                      <span className={`status status-${l.status}`}>
                        {l.status === "active"
                          ? "Ativo"
                          : l.status === "paid"
                            ? "Pago"
                            : l.status === "overdue"
                              ? "Atrasado"
                              : l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button className="btn btn-outline btn-sm" onClick={closeModal}>
            Fechar
          </button>
        </div>
      </div>,
    );
  };

  const statusInfo = (status) =>
    STATUS_OPTS.find((o) => o.value === status) || {
      label: status,
      cls: "status-inactive",
    };

  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p className="page-desc">Gerencie sua carteira de clientes</p>
        </div>
        <div className="header-actions">
          <button onClick={handleAdd} className="btn btn-gold btn-sm">
            + Novo Cliente
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid kpi-grid-3" style={{ marginBottom: 20 }}>
        <div className="kpi-card kpi-clients">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Total de Clientes</span>
            <span className="kpi-value">{accessibleClients.length}</span>
          </div>
        </div>
        <div className="kpi-card kpi-revenue">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Clientes Ativos</span>
            <span className="kpi-value">
              {accessibleClients.filter((c) => c.status === "active").length}
            </span>
          </div>
        </div>
        <div className="kpi-card kpi-expense">
          <div className="kpi-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Inadimplentes</span>
            <span className="kpi-value">{clientsWithOverdueCount}</span>
          </div>
        </div>
      </div>

      {/* Pending Clients Section (Admin only) */}
      {(userRole === "admin" || userRole === "supervisor") &&
        pendingClients.length > 0 && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              borderColor: "var(--orange)",
              borderLeft: "4px solid var(--orange)",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: "var(--orange)", marginBottom: 4 }}>
                ⏳ Clientes Pendentes de Aprovação ({pendingClients.length})
              </h3>
              <p className="text-dim" style={{ fontSize: "0.85rem" }}>
                Analise os dados do cliente e valores antes de aprovar
              </p>
            </div>

            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF / CNPJ</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Tipo</th>
                    <th>Segmento</th>
                    <th>Cadastrado por</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingClients.map((c) => {
                    const profile = c.profile
                      ? typeof c.profile === "string"
                        ? JSON.parse(c.profile)
                        : c.profile
                      : {};
                    const creatorName =
                      clients.find(
                        (client) => client.created_by === c.created_by,
                      )?.name ||
                      c.created_by ||
                      "—";

                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>{c.cpf_cnpj || "—"}</td>
                        <td>{c.phone || "—"}</td>
                        <td>{c.email || "—"}</td>
                        <td>
                          <span
                            className="text-dim"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {profile.client_type?.charAt(0).toUpperCase() +
                              profile.client_type?.slice(1) || "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="text-dim"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {profile.business_segment
                              ?.replace(/_/g, " ")
                              .charAt(0)
                              .toUpperCase() +
                              profile.business_segment
                                ?.replace(/_/g, " ")
                                .slice(1) || "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            className="text-dim"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {creatorName}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            title="Ver detalhes"
                            onClick={() => handleEdit(c)}
                          >
                            👁️
                          </button>
                          <button
                            className="btn-icon"
                            title="Aprovar"
                            style={{ color: "var(--green)" }}
                            onClick={() => {
                              openModal(
                                `Aprovar Cliente — ${c.name}`,
                                <div className="modal-form">
                                  <div
                                    style={{
                                      marginBottom: 16,
                                      padding: "12px",
                                      background: "var(--bg-primary)",
                                      borderRadius: 8,
                                    }}
                                  >
                                    <div style={{ marginBottom: 8 }}>
                                      <span className="text-dim">Nome:</span>
                                      <strong style={{ display: "block" }}>
                                        {c.name}
                                      </strong>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                      <span className="text-dim">
                                        CPF/CNPJ:
                                      </span>
                                      <strong style={{ display: "block" }}>
                                        {c.cpf_cnpj || "—"}
                                      </strong>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                      <span className="text-dim">
                                        Telefone:
                                      </span>
                                      <strong style={{ display: "block" }}>
                                        {c.phone || "—"}
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-dim">
                                        Cadastrado por:
                                      </span>
                                      <strong style={{ display: "block" }}>
                                        {creatorName}
                                      </strong>
                                    </div>
                                  </div>
                                  <p
                                    style={{
                                      color: "var(--text-dim)",
                                      marginBottom: 12,
                                    }}
                                  >
                                    Confirmar aprovação deste cliente?
                                  </p>
                                  <div className="form-actions">
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={closeModal}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      className="btn btn-gold btn-sm"
                                      onClick={async () => {
                                        try {
                                          await approveClient(c.id);
                                          closeModal();
                                        } catch {
                                          /* handled */
                                        }
                                      }}
                                    >
                                      ✓ Aprovar
                                    </button>
                                  </div>
                                </div>,
                              );
                            }}
                          >
                            ✓
                          </button>
                          <button
                            className="btn-icon"
                            title="Rejeitar"
                            style={{ color: "var(--red)" }}
                            onClick={() => {
                              openModal(
                                `Rejeitar Cliente — ${c.name}`,
                                <div className="modal-form">
                                  <p style={{ marginBottom: 16 }}>
                                    Tem certeza que deseja rejeitar este
                                    cliente?
                                  </p>
                                  <div className="form-actions">
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={closeModal}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={async () => {
                                        try {
                                          await rejectClient(
                                            c.id,
                                            "Rejeitado pelo administrador",
                                          );
                                          closeModal();
                                        } catch {
                                          /* handled */
                                        }
                                      }}
                                    >
                                      ✗ Rejeitar
                                    </button>
                                  </div>
                                </div>,
                              );
                            }}
                          >
                            ✗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      <div className="card">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="🔍  Buscar por nome, CPF, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            {STATUS_OPTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF / CNPJ</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Saldo Devedor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((c) => {
                  const si = statusInfo(c.status);
                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        {c.address && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-dim)",
                            }}
                          >
                            {c.address}
                          </div>
                        )}
                      </td>
                      <td>{c.cpf_cnpj || "—"}</td>
                      <td>{c.phone || "—"}</td>
                      <td>{c.email || "—"}</td>
                      <td>
                        <span className={`status ${si.cls}`}>{si.label}</span>
                      </td>
                      <td>{fmt(clientBalance(c.id))}</td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Ver empréstimos"
                          onClick={() => handleViewLoans(c)}
                        >
                          💳
                        </button>
                        {(userRole === "admin" ||
                          userRole === "supervisor" ||
                          currentUser?.access_level === "admin" ||
                          currentUser?.access_level === "supervisor") && (
                          <>
                            <button
                              className="btn-icon"
                              title="Editar"
                              onClick={() => handleEdit(c)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              title="Excluir"
                              onClick={() => handleDelete(c)}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "var(--text-dim)",
                    }}
                  >
                    {search || filterStatus
                      ? "Nenhum cliente encontrado com os filtros aplicados."
                      : "Nenhum cliente cadastrado. Clique em + Novo Cliente para começar."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              color: "var(--text-dim)",
              fontSize: "0.8rem",
            }}
          >
            Exibindo {filtered.length} de {clients.length} cliente
            {clients.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}

export default Clientes;

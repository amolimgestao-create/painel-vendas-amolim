"use client"

import { useState } from "react"
import { VENDEDORES, VendedorConfig } from "@/lib/metas"
import Link from "next/link"
import {
  ArrowLeft, Lock, Save, CheckCircle, AlertCircle, Loader2,
  Plus, Trash2, X, Users, Target, Gift,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────

type BucketForm = { meta: string; superMeta: string; metaAmolim: string }
type FormMetas  = Record<string, { carteira: BucketForm; leads: BucketForm }>
type VendedorLocal = VendedorConfig & { _new?: boolean }
type Aba = "vendedores" | "metas" | "bonus"

type NovoForm = {
  nomeExibicao: string
  regiao: string
  carteiraApiNome: string
  temLeads: boolean
  leadsApiNome: string
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseBRL(v: string) {
  return parseFloat(v.replace(/\./g, "").replace(",", ".")) || 0
}

function fmtInput(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

function initMetas(vs: VendedorConfig[]): FormMetas {
  return Object.fromEntries(
    vs.map((v) => [
      v.id,
      {
        carteira: {
          meta: fmtInput(v.carteira.meta),
          superMeta: fmtInput(v.carteira.superMeta),
          metaAmolim: fmtInput(v.carteira.metaAmolim),
        },
        leads: {
          meta: fmtInput(v.leads.meta),
          superMeta: fmtInput(v.leads.superMeta),
          metaAmolim: fmtInput(v.leads.metaAmolim),
        },
      },
    ])
  )
}

const EMPTY_ZERO: BucketForm = { meta: "0,00", superMeta: "0,00", metaAmolim: "0,00" }
const EMPTY_NOVO: NovoForm = {
  nomeExibicao: "",
  regiao: "",
  carteiraApiNome: "",
  temLeads: true,
  leadsApiNome: "",
}

// ─── CampoMeta ─────────────────────────────────────────────────────────────

function CampoMeta({
  label,
  value,
  onChange,
  destaque,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  destaque?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className={`text-xs font-medium ${destaque ? "text-white" : "text-slate-400"}`}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-slate-900 border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
            destaque ? "border-slate-500" : "border-slate-700"
          }`}
        />
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function SupervisorPage() {
  const [etapa, setEtapa]           = useState<"login" | "painel">("login")
  const [aba, setAba]               = useState<Aba>("vendedores")
  const [senha, setSenha]           = useState("")
  const [senhaErro, setSenhaErro]   = useState(false)
  const [loginando, setLoginando]   = useState(false)

  const [lista, setLista]           = useState<VendedorLocal[]>(VENDEDORES.map((v) => ({ ...v })))
  const [deletar, setDeletar]       = useState<Set<string>>(new Set())
  const [formMetas, setFormMetas]   = useState<FormMetas>(initMetas(VENDEDORES))

  const [modal, setModal]           = useState(false)
  const [novoForm, setNovoForm]     = useState<NovoForm>(EMPTY_NOVO)
  const [novoErro, setNovoErro]     = useState("")

  const [confirmId, setConfirmId]   = useState<string | null>(null)
  const [status, setStatus]         = useState<"idle" | "salvando" | "sucesso" | "erro">("idle")
  const [erroMsg, setErroMsg]       = useState("")

  const ativos = lista.filter((v) => !deletar.has(v.id))

  // ── Handlers ──

  function setMetaField(
    id: string,
    bucket: "carteira" | "leads",
    campo: keyof BucketForm,
    val: string
  ) {
    setFormMetas((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [bucket]: { ...prev[id][bucket], [campo]: val },
      },
    }))
  }

  function handleAdicionarVendedor() {
    const { nomeExibicao, regiao, carteiraApiNome, temLeads, leadsApiNome } = novoForm
    if (!nomeExibicao.trim())               return setNovoErro("Nome é obrigatório.")
    if (!regiao || isNaN(Number(regiao)))   return setNovoErro("Região inválida.")
    if (!carteiraApiNome.trim())            return setNovoErro("API Nome Carteira é obrigatório.")
    if (temLeads && !leadsApiNome.trim())   return setNovoErro("API Nome Leads é obrigatório quando tem leads.")

    const id = slugify(nomeExibicao) || `v${Date.now()}`
    if (lista.some((v) => v.id === id && !deletar.has(v.id)))
      return setNovoErro("Já existe um vendedor com esse nome.")

    const novo: VendedorLocal = {
      id,
      nomeExibicao: nomeExibicao.trim(),
      regiao: Number(regiao),
      temLeads,
      _new: true,
      carteira: { apiNome: carteiraApiNome.trim().toUpperCase(), meta: 0, superMeta: 0, metaAmolim: 0 },
      leads:    { apiNome: leadsApiNome.trim().toUpperCase(),    meta: 0, superMeta: 0, metaAmolim: 0 },
    }

    setLista((prev) => [...prev, novo])
    setFormMetas((prev) => ({
      ...prev,
      [id]: { carteira: { ...EMPTY_ZERO }, leads: { ...EMPTY_ZERO } },
    }))
    setModal(false)
    setNovoForm(EMPTY_NOVO)
    setNovoErro("")
  }

  function confirmarDelete(id: string) {
    setDeletar((prev) => new Set([...prev, id]))
    setConfirmId(null)
  }

  async function handleSalvar() {
    setStatus("salvando")
    setErroMsg("")

    const vendedores = ativos.map((v) => ({
      id: v.id,
      nomeExibicao: v.nomeExibicao,
      regiao: v.regiao,
      temLeads: v.temLeads,
      carteiraApiNome: v.carteira.apiNome,
      leadsApiNome: v.leads.apiNome,
      carteira: {
        meta:       parseBRL(formMetas[v.id]?.carteira.meta       ?? "0"),
        superMeta:  parseBRL(formMetas[v.id]?.carteira.superMeta  ?? "0"),
        metaAmolim: parseBRL(formMetas[v.id]?.carteira.metaAmolim ?? "0"),
      },
      leads: {
        meta:       parseBRL(formMetas[v.id]?.leads.meta       ?? "0"),
        superMeta:  parseBRL(formMetas[v.id]?.leads.superMeta  ?? "0"),
        metaAmolim: parseBRL(formMetas[v.id]?.leads.metaAmolim ?? "0"),
      },
    }))

    try {
      const res = await fetch("/api/admin/update-metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha, vendedores }),
      })
      if (res.status === 401) {
        setStatus("erro")
        setErroMsg("Senha incorreta.")
        setEtapa("login")
        setSenhaErro(true)
        return
      }
      if (!res.ok) {
        setStatus("erro")
        setErroMsg("Erro ao salvar. Tente novamente.")
        return
      }
      setStatus("sucesso")
    } catch {
      setStatus("erro")
      setErroMsg("Erro de conexão.")
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────

  if (etapa === "login") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <Lock size={20} className="text-slate-400" />
            <div>
              <h1 className="text-white font-bold text-lg">Painel Supervisor</h1>
              <p className="text-slate-400 text-xs">Amolim — Gestão Comercial</p>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (!senha.trim()) return
              setLoginando(true)
              setSenhaErro(false)
              try {
                const res = await fetch("/api/admin/verify-password", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ password: senha }),
                })
                if (!res.ok) { setSenhaErro(true); return }
                setEtapa("painel")
              } catch {
                setSenhaErro(true)
              } finally {
                setLoginando(false)
              }
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Senha de acesso</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setSenhaErro(false) }}
                placeholder="••••••••"
                autoFocus
                className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  senhaErro ? "border-red-500" : "border-slate-700"
                }`}
              />
              {senhaErro && <p className="text-red-400 text-xs mt-1">Senha incorreta.</p>}
            </div>
            <button
              type="submit"
              disabled={loginando}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loginando ? <><Loader2 size={16} className="animate-spin" /> Verificando...</> : "Entrar"}
            </button>
          </form>

          <div className="mt-6">
            <Link href="/" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              ← Voltar ao painel
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Sucesso ────────────────────────────────────────────────────────────

  if (status === "sucesso") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Alterações salvas!</h2>
          <p className="text-slate-400 text-sm mb-6">O painel será atualizado em ~2 minutos.</p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl block text-center transition-colors"
            >
              Ver painel
            </Link>
            <button
              onClick={() => setStatus("idle")}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Continuar editando
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Painel ─────────────────────────────────────────────────────────────

  const TABS: { id: Aba; label: string; Icon: typeof Users; disabled?: boolean }[] = [
    { id: "vendedores", label: "Vendedores", Icon: Users },
    { id: "metas",      label: "Metas",      Icon: Target },
    { id: "bonus",      label: "Bônus",      Icon: Gift, disabled: true },
  ]

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" style={{ borderTop: "4px solid #1565C0" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg">Painel Supervisor</h1>
        </div>
        <span className="text-xs text-slate-400 border border-slate-600 px-2.5 py-1 rounded-lg">
          {ativos.length} / 10 vendedores
        </span>
      </header>

      {/* Tabs */}
      <div className="border-b border-slate-700 px-6 bg-slate-900">
        <div className="flex gap-1">
          {TABS.map(({ id, label, Icon, disabled }) => (
            <button
              key={id}
              disabled={disabled}
              onClick={() => !disabled && setAba(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                aba === id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Icon size={15} />
              {label}
              {disabled && (
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 ml-1">
                  em breve
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Erro global */}
      {status === "erro" && (
        <div className="mx-6 mt-4 flex items-center gap-2 bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3 text-red-400 text-sm">
          <AlertCircle size={16} />
          {erroMsg}
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 p-6 pb-28 max-w-5xl mx-auto w-full">

        {/* ── Aba: Vendedores ──────────────────────────────────────────── */}
        {aba === "vendedores" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-white font-semibold">Equipe de vendas</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione ou remova vendedores — suporte a até 10
                </p>
              </div>
              <button
                onClick={() => { setModal(true); setNovoForm(EMPTY_NOVO); setNovoErro("") }}
                disabled={ativos.length >= 10}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <Plus size={15} />
                Adicionar vendedor
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ativos.map((v) => (
                <div key={v.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-white font-bold text-lg leading-none">{v.nomeExibicao}</span>
                      <span className="text-xs text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded shrink-0">
                        R{v.regiao}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          v.temLeads
                            ? "bg-cyan-500/15 text-cyan-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {v.temLeads ? "Carteira + Leads" : "Somente Carteira"}
                      </span>
                    </div>

                    {confirmId === v.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">Confirmar?</span>
                        <button
                          onClick={() => confirmarDelete(v.id)}
                          className="text-xs bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-lg transition-colors"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs text-slate-400 hover:text-white px-1 transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(v.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500">Carteira: </span>
                      <code className="text-slate-300 font-mono">{v.carteira.apiNome}</code>
                    </div>
                    {v.temLeads && (
                      <div>
                        <span className="text-slate-500">Leads: </span>
                        <code className="text-slate-300 font-mono">{v.leads.apiNome}</code>
                      </div>
                    )}
                  </div>

                  {v._new && (
                    <span className="mt-3 inline-block text-[11px] bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
                      novo — aguardando salvar
                    </span>
                  )}
                </div>
              ))}

              {ativos.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center h-40 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
                  <Users size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">Nenhum vendedor ativo. Adicione um.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Aba: Metas ───────────────────────────────────────────────── */}
        {aba === "metas" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {ativos.map((v) => (
              <div key={v.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-700 bg-slate-800/80 flex items-center gap-2">
                  <h2 className="text-white font-bold text-lg">{v.nomeExibicao}</h2>
                  <span className="text-xs text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">
                    Região {v.regiao}
                  </span>
                </div>

                <div className={`p-5 grid gap-5 ${v.temLeads ? "grid-cols-2" : "grid-cols-1"}`}>
                  {/* Carteira */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      <span className="text-xs font-bold text-slate-300 tracking-wider">CARTEIRA</span>
                    </div>
                    <CampoMeta
                      label="Meta" destaque
                      value={formMetas[v.id]?.carteira.meta ?? "0,00"}
                      onChange={(val) => setMetaField(v.id, "carteira", "meta", val)}
                    />
                    <CampoMeta
                      label="Super Meta"
                      value={formMetas[v.id]?.carteira.superMeta ?? "0,00"}
                      onChange={(val) => setMetaField(v.id, "carteira", "superMeta", val)}
                    />
                    <CampoMeta
                      label="Meta Amolim"
                      value={formMetas[v.id]?.carteira.metaAmolim ?? "0,00"}
                      onChange={(val) => setMetaField(v.id, "carteira", "metaAmolim", val)}
                    />
                  </div>

                  {/* Leads */}
                  {v.temLeads && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                        <span className="text-xs font-bold text-slate-300 tracking-wider">LEADS</span>
                      </div>
                      <CampoMeta
                        label="Meta" destaque
                        value={formMetas[v.id]?.leads.meta ?? "0,00"}
                        onChange={(val) => setMetaField(v.id, "leads", "meta", val)}
                      />
                      <CampoMeta
                        label="Super Meta"
                        value={formMetas[v.id]?.leads.superMeta ?? "0,00"}
                        onChange={(val) => setMetaField(v.id, "leads", "superMeta", val)}
                      />
                      <CampoMeta
                        label="Meta Amolim"
                        value={formMetas[v.id]?.leads.metaAmolim ?? "0,00"}
                        onChange={(val) => setMetaField(v.id, "leads", "metaAmolim", val)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {ativos.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center h-40 text-slate-500">
                <Target size={32} className="mb-2 opacity-40" />
                <p className="text-sm">Nenhum vendedor ativo.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Aba: Bônus ───────────────────────────────────────────────── */}
        {aba === "bonus" && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Gift size={48} className="text-slate-600 mb-4" />
            <h2 className="text-slate-300 font-semibold text-lg">Configuração de Bônus</h2>
            <p className="text-slate-500 text-sm mt-1">Em desenvolvimento — disponível em breve</p>
          </div>
        )}
      </div>

      {/* ── Barra de salvar (sticky) ──────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700 px-6 py-4 flex items-center justify-between z-10">
        <span className="text-xs text-slate-400">
          {ativos.length} vendedor{ativos.length !== 1 ? "es" : ""} ativos
          {deletar.size > 0 && ` — ${deletar.size} serão removidos`}
          {lista.some((v) => v._new && !deletar.has(v.id)) && " — novos incluídos"}
        </span>
        <button
          onClick={handleSalvar}
          disabled={status === "salvando"}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {status === "salvando" ? (
            <><Loader2 size={16} className="animate-spin" /> Salvando...</>
          ) : (
            <><Save size={16} /> Salvar alterações</>
          )}
        </button>
      </div>

      {/* ── Modal: Novo Vendedor ──────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">Novo Vendedor</h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {novoErro && (
              <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {novoErro}
              </div>
            )}

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Nome de exibição</label>
                <input
                  type="text"
                  value={novoForm.nomeExibicao}
                  onChange={(e) => setNovoForm((p) => ({ ...p, nomeExibicao: e.target.value }))}
                  placeholder="Ex: Fernanda"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Região */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Região</label>
                <input
                  type="number"
                  value={novoForm.regiao}
                  onChange={(e) => setNovoForm((p) => ({ ...p, regiao: e.target.value }))}
                  placeholder="Ex: 4"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* API Nome Carteira */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">API Nome — Carteira</label>
                <input
                  type="text"
                  value={novoForm.carteiraApiNome}
                  onChange={(e) => setNovoForm((p) => ({ ...p, carteiraApiNome: e.target.value }))}
                  placeholder="Ex: REGIAO 4 CARTEIRA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Nome exato do vendedor na API do ERP</p>
              </div>

              {/* Tem Leads */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Tem Leads?</label>
                <div className="flex gap-3">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => setNovoForm((p) => ({ ...p, temLeads: v }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        novoForm.temLeads === v
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      }`}
                    >
                      {v ? "Sim" : "Não"}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Nome Leads */}
              {novoForm.temLeads && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">API Nome — Leads</label>
                  <input
                    type="text"
                    value={novoForm.leadsApiNome}
                    onChange={(e) => setNovoForm((p) => ({ ...p, leadsApiNome: e.target.value }))}
                    placeholder="Ex: REGIAO 4 LEADS"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarVendedor}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

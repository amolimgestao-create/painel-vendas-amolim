"use client"

import { useState } from "react"
import { VENDEDORES, VendedorConfig } from "@/lib/metas"
import { formatarMoeda } from "@/lib/utils"
import Link from "next/link"
import { ArrowLeft, Lock, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

type FormMetas = {
  [id: string]: {
    carteira: { meta: string; superMeta: string; metaAmolim: string }
    leads: { meta: string; superMeta: string; metaAmolim: string }
  }
}

function parseBRL(valor: string): number {
  return parseFloat(valor.replace(/\./g, "").replace(",", ".")) || 0
}

function formatInput(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function initForm(): FormMetas {
  const form: FormMetas = {}
  VENDEDORES.forEach((v) => {
    form[v.id] = {
      carteira: {
        meta: formatInput(v.carteira.meta),
        superMeta: formatInput(v.carteira.superMeta),
        metaAmolim: formatInput(v.carteira.metaAmolim),
      },
      leads: {
        meta: formatInput(v.leads.meta),
        superMeta: formatInput(v.leads.superMeta),
        metaAmolim: formatInput(v.leads.metaAmolim),
      },
    }
  })
  return form
}

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

export default function AdminPage() {
  const [etapa, setEtapa] = useState<"login" | "form">("login")
  const [senha, setSenha] = useState("")
  const [senhaErro, setSenhaErro] = useState(false)
  const [form, setForm] = useState<FormMetas>(initForm)
  const [status, setStatus] = useState<"idle" | "salvando" | "sucesso" | "erro">("idle")
  const [erroMsg, setErroMsg] = useState("")

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (senha.trim() === "") return
    setSenhaErro(false)
    setEtapa("form")
  }

  function setField(
    id: string,
    bucket: "carteira" | "leads",
    campo: "meta" | "superMeta" | "metaAmolim",
    valor: string
  ) {
    setForm((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [bucket]: { ...prev[id][bucket], [campo]: valor },
      },
    }))
  }

  async function handleSalvar() {
    setStatus("salvando")
    setErroMsg("")

    const vendedores = VENDEDORES.map((v) => ({
      id: v.id,
      nomeExibicao: v.nomeExibicao,
      regiao: v.regiao,
      carteira: {
        meta: parseBRL(form[v.id].carteira.meta),
        superMeta: parseBRL(form[v.id].carteira.superMeta),
        metaAmolim: parseBRL(form[v.id].carteira.metaAmolim),
      },
      leads: {
        meta: parseBRL(form[v.id].leads.meta),
        superMeta: parseBRL(form[v.id].leads.superMeta),
        metaAmolim: parseBRL(form[v.id].leads.metaAmolim),
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
      setErroMsg("Erro de conexão. Verifique a internet.")
    }
  }

  // Tela de login
  if (etapa === "login") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <Lock size={20} className="text-slate-400" />
            <div>
              <h1 className="text-white font-bold text-lg">Atualizar Metas</h1>
              <p className="text-slate-400 text-xs">Painel Admin — Amolim</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Entrar
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

  // Tela de sucesso
  if (status === "sucesso") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Metas atualizadas!</h2>
          <p className="text-slate-400 text-sm mb-6">
            O painel será atualizado automaticamente em cerca de 2 minutos.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors block text-center"
            >
              Ver painel
            </Link>
            <button
              onClick={() => { setStatus("idle"); setForm(initForm()) }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Atualizar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Formulário
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setEtapa("login")}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-white font-bold text-xl">Atualizar Metas</h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Edite os valores e clique em Salvar — o painel atualiza em ~2 minutos
            </p>
          </div>
        </div>

        {status === "erro" && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
            <AlertCircle size={16} />
            {erroMsg}
          </div>
        )}

        {/* Cards por vendedor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {VENDEDORES.map((v) => (
            <div key={v.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              {/* Header do card */}
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
                    label="Meta"
                    value={form[v.id].carteira.meta}
                    onChange={(val) => setField(v.id, "carteira", "meta", val)}
                    destaque
                  />
                  <CampoMeta
                    label="Super Meta"
                    value={form[v.id].carteira.superMeta}
                    onChange={(val) => setField(v.id, "carteira", "superMeta", val)}
                  />
                  <CampoMeta
                    label="Meta Amolim"
                    value={form[v.id].carteira.metaAmolim}
                    onChange={(val) => setField(v.id, "carteira", "metaAmolim", val)}
                  />
                </div>

                {/* Leads — oculto quando vendor não tem leads */}
                {v.temLeads && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" />
                      <span className="text-xs font-bold text-slate-300 tracking-wider">LEADS</span>
                    </div>
                    <CampoMeta
                      label="Meta"
                      value={form[v.id].leads.meta}
                      onChange={(val) => setField(v.id, "leads", "meta", val)}
                      destaque
                    />
                    <CampoMeta
                      label="Super Meta"
                      value={form[v.id].leads.superMeta}
                      onChange={(val) => setField(v.id, "leads", "superMeta", val)}
                    />
                    <CampoMeta
                      label="Meta Amolim"
                      value={form[v.id].leads.metaAmolim}
                      onChange={(val) => setField(v.id, "leads", "metaAmolim", val)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botão salvar inferior */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSalvar}
            disabled={status === "salvando"}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            {status === "salvando" ? (
              <><Loader2 size={16} className="animate-spin" /> Salvando...</>
            ) : (
              <><Save size={16} /> Salvar metas</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

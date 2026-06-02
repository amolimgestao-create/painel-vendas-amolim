"use client"

import { useState } from "react"
import Link from "next/link"
import { VENDEDORES } from "@/lib/metas"
import { ArrowLeft, Search } from "lucide-react"

export default function SelecionarVendedor() {
  const [busca, setBusca] = useState("")

  const filtrados = VENDEDORES.filter((v) =>
    v.nomeExibicao.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Painel geral
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Selecione o vendedor</h1>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex flex-col gap-3">
          {filtrados.map((v) => (
            <Link
              key={v.id}
              href={`/vendedor/${v.id}`}
              className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 flex items-center justify-between hover:bg-slate-700 hover:border-slate-500 transition-all"
            >
              <span className="text-white font-medium">{v.nomeExibicao}</span>
              <span className="text-xs text-slate-400 border border-slate-600 px-2 py-0.5 rounded">
                Região {v.regiao}
              </span>
            </Link>
          ))}
          {filtrados.length === 0 && (
            <p className="text-slate-500 text-center py-8">Nenhum vendedor encontrado.</p>
          )}
        </div>
      </div>
    </div>
  )
}

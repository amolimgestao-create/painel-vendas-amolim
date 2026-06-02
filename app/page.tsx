"use client"

import useSWR from "swr"
import { useEffect, useState } from "react"
import { Maximize2 } from "lucide-react"
import { processarPedidos } from "@/lib/processarPedidos"
import { getMesAtual, formatarMoeda } from "@/lib/utils"
import { Pedido, BucketStats, VendedorStats } from "@/lib/types"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const MEDALHAS = ["🥇", "🥈", "🥉", ""]

function statusCor(pct: number) {
  if (pct >= 100) return { bar: "bg-green-500", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/40" }
  if (pct >= 80) return { bar: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/40" }
  return { bar: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" }
}

function BucketMini({ bucket, label }: { bucket: BucketStats; label: string }) {
  const pct = Math.min(bucket.percentualMeta, 100)
  const cor = statusCor(bucket.percentualMeta)
  const atingiu = bucket.percentualMeta >= 100

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-slate-400">{label}</span>
        {atingiu ? (
          <span className="text-xs font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full">META ✓</span>
        ) : (
          <span className={`text-xs font-bold ${cor.text}`}>{bucket.percentualMeta.toFixed(1)}%</span>
        )}
      </div>

      <div className="text-2xl font-extrabold text-white leading-none">
        {formatarMoeda(bucket.totalFaturado)}
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-700 ${cor.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Meta: {formatarMoeda(bucket.meta)}</span>
        {!atingiu && (
          <span className={`font-semibold ${cor.text}`}>
            faltam {formatarMoeda(bucket.faltaParaMeta)}
          </span>
        )}
      </div>
    </div>
  )
}

function CardVendedor({ stats, posicao }: { stats: VendedorStats; posicao: number }) {
  const cor = statusCor(stats.percentualMetaTotal)
  const ambosNaMeta = stats.carteira.percentualMeta >= 100 && stats.leads.percentualMeta >= 100

  return (
    <Link href={`/vendedor/${stats.id}`} className="block">
      <div className={`bg-slate-800 rounded-2xl border-2 ${cor.border} overflow-hidden hover:brightness-110 transition-all`}>
        {/* Header */}
        <div className={`px-5 py-3 flex items-center justify-between ${cor.bg} border-b border-slate-700`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{MEDALHAS[posicao] || ""}</span>
            <span className="text-lg font-extrabold text-white">{stats.nomeExibicao}</span>
            <span className="text-xs text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">R{stats.regiao}</span>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black ${cor.text}`}>
              {stats.percentualMetaTotal.toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400">do total</div>
          </div>
        </div>

        {/* Total geral */}
        <div className="px-5 py-3 flex items-baseline gap-2 border-b border-slate-700/50">
          <span className="text-3xl font-black text-white">{formatarMoeda(stats.totalGeral)}</span>
          <span className="text-sm text-slate-400">/ {formatarMoeda(stats.metaTotal)}</span>
          {ambosNaMeta && (
            <span className="ml-auto text-xs font-bold text-green-400 bg-green-500/15 px-2 py-1 rounded-lg">
              DENTRO DA META
            </span>
          )}
        </div>

        {/* Buckets */}
        <div className="grid grid-cols-2 divide-x divide-slate-700">
          <BucketMini bucket={stats.carteira} label="CARTEIRA" />
          <BucketMini bucket={stats.leads} label="LEADS" />
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-slate-700">
        <div className="h-5 bg-slate-700 rounded w-1/3" />
      </div>
      <div className="px-5 py-3 border-b border-slate-700">
        <div className="h-8 bg-slate-700 rounded w-1/2" />
      </div>
      <div className="grid grid-cols-2 divide-x divide-slate-700">
        <div className="p-4 space-y-2">
          <div className="h-3 bg-slate-700 rounded w-1/3" />
          <div className="h-6 bg-slate-700 rounded w-2/3" />
          <div className="h-2 bg-slate-700 rounded" />
        </div>
        <div className="p-4 space-y-2">
          <div className="h-3 bg-slate-700 rounded w-1/3" />
          <div className="h-6 bg-slate-700 rounded w-2/3" />
          <div className="h-2 bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function PainelGeral() {
  const [agora, setAgora] = useState(new Date())
  const { criacaoIni, criacaoFim } = getMesAtual()
  const intervalo = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || "300000")

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const { data: pedidos, isLoading, error } = useSWR<Pedido[]>(
    `/api/pedidos?criacaoIni=${criacaoIni}&criacaoFim=${criacaoFim}`,
    fetcher,
    { refreshInterval: intervalo }
  )

  const stats = pedidos && !error
    ? processarPedidos(pedidos).sort((a, b) => b.percentualMetaTotal - a.percentualMetaTotal)
    : []

  const totalGeral = stats.reduce((acc, s) => acc + s.totalGeral, 0)
  const metaGeral = stats.reduce((acc, s) => acc + s.metaTotal, 0)
  const pctGeral = metaGeral > 0 ? (totalGeral / metaGeral) * 100 : 0
  const dentroMeta = stats.filter((s) => s.carteira.percentualMeta >= 100 && s.leads.percentualMeta >= 100).length

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
        <div>
          <h1 className="text-2xl font-black tracking-widest text-white">AMOLIM</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Painel Comercial — {criacaoIni.substring(0, 7).replace("-", "/")}
          </p>
        </div>

        {/* Resumo geral */}
        {!isLoading && stats.length > 0 && (
          <div className="hidden md:flex items-center gap-6 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Total equipe</div>
              <div className="text-lg font-black text-white">{formatarMoeda(totalGeral)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Meta geral</div>
              <div className={`text-lg font-black ${pctGeral >= 100 ? "text-green-400" : pctGeral >= 80 ? "text-yellow-400" : "text-red-400"}`}>
                {pctGeral.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Dentro da meta</div>
              <div className="text-lg font-black text-white">{dentroMeta}/{stats.length}</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-mono text-white">{agora.toLocaleTimeString("pt-BR")}</div>
            <div className="text-xs text-slate-400">
              {agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300"
            title="Tela cheia"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </header>

      {/* Grid de cards */}
      <main className="flex-1 p-6">
        {error && (
          <div className="text-center text-red-400 py-20 text-lg">
            Erro ao carregar dados da API. Verifique a conexão com o servidor.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : stats.map((s, i) => <CardVendedor key={s.id} stats={s} posicao={i} />)}
        </div>

        {/* Barra de progresso geral */}
        {!isLoading && stats.length > 0 && (
          <div className="mt-5 bg-slate-800 rounded-2xl p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400 font-medium">Progresso geral da equipe</span>
              <span className={`text-sm font-bold ${pctGeral >= 100 ? "text-green-400" : pctGeral >= 80 ? "text-yellow-400" : "text-red-400"}`}>
                {formatarMoeda(totalGeral)} — {pctGeral.toFixed(1)}% da meta de {formatarMoeda(metaGeral)}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${pctGeral >= 100 ? "bg-green-500" : pctGeral >= 80 ? "bg-yellow-400" : "bg-red-500"}`}
                style={{ width: `${Math.min(pctGeral, 100)}%` }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-8 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>Atualiza a cada {intervalo / 60000} minutos</span>
        <Link href="/vendedor" className="hover:text-slate-300 transition-colors">
          Ver painel individual →
        </Link>
      </footer>
    </div>
  )
}

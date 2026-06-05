"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import Link from "next/link"
import { use } from "react"
import { ArrowLeft } from "lucide-react"
import { VENDEDORES } from "@/lib/metas"
import { processarPedidos } from "@/lib/processarPedidos"
import {
  getMesAtual,
  getMesAnterior,
  formatarMoeda,
  formatarMesAno,
  buildCumulativeChart,
  getDiasNoMes,
  getDiaAtual,
  getMesStr,
} from "@/lib/utils"
import { Pedido } from "@/lib/types"

// Recharts com SSR desabilitado — obrigatório no Next.js
const ComposedChart = dynamic(() => import("recharts").then((m) => m.ComposedChart), { ssr: false })
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false })
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false })
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false })
const ReferenceLine = dynamic(() => import("recharts").then((m) => m.ReferenceLine), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false })

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function mensagem(pct: number) {
  if (pct >= 100) return "Meta batida! Parabéns!"
  if (pct >= 80) return "Quase lá, continue!"
  if (pct >= 50) return "Bom ritmo, acelera!"
  return "Vamos nessa!"
}

function KpiCard({
  titulo,
  valor,
  sub,
  destaque,
}: {
  titulo: string
  valor: string
  sub?: string
  destaque?: "verde" | "amarelo" | "vermelho"
}) {
  const corSub =
    destaque === "verde"
      ? "text-green-400"
      : destaque === "amarelo"
      ? "text-yellow-400"
      : destaque === "vermelho"
      ? "text-[#66BB6A]"
      : "text-slate-400"

  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col gap-1">
      <p className="text-xs text-slate-400 font-medium">{titulo}</p>
      <p className="text-2xl font-black text-white leading-none">{valor}</p>
      {sub && <p className={`text-xs font-semibold mt-0.5 ${corSub}`}>{sub}</p>}
    </div>
  )
}

export default function PainelVendedor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const config = VENDEDORES.find((v) => v.id === id)

  const mesAtual = getMesAtual()
  const mesAnterior = getMesAnterior()
  const intervalo = parseInt(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || "300000")

  const { data: pedidosAtual, isLoading: loadAtual } = useSWR<Pedido[]>(
    `/api/pedidos?criacaoIni=${mesAtual.criacaoIni}&criacaoFim=${mesAtual.criacaoFim}`,
    fetcher,
    { refreshInterval: intervalo }
  )

  const { data: pedidosAnterior, isLoading: loadAnterior } = useSWR<Pedido[]>(
    `/api/pedidos?criacaoIni=${mesAnterior.criacaoIni}&criacaoFim=${mesAnterior.criacaoFim}`,
    fetcher
  )

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-2">Vendedor não encontrado.</p>
          <Link href="/vendedor" className="text-blue-400 hover:underline">Voltar</Link>
        </div>
      </div>
    )
  }

  const statsAtual = pedidosAtual ? processarPedidos(pedidosAtual).find((s) => s.id === id) : null
  const statsAnterior = pedidosAnterior ? processarPedidos(pedidosAnterior).find((s) => s.id === id) : null

  const isLoading = loadAtual || loadAnterior
  const temLeads = config.temLeads
  const pctTotal = statsAtual?.percentualMetaTotal || 0
  const pctCarteira = statsAtual?.carteira.percentualMeta || 0
  const pctLeads = statsAtual?.leads.percentualMeta || 0

  function corStatus(pct: number): "verde" | "amarelo" | "vermelho" {
    if (pct >= 100) return "verde"
    if (pct >= 80) return "amarelo"
    return "vermelho"
  }

  // Dados do gráfico cumulativo
  const hoje = new Date()
  const diasNoMes = getDiasNoMes(hoje.getFullYear(), hoje.getMonth() + 1)
  const diaAtual = getDiaAtual()
  const mesStr = getMesStr()

  const chartData =
    statsAtual
      ? buildCumulativeChart(
          statsAtual.carteira.vendasPorDia,
          statsAtual.leads.vendasPorDia,
          config.carteira.meta,
          config.leads.meta,
          diasNoMes,
          diaAtual,
          mesStr
        )
      : []

  const variacao =
    statsAnterior && statsAnterior.totalGeral > 0
      ? (((statsAtual?.totalGeral || 0) - statsAnterior.totalGeral) / statsAnterior.totalGeral) * 100
      : null

  return (
    <div className="min-h-screen bg-slate-900 p-6 flex flex-col gap-5 max-w-5xl mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <Link href="/vendedor" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} /> Todos os vendedores
        </Link>
        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
          Painel geral
        </Link>
      </div>

      {/* Título */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">{config.nomeExibicao}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Região {config.regiao} — {mensagem(pctTotal)}
          </p>
        </div>
        {!isLoading && statsAtual && (
          <div className="text-right">
            <div className="text-xs text-slate-400 mb-1">Total {formatarMesAno(mesAtual.criacaoIni.substring(0, 7))}</div>
            <div className={`text-4xl font-black ${
              pctTotal >= 100 ? "text-green-400" : pctTotal >= 80 ? "text-yellow-400" : "text-[#66BB6A]"
            }`}>
              {pctTotal.toFixed(1)}%
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              titulo="Carteira"
              valor={formatarMoeda(statsAtual?.carteira.totalFaturado || 0)}
              sub={
                pctCarteira >= 100
                  ? "META ATINGIDA ✓"
                  : `${pctCarteira.toFixed(1)}% — faltam ${formatarMoeda(statsAtual?.carteira.faltaParaMeta || 0)}`
              }
              destaque={corStatus(pctCarteira)}
            />
            {temLeads && (
              <KpiCard
                titulo="Leads"
                valor={formatarMoeda(statsAtual?.leads.totalFaturado || 0)}
                sub={
                  pctLeads >= 100
                    ? "META ATINGIDA ✓"
                    : `${pctLeads.toFixed(1)}% — faltam ${formatarMoeda(statsAtual?.leads.faltaParaMeta || 0)}`
                }
                destaque={corStatus(pctLeads)}
              />
            )}
            <KpiCard
              titulo="Ticket Médio"
              valor={formatarMoeda(
                statsAtual
                  ? (statsAtual.carteira.ticketMedio * statsAtual.carteira.numeroPedidos +
                      (temLeads ? statsAtual.leads.ticketMedio * statsAtual.leads.numeroPedidos : 0)) /
                      Math.max(statsAtual.carteira.numeroPedidos + (temLeads ? statsAtual.leads.numeroPedidos : 0), 1)
                  : 0
              )}
              sub={`${(statsAtual?.carteira.numeroPedidos || 0) + (temLeads ? (statsAtual?.leads.numeroPedidos || 0) : 0)} pedidos`}
            />
            <KpiCard
              titulo="Total Geral"
              valor={formatarMoeda(statsAtual?.totalGeral || 0)}
              sub={`meta ${formatarMoeda(config.carteira.meta + (temLeads ? config.leads.meta : 0))}`}
              destaque={corStatus(pctTotal)}
            />
          </div>

          {/* Gráficos: Carteira (sempre) + Leads (se temLeads) */}
          {chartData.length > 0 && (
            <div className={`grid grid-cols-1 ${temLeads ? "md:grid-cols-2" : ""} gap-4`}>
              {/* Gráfico Carteira */}
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Carteira — evolução acumulada</h2>
                  <div className="text-xs text-slate-400">Meta: {formatarMoeda(config.carteira.meta)}</div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="dia" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [
                        formatarMoeda(Number(v)),
                        name === "acumuladoCarteira" ? "Carteira acum." : "Meta esperada",
                      ]}
                      labelFormatter={(v) => `Dia ${v}`}
                    />
                    <ReferenceLine
                      y={config.carteira.meta}
                      stroke="#22c55e"
                      strokeDasharray="6 3"
                      strokeOpacity={0.4}
                      label={{ value: "Meta", fill: "#22c55e", fontSize: 10, position: "insideTopRight" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="acumuladoCarteira"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="metaCarteiraPace"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico Leads — só se temLeads */}
              {temLeads && <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">Leads — evolução acumulada</h2>
                  <div className="text-xs text-slate-400">Meta: {formatarMoeda(config.leads.meta)}</div>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="dia" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={55}
                    />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [
                        formatarMoeda(Number(v)),
                        name === "acumuladoLeads" ? "Leads acum." : "Meta esperada",
                      ]}
                      labelFormatter={(v) => `Dia ${v}`}
                    />
                    <ReferenceLine
                      y={config.leads.meta}
                      stroke="#22c55e"
                      strokeDasharray="6 3"
                      strokeOpacity={0.4}
                      label={{ value: "Meta", fill: "#22c55e", fontSize: 10, position: "insideTopRight" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="acumuladoLeads"
                      fill="#06b6d4"
                      fillOpacity={0.6}
                      stroke="#06b6d4"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="metaLeadsPace"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>}
            </div>
          )}

          {/* Barras de progresso detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Carteira", stats: statsAtual?.carteira, meta: config.carteira },
              ...(temLeads ? [{ label: "Leads", stats: statsAtual?.leads, meta: config.leads }] : []),
            ].map(({ label, stats: b, meta: m }) => {
              if (!b) return null
              const pct = Math.min(b.percentualMeta, 100)
              const cor =
                b.percentualMeta >= 100
                  ? "bg-green-500"
                  : b.percentualMeta >= 80
                  ? "bg-yellow-400"
                  : "bg-[#2E7D32]"
              return (
                <div key={label} className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm tracking-wider">{label.toUpperCase()}</span>
                    <span className={`text-sm font-bold ${b.percentualMeta >= 100 ? "text-green-400" : b.percentualMeta >= 80 ? "text-yellow-400" : "text-[#66BB6A]"}`}>
                      {b.percentualMeta.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-4">
                    <div className={`h-4 rounded-full transition-all duration-700 ${cor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 text-center text-xs">
                    <div>
                      <p className="text-slate-400">Faturado</p>
                      <p className="font-bold text-white">{formatarMoeda(b.totalFaturado)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Meta</p>
                      <p className="font-bold text-white">{formatarMoeda(m.meta)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">{b.percentualMeta >= 100 ? "Excedente" : "Falta"}</p>
                      <p className={`font-bold ${b.percentualMeta >= 100 ? "text-green-400" : "text-[#66BB6A]"}`}>
                        {formatarMoeda(b.percentualMeta >= 100 ? b.totalFaturado - m.meta : b.faltaParaMeta)}
                      </p>
                    </div>
                  </div>
                  {/* Super meta e Meta Amolim */}
                  <div className="flex gap-2 text-xs">
                    <span className="text-slate-500">Super Meta: {formatarMoeda(m.superMeta)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-500">Meta Amolim: {formatarMoeda(m.metaAmolim)}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparativo mês anterior */}
          {statsAnterior && (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-400 mb-4">
                Comparativo — {formatarMesAno(mesAnterior.criacaoIni.substring(0, 7))}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Mês anterior</p>
                  <p className="text-lg font-bold text-slate-300">{formatarMoeda(statsAnterior.totalGeral)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Mês atual</p>
                  <p className="text-lg font-bold text-white">{formatarMoeda(statsAtual?.totalGeral || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Variação</p>
                  {variacao !== null ? (
                    <p className={`text-lg font-bold ${variacao >= 0 ? "text-green-400" : "text-[#66BB6A]"}`}>
                      {variacao >= 0 ? "+" : ""}{variacao.toFixed(1)}%
                    </p>
                  ) : (
                    <p className="text-lg font-bold text-slate-500">—</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

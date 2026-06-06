"use client"

import useSWR from "swr"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { Maximize2 } from "lucide-react"
import { processarPedidos } from "@/lib/processarPedidos"
import { getMesAtual, formatarMoeda, getDiasNoMes, getDiaAtual, getMesStr } from "@/lib/utils"
import { Pedido, BucketStats, VendedorStats } from "@/lib/types"
import { VENDEDORES } from "@/lib/metas"
import Link from "next/link"

const ComposedChart = dynamic(() => import("recharts").then((m) => m.ComposedChart), { ssr: false })
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false })
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false })
const ReferenceLine = dynamic(() => import("recharts").then((m) => m.ReferenceLine), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false })

const A_BLUE = "#1565C0"
const A_BLUE_L = "#1E88E5"
const A_GREEN = "#43A047"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function statusCor(pct: number) {
  if (pct >= 100) return { bar: "bg-green-500", text: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/40" }
  if (pct >= 80) return { bar: "bg-yellow-400", text: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/40" }
  return { bar: "bg-[#2E7D32]", text: "text-[#66BB6A]", bg: "bg-[#2E7D32]/10", border: "border-[#2E7D32]/40" }
}

function buildTeamChart(
  stats: VendedorStats[],
  metaTotal: number,
  diasNoMes: number,
  diaAtual: number,
  mesStr: string
) {
  const mapDia: Record<string, number> = {}
  stats.forEach((s) => {
    ;[...s.carteira.vendasPorDia, ...s.leads.vendasPorDia].forEach((v) => {
      mapDia[v.dia] = (mapDia[v.dia] || 0) + v.total
    })
  })
  let cum = 0
  return Array.from({ length: diaAtual }, (_, i) => {
    const d = i + 1
    const key = String(d).padStart(2, "0") + "/" + mesStr
    cum += mapDia[key] || 0
    return {
      dia: d,
      total: Math.round(cum),
      metaPace: Math.round((metaTotal * d) / diasNoMes),
    }
  })
}

function BucketMini({ bucket, label }: { bucket: BucketStats; label: string }) {
  const pct = Math.min(bucket.percentualMeta, 100)
  const cor = statusCor(bucket.percentualMeta)
  const atingiu = bucket.percentualMeta >= 100
  const semMeta = bucket.meta === 0

  return (
    <div className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold tracking-widest text-slate-400">{label}</span>
        {semMeta ? (
          <span className="text-xs text-slate-500">sem meta</span>
        ) : atingiu ? (
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
          className={`h-2.5 rounded-full transition-all duration-700 ${semMeta ? "bg-slate-600" : cor.bar}`}
          style={{ width: semMeta ? 0 : `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{semMeta ? "—" : `Meta: ${formatarMoeda(bucket.meta)}`}</span>
        {!atingiu && !semMeta && (
          <span className={`font-semibold ${cor.text}`}>faltam {formatarMoeda(bucket.faltaParaMeta)}</span>
        )}
      </div>
    </div>
  )
}

function CardVendedor({ stats, temLeads }: { stats: VendedorStats; temLeads: boolean }) {
  const cor = statusCor(stats.percentualMetaTotal)
  const naMeta = temLeads
    ? stats.carteira.percentualMeta >= 100 && stats.leads.percentualMeta >= 100
    : stats.carteira.percentualMeta >= 100

  return (
    <Link href={`/vendedor/${stats.id}`} className="block">
      <div className={`bg-slate-800 rounded-2xl border-2 ${cor.border} overflow-hidden hover:brightness-110 transition-all`}>
        <div className={`px-5 py-3 flex items-center justify-between ${cor.bg} border-b border-slate-700`}>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-white">{stats.nomeExibicao}</span>
            <span className="text-xs text-slate-400 border border-slate-600 px-1.5 py-0.5 rounded">R{stats.regiao}</span>
          </div>
          <div className="text-right">
            <div className={`text-xl font-black ${cor.text}`}>{stats.percentualMetaTotal.toFixed(1)}%</div>
            <div className="text-xs text-slate-400">do total</div>
          </div>
        </div>

        <div className="px-5 py-3 flex items-baseline gap-2 border-b border-slate-700/50">
          <span className="text-3xl font-black text-white">{formatarMoeda(stats.totalGeral)}</span>
          <span className="text-sm text-slate-400">/ {formatarMoeda(stats.metaTotal)}</span>
          {naMeta && (
            <span className="ml-auto text-xs font-bold text-green-400 bg-green-500/15 px-2 py-1 rounded-lg">
              DENTRO DA META
            </span>
          )}
        </div>

        {temLeads ? (
          <div className="grid grid-cols-2 divide-x divide-slate-700">
            <BucketMini bucket={stats.carteira} label="CARTEIRA" />
            <BucketMini bucket={stats.leads} label="LEADS" />
          </div>
        ) : (
          <BucketMini bucket={stats.carteira} label="CARTEIRA" />
        )}
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-2xl border-2 border-slate-700 overflow-hidden animate-pulse">
      <div className="px-5 py-3 border-b border-slate-700"><div className="h-5 bg-slate-700 rounded w-1/3" /></div>
      <div className="px-5 py-3 border-b border-slate-700"><div className="h-8 bg-slate-700 rounded w-1/2" /></div>
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

  const vendedorConfigs = new Map(VENDEDORES.map((v) => [v.id, v]))

  const stats = pedidos && !error
    ? processarPedidos(pedidos).sort((a, b) => a.regiao - b.regiao)
    : []

  const totalGeral = stats.reduce((acc, s) => acc + s.totalGeral, 0)
  const metaGeral = stats.reduce((acc, s) => acc + s.metaTotal, 0)
  const pctGeral = metaGeral > 0 ? (totalGeral / metaGeral) * 100 : 0
  const dentroMeta = stats.filter((s) => {
    const cfg = vendedorConfigs.get(s.id)
    if (!cfg) return false
    return cfg.temLeads
      ? s.carteira.percentualMeta >= 100 && s.leads.percentualMeta >= 100
      : s.carteira.percentualMeta >= 100
  }).length

  const hoje = new Date()
  const diasNoMes = getDiasNoMes(hoje.getFullYear(), hoje.getMonth() + 1)
  const diaAtual = getDiaAtual()
  const mesStr = getMesStr()
  const teamChartData = stats.length > 0
    ? buildTeamChart(stats, metaGeral, diasNoMes, diaAtual, mesStr)
    : []

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  const corPct = pctGeral >= 100 ? "text-green-400" : pctGeral >= 80 ? "text-yellow-400" : "text-[#66BB6A]"
  const barPct = pctGeral >= 100 ? "bg-green-500" : pctGeral >= 80 ? "bg-yellow-400" : "bg-[#2E7D32]"

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" style={{ borderTop: `4px solid ${A_BLUE}` }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-700/80 bg-slate-900/95 backdrop-blur">
        <div>
          <div style={{
            background: "radial-gradient(ellipse 120% 200% at 50% 50%, rgba(255,255,255,0.92) 25%, rgba(255,255,255,0.55) 55%, rgba(255,255,255,0.08) 80%, transparent 100%)",
            borderRadius: "10px",
            padding: "5px 14px",
            display: "inline-block",
          }}>
            <img
              src="https://www.amolim.com.br/wp-content/uploads/2025/08/LOGO-AMOLIM-e1755694381428.png"
              alt="Amolim"
              className="h-11 w-auto block"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Painel Comercial — {criacaoIni.substring(0, 7).replace("-", "/")}
          </p>
        </div>

        {!isLoading && stats.length > 0 && (
          <div className="hidden md:flex items-center gap-6 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Total equipe</div>
              <div className="text-lg font-black text-white">{formatarMoeda(totalGeral)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Meta geral</div>
              <div className={`text-lg font-black ${corPct}`}>{pctGeral.toFixed(1)}%</div>
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

      <main className="flex-1 p-6 space-y-5">
        {error && (
          <div className="text-center text-[#66BB6A] py-20 text-lg">
            Erro ao carregar dados da API. Verifique a conexão com o servidor.
          </div>
        )}

        {/* Cards dos vendedores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : stats.map((s) => (
                <CardVendedor
                  key={s.id}
                  stats={s}
                  temLeads={vendedorConfigs.get(s.id)?.temLeads ?? true}
                />
              ))}
        </div>

        {!isLoading && stats.length > 0 && (
          <>
            {/* Barra de progresso geral */}
            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400 font-medium">Progresso geral da equipe</span>
                <span className={`text-sm font-bold ${corPct}`}>
                  {formatarMoeda(totalGeral)} — {pctGeral.toFixed(1)}% da meta de {formatarMoeda(metaGeral)}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${barPct}`}
                  style={{ width: `${Math.min(pctGeral, 100)}%` }}
                />
              </div>
            </div>

            {/* Gráfico de progressão diária da equipe */}
            {teamChartData.length > 0 && (
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-white">Progressão diária da equipe</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Acumulado realizado vs. ritmo esperado da meta</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={teamChartData} margin={{ top: 8, right: 232, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="dia" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [
                        formatarMoeda(Number(v)),
                        name === "total" ? "Realizado" : "Meta esperada",
                      ]}
                      labelFormatter={(v) => `Dia ${v}`}
                    />
                    <ReferenceLine
                      y={metaGeral}
                      stroke={A_GREEN}
                      strokeDasharray="6 3"
                      strokeOpacity={0.35}
                      label={{ value: "Meta", fill: A_GREEN, fontSize: 10, position: "insideTopRight" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      fill={A_BLUE}
                      fillOpacity={0.4}
                      stroke={A_BLUE_L}
                      strokeWidth={2}
                      dot={(dotProps: any) => {
                        if (dotProps.index !== teamChartData.length - 1) return <g key={`d-${dotProps.index}`} />
                        const totalVal = Number(dotProps.payload?.total ?? 0)
                        const metaVal  = Number(dotProps.payload?.metaPace ?? 0)
                        const dia      = dotProps.payload?.dia ?? dotProps.index + 1
                        const bw = 214
                        const bh = 66
                        const bx = dotProps.cx + 14
                        const by = Math.max(4, dotProps.cy - bh / 2)
                        return (
                          <g key={`d-${dotProps.index}`}>
                            {/* Dot no fim da linha */}
                            <circle cx={dotProps.cx} cy={dotProps.cy} r={4} fill={A_BLUE_L} stroke="#0f172a" strokeWidth={2} />
                            {/* Caixa estilo tooltip */}
                            <rect x={bx} y={by} width={bw} height={bh} rx={8} fill="#1e293b" stroke="#334155" strokeWidth={1} />
                            {/* Título */}
                            <text x={bx + 10} y={by + 17} fill="white" fontSize={11} fontWeight="700">Dia {dia}</text>
                            {/* Separador */}
                            <line x1={bx + 8} y1={by + 23} x2={bx + bw - 8} y2={by + 23} stroke="#334155" strokeWidth={0.5} />
                            {/* Meta esperada */}
                            <circle cx={bx + 12} cy={by + 37} r={3} fill={A_GREEN} />
                            <text x={bx + 21} y={by + 41} fill="#94a3b8" fontSize={10}>Meta esperada</text>
                            <text x={bx + bw - 8} y={by + 41} textAnchor="end" fill={A_GREEN} fontSize={10} fontWeight="600">{formatarMoeda(metaVal)}</text>
                            {/* Realizado */}
                            <circle cx={bx + 12} cy={by + 53} r={3} fill={A_BLUE_L} />
                            <text x={bx + 21} y={by + 57} fill="#94a3b8" fontSize={10}>Realizado</text>
                            <text x={bx + bw - 8} y={by + 57} textAnchor="end" fill={A_BLUE_L} fontSize={10} fontWeight="600">{formatarMoeda(totalVal)}</text>
                          </g>
                        )
                      }}
                      activeDot={{ r: 5, fill: A_BLUE_L, stroke: "#0f172a", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="metaPace"
                      stroke={A_GREEN}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="px-8 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>Atualiza a cada {intervalo / 60000} minutos</span>
        <Link href="/vendedor" className="hover:text-slate-300 transition-colors">
          Ver painel individual →
        </Link>
      </footer>
    </div>
  )
}

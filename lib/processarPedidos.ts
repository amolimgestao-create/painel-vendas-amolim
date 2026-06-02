import { Pedido, BucketStats, VendedorStats } from "./types"
import { VENDEDORES } from "./metas"

function processarBucket(
  pedidos: Pedido[],
  apiNome: string,
  meta: number,
  superMeta: number,
  metaAmolim: number
): BucketStats {
  const lista = pedidos.filter(
    (p) => p.Vendedor?.toUpperCase() === apiNome.toUpperCase()
  )

  const totalFaturado = lista.reduce((acc, p) => acc + (p.ped_total_pedido || 0), 0)
  const numeroPedidos = lista.length
  const ticketMedio = numeroPedidos > 0 ? totalFaturado / numeroPedidos : 0
  const percentualMeta = meta > 0 ? (totalFaturado / meta) * 100 : 0
  const faltaParaMeta = Math.max(0, meta - totalFaturado)

  const porDia: Record<string, number> = {}
  lista.forEach((p) => {
    const dia = p.DataFechamento?.substring(0, 10) || ""
    if (dia) porDia[dia] = (porDia[dia] || 0) + p.ped_total_pedido
  })
  const vendasPorDia = Object.entries(porDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, total]) => ({
      dia: dia.substring(8, 10) + "/" + dia.substring(5, 7),
      total,
    }))

  return {
    apiNome,
    meta,
    superMeta,
    metaAmolim,
    totalFaturado,
    percentualMeta,
    numeroPedidos,
    ticketMedio,
    faltaParaMeta,
    vendasPorDia,
  }
}

export function processarPedidos(pedidos: Pedido[]): VendedorStats[] {
  if (!Array.isArray(pedidos)) return []

  return VENDEDORES.map((v) => {
    const carteira = processarBucket(
      pedidos,
      v.carteira.apiNome,
      v.carteira.meta,
      v.carteira.superMeta,
      v.carteira.metaAmolim
    )
    const leads = processarBucket(
      pedidos,
      v.leads.apiNome,
      v.leads.meta,
      v.leads.superMeta,
      v.leads.metaAmolim
    )

    const totalGeral = carteira.totalFaturado + leads.totalFaturado
    const metaTotal = v.carteira.meta + v.leads.meta
    const percentualMetaTotal = metaTotal > 0 ? (totalGeral / metaTotal) * 100 : 0

    return {
      id: v.id,
      nomeExibicao: v.nomeExibicao,
      regiao: v.regiao,
      carteira,
      leads,
      totalGeral,
      metaTotal,
      percentualMetaTotal,
    }
  })
}

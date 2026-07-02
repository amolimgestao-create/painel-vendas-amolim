import historicoRaw from "./metas-data.json"

export type MetaNivel = {
  meta: number
  superMeta: number
  metaAmolim: number
}

export type VendedorConfig = {
  id: string
  nomeExibicao: string
  regiao: number
  temLeads: boolean
  carteira: { apiNome: string } & MetaNivel
  leads: { apiNome: string } & MetaNivel
}

export const HISTORICO_METAS = historicoRaw as unknown as Record<string, VendedorConfig[]>

// Último mês disponível — fallback e compatibilidade
export const VENDEDORES: VendedorConfig[] = (() => {
  const meses = Object.keys(HISTORICO_METAS).sort()
  return HISTORICO_METAS[meses[meses.length - 1]] ?? []
})()

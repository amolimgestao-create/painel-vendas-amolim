export type Pedido = {
  idpedidos: number
  ped_nr_pedido: number
  DataCriacao: string
  DataFechamento: string
  Cliente: string
  Vendedor: string
  ped_total_pedido: number
  ped_situacao: string
  fopa_descricao: string
}

export type BucketStats = {
  apiNome: string
  meta: number
  superMeta: number
  metaAmolim: number
  totalFaturado: number
  percentualMeta: number
  numeroPedidos: number
  ticketMedio: number
  faltaParaMeta: number
  vendasPorDia: { dia: string; total: number }[]
}

export type VendedorStats = {
  id: string
  nomeExibicao: string
  regiao: number
  carteira: BucketStats
  leads: BucketStats
  totalGeral: number
  metaTotal: number
  percentualMetaTotal: number
}

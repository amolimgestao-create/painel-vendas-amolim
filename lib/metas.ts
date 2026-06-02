export type MetaNivel = {
  meta: number
  superMeta: number
  metaAmolim: number
}

export type VendedorConfig = {
  id: string
  nomeExibicao: string
  regiao: number
  carteira: { apiNome: string } & MetaNivel
  leads: { apiNome: string } & MetaNivel
}

// Metas referência: junho de 2026 — atualizado via painel admin
export const VENDEDORES: VendedorConfig[] = [
  {
    id: "natalia",
    nomeExibicao: "Natalia",
    regiao: 1,
    carteira: {
      apiNome: "REGIAO 1 CARTEIRA",
      meta: 120512,
      superMeta: 126537.6,
      metaAmolim: 133497.17,
    },
    leads: {
      apiNome: "REGIAO 1 LEADS",
      meta: 7500,
      superMeta: 7875,
      metaAmolim: 8308.13,
    },
  },
  {
    id: "kelly",
    nomeExibicao: "Kelly",
    regiao: 3,
    carteira: {
      apiNome: "REGIAO 3 CARTEIRA",
      meta: 130000,
      superMeta: 134683.5,
      metaAmolim: 142091.09,
    },
    leads: {
      apiNome: "REGIAO 3 LEADS",
      meta: 7500,
      superMeta: 7875,
      metaAmolim: 8308.13,
    },
  },
  {
    id: "debora",
    nomeExibicao: "Débora",
    regiao: 2,
    carteira: {
      apiNome: "REGIAO 2 CARTEIRA",
      meta: 6300,
      superMeta: 6615,
      metaAmolim: 6978.83,
    },
    leads: {
      apiNome: "REGIAO 2 LEADS",
      meta: 15000,
      superMeta: 15750,
      metaAmolim: 16616.25,
    },
  },
  {
    id: "evelyn",
    nomeExibicao: "Evelyn",
    regiao: 5,
    carteira: {
      apiNome: "REGIAO 5 CARTEIRA",
      meta: 39190,
      superMeta: 41149.5,
      metaAmolim: 43412.72,
    },
    leads: {
      apiNome: "REGIAO 5 LEADS",
      meta: 15000,
      superMeta: 15750,
      metaAmolim: 16616.25,
    },
  },
]

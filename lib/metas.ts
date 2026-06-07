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

// Metas referência: junho de 2026 — atualizado via painel admin
export const VENDEDORES: VendedorConfig[] = [
  {
    id: "industria",
    nomeExibicao: "Indústria",
    regiao: 0,
    temLeads: false,
    carteira: {
      apiNome: "REGIAO 0 CARTEIRA",
      meta: 0,
      superMeta: 0,
      metaAmolim: 0,
    },
    leads: {
      apiNome: "",
      meta: 0,
      superMeta: 0,
      metaAmolim: 0,
    },
  },
  {
    id: "natalia",
    nomeExibicao: "Natalia",
    regiao: 1,
    temLeads: true,
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
    id: "debora",
    nomeExibicao: "Débora",
    regiao: 2,
    temLeads: true,
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
    id: "kelly",
    nomeExibicao: "Kelly",
    regiao: 3,
    temLeads: true,
    carteira: {
      apiNome: "REGIAO 3 CARTEIRA",
      meta: 128270,
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
    id: "evellyn",
    nomeExibicao: "Evellyn",
    regiao: 4,
    temLeads: false,
    carteira: {
      apiNome: "REGIAO 4 CARTEIRA",
      meta: 6300,
      superMeta: 6615,
      metaAmolim: 6978.83,
    },
    leads: {
      apiNome: "",
      meta: 0,
      superMeta: 0,
      metaAmolim: 0,
    },
  },
]

import { NextRequest, NextResponse } from "next/server"
import { VENDEDORES } from "@/lib/metas"

type BucketInput = {
  meta: number
  superMeta: number
  metaAmolim: number
}

type VendedorInput = {
  id: string
  nomeExibicao: string
  regiao: number
  // enviados pelo supervisor (add/remove/edit); opcionais para compatibilidade com /admin legado
  temLeads?: boolean
  carteiraApiNome?: string
  leadsApiNome?: string
  carteira: BucketInput
  leads: BucketInput
}

function gerarConteudoMetas(vendedores: VendedorInput[]): string {
  const linhas = vendedores.map((v) => {
    const cfg = VENDEDORES.find((c) => c.id === v.id)
    // input tem precedência (supervisor pode alterar estrutura); fallback para cfg existente
    const temLeads        = v.temLeads         !== undefined ? v.temLeads         : (cfg?.temLeads ?? true)
    const carteiraApiNome = v.carteiraApiNome  || cfg?.carteira.apiNome || `REGIAO ${v.regiao} CARTEIRA`
    const leadsApiNome    = v.leadsApiNome     !== undefined ? v.leadsApiNome     : (cfg?.leads.apiNome ?? (temLeads ? `REGIAO ${v.regiao} LEADS` : ""))

    return `  {
    id: "${v.id}",
    nomeExibicao: "${v.nomeExibicao}",
    regiao: ${v.regiao},
    temLeads: ${temLeads},
    carteira: {
      apiNome: "${carteiraApiNome}",
      meta: ${v.carteira.meta},
      superMeta: ${v.carteira.superMeta},
      metaAmolim: ${v.carteira.metaAmolim},
    },
    leads: {
      apiNome: "${leadsApiNome}",
      meta: ${v.leads.meta},
      superMeta: ${v.leads.superMeta},
      metaAmolim: ${v.leads.metaAmolim},
    },
  }`
  }).join(",\n")

  const mesRef = new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" })

  return `export type MetaNivel = {
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

// Metas referência: ${mesRef} — atualizado via painel admin
export const VENDEDORES: VendedorConfig[] = [
${linhas},
]
`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, vendedores } = body as { password: string; vendedores: VendedorInput[] }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const filePath = "lib/metas.ts"
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`

    // Buscar SHA atual do arquivo
    const getRes = await fetch(apiBase, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!getRes.ok) {
      return NextResponse.json({ error: "Erro ao acessar GitHub" }, { status: 500 })
    }

    const fileData = await getRes.json()
    const sha = fileData.sha

    // Gerar novo conteúdo
    const novoConteudo = gerarConteudoMetas(vendedores)
    const conteudoBase64 = Buffer.from(novoConteudo).toString("base64")

    // Atualizar arquivo no GitHub
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore: atualizar metas — ${new Date().toLocaleDateString("pt-BR")}`,
        content: conteudoBase64,
        sha,
      }),
    })

    if (!putRes.ok) {
      const err = await putRes.json()
      return NextResponse.json({ error: "Erro ao salvar no GitHub", detail: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

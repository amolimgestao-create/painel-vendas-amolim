import { NextRequest, NextResponse } from "next/server"

type MetaNivel = { meta: number; superMeta: number; metaAmolim: number }
type VendedorConfig = {
  id: string
  nomeExibicao: string
  regiao: number
  temLeads: boolean
  carteira: { apiNome: string } & MetaNivel
  leads: { apiNome: string } & MetaNivel
}
type VendedorInput = {
  id: string
  nomeExibicao: string
  regiao: number
  temLeads?: boolean
  carteiraApiNome?: string
  leadsApiNome?: string
  carteira: MetaNivel
  leads: MetaNivel
}

const MAX_MESES = 6

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, vendedores, mesAno } = body as {
      password: string
      vendedores: VendedorInput[]
      mesAno: string
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
    }

    if (!mesAno || !/^\d{4}-\d{2}$/.test(mesAno)) {
      return NextResponse.json({ error: "mesAno inválido" }, { status: 400 })
    }

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const filePath = "lib/metas-data.json"
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`
    const ghHeaders = {
      Authorization: `token ${token}`,
      Accept: "application/vnd.github.v3+json",
    }

    const getRes = await fetch(apiBase, { headers: ghHeaders })
    if (!getRes.ok) {
      return NextResponse.json({ error: "Erro ao acessar GitHub" }, { status: 500 })
    }

    const fileData = await getRes.json()
    const sha: string = fileData.sha
    const historico: Record<string, VendedorConfig[]> = JSON.parse(
      Buffer.from(fileData.content, "base64").toString("utf-8")
    )

    // Config de referência para apiNomes (mês atual ou mais recente disponível)
    const mesesExistentes = Object.keys(historico).sort()
    const cfgRef = historico[mesAno] ?? historico[mesesExistentes[mesesExistentes.length - 1]] ?? []

    historico[mesAno] = vendedores.map((v): VendedorConfig => {
      const cfg = cfgRef.find((c) => c.id === v.id)
      const temLeads = v.temLeads !== undefined ? v.temLeads : (cfg?.temLeads ?? true)
      const carteiraApiNome = v.carteiraApiNome || cfg?.carteira.apiNome || `REGIAO ${v.regiao} CARTEIRA`
      const leadsApiNome =
        v.leadsApiNome !== undefined
          ? v.leadsApiNome
          : (cfg?.leads.apiNome ?? (temLeads ? `REGIAO ${v.regiao} LEADS` : ""))
      return {
        id: v.id,
        nomeExibicao: v.nomeExibicao,
        regiao: v.regiao,
        temLeads,
        carteira: { apiNome: carteiraApiNome, ...v.carteira },
        leads: { apiNome: leadsApiNome, ...v.leads },
      }
    })

    // Manter só os últimos MAX_MESES meses
    const mesesOrdenados = Object.keys(historico).sort()
    if (mesesOrdenados.length > MAX_MESES) {
      mesesOrdenados.slice(0, mesesOrdenados.length - MAX_MESES).forEach((m) => delete historico[m])
    }

    const novoConteudo = JSON.stringify(historico, null, 2)
    const conteudoBase64 = Buffer.from(novoConteudo).toString("base64")

    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: { ...ghHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `chore: metas ${mesAno} — ${new Date().toLocaleDateString("pt-BR")}`,
        content: conteudoBase64,
        sha,
      }),
    })

    if (!putRes.ok) {
      const err = await putRes.json()
      return NextResponse.json({ error: "Erro ao salvar no GitHub", detail: err }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

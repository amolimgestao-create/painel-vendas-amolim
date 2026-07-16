import { NextRequest, NextResponse } from "next/server"
import { Pedido } from "@/lib/types"

// Janela de busca antes do inicio do periodo: um pedido nao pode ser
// fechado antes de ser criado, entao basta olhar pra tras o suficiente
// pra nao perder pedidos antigos que so fecharam dentro do periodo.
const LOOKBACK_DIAS = 365

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fechamentoIni = searchParams.get("fechamentoIni") || ""
  const fechamentoFim = searchParams.get("fechamentoFim") || ""

  const base = process.env.INTIS_API_BASE
  const key = process.env.INTIS_API_KEY

  const criacaoIni = new Date(`${fechamentoIni}T00:00:00`)
  criacaoIni.setDate(criacaoIni.getDate() - LOOKBACK_DIAS)
  const criacaoIniStr = criacaoIni.toISOString().substring(0, 10)

  const url = `${base}/apiFaturamento.php/pedidos/?criacaoIni=${criacaoIniStr}&criacaoFim=${fechamentoFim}&situacao=F`

  try {
    const res = await fetch(url, {
      headers: { APPKEY: key! },
      next: { revalidate: 0 },
    })
    const data: Pedido[] = await res.json()

    // A API filtra por data de criacao; o periodo exibido no painel
    // precisa refletir pedidos fechados no periodo, independente de
    // quando foram criados — filtramos por DataFechamento aqui.
    const filtrado = Array.isArray(data)
      ? data.filter((p) => {
          const fechamento = p.DataFechamento?.substring(0, 10) || ""
          return fechamento >= fechamentoIni && fechamento <= fechamentoFim
        })
      : data

    return NextResponse.json(filtrado)
  } catch {
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const criacaoIni = searchParams.get("criacaoIni") || ""
  const criacaoFim = searchParams.get("criacaoFim") || ""

  const base = process.env.INTIS_API_BASE
  const key = process.env.INTIS_API_KEY

  const url = `${base}/apiFaturamento.php/pedidos/?criacaoIni=${criacaoIni}&criacaoFim=${criacaoFim}&situacao=F`

  try {
    const res = await fetch(url, {
      headers: { APPKEY: key! },
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 })
  }
}

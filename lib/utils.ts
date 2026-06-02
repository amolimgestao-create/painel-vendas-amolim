export function getMesAtual(): { criacaoIni: string; criacaoFim: string } {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, "0")
  const dia = String(hoje.getDate()).padStart(2, "0")
  return { criacaoIni: `${ano}-${mes}-01`, criacaoFim: `${ano}-${mes}-${dia}` }
}

export function getMesAnterior(): { criacaoIni: string; criacaoFim: string } {
  const hoje = new Date()
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
  const ano = ultimo.getFullYear()
  const mes = String(ultimo.getMonth() + 1).padStart(2, "0")
  const dia = String(ultimo.getDate()).padStart(2, "0")
  return { criacaoIni: `${ano}-${mes}-01`, criacaoFim: `${ano}-${mes}-${dia}` }
}

export function getDiasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate()
}

export function getMesStr(): string {
  return String(new Date().getMonth() + 1).padStart(2, "0")
}

export function getDiaAtual(): number {
  return new Date().getDate()
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatarMesAno(yyyyMM: string): string {
  const [ano, mes] = yyyyMM.split("-")
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${nomes[parseInt(mes) - 1]}/${ano}`
}

export function buildCumulativeChart(
  carteiraVendas: { dia: string; total: number }[],
  leadsVendas: { dia: string; total: number }[],
  metaCarteira: number,
  metaLeads: number,
  diasNoMes: number,
  diaAtual: number,
  mesStr: string
) {
  const mapC: Record<string, number> = {}
  const mapL: Record<string, number> = {}
  carteiraVendas.forEach((v) => (mapC[v.dia] = v.total))
  leadsVendas.forEach((v) => (mapL[v.dia] = v.total))

  let cumC = 0
  let cumL = 0
  const metaTotal = metaCarteira + metaLeads

  return Array.from({ length: diaAtual }, (_, i) => {
    const d = i + 1
    const key = String(d).padStart(2, "0") + "/" + mesStr
    cumC += mapC[key] || 0
    cumL += mapL[key] || 0
    return {
      dia: d,
      acumuladoCarteira: Math.round(cumC),
      acumuladoLeads: Math.round(cumL),
      acumuladoTotal: Math.round(cumC + cumL),
      metaPace: Math.round((metaTotal * d) / diasNoMes),
      metaCarteiraPace: Math.round((metaCarteira * d) / diasNoMes),
      metaLeadsPace: Math.round((metaLeads * d) / diasNoMes),
    }
  })
}

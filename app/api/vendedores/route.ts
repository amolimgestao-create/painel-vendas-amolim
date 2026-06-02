import { NextResponse } from "next/server"
import { VENDEDORES } from "@/lib/metas"

export async function GET() {
  return NextResponse.json(VENDEDORES)
}

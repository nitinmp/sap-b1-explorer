import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = cookies()
  const hasSession = !!cookieStore.get('b1session')?.value
  return NextResponse.json({ ok: true, session: hasSession })
}

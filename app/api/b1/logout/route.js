import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import axios from 'axios'
import https from 'https'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })
const sapClient = axios.create({ httpsAgent, timeout: 30000 })

export async function POST() {
  const cookieStore = cookies()
  const b1Session = cookieStore.get('b1session')?.value

  if (b1Session) {
    try {
      await sapClient.post(
        `${process.env.SAP_HOST}/b1s/v1/Logout`,
        {},
        { headers: { Cookie: `B1SESSION=${b1Session}` } }
      )
    } catch (_) {
      // ignore logout errors
    }
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete('b1session')
  return response
}

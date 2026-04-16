import { NextResponse } from 'next/server'
import axios from 'axios'
import https from 'https'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })
const sapClient = axios.create({ httpsAgent, timeout: 30000 })

export async function POST(request) {
  const { companyDb, user, pass } = await request.json()

  const SAP_HOST = process.env.SAP_HOST
  const companyDbVal = companyDb || process.env.SAP_COMPANY_DB
  const userVal = user || process.env.SAP_USER
  const passVal = pass || process.env.SAP_PASS

  try {
    const res = await sapClient.post(
      `${SAP_HOST}/b1s/v1/Login`,
      { CompanyDB: companyDbVal, UserName: userVal, Password: passVal },
      { headers: { 'Content-Type': 'application/json' } }
    )

    let b1Session = null

    // SAP may return SessionId in body or Set-Cookie header
    if (res.data?.SessionId) {
      b1Session = res.data.SessionId
    } else {
      const setCookies = res.headers['set-cookie'] || []
      for (const c of setCookies) {
        const match = c.match(/B1SESSION=([^;]+)/)
        if (match) { b1Session = match[1]; break }
      }
    }

    if (!b1Session) throw new Error('Login succeeded but no session ID found in response')

    const response = NextResponse.json({ ok: true })
    response.cookies.set('b1session', b1Session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 30, // 30 minutes
      path: '/',
    })
    return response
  } catch (err) {
    const status = err.response?.status || 500
    const message = err.response?.data?.error?.message?.value || err.message
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}

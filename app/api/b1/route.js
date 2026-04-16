import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import axios from 'axios'
import https from 'https'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })
const sapClient = axios.create({ httpsAgent, timeout: 30000 })

export async function GET(request) {
  const cookieStore = cookies()
  const b1Session = cookieStore.get('b1session')?.value

  if (!b1Session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'path query param required' }, { status: 400 })
  }

  // Forward all remaining query params to SAP (OData $filter, $select, $top, etc.)
  const sapParams = {}
  searchParams.forEach((value, key) => {
    if (key !== 'path') sapParams[key] = value
  })

  try {
    const res = await sapClient.get(`${process.env.SAP_HOST}${path}`, {
      params: sapParams,
      headers: { Cookie: `B1SESSION=${b1Session}`, 'Content-Type': 'application/json' },
    })
    return NextResponse.json(res.data)
  } catch (err) {
    const status = err.response?.status || 500
    const message = err.response?.data?.error?.message?.value || err.message

    // Session expired — clear the cookie and tell the client to re-login
    if (status === 401) {
      const response = NextResponse.json({ error: 'SESSION_EXPIRED' }, { status: 401 })
      response.cookies.delete('b1session')
      return response
    }

    return NextResponse.json({ error: message }, { status })
  }
}

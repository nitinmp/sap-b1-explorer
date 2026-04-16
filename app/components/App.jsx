'use client'

import React, { useState, useEffect } from 'react'
import LoginCard from './LoginCard'
import TabNav from './TabNav'
import BusinessPartners from './pages/BusinessPartners'
import ARInvoices from './pages/ARInvoices'
import SalesOrders from './pages/SalesOrders'
import JournalEntries from './pages/JournalEntries'
import IncomingPayments from './pages/IncomingPayments'
import { checkHealth, logoutB1 } from '../services/b1Api'

const PAGE_MAP = {
  bp: BusinessPartners,
  invoices: ARInvoices,
  orders: SalesOrders,
  journal: JournalEntries,
  payments: IncomingPayments,
}

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('bp')
  const [connected, setConnected] = useState(false)

  // Poll health to show connection status
  useEffect(() => {
    const poll = async () => {
      const ok = await checkHealth()
      setConnected(ok)
    }
    poll()
    const interval = setInterval(poll, 10000)
    return () => clearInterval(interval)
  }, [])

  // Listen for session expiry from any API call
  useEffect(() => {
    const handler = () => setSession(null)
    window.addEventListener('b1:session-expired', handler)
    return () => window.removeEventListener('b1:session-expired', handler)
  }, [])

  const handleLogin = (info) => setSession(info)

  const handleLogout = async () => {
    await logoutB1()
    setSession(null)
  }

  if (!session) {
    return <LoginCard onLogin={handleLogin} />
  }

  const ActivePage = PAGE_MAP[activeTab]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800 text-base">SAP B1 Explorer</span>
          <span className="text-sm text-gray-400">{session.companyDb}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`}
            />
            <span className={connected ? 'text-green-700' : 'text-gray-500'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <TabNav active={activeTab} onChange={setActiveTab} />

      {/* Page content */}
      <div className="flex flex-col flex-1 min-h-0" style={{ height: 'calc(100vh - 105px)' }}>
        <ActivePage key={activeTab} />
      </div>
    </div>
  )
}

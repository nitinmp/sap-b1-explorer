'use client'

import React from 'react'

const TABS = [
  { id: 'bp', label: 'Business Partners' },
  { id: 'invoices', label: 'AR Invoices' },
  { id: 'orders', label: 'Sales Orders' },
  { id: 'journal', label: 'Journal Entries' },
  { id: 'payments', label: 'Incoming Payments' },
]

export default function TabNav({ active, onChange }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex space-x-0 px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

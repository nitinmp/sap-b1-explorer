'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function FilterBar({ filters, onSearch, autoSearch = false }) {
  const onSearchRef = useRef(onSearch)
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  const initialState = useMemo(
    () => Object.fromEntries(filters.map((f) => [f.name, f.default ?? ''])),
    [filters]
  )
  const [values, setValues] = useState(initialState)

  useEffect(() => {
    setValues(initialState)
  }, [initialState])

  useEffect(() => {
    if (!autoSearch) return
    onSearchRef.current(initialState)
  }, [autoSearch, initialState])

  const handleChange = (name, val) => setValues((prev) => ({ ...prev, [name]: val }))

  const handleClear = () => {
    const cleared = Object.fromEntries(filters.map((f) => [f.name, f.default ?? '']))
    setValues(cleared)
    onSearch(cleared)
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-wrap gap-3 items-end">
        {filters.map((f) => (
          <div
            key={f.name}
            className={f.fullWidth ? 'flex flex-col flex-1 min-w-[240px]' : 'flex flex-col min-w-[140px]'}
          >
            <label className="text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            {f.type === 'select' ? (
              <select
                value={values[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type}
                value={values[f.name]}
                onChange={(e) => handleChange(f.name, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSearch(values)
                }}
                placeholder={f.placeholder || ''}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 ml-auto self-end">
          <button
            onClick={() => onSearch(values)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
          >
            Search
          </button>
          <button
            onClick={handleClear}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-1.5 rounded transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}

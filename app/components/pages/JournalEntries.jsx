'use client'

import React, { useState } from 'react'
import FilterBar from '../FilterBar'
import GridView from '../GridView'
import Flyout from '../Flyout'
import { buildSubstringOfFilter, fetchB1, fetchB1WithFallback } from '../../services/b1Api'

const FILTERS = [
  { name: 'SearchText', label: 'Search', type: 'text', placeholder: 'Trans # / Memo / Reference', fullWidth: true },
  { name: 'JdtNum', label: 'Transaction Number', type: 'text', placeholder: 'e.g. 500' },
  { name: 'DateFrom', label: 'Date From', type: 'date' },
  { name: 'DateTo', label: 'Date To', type: 'date' },
  { name: 'Memo', label: 'Memo', type: 'text', placeholder: 'Memo text' },
]

const COLUMNS = [
  { field: 'JdtNum', headerName: 'Trans #', type: 'numericColumn' },
  { field: 'ReferenceDate', headerName: 'Ref Date' },
  { field: 'DueDate', headerName: 'Due Date' },
  { field: 'Memo', headerName: 'Memo' },
  { field: 'TransactionCode', headerName: 'Trans Code' },
]

const SELECT = 'JdtNum,ReferenceDate,DueDate,Memo,Reference,Reference2,TransactionCode,ProjectCode,TaxDate,VatDate,Indicator,Series,Number'

function buildSections(row) {
  if (row?.__loading) {
    return [
      {
        title: 'Loading',
        fields: [{ label: 'Status', value: 'Fetching details…', fullWidth: true }],
      },
    ]
  }
  if (row?.__error) {
    return [
      {
        title: 'Error',
        fields: [{ label: 'Message', value: row.__error, fullWidth: true }],
      },
    ]
  }

  const lines = Array.isArray(row.JournalEntryLines) ? row.JournalEntryLines : []

  return [
    {
      title: 'Journal Entry',
      subtitle: `Transaction #${row.JdtNum}`,
      fields: [
        { label: 'Trans Number', value: row.JdtNum },
        { label: 'Series', value: row.Series },
        { label: 'Number', value: row.Number },
        { label: 'Transaction Code', value: row.TransactionCode },
        { label: 'Indicator', value: row.Indicator },
        { label: 'Project Code', value: row.ProjectCode },
      ],
    },
    {
      title: 'Dates',
      fields: [
        { label: 'Reference Date', value: row.ReferenceDate },
        { label: 'Due Date', value: row.DueDate },
        { label: 'Tax Date', value: row.TaxDate },
        { label: 'VAT Date', value: row.VatDate },
      ],
    },
    {
      title: 'References & Memo',
      fields: [
        { label: 'Reference 1', value: row.Reference },
        { label: 'Reference 2', value: row.Reference2 },
        { label: 'Memo', value: row.Memo, fullWidth: true },
      ],
    },
    ...(lines.length ? [{
      title: 'Lines',
      table: {
        columns: [
          { key: 'LineID', label: '#', align: 'right' },
          { key: 'AccountCode', label: 'Account' },
          { key: 'LineMemo', label: 'Line Memo', wrap: true },
          { key: 'Debit', label: 'Debit', align: 'right' },
          { key: 'Credit', label: 'Credit', align: 'right' },
          { key: 'CostingCode', label: 'Dim1' },
        ],
        rows: lines,
      },
    }] : []),
  ]
}

export default function JournalEntries() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(null)
  const [selected, setSelected] = useState(null)

  const handleSearch = async (vals) => {
    setLoading(true)
    setError(null)
    setSelected(null)
    try {
      const parts = []
      const q = (vals.SearchText ?? '').trim()
      if (q) {
        const qParts = []
        const num = parseInt(q, 10)
        if (!Number.isNaN(num)) qParts.push(`JdtNum eq ${num}`)
        const text = buildSubstringOfFilter(['Memo', 'Reference', 'Reference2', 'TransactionCode'], q)
        if (text) qParts.push(text)
        if (qParts.length) parts.push(`(${qParts.join(' or ')})`)
      }
      if (vals.JdtNum) parts.push(`JdtNum eq ${parseInt(vals.JdtNum, 10)}`)
      if (vals.DateFrom) parts.push(`ReferenceDate ge '${vals.DateFrom}'`)
      if (vals.DateTo) parts.push(`ReferenceDate le '${vals.DateTo}'`)
      if (vals.Memo) parts.push(buildSubstringOfFilter(['Memo'], vals.Memo))

      const data = await fetchB1('/b1s/v1/JournalEntries', {
        $filter: parts.length ? parts.join(' and ') : undefined,
        $select: SELECT,
        $top: 100,
      })
      setRows(data.value || [])
      setTotal(data['@odata.count'] ?? null)
    } catch (err) {
      setError(err.message)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const handleRowClick = async (row) => {
    const jdtNum = row?.JdtNum
    if (jdtNum == null) return
    setSelected({ __loading: true, JdtNum: jdtNum, Memo: row.Memo, TransactionCode: row.TransactionCode })
    try {
      const detailPath = `/b1s/v1/JournalEntries(${jdtNum})`
      const detail = await fetchB1WithFallback(
        detailPath,
        { $expand: 'JournalEntryLines' },
        [{}, { $expand: 'JournalEntryLines,JournalEntryReferences' }]
      )
      setSelected(detail)
    } catch (err) {
      setSelected({ __error: err.message, ...row })
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <FilterBar filters={FILTERS} onSearch={handleSearch} autoSearch />
      <GridView
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        error={error}
        totalCount={total}
        exportFileName="journal-entries"
        onRowClick={handleRowClick}
      />
      {selected && (
        <Flyout
          title={`Journal Entry #${selected.JdtNum ?? ''}`}
          subtitle={selected.Memo || selected.TransactionCode || ''}
          sections={buildSections(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

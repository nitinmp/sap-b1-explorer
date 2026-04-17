'use client'

import React, { useState } from 'react'
import FilterBar from '../FilterBar'
import GridView from '../GridView'
import Flyout from '../Flyout'
import { buildSubstringOfFilter, escapeODataString, fetchB1, fetchB1WithFallback } from '../../services/b1Api'

const FILTERS = [
  { name: 'SearchText', label: 'Search', type: 'text', placeholder: 'Doc # / Customer / Ref / Remarks', fullWidth: true },
  { name: 'DocNum', label: 'Doc Number', type: 'text', placeholder: 'e.g. 1001' },
  { name: 'CardCode', label: 'Customer Code', type: 'text', placeholder: 'e.g. C001' },
  { name: 'DateFrom', label: 'Date From', type: 'date' },
  { name: 'DateTo', label: 'Date To', type: 'date' },
  {
    name: 'Status',
    label: 'Status',
    type: 'select',
    default: 'all',
    options: [
      { value: 'all', label: 'All' },
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
]

const COLUMNS = [
  { field: 'DocNum', headerName: 'Doc #', type: 'numericColumn' },
  { field: 'CardCode', headerName: 'Customer Code' },
  { field: 'CardName', headerName: 'Customer Name' },
  { field: 'DocDate', headerName: 'Date' },
  { field: 'DocDueDate', headerName: 'Due Date' },
  {
    field: 'DocTotal',
    headerName: 'Total',
    type: 'numericColumn',
    valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''),
  },
  { field: 'DocumentStatus', headerName: 'Status' },
  { field: 'DocCurrency', headerName: 'Currency' },
]

const SELECT = 'DocEntry,DocNum,CardCode,CardName,DocDate,DocDueDate,DocTotal,DocumentStatus,DocCurrency,VatSum,DiscountPercent,Reference1,Reference2,Comments'

const fmt = (v) => (v != null ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : null)
const statusLabel = (s) => s === 'bost_Open' ? 'Open' : s === 'bost_Close' ? 'Closed' : s

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

  const lines = Array.isArray(row.DocumentLines) ? row.DocumentLines : []

  return [
    {
      title: 'Document Info',
      subtitle: `Invoice #${row.DocNum}`,
      fields: [
        { label: 'Doc Number', value: row.DocNum },
        { label: 'Currency', value: row.DocCurrency },
        { label: 'Doc Date', value: row.DocDate },
        { label: 'Due Date', value: row.DocDueDate },
        { label: 'Status', value: statusLabel(row.DocumentStatus) },
        { label: 'Reference 1', value: row.Reference1 },
        { label: 'Reference 2', value: row.Reference2 },
        ...(row.NumAtCard ? [{ label: 'Customer Ref', value: row.NumAtCard, fullWidth: true }] : []),
      ],
    },
    {
      title: 'Customer',
      fields: [
        { label: 'Card Code', value: row.CardCode },
        { label: 'Card Name', value: row.CardName, fullWidth: true },
      ],
    },
    ...(lines.length ? [{
      title: 'Lines',
      table: {
        columns: [
          { key: 'LineNum', label: '#', align: 'right' },
          { key: 'ItemCode', label: 'Item' },
          { key: 'ItemDescription', label: 'Description', wrap: true },
          { key: 'Quantity', label: 'Qty', align: 'right' },
          { key: 'UnitPrice', label: 'Price', align: 'right', format: (v) => (v != null ? fmt(v) : '—') },
          { key: 'LineTotal', label: 'Total', align: 'right', format: (v) => (v != null ? fmt(v) : '—') },
        ],
        rows: lines,
      },
    }] : []),
    {
      title: 'Financials',
      fields: [
        { label: 'Doc Total', value: fmt(row.DocTotal), style: { fontSize: 14, fontWeight: 700 } },
        { label: 'VAT Sum', value: fmt(row.VatSum) },
        { label: 'Discount %', value: row.DiscountPercent != null ? `${row.DiscountPercent}%` : null },
      ],
    },
    ...(row.Comments ? [{
      title: 'Remarks',
      fields: [{ label: 'Comments', value: row.Comments, fullWidth: true }],
    }] : []),
  ]
}

export default function ARInvoices() {
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
        if (!Number.isNaN(num)) qParts.push(`DocNum eq ${num}`)
        const text = buildSubstringOfFilter(['CardCode', 'CardName', 'Reference1', 'Reference2', 'Comments', 'NumAtCard'], q)
        if (text) qParts.push(text)
        if (qParts.length) parts.push(`(${qParts.join(' or ')})`)
      }
      if (vals.DocNum) parts.push(`DocNum eq ${parseInt(vals.DocNum, 10)}`)
      if (vals.CardCode) parts.push(`CardCode eq '${escapeODataString(vals.CardCode)}'`)
      if (vals.DateFrom) parts.push(`DocDate ge '${vals.DateFrom}'`)
      if (vals.DateTo) parts.push(`DocDate le '${vals.DateTo}'`)
      if (vals.Status === 'open') parts.push("DocumentStatus eq 'bost_Open'")
      if (vals.Status === 'closed') parts.push("DocumentStatus eq 'bost_Close'")

      const data = await fetchB1('/b1s/v1/Invoices', {
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
    const docEntry = row?.DocEntry
    const docNum = row?.DocNum
    if (docEntry == null) return
    setSelected({ __loading: true, DocEntry: docEntry, DocNum: docNum, CardName: row.CardName })
    try {
      const detailPath = `/b1s/v1/Invoices(${docEntry})`
      const detail = await fetchB1WithFallback(
        detailPath,
        { $expand: 'DocumentLines' },
        [{}, { $expand: 'DocumentLines,TaxExtension' }]
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
        exportFileName="ar-invoices"
        onRowClick={handleRowClick}
      />
      {selected && (
        <Flyout
          title={`Invoice #${selected.DocNum ?? selected.DocEntry ?? ''}`}
          subtitle={selected.CardName || selected.CardCode || ''}
          sections={buildSections(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

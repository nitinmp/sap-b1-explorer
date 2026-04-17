'use client'

import React, { useState } from 'react'
import FilterBar from '../FilterBar'
import GridView from '../GridView'
import Flyout from '../Flyout'
import { buildSubstringOfFilter, escapeODataString, fetchB1, fetchB1WithFallback } from '../../services/b1Api'

const FILTERS = [
  { name: 'SearchText', label: 'Search', type: 'text', placeholder: 'Doc # / Customer / Ref / Bank', fullWidth: true },
  { name: 'DocNum', label: 'Doc Number', type: 'text', placeholder: 'e.g. 3001' },
  { name: 'CardCode', label: 'Customer Code', type: 'text', placeholder: 'e.g. C001' },
  { name: 'DateFrom', label: 'Date From', type: 'date' },
  { name: 'DateTo', label: 'Date To', type: 'date' },
]

const fmt = (p) => (p.value != null ? Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '')
const fmtV = (v) => (v != null ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : null)

const COLUMNS = [
  { field: 'DocNum', headerName: 'Doc #', type: 'numericColumn' },
  { field: 'CardCode', headerName: 'Customer Code' },
  { field: 'CardName', headerName: 'Customer Name' },
  { field: 'DocDate', headerName: 'Date' },
  { field: 'DocCurrency', headerName: 'Currency' },
  { field: 'CashSum', headerName: 'Cash', type: 'numericColumn', valueFormatter: fmt },
  { field: 'TransferSum', headerName: 'Transfer', type: 'numericColumn', valueFormatter: fmt },
  { field: 'PaymentType', headerName: 'Type' },
]

const SELECT = 'DocEntry,DocNum,CardCode,CardName,DocDate,DocCurrency,CashSum,TransferSum,PaymentType,Reference1,Reference2,Remarks,TransactionCode,DueDate,BankCode,BankAccount,CheckAccount,TransferDate,TransferReference,LocalCurrency'

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

  const paymentInvoices = Array.isArray(row.PaymentInvoices) ? row.PaymentInvoices : []
  const paymentChecks = Array.isArray(row.PaymentChecks) ? row.PaymentChecks : []
  const paymentAccounts = Array.isArray(row.PaymentAccounts) ? row.PaymentAccounts : []

  return [
    {
      title: 'Payment Info',
      subtitle: `Payment #${row.DocNum}`,
      fields: [
        { label: 'Doc Number', value: row.DocNum },
        { label: 'Payment Type', value: row.PaymentType },
        { label: 'Doc Date', value: row.DocDate },
        { label: 'Due Date', value: row.DueDate },
        { label: 'Currency', value: row.DocCurrency },
        { label: 'Local Currency', value: row.LocalCurrency },
        { label: 'Trans Code', value: row.TransactionCode },
      ],
    },
    {
      title: 'Customer',
      fields: [
        { label: 'Card Code', value: row.CardCode },
        { label: 'Card Name', value: row.CardName, fullWidth: true },
      ],
    },
    {
      title: 'Amounts',
      fields: [
        { label: 'Cash Sum', value: fmtV(row.CashSum), style: { fontWeight: 700, fontSize: 14 } },
        { label: 'Transfer Sum', value: fmtV(row.TransferSum), style: { fontWeight: 700, fontSize: 14 } },
      ],
    },
    {
      title: 'Bank / Transfer Details',
      fields: [
        { label: 'Bank Code', value: row.BankCode },
        { label: 'Bank Account', value: row.BankAccount },
        { label: 'Transfer Date', value: row.TransferDate },
        { label: 'Transfer Ref', value: row.TransferReference },
        { label: 'Reference 1', value: row.Reference1 },
        { label: 'Reference 2', value: row.Reference2 },
      ],
    },
    ...(paymentInvoices.length ? [{
      title: 'Applied Documents',
      table: {
        columns: [
          { key: 'InvoiceType', label: 'Type' },
          { key: 'DocEntry', label: 'DocEntry', align: 'right' },
          { key: 'DocNum', label: 'Doc #', align: 'right' },
          { key: 'SumApplied', label: 'Applied', align: 'right', format: (v) => (v != null ? fmtV(v) : '—') },
          { key: 'AppliedFC', label: 'Applied FC', align: 'right', format: (v) => (v != null ? fmtV(v) : '—') },
        ],
        rows: paymentInvoices,
      },
    }] : []),
    ...(paymentChecks.length ? [{
      title: 'Checks',
      table: {
        columns: [
          { key: 'CheckNumber', label: 'Check #' },
          { key: 'BankCode', label: 'Bank' },
          { key: 'DueDate', label: 'Due Date' },
          { key: 'CheckSum', label: 'Amount', align: 'right', format: (v) => (v != null ? fmtV(v) : '—') },
        ],
        rows: paymentChecks,
      },
    }] : []),
    ...(paymentAccounts.length ? [{
      title: 'G/L Allocation',
      table: {
        columns: [
          { key: 'AccountCode', label: 'Account' },
          { key: 'SumPaid', label: 'Amount', align: 'right', format: (v) => (v != null ? fmtV(v) : '—') },
          { key: 'Decription', label: 'Description', wrap: true },
        ],
        rows: paymentAccounts,
      },
    }] : []),
    ...(row.Remarks ? [{
      title: 'Remarks',
      fields: [{ label: 'Remarks', value: row.Remarks, fullWidth: true }],
    }] : []),
  ]
}

export default function IncomingPayments() {
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
        const text = buildSubstringOfFilter(['CardCode', 'CardName', 'Reference1', 'Reference2', 'Remarks', 'BankCode', 'BankAccount', 'TransferReference'], q)
        if (text) qParts.push(text)
        if (qParts.length) parts.push(`(${qParts.join(' or ')})`)
      }
      if (vals.DocNum) parts.push(`DocNum eq ${parseInt(vals.DocNum, 10)}`)
      if (vals.CardCode) parts.push(`CardCode eq '${escapeODataString(vals.CardCode)}'`)
      if (vals.DateFrom) parts.push(`DocDate ge '${vals.DateFrom}'`)
      if (vals.DateTo) parts.push(`DocDate le '${vals.DateTo}'`)

      const data = await fetchB1('/b1s/v1/IncomingPayments', {
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
      const detailPath = `/b1s/v1/IncomingPayments(${docEntry})`
      const detail = await fetchB1WithFallback(
        detailPath,
        { $expand: 'PaymentInvoices,PaymentChecks,PaymentAccounts,PaymentCreditCards' },
        [{}, { $expand: 'PaymentInvoices,PaymentChecks' }, { $expand: 'PaymentInvoices' }]
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
        exportFileName="incoming-payments"
        onRowClick={handleRowClick}
      />
      {selected && (
        <Flyout
          title={`Payment #${selected.DocNum ?? selected.DocEntry ?? ''}`}
          subtitle={selected.CardName || selected.CardCode || ''}
          sections={buildSections(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

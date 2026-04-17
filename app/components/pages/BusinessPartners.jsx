'use client'

import React, { useState } from 'react'
import FilterBar from '../FilterBar'
import GridView from '../GridView'
import Flyout from '../Flyout'
import { buildSubstringOfFilter, escapeODataString, fetchB1, fetchB1WithFallback } from '../../services/b1Api'

const FILTERS = [
  { name: 'SearchText', label: 'Search', type: 'text', placeholder: 'Card Code / Card Name', fullWidth: true },
  { name: 'CardCode', label: 'Card Code', type: 'text', placeholder: 'e.g. C001' },
  { name: 'CardName', label: 'Card Name', type: 'text', placeholder: 'Name' },
  { name: 'GroupCode', label: 'Group Code', type: 'text', placeholder: 'Group #' },
]

const COLUMNS = [
  { field: 'CardCode', headerName: 'Card Code' },
  { field: 'CardName', headerName: 'Card Name' },
  { field: 'Phone1', headerName: 'Phone' },
  { field: 'EmailAddress', headerName: 'Email' },
  { field: 'City', headerName: 'City' },
  { field: 'Country', headerName: 'Country' },
  {
    field: 'CurrentAccountBalance',
    headerName: 'Balance',
    type: 'numericColumn',
    valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''),
  },
]

const SELECT = 'CardCode,CardName,CardType,GroupCode,Phone1,Phone2,Fax,EmailAddress,City,County,Country,CurrentAccountBalance'

const fmt = (v) => (v != null ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : null)

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

  const addresses = Array.isArray(row.BPAddresses) ? row.BPAddresses : []
  const contacts = Array.isArray(row.ContactEmployees) ? row.ContactEmployees : Array.isArray(row.BPContactEmployees) ? row.BPContactEmployees : []
  const bankAccounts = Array.isArray(row.BPBankAccounts) ? row.BPBankAccounts : []

  return [
    {
      title: 'Business Partner',
      subtitle: row.CardCode,
      fields: [
        { label: 'Card Code', value: row.CardCode },
        { label: 'Card Type', value: row.CardType === 'cCustomer' ? 'Customer' : row.CardType === 'cSupplier' ? 'Supplier' : row.CardType },
        { label: 'Card Name', value: row.CardName, fullWidth: true },
        { label: 'Group Code', value: row.GroupCode },
      ],
    },
    {
      title: 'Contact Information',
      fields: [
        { label: 'Phone 1', value: row.Phone1 },
        { label: 'Phone 2', value: row.Phone2 },
        { label: 'Fax', value: row.Fax },
        { label: 'Email', value: row.EmailAddress, fullWidth: true },
      ],
    },
    {
      title: 'Address',
      fields: [
        { label: 'City', value: row.City },
        { label: 'County', value: row.County },
        { label: 'Country', value: row.Country },
      ],
    },
    ...(addresses.length ? [{
      title: 'Addresses',
      table: {
        columns: [
          { key: 'AddressType', label: 'Type' },
          { key: 'AddressName', label: 'Name' },
          { key: 'Street', label: 'Street', wrap: true },
          { key: 'City', label: 'City' },
          { key: 'Country', label: 'Country' },
          { key: 'ZipCode', label: 'Zip' },
        ],
        rows: addresses,
      },
    }] : []),
    ...(contacts.length ? [{
      title: 'Contacts',
      table: {
        columns: [
          { key: 'Name', label: 'Name' },
          { key: 'Position', label: 'Position' },
          { key: 'Phone1', label: 'Phone' },
          { key: 'E_Mail', label: 'Email', wrap: true },
        ],
        rows: contacts,
      },
    }] : []),
    ...(bankAccounts.length ? [{
      title: 'Bank Accounts',
      table: {
        columns: [
          { key: 'BankCode', label: 'Bank' },
          { key: 'AccountNo', label: 'Account #' },
          { key: 'IBAN', label: 'IBAN', wrap: true },
          { key: 'Branch', label: 'Branch' },
        ],
        rows: bankAccounts,
      },
    }] : []),
    {
      title: 'Financial',
      fields: [
        {
          label: 'Current Balance',
          value: fmt(row.CurrentAccountBalance),
          style: { fontSize: 14, fontWeight: 700, color: row.CurrentAccountBalance < 0 ? '#EF4444' : '#111' },
        },
      ],
    },
  ]
}

export default function BusinessPartners() {
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
      const parts = ["CardType eq 'C'"]
      const textFilter = buildSubstringOfFilter(['CardCode', 'CardName'], vals.SearchText)
      if (textFilter) parts.push(textFilter)
      if (vals.CardCode) parts.push(`CardCode eq '${vals.CardCode}'`)
      if (vals.CardName) parts.push(buildSubstringOfFilter(['CardName'], vals.CardName))
      if (vals.GroupCode) parts.push(`GroupCode eq ${parseInt(vals.GroupCode, 10) || 0}`)

      const data = await fetchB1('/b1s/v1/BusinessPartners', {
        $filter: parts.filter(Boolean).join(' and '),
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
    const cardCode = row?.CardCode
    if (!cardCode) return
    setSelected({ __loading: true, CardCode: cardCode, CardName: row.CardName })
    try {
      const detailPath = `/b1s/v1/BusinessPartners('${escapeODataString(cardCode)}')`
      const detail = await fetchB1WithFallback(
        detailPath,
        { $expand: 'BPAddresses,ContactEmployees,BPBankAccounts' },
        [{}, { $expand: 'BPAddresses' }, { $expand: 'ContactEmployees' }]
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
        exportFileName="business-partners"
        onRowClick={handleRowClick}
      />
      {selected && (
        <Flyout
          title={selected.CardName || selected.CardCode}
          subtitle="Business Partner"
          sections={buildSections(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

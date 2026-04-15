import React, { useState } from 'react';
import FilterBar from '../components/FilterBar.jsx';
import GridView from '../components/GridView.jsx';
import Flyout from '../components/Flyout.jsx';
import { fetchB1 } from '../services/b1Api.js';

const FILTERS = [
  { name: 'DocNum', label: 'Doc Number', type: 'text', placeholder: 'e.g. 2001' },
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
];

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
];

const SELECT = 'DocNum,CardCode,CardName,DocDate,DocDueDate,DocTotal,DocumentStatus,DocCurrency,VatSum,DiscountPercent,Reference1,Reference2,Comments';

const fmt = (v) => (v != null ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : null);
const statusLabel = (s) => s === 'bost_Open' ? 'Open' : s === 'bost_Close' ? 'Closed' : s;

function buildSections(row) {
  return [
    {
      title: 'Document Info',
      subtitle: `Sales Order #${row.DocNum}`,
      fields: [
        { label: 'Doc Number', value: row.DocNum },
        { label: 'Currency', value: row.DocCurrency },
        { label: 'Doc Date', value: row.DocDate },
        { label: 'Due Date', value: row.DocDueDate },
        { label: 'Status', value: statusLabel(row.DocumentStatus) },
        { label: 'Reference 1', value: row.Reference1 },
        { label: 'Reference 2', value: row.Reference2 },
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
  ];
}

export default function SalesOrders() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(null);
  const [selected, setSelected] = useState(null);

  const handleSearch = async (vals) => {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const parts = [];
      if (vals.DocNum) parts.push(`DocNum eq ${parseInt(vals.DocNum, 10)}`);
      if (vals.CardCode) parts.push(`CardCode eq '${vals.CardCode}'`);
      if (vals.DateFrom) parts.push(`DocDate ge '${vals.DateFrom}'`);
      if (vals.DateTo) parts.push(`DocDate le '${vals.DateTo}'`);
      if (vals.Status === 'open') parts.push("DocumentStatus eq 'bost_Open'");
      if (vals.Status === 'closed') parts.push("DocumentStatus eq 'bost_Close'");

      const data = await fetchB1('/b1s/v1/Orders', {
        $filter: parts.length ? parts.join(' and ') : undefined,
        $select: SELECT,
        $top: 100,
      });
      setRows(data.value || []);
      setTotal(data['@odata.count'] ?? null);
    } catch (err) {
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <FilterBar filters={FILTERS} onSearch={handleSearch} />
      <GridView
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        error={error}
        totalCount={total}
        exportFileName="sales-orders"
        onRowClick={setSelected}
      />
      {selected && (
        <Flyout
          title={`Sales Order #${selected.DocNum}`}
          subtitle={selected.CardName}
          sections={buildSections(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

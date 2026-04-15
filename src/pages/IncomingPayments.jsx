import React, { useState } from 'react';
import FilterBar from '../components/FilterBar.jsx';
import GridView from '../components/GridView.jsx';
import Flyout from '../components/Flyout.jsx';
import { fetchB1 } from '../services/b1Api.js';

const FILTERS = [
  { name: 'DocNum', label: 'Doc Number', type: 'text', placeholder: 'e.g. 3001' },
  { name: 'CardCode', label: 'Customer Code', type: 'text', placeholder: 'e.g. C001' },
  { name: 'DateFrom', label: 'Date From', type: 'date' },
  { name: 'DateTo', label: 'Date To', type: 'date' },
];

const fmt = (p) => (p.value != null ? Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '');
const fmtV = (v) => (v != null ? Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) : null);

const COLUMNS = [
  { field: 'DocNum', headerName: 'Doc #', type: 'numericColumn' },
  { field: 'CardCode', headerName: 'Customer Code' },
  { field: 'CardName', headerName: 'Customer Name' },
  { field: 'DocDate', headerName: 'Date' },
  { field: 'DocCurrency', headerName: 'Currency' },
  { field: 'CashSum', headerName: 'Cash', type: 'numericColumn', valueFormatter: fmt },
  { field: 'TransferSum', headerName: 'Transfer', type: 'numericColumn', valueFormatter: fmt },
  { field: 'PaymentType', headerName: 'Type' },
];

const SELECT = 'DocNum,CardCode,CardName,DocDate,DocCurrency,CashSum,TransferSum,PaymentType,Reference1,Reference2,Remarks,TransactionCode,DueDate,BankCode,BankAccount,CheckAccount,TransferDate,TransferReference,LocalCurrency';

function buildSections(row) {
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
    ...(row.Remarks ? [{
      title: 'Remarks',
      fields: [{ label: 'Remarks', value: row.Remarks, fullWidth: true }],
    }] : []),
  ];
}

export default function IncomingPayments() {
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

      const data = await fetchB1('/b1s/v1/IncomingPayments', {
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
        exportFileName="incoming-payments"
        onRowClick={setSelected}
      />
      {selected && (
        <Flyout
          title={`Payment #${selected.DocNum}`}
          subtitle={selected.CardName}
          sections={buildSections(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

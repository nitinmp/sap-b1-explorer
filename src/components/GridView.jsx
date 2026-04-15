import React, { useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function GridView({ columns, rows, loading, error, totalCount, exportFileName, onRowClick }) {
  const gridRef = useRef(null);

  const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    minWidth: 80,
    flex: 1,
  };

  const onExport = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `${exportFileName || 'export'}.csv` });
  }, [exportFileName]);

  const rowCount = rows?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <span className="text-sm text-gray-500">
          {loading
            ? 'Loading…'
            : error
            ? ''
            : `Showing ${rowCount}${totalCount != null && totalCount > rowCount ? ` of ${totalCount}` : ''} record${rowCount !== 1 ? 's' : ''}`}
        </span>
        <button
          onClick={onExport}
          disabled={loading || !!error || rowCount === 0}
          className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-1 rounded transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 flex-shrink-0 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Loading / empty states (shown above a hidden grid) */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm flex-shrink-0">
          <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Fetching data…
        </div>
      )}
      {!loading && !error && rowCount === 0 && (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm flex-shrink-0">
          No results. Use the filters above and click Search.
        </div>
      )}

      {/* AG Grid — always mounted once we have rows, given explicit height */}
      {!loading && !error && rowCount > 0 && (
        <div className="ag-theme-alpine mx-4 my-3 rounded-lg overflow-hidden border border-gray-200">
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            pagination
            paginationPageSize={50}
            animateRows
            domLayout="autoHeight"
            rowStyle={{ cursor: onRowClick ? 'pointer' : 'default' }}
            onRowClicked={onRowClick ? (e) => onRowClick(e.data) : undefined}
          />
        </div>
      )}
    </div>
  );
}

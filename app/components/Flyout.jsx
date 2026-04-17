'use client'

import React, { useEffect } from 'react'

export default function Flyout({ title, subtitle, sections, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Dim overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 40,
        }}
      />

      {/* Flyout panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        maxWidth: '100vw',
        background: '#f5f6f7',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,.14)',
        zIndex: 50,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: '#f5f5f5', border: 'none',
              cursor: 'pointer', fontSize: 16, color: '#555',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          minHeight: 0,
          padding: '14px 16px',
          paddingBottom: 96,
          display: 'flex', flexDirection: 'column', gap: 12,
          WebkitOverflowScrolling: 'touch',
        }}>
          {sections.map((section, i) => (
            <div key={i} style={{
              flexShrink: 0,
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #e8e8e8',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{section.title}</div>
                {section.subtitle && (
                  <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{section.subtitle}</div>
                )}
              </div>
              {section.table ? (
                <div style={{ padding: '10px 12px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {section.table.columns.map((col) => (
                          <th
                            key={col.key}
                            style={{
                              textAlign: col.align || 'left',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#666',
                              padding: '8px 8px',
                              borderBottom: '1px solid #eee',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(section.table.rows || []).map((row, rIdx) => (
                        <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#fff' : '#fafafa' }}>
                          {section.table.columns.map((col) => (
                            <td
                              key={col.key}
                              style={{
                                textAlign: col.align || 'left',
                                fontSize: 12.5,
                                color: '#111',
                                padding: '8px 8px',
                                borderBottom: '1px solid #f2f2f2',
                                verticalAlign: 'top',
                                whiteSpace: col.wrap ? 'normal' : 'nowrap',
                              }}
                            >
                              {col.format ? col.format(row[col.key], row) : (row[col.key] != null && row[col.key] !== '' ? row[col.key] : '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {(section.table.rows || []).length === 0 && (
                        <tr>
                          <td
                            colSpan={section.table.columns.length}
                            style={{
                              fontSize: 12.5,
                              color: '#888',
                              padding: '10px 8px',
                            }}
                          >
                            No rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 11,
                }}>
                  {(section.fields || []).map((field, j) => (
                    <div key={j} style={field.fullWidth ? { gridColumn: '1 / -1' } : {}}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: '#888',
                        textTransform: 'uppercase', letterSpacing: '.3px',
                        marginBottom: 3,
                      }}>
                        {field.label}
                      </div>
                      <div style={{
                        fontSize: 13, color: '#111', fontWeight: 500,
                        lineHeight: 1.5,
                        ...(field.style || {}),
                      }}>
                        {field.value != null && field.value !== '' ? field.value : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10,
          padding: '14px 16px',
          background: '#fff',
          borderTop: '1px solid #e8e8e8',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: 11, borderRadius: 8,
              border: '1.5px solid #d0d0d0',
              background: '#fff', color: '#555',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  )
}

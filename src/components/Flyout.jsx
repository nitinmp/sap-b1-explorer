import React, { useEffect } from 'react';

/**
 * Right-side flyout panel following tmpl_admin_dashboard_flyout design.
 *
 * Props:
 *   title      — flyout header title
 *   subtitle   — optional header subtitle
 *   sections   — array of { title, subtitle?, fields: [{ label, value, fullWidth? }] }
 *   onClose    — called when overlay or ✕ is clicked
 */
export default function Flyout({ title, subtitle, sections, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
        width: 400,
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
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {sections.map((section, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 10,
              border: '1px solid #e8e8e8',
              overflow: 'hidden',
            }}>
              {/* Section header */}
              <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{section.title}</div>
                {section.subtitle && (
                  <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{section.subtitle}</div>
                )}
              </div>

              {/* Fields grid */}
              <div style={{
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 11,
              }}>
                {section.fields.map((field, j) => (
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
            </div>
          ))}
        </div>

        {/* Sticky footer — close only (read-only explorer) */}
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
  );
}

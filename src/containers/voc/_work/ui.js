import React from 'react';
import { BasicButton } from 'components';

export const noteStyle = {
  margin: '0 0 8px',
  color: 'var(--cw-text-secondary)',
  fontSize: '12px',
};

export function Note({ children }) {
  return <p style={noteStyle}>{children}</p>;
}

export function SearchActions({ onSearch, onReset, searchLabel = '조회' }) {
  return (
    <React.Fragment>
      <BasicButton value={searchLabel} color="blue" filled className="icon-srch" onClick={onSearch} />
      <BasicButton value="" color="grey" type="icon" className="icon-reset" tooltip="초기화" onClick={onReset} />
    </React.Fragment>
  );
}

export function StatCards({ items, direction, fill }) {
  const column = direction === 'column';
  return (
    <div style={{
      display: 'flex',
      flexDirection: column ? 'column' : 'row',
      gap: '8px',
      flexWrap: column ? 'nowrap' : 'wrap',
      marginBottom: fill ? 0 : '8px',
      height: fill ? '100%' : undefined,
    }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            flex: fill ? '1 1 0' : (column ? '0 0 auto' : '1 1 140px'),
            border: '1px solid var(--cw-border, #e5e7eb)',
            borderRadius: '8px',
            padding: '12px 16px',
            background: 'var(--cw-surface, #fff)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--cw-text-secondary)' }}>{item.label}</div>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function InfoGrid({ pairs }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr 120px 1fr',
      gap: '6px 12px',
      marginBottom: '12px',
      alignItems: 'center',
    }}
    >
      {pairs.map((pair) => (
        <React.Fragment key={pair.label}>
          <span style={{ color: 'var(--cw-text-secondary)' }}>{pair.label}</span>
          <span>{pair.value || '-'}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export function DataTable({ columns, rows, rowKey, rowStyle, onRowClick, selectedKey, minWidth }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="scrm-table" style={{ minWidth: minWidth || '720px', width: '100%' }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="scrm-table-th">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="scrm-table-td" colSpan={columns.length}>조회 결과가 없습니다.</td>
            </tr>
          ) : rows.map((row) => {
            const selected = selectedKey ? selectedKey(row) : false;
            const extra = rowStyle ? rowStyle(row) : undefined;
            return (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  ...extra,
                  cursor: onRowClick ? 'pointer' : undefined,
                  outline: selected ? '2px solid var(--cw-point, #2563eb)' : undefined,
                }}
              >
                {columns.map((column) => (
                  <td key={column.key} className="scrm-table-td">{column.value(row)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

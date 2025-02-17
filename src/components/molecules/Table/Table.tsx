import React from 'react';
import styles from './Table.module.scss';
import { flexRender, Table as TableType } from '@tanstack/react-table';

interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  table: TableType<any>
  columnSizeVars: {
    [key: string]: number
  }
}

export const Table: React.FC<TableProps> = ({
  table,
  columnSizeVars,
  ...props
}) => {
  return (
    <div
        className={styles.divTable}
        style={{
        ...columnSizeVars,
        width: table.getTotalSize(),
        }}
        {...props}
    >
      <div className={styles.thead}>
        {table.getHeaderGroups().map(headerGroup => (
          <div key={headerGroup.id} className={styles.tr}>
            {headerGroup.headers.map(header => (
              <div
              key={header.id}
              className={styles.th}
              style={{
                  width: `calc(var(--header-${header.id}-size) * 1px)`,
              }}
              >
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
              {/* Zone de redimensionnement */}
              <div
                onDoubleClick={() => header.column.resetSize()}
                onMouseDown={header.getResizeHandler()}
                onTouchStart={header.getResizeHandler()}
                className={`${styles.resizer} ${header.column.getIsResizing() ? styles.isResizing : ''}`}
              />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.tbody}>
        {table.getRowModel().rows.map(row => (
          <div key={row.id} className={styles.tr}>
          {row.getVisibleCells().map(cell => (
            <div
              key={cell.id}
              className={styles.td}
              style={{
              width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
            }}
            >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ))}
          </div>
        ))}
      </div>
    </div>
  );
};

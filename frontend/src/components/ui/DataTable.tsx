import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { useTheme } from '../../context/ThemeContext';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  hidden?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | null;
  exportFileName?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching the selected parameters.',
  pageSize = 15,
  onRowClick,
  selectedRowKey,
  exportFileName = 'export.csv',
  className = '',
}: DataTableProps<T>) {
  const { density } = useTheme();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [visibleColKeys, setVisibleColKeys] = useState<Set<string>>(() => {
    return new Set(columns.filter((c) => !c.hidden).map((c) => c.key));
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const activeColumns = useMemo(() => {
    return columns.filter((c) => visibleColKeys.has(c.key));
  }, [columns, visibleColKeys]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleColumn = (key: string) => {
    const next = new Set(visibleColKeys);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    setVisibleColKeys(next);
  };

  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const exportCols = activeColumns;
    const headers = exportCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = sortedData.map((row) =>
      exportCols
        .map((c) => {
          const val = row[c.key];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pyClass = density === 'compact' ? 'py-1.5' : 'py-2.5';

  if (isLoading) {
    return (
      <div className={`rounded-lg border border-cp-border bg-cp-bg-surface overflow-hidden ${className}`}>
        <TableSkeleton rows={pageSize > 10 ? 8 : pageSize} cols={columns.length} />
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-cp-border bg-cp-bg-surface overflow-hidden shadow-xs flex flex-col ${className}`}>
      {/* Table Toolbar */}
      <div className="p-2.5 border-b border-cp-border bg-cp-bg-elevated/40 flex items-center justify-between gap-3 text-xs">
        <span className="text-[11px] text-cp-text-muted font-mono">
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
        </span>

        <div className="flex items-center gap-1.5 relative">
          <Button
            variant="ghost"
            size="xs"
            onClick={handleExportCSV}
            disabled={sortedData.length === 0}
            leftIcon={<Download className="w-3 h-3" />}
          >
            Export CSV
          </Button>

          {/* Column Visibility Menu */}
          <div className="relative">
            <IconButton
              aria-label="Toggle visible columns"
              size="xs"
              variant="ghost"
              onClick={() => setColMenuOpen(!colMenuOpen)}
            >
              <SlidersHorizontal className="w-3 h-3" />
            </IconButton>

            {colMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 p-2 rounded-md border border-cp-border bg-cp-bg-surface shadow-md z-30 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-cp-text-muted block px-1 pb-1 border-b border-cp-border">
                  Display Columns
                </span>
                <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1">
                  {columns.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 px-1.5 py-1 rounded text-[11px] hover:bg-cp-bg-hover cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColKeys.has(c.key)}
                        onChange={() => toggleColumn(c.key)}
                        className="rounded border-cp-border text-cp-accent"
                      />
                      <span className="truncate">{c.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-cp-bg-elevated text-cp-text-muted uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-cp-border">
            <tr>
              {activeColumns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-3 py-2 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    } ${col.sortable !== false ? 'cursor-pointer hover:text-cp-text-primary select-none' : ''} ${col.className || ''}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div className={`inline-flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : ''}`}>
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-cp-text-muted">
                          {isSorted ? (
                            sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-cp-accent" /> : <ChevronDown className="w-3 h-3 text-cp-accent" />
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-cp-border/60 font-mono text-[11px] tabular-nums">
            {paginatedData.map((row) => {
              const rowKey = keyExtractor(row);
              const isSelected = selectedRowKey === rowKey;
              return (
                <tr
                  key={rowKey}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    isSelected
                      ? 'bg-cp-accent/10 border-l-2 border-l-cp-accent'
                      : 'hover:bg-cp-bg-hover/60'
                  }`}
                >
                  {activeColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 ${pyClass} ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedData.length === 0 && (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 border-t border-cp-border bg-cp-bg-surface flex items-center justify-between text-xs">
          <span className="text-[11px] text-cp-text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              aria-label="Previous page"
              size="xs"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </IconButton>
            <IconButton
              aria-label="Next page"
              size="xs"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}

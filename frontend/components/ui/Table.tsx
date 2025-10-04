import React from 'react';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
};

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => {
  return <thead className={`bg-gray-50 ${className}`}>{children}</thead>;
};

export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>{children}</tbody>;
};

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  onClick,
  hover = true,
}) => {
  const hoverClass = hover ? 'hover:bg-gray-50' : '';
  const clickClass = onClick ? 'cursor-pointer' : '';

  return (
    <tr className={`${hoverClass} ${clickClass} ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
};

export interface TableHeadCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  onSort?: () => void;
  sortDirection?: 'asc' | 'desc' | null;
}

export const TableHeadCell: React.FC<TableHeadCellProps> = ({
  children,
  className = '',
  align = 'left',
  sortable = false,
  onSort,
  sortDirection = null,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const sortableClass = sortable ? 'cursor-pointer select-none hover:bg-gray-100' : '';

  return (
    <th
      className={`px-6 py-3 ${alignClasses[align]} text-xs font-medium text-gray-500 uppercase tracking-wider ${sortableClass} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="text-gray-400">
            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  );
};

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  align = 'left',
  colSpan,
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${alignClasses[align]} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
};

export interface TableEmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  colSpan: number;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  message = 'No data available',
  icon,
  action,
  colSpan,
}) => {
  return (
    <TableRow hover={false}>
      <TableCell colSpan={colSpan} align="center" className="py-12">
        <div className="flex flex-col items-center justify-center">
          {icon && <div className="text-gray-400 mb-4 text-4xl">{icon}</div>}
          <p className="text-gray-500 mb-4">{message}</p>
          {action && <div>{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
};

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>
          {onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700">
                Per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

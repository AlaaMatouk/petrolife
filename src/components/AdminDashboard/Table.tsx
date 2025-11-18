import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { LoadingSpinner } from "../shared/Spinner/LoadingSpinner";

export interface TableColumn<T = any> {
  key: string;
  label?: string;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  className = "",
  headerClassName = "",
  rowClassName = "",
  cellClassName = "",
  loading = false,
  emptyMessage = "لا توجد بيانات",
}: TableProps<T>) => {
  if (loading) {
    return (
      <LoadingSpinner size="md" message="جاري التحميل..." className="py-8" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-color-mode-text-icons-t-sec">{emptyMessage}</div>
      </div>
    );
  }

  const hasAnyLabels = columns.some((column) => column.label);

  return (
    <div
      className={`w-full rounded-[20px] border border-[color:var(--border-subtle)] bg-[var(--surface-card)] shadow-sm transition-colors duration-300 ${className}`}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full"
          style={{ borderCollapse: "separate", borderSpacing: 0 }}
        >
          {hasAnyLabels && (
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-center border-b border-[color:var(--border-subtle)] font-medium text-sm whitespace-nowrap transition-colors duration-300 ${
                      column.width || "w-auto"
                    } ${headerClassName}`}
                    style={{
                      backgroundColor: "var(--table-header-bg)",
                      color: "var(--table-text-color)",
                    }}
                  >
                    {column.label && (
                      <div className="flex items-center justify-end gap-2">
                        <span>{column.label}</span>
                        {column.key === "accountStatus" && (
                          <SlidersHorizontal className="w-4 h-4 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(Array.isArray(data) ? data : []).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`hover:bg-[color:var(--table-row-hover)] transition-colors ${rowClassName}`}
                style={{
                  borderBottom:
                    "1px solid var(--border-subtle, rgba(226, 232, 240, 1))",
                  borderBottomWidth: "1px",
                  borderBottomStyle: "solid",
                  borderBottomColor:
                    "var(--border-subtle, rgba(226, 232, 240, 1))",
                }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`align-middle py-3 px-4 text-sm text-center ${
                      column.width || "w-auto"
                    } ${cellClassName}`}
                    style={{
                      borderBottom:
                        "1px solid var(--border-subtle, rgba(226, 232, 240, 1))",
                      color: "var(--table-text-color)",
                    }}
                  >
                    <div className="flex items-center justify-end transition-colors duration-300">
                      {column.render
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

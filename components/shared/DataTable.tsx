import { Fragment, type ReactNode } from "react";
import { Card } from "./Card";
import { Th, Td, RowActions } from "./TableHelpers";

export interface ColumnDef<T> {
  header: string;
  cell: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  renderMobileCard: (row: T, actions: ReactNode) => ReactNode;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  renderMobileCard,
  onEdit,
  onDelete,
  onView,
  rowClassName,
}: DataTableProps<T>) {
  const hasActions = !!(onEdit || onDelete || onView);

  return (
    <>
      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                {columns.map((col, i) => (
                  <Th key={i}>{col.header}</Th>
                ))}
                {hasActions && <Th>إجراءات</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-muted/20 transition-colors ${
                    rowClassName ? rowClassName(row) : ""
                  }`}
                >
                  {columns.map((col, i) => (
                    <Td key={i}>{col.cell(row)}</Td>
                  ))}
                  {hasActions && (
                    <Td>
                      <RowActions
                        onEdit={onEdit ? () => onEdit(row) : undefined}
                        onDelete={onDelete ? () => onDelete(row) : undefined}
                        onView={onView ? () => onView(row) : undefined}
                      />
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="md:hidden space-y-3">
        {data.map((row) => {
          const actions = hasActions ? (
            <RowActions
              onEdit={onEdit ? () => onEdit(row) : undefined}
              onDelete={onDelete ? () => onDelete(row) : undefined}
              onView={onView ? () => onView(row) : undefined}
            />
          ) : null;

          return (
            <Fragment key={row.id}>{renderMobileCard(row, actions)}</Fragment>
          );
        })}
      </div>
    </>
  );
}

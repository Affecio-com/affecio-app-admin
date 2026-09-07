import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = "No results found.",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-affecio-muted">{emptyMessage}</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.cell(row)}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

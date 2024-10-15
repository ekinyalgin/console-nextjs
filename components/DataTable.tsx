'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { Settings2, Trash2 } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  keyField: string;
  selectable?: boolean;
  selectedItems?: any[];
  onSelectChange?: (selectedItems: any[]) => void;
  onEdit?: (item: TData) => void;
  onDelete?: (id: any) => void;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  keyField,
  selectable = false,
  selectedItems = [],
  onSelectChange,
  onEdit,
  onDelete,
  showEditAction = true,
  showDeleteAction = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectable) {
      const newRowSelection = selectedItems.reduce(
        (acc, id) => ({ ...acc, [id]: true }),
        {}
      );
      setRowSelection(newRowSelection);
    }
  }, [selectedItems, selectable]);

  const handleRowSelectionChange = useCallback(
    (id: string, checked: boolean) => {
      const newSelection = { ...rowSelection, [id]: checked };
      setRowSelection(newSelection);
      if (selectable && onSelectChange) {
        const selectedIds = Object.keys(newSelection)
          .filter((key) => newSelection[key])
          .map(Number);
        console.log('DataTable - Selected IDs:', selectedIds);
        onSelectChange(selectedIds);
      }
    },
    [rowSelection, selectable, onSelectChange]
  );

  const tableColumns: ColumnDef<TData, TValue>[] = [
    ...(selectable
      ? [
          {
            id: 'select',
            header: ({ table }) => (
              <input
                type="checkbox"
                checked={table.getIsAllPageRowsSelected()}
                onChange={(e) => {
                  table.toggleAllPageRowsSelected(e.target.checked);
                  const allIds = data.map((item: any) => item[keyField]);
                  handleRowSelectionChange(
                    'all',
                    e.target.checked,
                    e.target.checked ? allIds : []
                  );
                }}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <input
                type="checkbox"
                checked={row.getIsSelected()}
                onChange={(e) => {
                  row.toggleSelected(e.target.checked);
                  handleRowSelectionChange(row.id, e.target.checked);
                }}
                aria-label="Select row"
              />
            ),
          } as ColumnDef<TData, TValue>,
        ]
      : []),
    ...columns,
    ...(showEditAction || showDeleteAction
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
              <div className="flex justify-center space-x-2">
                {showEditAction && onEdit && (
                  <Button
                    onClick={() => onEdit(row.original)}
                    size="sm"
                    variant="ghost"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                )}
                {showDeleteAction && onDelete && (
                  <Button
                    onClick={() => onDelete((row.original as any)[keyField])}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ),
          } as ColumnDef<TData, TValue>,
        ]
      : []),
  ];

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: selectable,
    onRowSelectionChange: setRowSelection,
  });

  return (
    <div className="rounded-md shadow-sm">
      <Table className="bg-white">
        <TableHeader className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`h-10 px-4 text-xs font-semibold uppercase text-gray-600 ${
                    header.column.columnDef.headerClassName || ''
                  }`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`h-10 px-4 ${
                      cell.column.columnDef.cellClassName || ''
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (selectable ? 1 : 0) + 1}
                className="h-10 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

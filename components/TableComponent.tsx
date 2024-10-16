import React, { useState } from 'react';
import { Column } from 'react-table';
import { Button } from '@/components/ui/button';
import { Settings2, Trash2, Check, X } from 'lucide-react';

interface TableComponentProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  selectedIds?: number[];
  onSelectChange?: (id: number) => void;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  onDescriptionToggle?: (id: number) => void;
  expandedDescriptions?: number[];
  showEditAction?: boolean;
  showDeleteAction?: boolean;
  renderSubComponent?: (props: { row: { original: T } }) => React.ReactNode;
}

export function TableComponent<T extends object>({
  columns,
  data,
  keyField,
  selectedIds = [],
  onSelectChange,
  onEdit,
  onDelete,
  onDescriptionToggle,
  expandedDescriptions = [],
  showEditAction = true,
  showDeleteAction = true,
  renderSubComponent,
}: TableComponentProps<T>) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null
  );

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmation(id);
  };

  const handleConfirmDelete = (id: number) => {
    onDelete && onDelete(id);
    setDeleteConfirmation(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  return (
    <table className="min-w-full bg-white">
      <thead>
        <tr>
          {onSelectChange && <th className="w-1/12 px-4 py-2">Select</th>}
          {columns.map((column, index) => (
            <th key={index} className={`px-4 py-2 ${column.className || ''}`}>
              {column.Header as React.ReactNode}
            </th>
          ))}
          {(showEditAction || showDeleteAction) && (
            <th className="w-1/12 px-4 py-2">Actions</th>
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <React.Fragment key={item[keyField] as React.Key}>
            <tr className="border-t">
              {onSelectChange && (
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item[keyField] as number)}
                    onChange={() => onSelectChange(item[keyField] as number)}
                  />
                </td>
              )}
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={`px-4 py-2 ${column.className || ''}`}
                >
                  {column.Cell
                    ? column.Cell({
                        value: item[column.accessor as keyof T],
                        row: { original: item },
                      })
                    : (item[column.accessor as keyof T] as React.ReactNode)}
                </td>
              ))}
              {(showEditAction || showDeleteAction) && (
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center space-x-2">
                    {showEditAction && onEdit && (
                      <Button
                        onClick={() => onEdit(item)}
                        size="sm"
                        variant="ghost"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    )}
                    {showDeleteAction && onDelete && (
                      <>
                        {deleteConfirmation === item[keyField] ? (
                          <>
                            <Button
                              onClick={() =>
                                handleConfirmDelete(item[keyField] as number)
                              }
                              size="sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-800"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleCancelDelete}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() =>
                              handleDeleteClick(item[keyField] as number)
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
            {expandedDescriptions?.includes(item[keyField] as number) &&
              renderSubComponent && (
                <tr>
                  <td
                    colSpan={columns.length + (onSelectChange ? 2 : 1)}
                    className="px-4 py-2 bg-gray-50"
                  >
                    {renderSubComponent({ row: { original: item } })}
                  </td>
                </tr>
              )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

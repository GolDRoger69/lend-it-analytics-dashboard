
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DataTableProps {
  title: string;
  description?: string;
  columns: { key: string; label: string }[];
  data: Record<string, any>[] | null;
  isLoading?: boolean;
  error?: string | null;
}

export function DataTable({ 
  title,
  description,
  columns, 
  data, 
  isLoading = false,
  error = null
}: DataTableProps) {
  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="mr-2 h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-6 text-destructive">
            <p>{error}</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            <p>No data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell key={`${i}-${column.key}`}>
                        {/* Handle different data types */}
                        {typeof row[column.key] === 'boolean' 
                          ? row[column.key] ? 'Yes' : 'No'
                          : typeof row[column.key] === 'number' && column.key.includes('price') || column.key.includes('cost') || column.key.includes('amount') || column.key.includes('revenue')
                            ? `$${row[column.key].toFixed(2)}`
                            : row[column.key] === null || row[column.key] === undefined
                              ? '—' 
                              : String(row[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

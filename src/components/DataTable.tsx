
import { useState } from "react";
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
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Get total number of pages
  const totalPages = data ? Math.ceil(data.length / itemsPerPage) : 0;
  
  // Get current items
  const currentItems = data ? data.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  ) : [];
  
  // Create array of page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  
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
          <>
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
                  {currentItems.map((row, i) => (
                    <TableRow key={i}>
                      {columns.map((column) => (
                        <TableCell key={`${i}-${column.key}`}>
                          {/* Handle different data types */}
                          {typeof row[column.key] === 'boolean' 
                            ? row[column.key] ? 'Yes' : 'No'
                            : typeof row[column.key] === 'number' && 
                              (column.key.includes('price') || 
                               column.key.includes('cost') || 
                               column.key.includes('amount') || 
                               column.key.includes('revenue') || 
                               column.key.includes('spent'))
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {pageNumbers.map(number => {
                    // Show first page, last page, and pages around current page
                    if (
                      number === 1 || 
                      number === totalPages || 
                      (number >= currentPage - 2 && number <= currentPage + 2)
                    ) {
                      return (
                        <PaginationItem key={number}>
                          <PaginationLink 
                            isActive={number === currentPage}
                            onClick={() => setCurrentPage(number)}
                            className="cursor-pointer"
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Show ellipsis
                    if (number === 2 && currentPage > 4) {
                      return <PaginationEllipsis key={`ellipsis-start`} />;
                    }
                    
                    if (number === totalPages - 1 && currentPage < totalPages - 3) {
                      return <PaginationEllipsis key={`ellipsis-end`} />;
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
            
            <div className="text-xs text-muted-foreground text-center mt-2">
              Showing {currentItems.length} of {data.length} items
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

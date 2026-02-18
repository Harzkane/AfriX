import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalCount: number;
    limit: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function Pagination({
    currentPage,
    totalCount,
    limit,
    onPageChange,
    isLoading
}: PaginationProps) {
    const totalPages = Math.ceil(totalCount / limit);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * limit + 1, totalCount)} to {Math.min(currentPage * limit, totalCount)} of {totalCount} users
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                </Button>
                <div className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
}

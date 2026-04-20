"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/button";

type TablePaginationProps = {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
      <p>
        Showing {start}-{end} of {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="gap-1"
        >
          <ChevronLeft size={14} />
          Prev
        </Button>
        <span className="min-w-20 text-center text-xs font-medium text-slate-500">
          Page {safePage} of {totalPages}
        </span>
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="gap-1"
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
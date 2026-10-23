"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = "data",
  className = "",
}: TablePaginationProps) {
  const isShowAll = pageSize >= 9999;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : isShowAll ? 1 : (safePage - 1) * pageSize + 1;
  const endItem = isShowAll ? totalItems : Math.min(safePage * pageSize, totalItems);

  // Generate page numbers to show around current page
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (safePage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (safePage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card/60 text-sm ${className}`}
    >
      {/* Left: Summary text */}
      <div className="text-muted-foreground text-xs sm:text-sm">
        Menampilkan{" "}
        <span className="font-semibold text-foreground">
          {startItem} - {endItem}
        </span>{" "}
        dari <span className="font-semibold text-foreground">{totalItems}</span> {itemLabel}
      </div>

      {/* Right: Page Size & Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Baris:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              const newSize = Number(val);
              onPageSizeChange(newSize);
              onPageChange(1); // reset to first page when page size changes
            }}
          >
            <SelectTrigger className="h-8 w-[88px] text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs">
                  {opt} / hal
                </SelectItem>
              ))}
              <SelectItem value="99999" className="text-xs">
                Semua
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navigation Buttons */}
        {!isShowAll && totalPages > 1 && (
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(1)}
              disabled={safePage <= 1}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage <= 1}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {getPageNumbers().map((p, idx) =>
                typeof p === "number" ? (
                  <Button
                    key={idx}
                    variant={p === safePage ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs font-semibold"
                    onClick={() => onPageChange(p)}
                  >
                    {p}
                  </Button>
                ) : (
                  <span key={idx} className="px-1 text-xs text-muted-foreground">
                    {p}
                  </span>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage >= totalPages}
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(totalPages)}
              disabled={safePage >= totalPages}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

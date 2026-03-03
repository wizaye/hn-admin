"use client"

import * as React from "react"
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    type PaginationState,
} from "@tanstack/react-table"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Columns3,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"

interface DataTableProps<TData> {
    columns: ColumnDef<TData, any>[]
    data: TData[]
    totalRows: number
    pagination: PaginationState
    onPaginationChange: (pagination: PaginationState) => void
    loading?: boolean
    toolbar?: React.ReactNode
}

export function DataTable<TData>({
    columns,
    data,
    totalRows,
    pagination,
    onPaginationChange,
    loading = false,
    toolbar,
}: DataTableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

    const pageCount = Math.ceil(totalRows / pagination.pageSize)

    const table = useReactTable({
        data,
        columns,
        pageCount,
        state: {
            sorting,
            columnVisibility,
            pagination,
        },
        manualPagination: true,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === "function" ? updater(pagination) : updater
            onPaginationChange(newPagination)
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    {toolbar}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Columns3 className="size-4" />
                            <span className="hidden lg:inline">Columns</span>
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {table
                            .getAllColumns()
                            .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                            .map((column) => (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id.replace(/_/g, " ")}
                                </DropdownMenuCheckboxItem>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const align = (header.column.columnDef.meta as any)?.align
                                    const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : ""
                                    return (
                                        <TableHead key={header.id} colSpan={header.colSpan} className={alignClass}>
                                            {header.isPlaceholder ? null : (
                                                <div
                                                    className={
                                                        header.column.getCanSort()
                                                            ? `flex items-center gap-1 cursor-pointer select-none ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : ""}`
                                                            : ""
                                                    }
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {header.column.getCanSort() && (
                                                        <span className="text-muted-foreground">
                                                            {header.column.getIsSorted() === "asc" ? (
                                                                <ArrowUp className="size-3.5" />
                                                            ) : header.column.getIsSorted() === "desc" ? (
                                                                <ArrowDown className="size-3.5" />
                                                            ) : (
                                                                <ArrowUpDown className="size-3.5 opacity-50" />
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-48">
                                    <div className="flex items-center justify-center">
                                        <Spinner className="size-6 text-muted-foreground" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => {
                                        const align = (cell.column.columnDef.meta as any)?.align
                                        const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : ""
                                        return (
                                            <TableCell key={cell.id} className={alignClass}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
                <div className="text-muted-foreground hidden text-sm lg:block">
                    Showing {pagination.pageIndex * pagination.pageSize + 1}–{Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)} of {totalRows}
                </div>
                <div className="flex w-full items-center gap-6 lg:w-fit lg:gap-8">
                    <div className="hidden items-center gap-2 lg:flex">
                        <Label htmlFor="rows-per-page" className="text-sm font-medium whitespace-nowrap">
                            Rows per page
                        </Label>
                        <Select
                            value={`${pagination.pageSize}`}
                            onValueChange={(value) => {
                                onPaginationChange({ pageIndex: 0, pageSize: Number(value) })
                            }}
                        >
                            <SelectTrigger size="sm" className="w-18" id="rows-per-page">
                                <SelectValue placeholder={pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 30, 50].map((size) => (
                                    <SelectItem key={size} value={`${size}`}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                        Page {pagination.pageIndex + 1} of {pageCount || 1}
                    </div>
                    <div className="ml-auto flex items-center gap-2 lg:ml-0">
                        <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
                            disabled={pagination.pageIndex === 0}
                        >
                            <span className="sr-only">First page</span>
                            <ChevronsLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: Math.max(0, pagination.pageIndex - 1) })}
                            disabled={pagination.pageIndex === 0}
                        >
                            <span className="sr-only">Previous page</span>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="size-8"
                            size="icon"
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: Math.min(pageCount - 1, pagination.pageIndex + 1) })}
                            disabled={pagination.pageIndex >= pageCount - 1}
                        >
                            <span className="sr-only">Next page</span>
                            <ChevronRight className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden size-8 lg:flex"
                            size="icon"
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })}
                            disabled={pagination.pageIndex >= pageCount - 1}
                        >
                            <span className="sr-only">Last page</span>
                            <ChevronsRight className="size-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

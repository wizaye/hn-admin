"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import AdminSidebarLayout from "@/components/admin-sidebar-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Mail, Package, Megaphone, Clock, ArrowRight, Users } from "lucide-react";

interface Enquiry {
  id: number;
  customer_name: string;
  company_name: string;
  email: string;
  total_items: number;
  status: string;
  created_at: string;
}

interface Banner {
  id: number;
  active: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  contacted: "bg-blue-100 text-blue-800 border-blue-200",
  quoted: "bg-purple-100 text-purple-800 border-purple-200",
  converted: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const enquiryColumns: ColumnDef<Enquiry>[] = [
  {
    accessorKey: "company_name",
    header: "Company",
    cell: ({ row }) => <span className="font-medium">{row.original.company_name}</span>,
  },
  {
    accessorKey: "customer_name",
    header: "Contact",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <span className="text-muted-foreground text-sm hidden md:inline">{row.original.email}</span>,
    meta: { className: "hidden md:table-cell" },
  },
  {
    accessorKey: "total_items",
    header: () => <div className="text-center">Items</div>,
    cell: ({ row }) => <div className="text-center font-medium">{row.original.total_items}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className={statusColors[row.original.status] || ""}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {new Date(row.original.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </span>
    ),
    meta: { className: "hidden md:table-cell" },
  },
];

export default function DashboardPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [totalEnquiries, setTotalEnquiries] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [totalBanners, setTotalBanners] = useState(0);
  const [categories, setCategories] = useState<{ category: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [enquiriesRes, pendingRes, bannersRes, categoriesRes] = await Promise.all([
          fetch("/api/enquiries?limit=5").then((r) => r.json()),
          fetch("/api/enquiries?status=pending&limit=1").then((r) => r.json()),
          fetch("/api/admin/banners?limit=100").then((r) => r.json()),
          fetch("/api/products/categories").then((r) => r.json()),
        ]);
        if (enquiriesRes.success) {
          setEnquiries(enquiriesRes.data || []);
          setTotalEnquiries(enquiriesRes.pagination?.total || enquiriesRes.data?.length || 0);
        }
        if (pendingRes.success) {
          setPendingCount(pendingRes.pagination?.total || 0);
        }
        if (bannersRes.success) {
          setBanners(bannersRes.data || []);
          setTotalBanners(bannersRes.pagination?.total || bannersRes.data?.length || 0);
        }
        if (categoriesRes.success) setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeBanners = banners.filter((b) => b.active === 1).length;

  const table = useReactTable({
    data: enquiries,
    columns: enquiryColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AdminSidebarLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business at a glance.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Enquiries</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalEnquiries}</div>
                  <p className="text-xs text-muted-foreground mt-1">All customer enquiries</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
                  <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Product Categories</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{categories.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active categories</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Banners</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeBanners}</div>
                  <p className="text-xs text-muted-foreground mt-1">of {totalBanners} total</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Enquiries */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Enquiries</CardTitle>
                  <CardDescription>Latest customer enquiries</CardDescription>
                </div>
                <Link href="/enquiries">
                  <Button variant="outline" size="sm" className="gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {enquiries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No enquiries yet</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-b-lg">
                    <Table>
                      <TableHeader className="bg-muted">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
          </>
        )}
      </div>
    </AdminSidebarLayout>
  );
}

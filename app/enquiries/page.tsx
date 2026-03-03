"use client";

import React, { useEffect, useState, useCallback } from "react";
import { type ColumnDef, type PaginationState } from "@tanstack/react-table";
import AdminSidebarLayout from "@/components/admin-sidebar-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import {
    MoreHorizontal, RefreshCcw, Mail, Phone, Building2, Package, Calendar, StickyNote, IndianRupee, Search,
} from "lucide-react";

interface EnquiryItem {
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    quantity: number;
    price: number;
}

interface Enquiry {
    id: number;
    customer_name: string;
    company_name: string;
    email: string;
    phone: string;
    customization_notes: string;
    expected_quantity: number;
    delivery_timeline: string;
    items: EnquiryItem[];
    total_items: number;
    status: string;
    created_at: string;
    updated_at: string;
    admin_notes: string;
    quoted_amount: number | null;
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    contacted: "bg-blue-100 text-blue-800 border-blue-200",
    quoted: "bg-purple-100 text-purple-800 border-purple-200",
    converted: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusOptions = ["pending", "contacted", "quoted", "converted", "closed"];

export default function EnquiriesPage() {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const [quotedAmount, setQuotedAmount] = useState("");
    const [saving, setSaving] = useState(false);

    const fetchEnquiries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(pagination.pageSize),
                offset: String(pagination.pageIndex * pagination.pageSize),
            });
            if (statusFilter !== "all") params.set("status", statusFilter);
            const res = await fetch(`/api/enquiries?${params}`);
            const data = await res.json();
            if (data.success) {
                setEnquiries(data.data || []);
                setTotalRows(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Error fetching enquiries:", error);
            toast.error("Failed to load enquiries");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, pagination.pageIndex, pagination.pageSize]);

    useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);

    // Reset to page 0 when filter changes
    useEffect(() => { setPagination((p) => ({ ...p, pageIndex: 0 })); }, [statusFilter]);

    const openDetail = (enquiry: Enquiry) => {
        setSelectedEnquiry(enquiry);
        setAdminNotes(enquiry.admin_notes || "");
        setQuotedAmount(enquiry.quoted_amount?.toString() || "");
        setDetailOpen(true);
    };

    const updateStatus = async (id: number, newStatus: string) => {
        const toastId = toast.loading(`Updating status to "${newStatus}"...`);
        try {
            const res = await fetch(`/api/enquiries/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Status updated to "${newStatus}"`, { id: toastId });
                fetchEnquiries();
                if (selectedEnquiry?.id === id) setSelectedEnquiry({ ...selectedEnquiry, status: newStatus });
            } else {
                toast.error("Failed to update status", { id: toastId });
            }
        } catch {
            toast.error("Failed to update status", { id: toastId });
        }
    };

    const saveDetails = async () => {
        if (!selectedEnquiry) return;
        setSaving(true);
        const toastId = toast.loading("Saving enquiry details...");
        try {
            const res = await fetch(`/api/enquiries/${selectedEnquiry.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ admin_notes: adminNotes, quoted_amount: quotedAmount ? parseFloat(quotedAmount) : null }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Enquiry details saved", { id: toastId });
                fetchEnquiries();
                setDetailOpen(false);
            } else {
                toast.error("Failed to save details", { id: toastId });
            }
        } catch {
            toast.error("Failed to save details", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const columns: ColumnDef<Enquiry>[] = [
        {
            accessorKey: "id",
            header: "#",
            cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>,
            enableHiding: false,
        },
        {
            accessorKey: "company_name",
            header: "Company",
            cell: ({ row }) => (
                <Button variant="link" className="text-foreground px-0 h-auto font-medium" onClick={() => openDetail(row.original)}>
                    {row.original.company_name}
                </Button>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "customer_name",
            header: "Contact",
            cell: ({ row }) => <span>{row.original.customer_name}</span>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
        },
        {
            accessorKey: "phone",
            header: "Phone",
            cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.phone}</span>,
        },
        {
            accessorKey: "total_items",
            header: "Items",
            cell: ({ row }) => <span className="font-medium">{row.original.total_items}</span>,
            meta: { align: "center" },
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
                    {new Date(row.original.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                </span>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {statusOptions.map((s) => (
                            <DropdownMenuItem key={s} disabled={s === row.original.status} onClick={() => updateStatus(row.original.id, s)}>
                                <Badge variant="outline" className={`mr-2 ${statusColors[s]}`}>{s}</Badge>
                                {s === row.original.status && "(current)"}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableHiding: false,
        },
    ];

    // Client-side search filter (search isn't in the API for enquiries)
    const filteredEnquiries = searchQuery
        ? enquiries.filter((e) =>
            e.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : enquiries;

    return (
        <AdminSidebarLayout>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Enquiries</h1>
                        <p className="text-muted-foreground">Manage customer enquiries and track status</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchEnquiries} className="gap-2">
                        <RefreshCcw className="w-4 h-4" /> Refresh
                    </Button>
                </div>

                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="contacted">Contacted</TabsTrigger>
                        <TabsTrigger value="quoted">Quoted</TabsTrigger>
                        <TabsTrigger value="converted">Converted</TabsTrigger>
                        <TabsTrigger value="closed">Closed</TabsTrigger>
                    </TabsList>
                </Tabs>

                <DataTable
                    columns={columns}
                    data={filteredEnquiries}
                    totalRows={totalRows}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    loading={loading}
                    toolbar={
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search enquiries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                    }
                />

                {/* Detail Dialog */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        {selectedEnquiry && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3">
                                        Enquiry #{selectedEnquiry.id}
                                        <Badge variant="outline" className={statusColors[selectedEnquiry.status] || ""}>{selectedEnquiry.status}</Badge>
                                    </DialogTitle>
                                    <DialogDescription>{selectedEnquiry.company_name} — {selectedEnquiry.customer_name}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-muted-foreground" /><span>{selectedEnquiry.company_name}</span></div>
                                        <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><a href={`mailto:${selectedEnquiry.email}`} className="underline">{selectedEnquiry.email}</a></div>
                                        <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><a href={`tel:${selectedEnquiry.phone}`} className="underline">{selectedEnquiry.phone}</a></div>
                                        <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-muted-foreground" /><span>{selectedEnquiry.delivery_timeline}</span></div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="font-medium mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Requested Products ({selectedEnquiry.items?.length || 0})</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead><TableHead>Variant</TableHead>
                                                    <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Price</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedEnquiry.items?.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                                        <TableCell className="text-muted-foreground">{item.variantName}</TableCell>
                                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">₹{item.price?.toLocaleString("en-IN")}</TableCell>
                                                        <TableCell className="text-right font-medium">₹{(item.price * item.quantity).toLocaleString("en-IN")}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {selectedEnquiry.customization_notes && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h4 className="font-medium mb-2 flex items-center gap-2"><StickyNote className="w-4 h-4" /> Customization Notes</h4>
                                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">{selectedEnquiry.customization_notes}</p>
                                            </div>
                                        </>
                                    )}
                                    <Separator />
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="status">Update Status</Label>
                                            <Select value={selectedEnquiry.status} onValueChange={(value) => updateStatus(selectedEnquiry.id, value)}>
                                                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {statusOptions.map((s) => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="quoted_amount">Quoted Amount (₹)</Label>
                                            <div className="relative mt-1.5">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input id="quoted_amount" type="number" placeholder="0" value={quotedAmount} onChange={(e) => setQuotedAmount(e.target.value)} className="pl-9" />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="admin_notes">Admin Notes</Label>
                                            <Textarea id="admin_notes" placeholder="Internal notes about this enquiry..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="mt-1.5" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button>
                                    <Button onClick={saveDetails} disabled={saving}>
                                        {saving ? <><Spinner className="size-4 mr-2" />Saving...</> : "Save Changes"}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminSidebarLayout>
    );
}

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
    MoreHorizontal, RefreshCcw, Mail, Phone, Building2, Package, Calendar, StickyNote, IndianRupee, Search, Eye, Trash2,
} from "lucide-react";

interface EnquiryItem {
    productId: string;
    productName: string;
    variantId: string;
    variantName: string;
    quantity: number;
    price: number;
    mrp?: number;
}

interface Enquiry {
    id: number;
    customer_name: string;
    company_name: string;
    email: string;
    phone: string;
    address?: string;
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
    quoted: "bg-purple-100 text-purple-800 border-purple-200",
    converted: "bg-green-100 text-green-800 border-green-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusOptions = ["pending", "quoted", "converted", "closed"];

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
    const [address, setAddress] = useState("");
    const [status, setStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [editedItems, setEditedItems] = useState<EnquiryItem[]>([]);

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<Enquiry | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Generate Quotation state
    const [localBillOpen, setLocalBillOpen] = useState(false);
    const [localBillForm, setLocalBillForm] = useState({ company_name: '', customer_name: '', email: '', phone: '', address: '' });
    const [localBillItems, setLocalBillItems] = useState<EnquiryItem[]>([]);
    const [creatingBill, setCreatingBill] = useState(false);
    
    // Product Search state
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    
    const searchProducts = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error("Failed to search products:", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const createLocalBill = async () => {
        if (!localBillForm.company_name || !localBillForm.customer_name || !localBillForm.phone) {
            toast.error("Company name, contact name, and phone are required");
            return;
        }
        if (localBillItems.length === 0 || !localBillItems[0].productName) {
            toast.error("At least one item is required");
            return;
        }
        setCreatingBill(true);
        const toastId = toast.loading("Generating quotation...");
        
        const totalAmount = localBillItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
        
        try {
            const res = await fetch("/api/enquiries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...localBillForm,
                    status: "quoted",
                    items: localBillItems,
                    total_amount: totalAmount
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Quotation generated", { id: toastId });
                setLocalBillOpen(false);
                setLocalBillForm({ company_name: '', customer_name: '', email: '', phone: '', address: '' });
                setLocalBillItems([]);
                fetchEnquiries();
            } else {
                toast.error(data.error || "Failed to generate quotation", { id: toastId });
            }
        } catch {
            toast.error("Failed to generate quotation", { id: toastId });
        } finally {
            setCreatingBill(false);
        }
    };

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
        setAddress(enquiry.address || "");
        setStatus(enquiry.status);
        
        const itemsToEdit = enquiry.items ? structuredClone(enquiry.items) : [];
        itemsToEdit.forEach((item: EnquiryItem) => {
            if (item.mrp === undefined) {
                item.mrp = item.price;
            }
        });
        setEditedItems(itemsToEdit);
        setDetailOpen(true);
    };



    const saveDetails = async () => {
        if (!selectedEnquiry) return;
        setSaving(true);
        const toastId = toast.loading("Saving enquiry details...");
        try {
            const res = await fetch(`/api/enquiries/${selectedEnquiry.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    admin_notes: adminNotes, 
                    quoted_amount: quotedAmount ? parseFloat(quotedAmount) : null, 
                    address: address,
                    status: status,
                    items: editedItems
                }),
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
                <span className="font-medium">{row.original.company_name}</span>
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
            accessorKey: "quoted_amount",
            header: "Quoted",
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.original.quoted_amount != null
                        ? `₹${Number(row.original.quoted_amount).toLocaleString("en-IN")}`
                        : <span className="text-muted-foreground">—</span>}
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
                        <DropdownMenuItem onClick={() => openDetail(row.original)}>
                            <Eye className="w-4 h-4 mr-2" /> View
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setDeleteTarget(row.original); setDeleteOpen(true); }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
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
                    <div className="flex gap-2">
                        <Button variant="default" size="sm" onClick={() => setLocalBillOpen(true)} className="gap-2">
                            <StickyNote className="w-4 h-4" /> Generate Quotation
                        </Button>
                        <Button variant="outline" size="sm" onClick={fetchEnquiries} className="gap-2">
                            <RefreshCcw className="w-4 h-4" /> Refresh
                        </Button>
                    </div>
                </div>

                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="overflow-x-auto max-w-full justify-start sm:justify-center h-auto py-1">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
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
                    <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
                        {selectedEnquiry && (
                            <>
                                <DialogHeader className="p-6 pb-4 border-b shrink-0">
                                    <DialogTitle className="flex items-center gap-3">
                                        Enquiry #{selectedEnquiry.id}
                                        <Badge variant="outline" className={statusColors[selectedEnquiry.status] || ""}>{selectedEnquiry.status}</Badge>
                                    </DialogTitle>
                                    <DialogDescription>{selectedEnquiry.company_name} — {selectedEnquiry.customer_name}</DialogDescription>
                                </DialogHeader>
                                <div className="p-6 space-y-6 overflow-y-auto flex-1">
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
                                                    <TableHead className="text-right">Qty</TableHead>
                                                    <TableHead className="text-right">MRP</TableHead>
                                                    <TableHead className="text-right">Gross Price</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {editedItems?.map((item, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-medium">{item.productName}</TableCell>
                                                        <TableCell className="text-muted-foreground">{item.variantName}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Input 
                                                                type="number" 
                                                                value={item.quantity} 
                                                                min={1}
                                                                onChange={(e) => {
                                                                    const newItems = [...editedItems];
                                                                    newItems[idx].quantity = parseInt(e.target.value) || 0;
                                                                    setEditedItems(newItems);
                                                                    
                                                                    // Update total quoted amount automatically
                                                                    const total = newItems.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.quantity || 0)), 0);
                                                                    setQuotedAmount(total.toString());
                                                                }}
                                                                className="w-20 ml-auto h-8 text-right"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="relative w-28 ml-auto">
                                                                <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                                <Input 
                                                                    type="number" 
                                                                    value={item.mrp !== undefined ? item.mrp : item.price} 
                                                                    min={0}
                                                                    onChange={(e) => {
                                                                        const newItems = [...editedItems];
                                                                        newItems[idx].mrp = parseFloat(e.target.value) || 0;
                                                                        setEditedItems(newItems);
                                                                    }}
                                                                    className="w-full pl-6 h-8 text-right"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="relative w-28 ml-auto">
                                                                <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                                <Input 
                                                                    type="number" 
                                                                    value={item.price} 
                                                                    min={0}
                                                                    onChange={(e) => {
                                                                        const newItems = [...editedItems];
                                                                        newItems[idx].price = parseFloat(e.target.value) || 0;
                                                                        setEditedItems(newItems);
                                                                        
                                                                        // Update total quoted amount automatically
                                                                        const total = newItems.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.quantity || 0)), 0);
                                                                        setQuotedAmount(total.toString());
                                                                    }}
                                                                    className="w-full pl-6 h-8 text-right"
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">₹{((item.price || 0) * (item.quantity || 0)).toLocaleString("en-IN")}</TableCell>
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
                                            <Select value={status} onValueChange={(value) => setStatus(value)}>
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
                                            <Label htmlFor="address">Address</Label>
                                            <Textarea id="address" placeholder="Customer address..." value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <Label htmlFor="admin_notes">Admin Notes</Label>
                                            <Textarea id="admin_notes" placeholder="Internal notes about this enquiry..." value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="mt-1.5" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 pt-4 border-t shrink-0 flex-row sm:justify-between items-center w-full">
                                    <Button 
                                        type="button" 
                                        variant="secondary" 
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                quotedAmount: quotedAmount,
                                                items: JSON.stringify(editedItems)
                                            });
                                            window.open(`/api/enquiries/${selectedEnquiry.id}/pdf?${params.toString()}`, '_blank');
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview PDF
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setDetailOpen(false)}>Cancel</Button>
                                        <Button onClick={saveDetails} disabled={saving}>
                                            {saving ? <><Spinner className="size-4 mr-2" />Saving...</> : "Save Changes"}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Enquiry</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete enquiry <strong>#{deleteTarget?.id}</strong> from <strong>{deleteTarget?.company_name}</strong>? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteTarget(null); }}>Cancel</Button>
                            <Button
                                variant="destructive"
                                disabled={deleting}
                                onClick={async () => {
                                    if (!deleteTarget) return;
                                    setDeleting(true);
                                    const toastId = toast.loading("Deleting enquiry...");
                                    try {
                                        const res = await fetch(`/api/enquiries/${deleteTarget.id}`, { method: "DELETE" });
                                        const data = await res.json();
                                        if (data.success) {
                                            toast.success("Enquiry deleted", { id: toastId });
                                            setDeleteOpen(false);
                                            setDeleteTarget(null);
                                            fetchEnquiries();
                                        } else {
                                            toast.error(data.error || "Failed to delete enquiry", { id: toastId });
                                        }
                                    } catch {
                                        toast.error("Failed to delete enquiry", { id: toastId });
                                    } finally {
                                        setDeleting(false);
                                    }
                                }}
                            >
                                {deleting ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Generate Quotation Dialog */}
                <Dialog open={localBillOpen} onOpenChange={setLocalBillOpen}>
                    <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Generate Quotation</DialogTitle>
                            <DialogDescription>
                                Manually create a quotation for a customer.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lb_company">Company Name</Label>
                                    <Input id="lb_company" value={localBillForm.company_name} onChange={(e) => setLocalBillForm({...localBillForm, company_name: e.target.value})} placeholder="E.g. Sharma Traders" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lb_contact">Contact Name</Label>
                                    <Input id="lb_contact" value={localBillForm.customer_name} onChange={(e) => setLocalBillForm({...localBillForm, customer_name: e.target.value})} placeholder="E.g. Rahul Sharma" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="lb_email">Email (Optional)</Label>
                                    <Input id="lb_email" type="email" value={localBillForm.email} onChange={(e) => setLocalBillForm({...localBillForm, email: e.target.value})} placeholder="Email address" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lb_phone">Phone</Label>
                                    <Input id="lb_phone" value={localBillForm.phone} onChange={(e) => setLocalBillForm({...localBillForm, phone: e.target.value})} placeholder="Phone number" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lb_address">Address (Optional)</Label>
                                <Textarea id="lb_address" value={localBillForm.address} onChange={(e) => setLocalBillForm({...localBillForm, address: e.target.value})} placeholder="Customer address" rows={2} />
                            </div>
                            
                            <div className="pt-4 border-t">
                                <div className="space-y-4 mb-4">
                                    <div className="space-y-2 relative">
                                        <Label>Search Product Catalog</Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Search by model number..." 
                                                className="pl-9"
                                                value={productSearchQuery}
                                                onChange={(e) => {
                                                    setProductSearchQuery(e.target.value);
                                                    searchProducts(e.target.value);
                                                }}
                                            />
                                        </div>
                                        {isSearching && (
                                            <div className="absolute top-full left-0 mt-1 z-10 w-full bg-background border rounded-md p-3 shadow-md text-sm flex items-center justify-center">
                                                <Spinner className="w-4 h-4 mr-2" /> Searching products...
                                            </div>
                                        )}
                                        {!isSearching && searchResults.length > 0 && (
                                            <div className="absolute top-full left-0 mt-1 z-10 w-full bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
                                                {searchResults.map((product: any) => (
                                                    <div 
                                                        key={product.id} 
                                                        className="px-3 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                                        onClick={() => {
                                                            const newItems = [...localBillItems];
                                                            
                                                            // If there is only one empty item, replace it
                                                            if (newItems.length === 1 && !newItems[0].productName && newItems[0].price === 0) {
                                                                newItems[0] = { 
                                                                    productName: product.model, 
                                                                    quantity: 1, 
                                                                    price: product.price,
                                                                    mrp: product.mrp !== undefined ? product.mrp : product.price,
                                                                    productId: product.id,
                                                                    variantId: '',
                                                                    variantName: product.color || ''
                                                                };
                                                            } else {
                                                                newItems.push({ 
                                                                    productName: product.model, 
                                                                    quantity: 1, 
                                                                    price: product.price,
                                                                    mrp: product.mrp !== undefined ? product.mrp : product.price,
                                                                    productId: product.id,
                                                                    variantId: '',
                                                                    variantName: product.color || ''
                                                                });
                                                            }
                                                            setLocalBillItems(newItems);
                                                            setProductSearchQuery("");
                                                            setSearchResults([]);
                                                        }}
                                                    >
                                                        <div>
                                                            <div className="font-medium">{product.model}</div>
                                                            <div className="text-xs text-muted-foreground">{product.category} {product.color ? `· ${product.color}` : ''}</div>
                                                        </div>
                                                        <div className="font-medium">₹{product.price}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <Label className="text-base font-semibold">Quotation Items</Label>
                                    <Button variant="outline" size="sm" onClick={() => setLocalBillItems([...localBillItems, { productName: '', quantity: 1, price: 0, mrp: 0, productId: '', variantId: '', variantName: '' }])}>+ Add Custom Item</Button>
                                </div>
                                
                                {localBillItems.length > 0 ? (
                                    <>
                                        <div className="flex gap-2 text-sm font-medium text-muted-foreground px-1 mb-2">
                                            <div className="flex-[2]">Product Model / Name</div>
                                            <div className="flex-1">Variant</div>
                                            <div className="w-20 text-center">Quantity</div>
                                            <div className="w-28 text-center">MRP (₹)</div>
                                            <div className="w-28 text-center">Gross Price (₹)</div>
                                            <div className="w-8"></div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {localBillItems.map((item, index) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <div className="flex-[2] space-y-1">
                                                        <Input placeholder="E.g. Hikvision 2MP Dome" value={item.productName} onChange={(e) => {
                                                            const newItems = [...localBillItems];
                                                            newItems[index].productName = e.target.value;
                                                            setLocalBillItems(newItems);
                                                        }} />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Input placeholder="Variant" value={item.variantName || ''} onChange={(e) => {
                                                            const newItems = [...localBillItems];
                                                            newItems[index].variantName = e.target.value;
                                                            setLocalBillItems(newItems);
                                                        }} />
                                                    </div>
                                                    <div className="w-20 space-y-1">
                                                        <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => {
                                                            const newItems = [...localBillItems];
                                                            newItems[index].quantity = parseInt(e.target.value) || 0;
                                                            setLocalBillItems(newItems);
                                                        }} />
                                                    </div>
                                                    <div className="w-28 space-y-1 relative">
                                                        <IndianRupee className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                                                        <Input type="number" min="0" className="pl-7" placeholder="MRP" value={item.mrp !== undefined ? item.mrp : item.price} onChange={(e) => {
                                                            const newItems = [...localBillItems];
                                                            newItems[index].mrp = parseFloat(e.target.value) || 0;
                                                            setLocalBillItems(newItems);
                                                        }} />
                                                    </div>
                                                    <div className="w-28 space-y-1 relative">
                                                        <IndianRupee className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                                                        <Input type="number" min="0" className="pl-7" placeholder="Gross Price" value={item.price} onChange={(e) => {
                                                            const newItems = [...localBillItems];
                                                            newItems[index].price = parseFloat(e.target.value) || 0;
                                                            setLocalBillItems(newItems);
                                                        }} />
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => {
                                                        const newItems = [...localBillItems];
                                                        newItems.splice(index, 1);
                                                        setLocalBillItems(newItems);
                                                    }}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                        No items added yet. Search the catalog above or add a custom item.
                                    </div>
                                )}
                                <div className="mt-4 text-right font-medium">
                                    Total: ₹{localBillItems.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0).toLocaleString("en-IN")}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setLocalBillOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={createLocalBill} 
                                disabled={
                                    creatingBill || 
                                    !localBillForm.company_name.trim() || 
                                    !localBillForm.customer_name.trim() || 
                                    !localBillForm.phone.trim() || 
                                    localBillItems.length === 0 || 
                                    !localBillItems.every(item => item.productName.trim() !== '')
                                }
                            >
                                {creatingBill ? "Generating..." : "Generate Quotation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminSidebarLayout>
    );
}

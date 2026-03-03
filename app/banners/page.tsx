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
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCcw, Search } from "lucide-react";

interface Banner {
    id: number;
    title: string;
    description: string | null;
    discount_text: string | null;
    link: string | null;
    active: number;
    start_date: string | null;
    end_date: string | null;
    bg_color: string;
    text_color: string;
    created_at: string;
    updated_at: string;
}

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editBanner, setEditBanner] = useState<Banner | null>(null);
    const [deleteBanner, setDeleteBanner] = useState<Banner | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formDiscountText, setFormDiscountText] = useState("");
    const [formLink, setFormLink] = useState("");
    const [formActive, setFormActive] = useState(true);
    const [formStartDate, setFormStartDate] = useState("");
    const [formEndDate, setFormEndDate] = useState("");
    const [formBgColor, setFormBgColor] = useState("#000000");
    const [formTextColor, setFormTextColor] = useState("#ffffff");

    const fetchBanners = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(pagination.pageSize),
                offset: String(pagination.pageIndex * pagination.pageSize),
            });
            if (searchQuery) params.set("search", searchQuery);
            const res = await fetch(`/api/admin/banners?${params}`);
            const data = await res.json();
            if (data.success) {
                setBanners(data.data || []);
                setTotalRows(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error("Error fetching banners:", error);
            toast.error("Failed to load banners");
        } finally { setLoading(false); }
    }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

    useEffect(() => { fetchBanners(); }, [fetchBanners]);

    const resetForm = () => {
        setEditBanner(null); setFormTitle(""); setFormDescription(""); setFormDiscountText(""); setFormLink("");
        setFormActive(true); setFormStartDate(""); setFormEndDate(""); setFormBgColor("#000000"); setFormTextColor("#ffffff");
    };

    const openCreate = () => { resetForm(); setFormOpen(true); };

    const openEdit = (banner: Banner) => {
        setEditBanner(banner); setFormTitle(banner.title); setFormDescription(banner.description || "");
        setFormDiscountText(banner.discount_text || ""); setFormLink(banner.link || "");
        setFormActive(banner.active === 1); setFormStartDate(banner.start_date || "");
        setFormEndDate(banner.end_date || ""); setFormBgColor(banner.bg_color || "#000000");
        setFormTextColor(banner.text_color || "#ffffff"); setFormOpen(true);
    };

    const handleSave = async () => {
        if (!formTitle) { toast.error("Title is required"); return; }
        setSaving(true);
        const toastId = toast.loading(editBanner ? "Updating banner..." : "Creating banner...");
        try {
            const payload: any = {
                title: formTitle, description: formDescription || null, discount_text: formDiscountText || null,
                link: formLink || null, active: formActive, start_date: formStartDate || null,
                end_date: formEndDate || null, bg_color: formBgColor, text_color: formTextColor,
            };
            let res;
            if (editBanner) {
                payload.id = editBanner.id;
                res = await fetch("/api/admin/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            } else {
                res = await fetch("/api/admin/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            }
            const data = await res.json();
            if (data.success) {
                toast.success(editBanner ? "Banner updated successfully" : "Banner created successfully", { id: toastId });
                setFormOpen(false); resetForm(); fetchBanners();
            } else toast.error(data.error || "Failed to save banner", { id: toastId });
        } catch { toast.error("Failed to save banner", { id: toastId }); } finally { setSaving(false); }
    };

    const toggleActive = async (banner: Banner) => {
        const toastId = toast.loading(banner.active === 1 ? "Deactivating banner..." : "Activating banner...");
        try {
            const res = await fetch("/api/admin/banners", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: banner.id, active: banner.active === 1 ? false : true }),
            });
            const data = await res.json();
            if (data.success) { toast.success(banner.active === 1 ? "Banner deactivated" : "Banner activated", { id: toastId }); fetchBanners(); }
            else toast.error("Failed to update banner", { id: toastId });
        } catch { toast.error("Failed to update banner", { id: toastId }); }
    };

    const handleDelete = async () => {
        if (!deleteBanner) return;
        setSaving(true);
        const toastId = toast.loading("Deleting banner...");
        try {
            const res = await fetch(`/api/admin/banners?id=${deleteBanner.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) { toast.success("Banner deleted successfully", { id: toastId }); setDeleteOpen(false); setDeleteBanner(null); fetchBanners(); }
            else toast.error(data.error || "Failed to delete banner", { id: toastId });
        } catch { toast.error("Failed to delete banner", { id: toastId }); } finally { setSaving(false); }
    };

    const columns: ColumnDef<Banner>[] = [
        {
            accessorKey: "title",
            header: "Banner",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="rounded-md px-3 py-1.5 text-xs font-medium inline-block max-w-[140px] truncate"
                        style={{ backgroundColor: row.original.bg_color, color: row.original.text_color }}>
                        {row.original.discount_text || row.original.title}
                    </div>
                    <span className="font-medium">{row.original.title}</span>
                </div>
            ),
            enableHiding: false,
        },
        {
            accessorKey: "discount_text",
            header: "Discount",
            cell: ({ row }) => (
                <span className="text-muted-foreground">{row.original.discount_text || "—"}</span>
            ),
        },
        {
            accessorKey: "start_date",
            header: "Date Range",
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {row.original.start_date && row.original.end_date
                        ? `${new Date(row.original.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(row.original.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                        : "No dates set"}
                </span>
            ),
        },
        {
            accessorKey: "active",
            header: "Active",
            cell: ({ row }) => (
                <Badge variant="outline" className={row.original.active === 1 ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                    {row.original.active === 1 ? "Active" : "Inactive"}
                </Badge>
            ),
            meta: { align: "center" },
        },
        {
            id: "toggle",
            header: "Toggle",
            cell: ({ row }) => (
                <Switch checked={row.original.active === 1} onCheckedChange={() => toggleActive(row.original)} />
            ),
            meta: { align: "center" },
            enableHiding: false,
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteBanner(row.original); setDeleteOpen(true); }}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableHiding: false,
        },
    ];

    return (
        <AdminSidebarLayout>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><h1 className="text-2xl font-bold tracking-tight">Sale Banners</h1><p className="text-muted-foreground">Create and manage promotional banners</p></div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchBanners} className="gap-2"><RefreshCcw className="w-4 h-4" /> Refresh</Button>
                        <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> New Banner</Button>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={banners}
                    totalRows={totalRows}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    loading={loading}
                    toolbar={
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search banners..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                                className="pl-9 h-9"
                            />
                        </div>
                    }
                />

                {/* Create/Edit Banner Dialog */}
                <Dialog open={formOpen} onOpenChange={setFormOpen}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editBanner ? "Edit Banner" : "Create Banner"}</DialogTitle>
                            <DialogDescription>{editBanner ? "Update the banner details" : "Create a new promotional banner"}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div><Label htmlFor="banner-title">Title *</Label><Input id="banner-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Summer Sale 2025" className="mt-1.5" /></div>
                            <div><Label htmlFor="banner-description">Description</Label><Textarea id="banner-description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Banner description..." rows={2} className="mt-1.5" /></div>
                            <div><Label htmlFor="banner-discount">Discount Text</Label><Input id="banner-discount" value={formDiscountText} onChange={(e) => setFormDiscountText(e.target.value)} placeholder="e.g. Up to 30% OFF" className="mt-1.5" /></div>
                            <div><Label htmlFor="banner-link">Link URL</Label><Input id="banner-link" value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="/products?category=..." className="mt-1.5" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="banner-start">Start Date</Label><Input id="banner-start" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="mt-1.5" /></div>
                                <div><Label htmlFor="banner-end">End Date</Label><Input id="banner-end" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} className="mt-1.5" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="banner-bg">Background Color</Label><div className="flex items-center gap-2 mt-1.5"><Input id="banner-bg" type="color" value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} className="w-12 h-9 p-1 cursor-pointer" /><Input value={formBgColor} onChange={(e) => setFormBgColor(e.target.value)} className="flex-1" /></div></div>
                                <div><Label htmlFor="banner-text-color">Text Color</Label><div className="flex items-center gap-2 mt-1.5"><Input id="banner-text-color" type="color" value={formTextColor} onChange={(e) => setFormTextColor(e.target.value)} className="w-12 h-9 p-1 cursor-pointer" /><Input value={formTextColor} onChange={(e) => setFormTextColor(e.target.value)} className="flex-1" /></div></div>
                            </div>
                            <div className="flex items-center gap-3"><Switch checked={formActive} onCheckedChange={setFormActive} id="banner-active" /><Label htmlFor="banner-active">Active</Label></div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Preview</Label>
                                <div className="mt-1.5 rounded-md px-4 py-3 text-center" style={{ backgroundColor: formBgColor, color: formTextColor }}>
                                    <p className="font-bold text-sm">{formTitle || "Banner Title"}</p>
                                    {formDiscountText && <p className="text-xs mt-0.5 opacity-90">{formDiscountText}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving}>{saving ? <><Spinner className="size-4 mr-2" />{editBanner ? "Saving..." : "Creating..."}</> : editBanner ? "Save Changes" : "Create Banner"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Banner</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete &quot;{deleteBanner?.title}&quot;? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{saving ? <><Spinner className="size-4 mr-2" />Deleting...</> : "Delete"}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminSidebarLayout>
    );
}

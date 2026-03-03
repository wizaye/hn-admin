"use client";

import React, { useEffect, useState, useCallback } from "react";
import { type ColumnDef, type PaginationState } from "@tanstack/react-table";
import AdminSidebarLayout from "@/components/admin-sidebar-layout";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Trash2, RefreshCcw, Search, Image as ImageIcon } from "lucide-react";

interface Product {
    id: number | string;
    model: string;
    color: string | null;
    price: number | string;
    image_url: string | null;
    image: string | null;
    category: string;
}

export default function ProductsPage() {
    const [categories, setCategories] = useState<{ category: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [products, setProducts] = useState<Product[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [formModel, setFormModel] = useState("");
    const [formColor, setFormColor] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formImageUrl, setFormImageUrl] = useState("");

    useEffect(() => {
        async function fetchCategories() {
            try {
                const res = await fetch("/api/products/categories");
                const data = await res.json();
                if (data.success && data.data?.length > 0) {
                    setCategories(data.data);
                    setSelectedCategory(data.data[0].category);
                }
            } catch (error) {
                console.error("Error fetching categories:", error);
                toast.error("Failed to load categories");
            } finally { setLoading(false); }
        }
        fetchCategories();
    }, []);

    const fetchProducts = useCallback(async () => {
        if (!selectedCategory) return;
        setProductsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(pagination.pageSize),
                offset: String(pagination.pageIndex * pagination.pageSize),
            });
            if (searchQuery) params.set("search", searchQuery);
            const res = await fetch(`/api/products/${encodeURIComponent(selectedCategory)}?${params}`);
            const data = await res.json();
            if (data.success) {
                setProducts(data.data || []);
                setTotalRows(data.pagination?.total || data.count || 0);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to load products");
        } finally { setProductsLoading(false); }
    }, [selectedCategory, pagination.pageIndex, pagination.pageSize, searchQuery]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // Reset pagination when category or search changes
    useEffect(() => { setPagination((p) => ({ ...p, pageIndex: 0 })); }, [selectedCategory]);

    const resetForm = () => { setFormModel(""); setFormColor(""); setFormPrice(""); setFormImageUrl(""); };

    const openEdit = (product: Product) => {
        setEditProduct(product);
        setFormModel(product.model || "");
        setFormColor(product.color || "");
        setFormPrice(product.price?.toString() || "");
        setFormImageUrl(product.image_url || product.image || "");
        setEditOpen(true);
    };

    const handleAdd = async () => {
        if (!formModel) { toast.error("Model name is required"); return; }
        setSaving(true);
        const toastId = toast.loading("Adding product...");
        try {
            const res = await fetch("/api/admin/products", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: selectedCategory, model: formModel, color: formColor || null, price: formPrice ? parseFloat(formPrice) : 0, image_url: formImageUrl || null }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Product added successfully", { id: toastId });
                setAddOpen(false); resetForm(); fetchProducts();
            } else toast.error(data.error || "Failed to add product", { id: toastId });
        } catch { toast.error("Failed to add product", { id: toastId }); } finally { setSaving(false); }
    };

    const handleUpdate = async () => {
        if (!editProduct) return;
        setSaving(true);
        const toastId = toast.loading("Updating product...");
        try {
            const res = await fetch("/api/admin/products", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: selectedCategory, id: editProduct.id, model: formModel, color: formColor || null, price: formPrice ? parseFloat(formPrice) : 0, image_url: formImageUrl || null }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Product updated successfully", { id: toastId });
                setEditOpen(false); resetForm(); fetchProducts();
            } else toast.error(data.error || "Failed to update product", { id: toastId });
        } catch { toast.error("Failed to update product", { id: toastId }); } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteProduct) return;
        setSaving(true);
        const toastId = toast.loading("Deleting product...");
        try {
            const res = await fetch(`/api/admin/products?category=${encodeURIComponent(selectedCategory)}&id=${deleteProduct.id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Product deleted successfully", { id: toastId });
                setDeleteOpen(false); setDeleteProduct(null); fetchProducts();
            } else toast.error(data.error || "Failed to delete product", { id: toastId });
        } catch { toast.error("Failed to delete product", { id: toastId }); } finally { setSaving(false); }
    };

    const getCategoryDisplayName = (name: string) => name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const columns: ColumnDef<Product>[] = [
        {
            id: "image",
            header: "Image",
            cell: ({ row }) => (
                row.original.image || row.original.image_url ? (
                    <img src={row.original.image || row.original.image_url || ""} alt={row.original.model} className="w-10 h-10 rounded object-cover bg-muted" />
                ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                )
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "model",
            header: "Model",
            cell: ({ row }) => <span className="font-medium">{row.original.model}</span>,
            enableHiding: false,
        },
        {
            accessorKey: "color",
            header: "Color",
            cell: ({ row }) => (
                row.original.color ? (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: row.original.color?.toLowerCase() || "#ccc" }} />
                        <span className="text-sm">{row.original.color}</span>
                    </div>
                ) : <span className="text-muted-foreground text-sm">—</span>
            ),
        },
        {
            accessorKey: "price",
            header: "Price (₹)",
            cell: ({ row }) => <span className="font-medium">₹{parseFloat(row.original.price?.toString() || "0").toLocaleString("en-IN")}</span>,
            meta: { align: "right" },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(row.original)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => { setDeleteProduct(row.original); setDeleteOpen(true); }}><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableHiding: false,
        },
    ];

    if (loading) {
        return (
            <AdminSidebarLayout>
                <div className="space-y-6">
                    <div><h1 className="text-2xl font-bold tracking-tight">Products</h1><p className="text-muted-foreground">Loading categories...</p></div>
                    <div className="flex items-center justify-center py-16"><Spinner className="size-6 text-muted-foreground" /></div>
                </div>
            </AdminSidebarLayout>
        );
    }

    return (
        <AdminSidebarLayout>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><h1 className="text-2xl font-bold tracking-tight">Products</h1><p className="text-muted-foreground">Manage products across categories</p></div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={fetchProducts} className="gap-2"><RefreshCcw className="w-4 h-4" /> Refresh</Button>
                        <Button size="sm" onClick={() => { resetForm(); setAddOpen(true); }} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium whitespace-nowrap">Category:</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full max-w-xs"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (<SelectItem key={cat.category} value={cat.category}>{getCategoryDisplayName(cat.category)}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Badge variant="secondary">{totalRows} products</Badge>
                </div>

                <DataTable
                    columns={columns}
                    data={products}
                    totalRows={totalRows}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    loading={productsLoading}
                    toolbar={
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                                className="pl-9 h-9"
                            />
                        </div>
                    }
                />

                {/* Add Product Dialog */}
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Add Product</DialogTitle><DialogDescription>Add a new product to <strong>{getCategoryDisplayName(selectedCategory)}</strong></DialogDescription></DialogHeader>
                        <div className="space-y-4">
                            <div><Label htmlFor="add-model">Model Name *</Label><Input id="add-model" value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="e.g. CU-007" className="mt-1.5" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="add-color">Color</Label><Input id="add-color" value={formColor} onChange={(e) => setFormColor(e.target.value)} placeholder="e.g. Golden" className="mt-1.5" /></div>
                                <div><Label htmlFor="add-price">Price (₹)</Label><Input id="add-price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0" className="mt-1.5" /></div>
                            </div>
                            <div><Label htmlFor="add-image">Image URL</Label><Input id="add-image" value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} placeholder="https://..." className="mt-1.5" /></div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAdd} disabled={saving}>{saving ? <><Spinner className="size-4 mr-2" />Adding...</> : "Add Product"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Product Dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Edit Product</DialogTitle><DialogDescription>Update product details in <strong>{getCategoryDisplayName(selectedCategory)}</strong></DialogDescription></DialogHeader>
                        <div className="space-y-4">
                            <div><Label htmlFor="edit-model">Model Name</Label><Input id="edit-model" value={formModel} onChange={(e) => setFormModel(e.target.value)} className="mt-1.5" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="edit-color">Color</Label><Input id="edit-color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="mt-1.5" /></div>
                                <div><Label htmlFor="edit-price">Price (₹)</Label><Input id="edit-price" type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="mt-1.5" /></div>
                            </div>
                            <div><Label htmlFor="edit-image">Image URL</Label><Input id="edit-image" value={formImageUrl} onChange={(e) => setFormImageUrl(e.target.value)} className="mt-1.5" /></div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={saving}>{saving ? <><Spinner className="size-4 mr-2" />Saving...</> : "Save Changes"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Product</AlertDialogTitle><AlertDialogDescription>Are you sure you want to delete <strong>{deleteProduct?.model}</strong>? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {saving ? <><Spinner className="size-4 mr-2" />Deleting...</> : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminSidebarLayout>
    );
}

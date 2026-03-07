"use client"

import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"

const pageTitles: Record<string, string> = {
    "/": "Dashboard",
    "/enquiries": "Enquiries",
    "/products": "Products",
    "/banners": "Sale Banners",
    "/admin-users": "Admin Users",
}

export default function AdminSidebarLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const pageTitle = pageTitles[pathname] || "Dashboard"
    const isHome = pathname === "/"

    const [user, setUser] = useState<{ name: string; email: string; avatar: string } | undefined>(undefined)

    // Fetch the current session user
    useEffect(() => {
        fetch("/api/auth/session")
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.user) {
                    setUser({
                        name: data.user.name || "Admin",
                        email: data.user.email || "",
                        avatar: "",
                    })
                }
            })
            .catch(() => { })
    }, [])

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {!isHome && (
                                    <>
                                        <BreadcrumbItem className="hidden md:block">
                                            <BreadcrumbLink href="/">HN Admin</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator className="hidden md:block" />
                                    </>
                                )}
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
            <Toaster richColors position="top-right" />
        </SidebarProvider>
    )
}

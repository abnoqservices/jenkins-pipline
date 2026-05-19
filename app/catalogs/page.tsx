"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Eye, Plus } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SavedCatalog = {
  id: string
  catalogName: string
  customerName: string
  brandName: string
  status: "draft" | "published"
  createdAt: string
  products: unknown[]
}

const STORAGE_KEY = "demo.catalog.builder.items"

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = React.useState<SavedCatalog[]>([])

  React.useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      setCatalogs(JSON.parse(raw))
    }
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Catalogs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, save, publish, and reuse customer catalogs.
            </p>
          </div>

          <Link href="/catalogs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Catalog
            </Button>
          </Link>
        </div>

        {catalogs.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">No catalogs yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start by creating your first event-based product catalog.
                </p>
              </div>
              <Link href="/catalogs/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalogs.map((catalog) => (
              <Card key={catalog.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="line-clamp-1">{catalog.catalogName}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{catalog.customerName}</p>
                    </div>
                    <Badge variant={catalog.status === "published" ? "default" : "secondary"}>
                      {catalog.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Brand</p>
                      <p className="font-medium">{catalog.brandName}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Products</p>
                      <p className="font-medium">{catalog.products.length}</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(catalog.createdAt).toLocaleString()}
                  </p>

                  <Link href="/catalogs/new">
                    <Button variant="outline" className="w-full">
                      <Eye className="mr-2 h-4 w-4" />
                      Open Builder
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

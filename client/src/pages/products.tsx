import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Plus,
  Search,
  Grid3X3,
  List,
  Eye,
  Edit,
  ImageIcon,
  X,
} from "lucide-react";
import type { ProductWithRelations, Warehouse } from "@shared/schema";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; productName: string } | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const filteredProducts = products?.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.stockCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWarehouse =
      warehouseFilter === "all" || product.warehouseId === warehouseFilter;

    return matchesSearch && matchesWarehouse;
  }) || [];

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Stok Yok", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Düşük Stok", variant: "secondary" as const };
    return { label: "Stokta", variant: "default" as const };
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Ürünler
          </h1>
          <p className="text-muted-foreground">
            Tüm ürünlerinizi yönetin ve takip edin
          </p>
        </div>
        <Link href="/products/new">
          <Button data-testid="button-add-new-product">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Ürün
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ürün ara (isim, stok kodu, barkod)"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-products"
          />
        </div>
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-warehouse-filter">
            <SelectValue placeholder="Depo Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Depolar</SelectItem>
            {warehouses?.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 bg-muted rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-grid-view"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-list-view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {productsLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-square w-full mb-4 rounded-md" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ürün Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || warehouseFilter !== "all"
                ? "Arama kriterlerinize uygun ürün bulunamadı"
                : "Henüz ürün eklenmemiş. Hemen yeni bir ürün ekleyin."}
            </p>
            {!searchQuery && warehouseFilter === "all" && (
              <Link href="/products/new">
                <Button data-testid="button-add-first-product">
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Ürünü Ekle
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.quantity);
            return (
              <Card key={product.id} className="hover-elevate" data-testid={`product-card-${product.id}`}>
                <CardContent className="p-4">
                  <div 
                    className="aspect-square w-full mb-4 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      if (product.mainPhotoId) {
                        setSelectedPhoto({
                          url: `/api/photos/${product.mainPhotoId}`,
                          productName: product.name,
                        });
                      }
                    }}
                  >
                    {product.mainPhotoId ? (
                      <img
                        src={`/api/photos/${product.mainPhotoId}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.stockCode}</p>
                    </div>
                    <Badge variant={stockStatus.variant} className="shrink-0">
                      {product.quantity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{product.productType}</span>
                    <span>
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(Number(product.exitPrice))}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" data-testid={`button-view-${product.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Görüntüle
                      </Button>
                    </Link>
                    <Link href={`/products/${product.id}/edit`}>
                      <Button variant="ghost" size="icon" data-testid={`button-edit-${product.id}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Stok Kodu</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-center">Adet</TableHead>
                    <TableHead className="text-right">Giriş Fiyatı</TableHead>
                    <TableHead className="text-right">Çıkış Fiyatı</TableHead>
                    <TableHead>Giriş Tarihi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.quantity);
                    return (
                      <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                        <TableCell>
                          <div 
                            className={`w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden ${
                              product.mainPhotoId ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
                            }`}
                            onClick={() => {
                              if (product.mainPhotoId) {
                                setSelectedPhoto({
                                  url: `/api/photos/${product.mainPhotoId}`,
                                  productName: product.name,
                                });
                              }
                            }}
                          >
                            {product.mainPhotoId ? (
                              <img
                                src={`/api/photos/${product.mainPhotoId}`}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.stockCode}</TableCell>
                        <TableCell>{product.productType}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={stockStatus.variant}>{product.quantity}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          }).format(Number(product.entryPrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          }).format(Number(product.exitPrice))}
                        </TableCell>
                        <TableCell>
                          {product.entryDate
                            ? format(new Date(product.entryDate), "d MMM yyyy", { locale: tr })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/products/${product.id}`}>
                              <Button variant="ghost" size="icon" data-testid={`button-view-row-${product.id}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/products/${product.id}/edit`}>
                              <Button variant="ghost" size="icon" data-testid={`button-edit-row-${product.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} ürün gösteriliyor
        {(searchQuery || warehouseFilter !== "all") && ` (toplam ${products?.length || 0} ürün)`}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-6xl p-0 bg-transparent border-0 shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <AnimatePresence mode="wait">
            {selectedPhoto && (
              <motion.div
                key={selectedPhoto.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="relative"
              >
                <div className="relative bg-background rounded-lg overflow-hidden shadow-2xl">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.productName}
                    className="w-full h-auto max-h-[85vh] object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-white/20"
                      onClick={() => setSelectedPhoto(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white font-medium text-sm">{selectedPhoto.productName}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}

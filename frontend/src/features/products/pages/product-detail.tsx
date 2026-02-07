import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Warehouse,
  Calendar,
  Barcode,
  TrendingUp,
  TrendingDown,
  ImageIcon,
  Star,
} from "lucide-react";
import type { ProductWithRelations, ProductPhoto, StockMovementWithRelations } from "@stockkar/shared";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data: product, isLoading: productLoading } = useQuery<ProductWithRelations>({
    queryKey: ["/api/products", params?.id],
    enabled: !!params?.id,
  });

  const { data: photos } = useQuery<ProductPhoto[]>({
    queryKey: ["/api/products", params?.id, "photos"],
    enabled: !!params?.id,
  });

  const { data: movements } = useQuery<StockMovementWithRelations[]>({
    queryKey: ["/api/products", params?.id, "movements"],
    enabled: !!params?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/products/${params?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Ürün silindi",
        description: "Ürün başarıyla silindi.",
      });
      navigate("/products");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  if (productLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ürün Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              Aradığınız ürün bulunamadı veya silinmiş olabilir.
            </p>
            <Link href="/products">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ürünlere Dön
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainPhoto = photos?.find((p) => p.isMain) || photos?.[0];
  const displayPhoto = selectedPhoto 
    ? photos?.find((p) => p.id === selectedPhoto) 
    : mainPhoto;

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Stok Yok", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Düşük Stok", variant: "secondary" as const };
    return { label: "Stokta", variant: "default" as const };
  };

  const stockStatus = getStockStatus(product.quantity);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button variant="ghost" size="icon" data-testid="button-back-to-products">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {product.name}
            </h1>
            <p className="text-muted-foreground">
              Stok Kodu: {product.stockCode}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline" data-testid="button-edit-product">
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-delete-product">
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ürünü silmek istediğinize emin misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Bu ürün ve tüm ilişkili fotoğraflar kalıcı olarak silinecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="aspect-square w-full rounded-md bg-muted/50 flex items-center justify-center overflow-hidden mb-4">
                {displayPhoto ? (
                  <img
                    src={`/api/photos/${displayPhoto.id}`}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground/50">
                    <ImageIcon className="h-24 w-24 mb-2" />
                    <span className="text-sm">Fotoğraf yok</span>
                  </div>
                )}
              </div>
              {photos && photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.id)}
                      className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                        (selectedPhoto === photo.id || (!selectedPhoto && photo.isMain))
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      data-testid={`photo-thumbnail-${photo.id}`}
                    >
                      <img
                        src={`/api/photos/${photo.id}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {photo.isMain && (
                        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                          <Star className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ürün Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Ürün Türü</span>
                  <p className="font-medium">{product.productType}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Stok Durumu</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={stockStatus.variant}>{product.quantity} adet</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" /> Giriş Fiyatı
                  </span>
                  <p className="font-medium">
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    }).format(Number(product.entryPrice))}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Çıkış Fiyatı
                  </span>
                  <p className="font-medium">
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                    }).format(Number(product.exitPrice))}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                {product.barcode && (
                  <div className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Barkod:</span>
                    <span className="font-mono">{product.barcode}</span>
                  </div>
                )}
                {product.warehouse && (
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Depo:</span>
                    <span>{product.warehouse.name}</span>
                  </div>
                )}
                {product.entryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Giriş Tarihi:</span>
                    <span>{format(new Date(product.entryDate), "d MMMM yyyy", { locale: tr })}</span>
                  </div>
                )}
              </div>

              {product.description && (
                <div className="pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Açıklama</span>
                  <p className="mt-1">{product.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Son Stok Hareketleri</CardTitle>
              <Link href={`/movements?productId=${product.id}`}>
                <Button variant="ghost" size="sm" data-testid="button-view-all-product-movements">
                  Tümünü Gör
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!movements || movements.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Henüz stok hareketi bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movements.slice(0, 5).map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`product-movement-${movement.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${movement.type === 'entry' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {movement.type === 'entry' ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {movement.type === 'entry' ? 'Giriş' : 'Çıkış'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {movement.date ? format(new Date(movement.date), "d MMM yyyy", { locale: tr }) : "-"}
                            {movement.project && ` • ${movement.project.name}`}
                          </span>
                        </div>
                      </div>
                      <Badge variant={movement.type === 'entry' ? 'default' : 'secondary'}>
                        {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

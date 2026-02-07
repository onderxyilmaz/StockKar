import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Warehouse, Building2, ArrowLeftRight, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import type { Product, Warehouse as WarehouseType, Project, StockMovement } from "@stockkar/shared";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: warehouses, isLoading: warehousesLoading } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: movements, isLoading: movementsLoading } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock-movements"],
  });

  const isLoading = productsLoading || warehousesLoading || projectsLoading || movementsLoading;

  const totalProducts = products?.length || 0;
  const totalWarehouses = warehouses?.length || 0;
  const totalProjects = projects?.length || 0;
  const totalMovements = movements?.length || 0;
  
  const totalStock = products?.reduce((sum, p) => sum + p.quantity, 0) || 0;
  const lowStockProducts = products?.filter(p => p.quantity <= 5) || [];
  const recentMovements = movements?.slice(0, 5) || [];

  const totalValue = products?.reduce((sum, p) => {
    return sum + (Number(p.entryPrice) * p.quantity);
  }, 0) || 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Stok durumunuza genel bakış
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-products">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Ürün
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalStock} adet toplam stok
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-warehouses">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Depolar
            </CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalWarehouses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aktif depo
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-projects">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projeler / Firmalar
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kayıtlı proje/firma
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-stock-value">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stok Değeri
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                    minimumFractionDigits: 0,
                  }).format(totalValue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Toplam envanter değeri
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Düşük Stok Uyarısı
            </CardTitle>
            <Link href="/products">
              <Button variant="ghost" size="sm" data-testid="button-view-all-low-stock">
                Tümünü Gör
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Düşük stoklu ürün bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    data-testid={`low-stock-item-${product.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Stok Kodu: {product.stockCode}
                      </span>
                    </div>
                    <Badge variant={product.quantity === 0 ? "destructive" : "secondary"}>
                      {product.quantity} adet
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-recent-movements">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Son Stok Hareketleri
            </CardTitle>
            <Link href="/movements">
              <Button variant="ghost" size="sm" data-testid="button-view-all-movements">
                Tümünü Gör
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowLeftRight className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Henüz stok hareketi bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    data-testid={`movement-item-${movement.id}`}
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
                        </span>
                      </div>
                    </div>
                    <Badge variant={movement.type === 'entry' ? 'default' : 'secondary'}>
                      {movement.type === 'entry' ? '+' : '-'}{movement.quantity} adet
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/products/new" className="flex-1 sm:flex-initial">
          <Button className="w-full sm:w-auto" data-testid="button-add-product">
            <Package className="h-4 w-4 mr-2" />
            Yeni Ürün Ekle
          </Button>
        </Link>
        <Link href="/barcode" className="flex-1 sm:flex-initial">
          <Button variant="outline" className="w-full sm:w-auto" data-testid="button-barcode-scanner">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Barkod ile İşlem
          </Button>
        </Link>
      </div>
    </div>
  );
}

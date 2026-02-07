import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Loader2,
  Package,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import type { StockMovementWithRelations, Product, Project } from "@stockkar/shared";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearch } from "wouter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const movementFormSchema = z.object({
  productId: z.string().min(1, "Ürün seçimi zorunludur"),
  type: z.enum(["entry", "exit"], { required_error: "Hareket türü zorunludur" }),
  quantity: z.coerce.number().min(1, "Miktar en az 1 olmalıdır"),
  projectId: z.string().optional(),
  notes: z.string().optional(),
  unitPrice: z.coerce.number().optional(),
});

type MovementFormValues = z.infer<typeof movementFormSchema>;

export default function StockMovements() {
  const { toast } = useToast();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const initialProductId = urlParams.get("productId") || "";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: movements, isLoading: movementsLoading } = useQuery<StockMovementWithRelations[]>({
    queryKey: ["/api/stock-movements"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      productId: initialProductId,
      type: "entry",
      quantity: 1,
      projectId: "",
      notes: "",
      unitPrice: 0,
    },
  });

  const watchedType = form.watch("type");
  const watchedProductId = form.watch("productId");
  const selectedProduct = products?.find((p) => p.id === watchedProductId);

  const createMutation = useMutation({
    mutationFn: async (data: MovementFormValues) => {
      await apiRequest("POST", "/api/stock-movements", {
        ...data,
        projectId: data.projectId || null,
        unitPrice: data.unitPrice || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Stok hareketi kaydedildi",
        description: "Stok hareketi başarıyla oluşturuldu.",
      });
      setIsDialogOpen(false);
      form.reset({
        productId: "",
        type: "entry",
        quantity: 1,
        projectId: "",
        notes: "",
        unitPrice: 0,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "Stok hareketi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const filteredMovements = movements?.filter((movement) => {
    const product = movement.product;
    const matchesSearch =
      !searchQuery ||
      product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product?.stockCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || movement.type === typeFilter;
    const matchesProject =
      projectFilter === "all" || movement.projectId === projectFilter;

    const movementDate = movement.date ? new Date(movement.date) : null;
    const matchesDateFrom = !dateFrom || (movementDate && movementDate >= dateFrom);
    const matchesDateTo = !dateTo || (movementDate && movementDate <= dateTo);

    return matchesSearch && matchesType && matchesProject && matchesDateFrom && matchesDateTo;
  }) || [];

  const onSubmit = (data: MovementFormValues) => {
    createMutation.mutate(data);
  };

  const openNewDialog = () => {
    form.reset({
      productId: initialProductId,
      type: "entry",
      quantity: 1,
      projectId: "",
      notes: "",
      unitPrice: 0,
    });
    setIsDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setProjectFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || typeFilter !== "all" || projectFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Stok Hareketleri
          </h1>
          <p className="text-muted-foreground">
            Ürün giriş ve çıkışlarını takip edin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="button-add-movement">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Hareket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Yeni Stok Hareketi</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ürün *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product">
                            <SelectValue placeholder="Ürün seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.stockCode}) - Stok: {product.quantity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hareket Türü *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-movement-type">
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Giriş (Stok Artışı)
                            </div>
                          </SelectItem>
                          <SelectItem value="exit">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-red-600" />
                              Çıkış (Stok Azalışı)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Miktar *
                        {selectedProduct && watchedType === "exit" && (
                          <span className="text-muted-foreground ml-2">
                            (Mevcut stok: {selectedProduct.quantity})
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max={watchedType === "exit" && selectedProduct ? selectedProduct.quantity : undefined}
                          autoFocus
                          autoComplete="off"
                          {...field}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedType === "exit" && (
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proje / Firma</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project">
                              <SelectValue placeholder="Proje veya firma seçin (opsiyonel)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Seçilmedi</SelectItem>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name} ({project.type === "project" ? "Proje" : "Firma"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedType === "entry" ? "Alış Fiyatı (₺)" : "Satış Fiyatı (₺)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={
                            selectedProduct
                              ? watchedType === "entry"
                                ? `Varsayılan: ${selectedProduct.entryPrice}`
                                : `Varsayılan: ${selectedProduct.exitPrice}`
                              : "0.00"
                          }
                          autoComplete="off"
                          {...field}
                          data-testid="input-unit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notlar</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Hareket hakkında notlar"
                          className="resize-none"
                          rows={2}
                          autoComplete="off"
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-movement"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-movement"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      "Kaydet"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ürün adı veya stok kodu ara"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-movements"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-type-filter">
              <SelectValue placeholder="Tür" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              <SelectItem value="entry">Giriş</SelectItem>
              <SelectItem value="exit">Çıkış</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-project-filter">
              <SelectValue placeholder="Proje/Firma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Projeler</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-date-from">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateFrom ? format(dateFrom, "d MMM yyyy", { locale: tr }) : "Başlangıç"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">-</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-date-to">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateTo ? format(dateTo, "d MMM yyyy", { locale: tr }) : "Bitiş"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <Filter className="h-4 w-4 mr-2" />
              Filtreleri Temizle
            </Button>
          )}
          <div className="flex gap-1 p-1 bg-muted rounded-md ml-auto">
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
      </div>

      {movementsLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
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
      ) : filteredMovements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ArrowLeftRight className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Stok Hareketi Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              {hasActiveFilters
                ? "Filtrelere uygun hareket bulunamadı"
                : "Henüz stok hareketi kaydedilmemiş."}
            </p>
            {!hasActiveFilters && (
              <Button onClick={openNewDialog} data-testid="button-add-first-movement">
                <Plus className="h-4 w-4 mr-2" />
                İlk Hareketi Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMovements.map((movement) => (
            <Card key={movement.id} className="hover-elevate" data-testid={`movement-card-${movement.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-md ${movement.type === 'entry' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {movement.type === 'entry' ? (
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <Badge variant={movement.type === 'entry' ? 'default' : 'secondary'}>
                    {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                  </Badge>
                </div>
                {movement.product && (
                  <Link href={`/products/${movement.product.id}`} className="hover:underline">
                    <h3 className="font-semibold text-sm truncate">{movement.product.name}</h3>
                    <p className="text-xs text-muted-foreground">{movement.product.stockCode}</p>
                  </Link>
                )}
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {movement.project && (
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span className="truncate">{movement.project.name}</span>
                    </div>
                  )}
                  {movement.unitPrice && (
                    <div>
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                      }).format(Number(movement.unitPrice))}
                    </div>
                  )}
                  {movement.date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(movement.date), "d MMM yyyy HH:mm", { locale: tr })}
                    </div>
                  )}
                </div>
                {movement.notes && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{movement.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Tür</TableHead>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-center">Miktar</TableHead>
                    <TableHead>Proje / Firma</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Notlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id} data-testid={`movement-row-${movement.id}`}>
                      <TableCell>
                        <div className={`p-2 rounded-md w-fit ${movement.type === 'entry' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {movement.type === 'entry' ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {movement.product ? (
                          <Link href={`/products/${movement.product.id}`} className="hover:underline">
                            <div>
                              <span className="font-medium">{movement.product.name}</span>
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {movement.product.stockCode}
                              </span>
                            </div>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={movement.type === 'entry' ? 'default' : 'secondary'}>
                          {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {movement.project ? (
                          <span>{movement.project.name}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {movement.unitPrice ? (
                          new Intl.NumberFormat("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                          }).format(Number(movement.unitPrice))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {movement.date
                          ? format(new Date(movement.date), "d MMM yyyy HH:mm", { locale: tr })
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {movement.notes || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        {filteredMovements.length} hareket gösteriliyor
        {hasActiveFilters && ` (toplam ${movements?.length || 0} hareket)`}
      </div>
    </div>
  );
}

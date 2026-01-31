import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Warehouse, Plus, Edit, Trash2, MapPin, Loader2, Grid3X3, List, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Warehouse as WarehouseType, ProductWithRelations } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const warehouseFormSchema = z.object({
  name: z.string().min(1, "Depo adı zorunludur"),
  address: z.string().optional(),
  description: z.string().optional(),
});

type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;

export default function Warehouses() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: warehouses, isLoading } = useQuery<WarehouseType[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: products } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
  });

  // Her depo için ürün sayısını hesapla
  const getProductCount = (warehouseId: string) => {
    return products?.filter((product) => product.warehouseId === warehouseId).length || 0;
  };

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseFormSchema),
    defaultValues: {
      name: "",
      address: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WarehouseFormValues) => {
      await apiRequest("POST", "/api/warehouses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Depo oluşturuldu",
        description: "Yeni depo başarıyla eklendi.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Depo oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WarehouseFormValues & { id: string }) => {
      await apiRequest("PATCH", `/api/warehouses/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Depo güncellendi",
        description: "Depo bilgileri başarıyla güncellendi.",
      });
      setIsDialogOpen(false);
      setEditingWarehouse(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Depo güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/warehouses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({
        title: "Depo silindi",
        description: "Depo başarıyla silindi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Depo silinirken bir hata oluştu. Bu depoda ürün bulunuyor olabilir.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WarehouseFormValues) => {
    if (editingWarehouse) {
      updateMutation.mutate({ ...data, id: editingWarehouse.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    form.reset({
      name: warehouse.name,
      address: warehouse.address || "",
      description: warehouse.description || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingWarehouse(null);
    form.reset({
      name: "",
      address: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Depolar
          </h1>
          <p className="text-muted-foreground">
            Depo lokasyonlarınızı yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} data-testid="button-add-warehouse">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Depo
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWarehouse ? "Depo Düzenle" : "Yeni Depo Ekle"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depo Adı *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ana Depo"
                          {...field}
                          data-testid="input-warehouse-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Depo adresi"
                          {...field}
                          data-testid="input-warehouse-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Depo hakkında notlar"
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-warehouse-description"
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
                    data-testid="button-cancel-warehouse"
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-warehouse">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : editingWarehouse ? (
                      "Güncelle"
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
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
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
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      ) : warehouses?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Warehouse className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Depo Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              Henüz depo eklenmemiş. Hemen yeni bir depo ekleyin.
            </p>
            <Button onClick={openNewDialog} data-testid="button-add-first-warehouse">
              <Plus className="h-4 w-4 mr-2" />
              İlk Depoyu Ekle
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses?.map((warehouse) => (
            <Card key={warehouse.id} className="hover-elevate" data-testid={`warehouse-card-${warehouse.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-primary" />
                  {warehouse.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Ürün Sayısı:</span>
                  <Badge variant="secondary">{getProductCount(warehouse.id)}</Badge>
                </div>
                {warehouse.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{warehouse.address}</span>
                  </div>
                )}
                {warehouse.description && (
                  <p className="text-sm text-muted-foreground">
                    {warehouse.description}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(warehouse)}
                    data-testid={`button-edit-warehouse-${warehouse.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-warehouse-${warehouse.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Depoyu silmek istediğinize emin misiniz?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlem geri alınamaz. Bu depoya bağlı ürünler varsa işlem başarısız olacaktır.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(warehouse.id)}
                          className="bg-destructive text-destructive-foreground"
                          data-testid={`button-confirm-delete-warehouse-${warehouse.id}`}
                        >
                          Sil
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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
                    <TableHead>Depo Adı</TableHead>
                    <TableHead>Ürün Sayısı</TableHead>
                    <TableHead>Adres</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses?.map((warehouse) => (
                    <TableRow key={warehouse.id} data-testid={`warehouse-row-${warehouse.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-primary" />
                          <span className="font-medium">{warehouse.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="secondary">{getProductCount(warehouse.id)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {warehouse.address ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{warehouse.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {warehouse.description || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(warehouse)}
                            data-testid={`button-edit-warehouse-${warehouse.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-delete-warehouse-${warehouse.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Depoyu silmek istediğinize emin misiniz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu işlem geri alınamaz. Bu depoya bağlı ürünler varsa işlem başarısız olacaktır.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(warehouse.id)}
                                  className="bg-destructive text-destructive-foreground"
                                  data-testid={`button-confirm-delete-warehouse-${warehouse.id}`}
                                >
                                  Sil
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

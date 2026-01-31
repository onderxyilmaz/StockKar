import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Barcode,
  Search,
  Package,
  TrendingUp,
  TrendingDown,
  ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit,
} from "lucide-react";
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
import type { ProductWithRelations, Project } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const movementFormSchema = z.object({
  type: z.enum(["entry", "exit"], { required_error: "Hareket türü zorunludur" }),
  quantity: z.coerce.number().min(1, "Miktar en az 1 olmalıdır"),
  projectId: z.string().optional(),
});

type MovementFormValues = z.infer<typeof movementFormSchema>;

export default function BarcodeScanner() {
  const { toast } = useToast();
  const [barcodeInput, setBarcodeInput] = useState("");
  const [foundProduct, setFoundProduct] = useState<ProductWithRelations | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "not-found">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      type: "exit",
      quantity: 1,
      projectId: "",
    },
  });

  const watchedType = form.watch("type");

  const createMutation = useMutation({
    mutationFn: async (data: MovementFormValues & { productId: string }) => {
      await apiRequest("POST", "/api/stock-movements", {
        ...data,
        projectId: data.projectId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      const message = watchedType === "entry" 
        ? `${form.getValues("quantity")} adet ürün stoğa eklendi` 
        : `${form.getValues("quantity")} adet ürün stoktan çıkarıldı`;
      toast({
        title: "İşlem başarılı",
        description: message,
      });
      resetScanner();
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message || "İşlem gerçekleştirilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Ürün silindi",
        description: "Ürün başarıyla silindi.",
      });
      resetScanner();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const searchProduct = (barcode: string) => {
    if (!barcode.trim()) return;
    
    setSearchStatus("searching");
    const product = products?.find(
      (p) => p.barcode === barcode || p.stockCode === barcode
    );

    setTimeout(() => {
      if (product) {
        setFoundProduct(product);
        setSearchStatus("found");
        form.reset({
          type: "exit",
          quantity: 1,
          projectId: "",
        });
      } else {
        setFoundProduct(null);
        setSearchStatus("not-found");
      }
    }, 300);
  };

  const resetScanner = () => {
    setBarcodeInput("");
    setFoundProduct(null);
    setSearchStatus("idle");
    form.reset();
    inputRef.current?.focus();
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchProduct(barcodeInput);
  };

  const onSubmit = (data: MovementFormValues) => {
    if (!foundProduct) return;
    createMutation.mutate({ ...data, productId: foundProduct.id });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Stok Yok", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Düşük Stok", variant: "secondary" as const };
    return { label: "Stokta", variant: "default" as const };
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
          <Barcode className="h-8 w-8 text-primary" />
          Barkod Okuyucu
        </h1>
        <p className="text-muted-foreground">
          Barkod veya stok kodu ile hızlı ürün işlemi yapın
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Barkod / Stok Kodu Okut</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Barkod veya stok kodunu okutun veya yazın"
                className="pl-11 h-12 text-lg font-mono"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoComplete="off"
                data-testid="input-barcode-scanner"
              />
            </div>
            <Button type="submit" size="lg" disabled={!barcodeInput.trim() || searchStatus === "searching"} data-testid="button-search-barcode">
              {searchStatus === "searching" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            Barkod okuyucunuz klavye girişi olarak çalışıyorsa, okuyucuyu kullandığınızda otomatik olarak arama yapılır.
          </p>
        </CardContent>
      </Card>

      {searchStatus === "not-found" && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mb-3" />
            <h3 className="text-lg font-semibold mb-1">Ürün Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              "{barcodeInput}" barkodu veya stok kodu ile eşleşen ürün bulunamadı.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={resetScanner} data-testid="button-try-again">
                Tekrar Dene
              </Button>
              <Link href="/products/new">
                <Button data-testid="button-add-new-product">
                  Yeni Ürün Ekle
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {searchStatus === "found" && foundProduct && (
        <>
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-md bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                  {foundProduct.mainPhotoId ? (
                    <img
                      src={`/api/photos/${foundProduct.mainPhotoId}`}
                      alt={foundProduct.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{foundProduct.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Stok Kodu: {foundProduct.stockCode}
                        {foundProduct.barcode && ` • Barkod: ${foundProduct.barcode}`}
                      </p>
                    </div>
                    <Badge variant={getStockStatus(foundProduct.quantity).variant} className="shrink-0">
                      {foundProduct.quantity} adet
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-muted-foreground">
                      Tür: <span className="text-foreground">{foundProduct.productType}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Çıkış Fiyatı:{" "}
                      <span className="text-foreground">
                        {new Intl.NumberFormat("tr-TR", {
                          style: "currency",
                          currency: "TRY",
                        }).format(Number(foundProduct.exitPrice))}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <CheckCircle2 className="h-6 w-6 text-primary mx-auto" />
                  <div className="flex gap-2">
                    <Link href={`/products/${foundProduct.id}/edit`}>
                      <Button variant="outline" size="icon" data-testid="button-edit-product">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" data-testid="button-delete-product">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            "{foundProduct.name}" ürününü silmek istediğinizden emin misiniz? 
                            Bu işlem geri alınamaz ve ürüne ait tüm fotoğraflar ve stok hareketleri de silinecektir.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">İptal</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate(foundProduct.id)}
                            data-testid="button-confirm-delete"
                          >
                            {deleteMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Evet, Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stok İşlemi</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İşlem Türü</FormLabel>
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            type="button"
                            variant={field.value === "entry" ? "default" : "outline"}
                            className="h-16 flex-col gap-1"
                            onClick={() => field.onChange("entry")}
                            data-testid="button-type-entry"
                          >
                            <TrendingUp className="h-6 w-6" />
                            <span>Giriş</span>
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === "exit" ? "default" : "outline"}
                            className="h-16 flex-col gap-1"
                            onClick={() => field.onChange("exit")}
                            data-testid="button-type-exit"
                          >
                            <TrendingDown className="h-6 w-6" />
                            <span>Çıkış</span>
                          </Button>
                        </div>
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
                          Miktar
                          {watchedType === "exit" && (
                            <span className="text-muted-foreground ml-2">
                              (Mevcut stok: {foundProduct.quantity})
                            </span>
                          )}
                        </FormLabel>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange(Math.max(1, field.value - 1))}
                            disabled={field.value <= 1}
                            data-testid="button-decrease-quantity"
                          >
                            -
                          </Button>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max={watchedType === "exit" ? foundProduct.quantity : undefined}
                              className="text-center text-lg font-semibold"
                              {...field}
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const max = watchedType === "exit" ? foundProduct.quantity : Infinity;
                              field.onChange(Math.min(max, field.value + 1));
                            }}
                            disabled={watchedType === "exit" && field.value >= foundProduct.quantity}
                            data-testid="button-increase-quantity"
                          >
                            +
                          </Button>
                        </div>
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
                          <FormLabel>Proje / Firma (Opsiyonel)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-project">
                                <SelectValue placeholder="Satış yapılan proje/firma" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Seçilmedi</SelectItem>
                              {projects?.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={resetScanner}
                      data-testid="button-cancel"
                    >
                      İptal
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createMutation.isPending || (watchedType === "exit" && form.getValues("quantity") > foundProduct.quantity)}
                      data-testid="button-confirm"
                    >
                      {createMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          İşleniyor...
                        </>
                      ) : watchedType === "entry" ? (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Stoğa Ekle
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Stoktan Çıkar
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </>
      )}

      {searchStatus === "idle" && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-muted-foreground">
              Ürün Bekliyor
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Barkod okuyucunuz ile bir ürün tarayın veya yukarıdaki alana
              barkod/stok kodu yazarak arama yapın.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

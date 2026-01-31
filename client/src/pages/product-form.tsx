import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  ArrowLeft,
  Save,
  Upload,
  X,
  Star,
  ImageIcon,
  Loader2,
  Barcode,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { ProductWithRelations, Warehouse, ProductPhoto } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const productFormSchema = z.object({
  stockCode: z.string().min(1, "Stok kodu zorunludur"),
  name: z.string().min(1, "Ürün adı zorunludur"),
  productType: z.string().min(1, "Ürün türü zorunludur"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "Miktar 0 veya daha fazla olmalıdır"),
  barcode: z.string().optional(),
  warehouseId: z.string().optional(),
  entryPrice: z.coerce.number().min(0, "Giriş fiyatı 0 veya daha fazla olmalıdır"),
  exitPrice: z.coerce.number().min(0, "Çıkış fiyatı 0 veya daha fazla olmalıdır"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

export default function ProductForm() {
  const [, editParams] = useRoute("/products/:id/edit");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ProductPhoto[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeStatus, setBarcodeStatus] = useState<"idle" | "searching" | "found" | "not-found">("idle");
  const [foundExistingProduct, setFoundExistingProduct] = useState<ProductWithRelations | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editParams?.id;
  const productId = editParams?.id;

  const { data: product, isLoading: productLoading } = useQuery<ProductWithRelations>({
    queryKey: ["/api/products", productId],
    enabled: isEditing,
  });

  const { data: photos } = useQuery<ProductPhoto[]>({
    queryKey: ["/api/products", productId, "photos"],
    enabled: isEditing,
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: allProducts } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
    enabled: barcodeMode && !isEditing,
  });

  const searchByBarcode = (barcode: string) => {
    if (!barcode.trim() || !allProducts) return;
    
    setBarcodeStatus("searching");
    const foundProduct = allProducts.find(
      (p) => p.barcode === barcode || p.stockCode === barcode
    );

    setTimeout(() => {
      if (foundProduct) {
        setFoundExistingProduct(foundProduct);
        setBarcodeStatus("found");
        form.reset({
          stockCode: foundProduct.stockCode,
          name: foundProduct.name,
          productType: foundProduct.productType,
          description: foundProduct.description || "",
          quantity: foundProduct.quantity,
          barcode: foundProduct.barcode || "",
          warehouseId: foundProduct.warehouseId || "",
          entryPrice: Number(foundProduct.entryPrice),
          exitPrice: Number(foundProduct.exitPrice),
        });
        toast({
          title: "Ürün bulundu",
          description: "Mevcut ürün bilgileri forma yüklendi. Düzenleyip kaydedebilirsiniz.",
        });
      } else {
        setFoundExistingProduct(null);
        setBarcodeStatus("not-found");
        form.setValue("barcode", barcode);
      }
    }, 300);
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchByBarcode(barcodeInput);
  };

  const resetBarcodeSearch = () => {
    setBarcodeInput("");
    setBarcodeStatus("idle");
    setFoundExistingProduct(null);
    barcodeInputRef.current?.focus();
  };

  useEffect(() => {
    if (barcodeMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeMode]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      stockCode: "",
      name: "",
      productType: "",
      description: "",
      quantity: 0,
      barcode: "",
      warehouseId: "",
      entryPrice: 0,
      exitPrice: 0,
    },
    values: product
      ? {
          stockCode: product.stockCode,
          name: product.name,
          productType: product.productType,
          description: product.description || "",
          quantity: product.quantity,
          barcode: product.barcode || "",
          warehouseId: product.warehouseId || "",
          entryPrice: Number(product.entryPrice),
          exitPrice: Number(product.exitPrice),
        }
      : undefined,
  });

  useState(() => {
    if (photos) {
      setExistingPhotos(photos);
      const mainIndex = photos.findIndex((p) => p.isMain);
      if (mainIndex >= 0) {
        setMainPhotoIndex(mainIndex);
      }
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const response = await apiRequest("POST", "/api/products", {
        ...data,
        warehouseId: data.warehouseId || null,
      });
      return response.json();
    },
    onSuccess: async (newProduct) => {
      if (uploadedPhotos.length > 0) {
        await uploadPhotos(newProduct.id);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Ürün oluşturuldu",
        description: "Yeni ürün başarıyla eklendi.",
      });
      navigate("/products");
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ürün oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormValues & { targetId?: string }) => {
      const id = data.targetId || productId;
      const { targetId, ...updateData } = data;
      await apiRequest("PATCH", `/api/products/${id}`, {
        ...updateData,
        warehouseId: updateData.warehouseId || null,
      });
      return id;
    },
    onSuccess: async (id) => {
      for (const photoId of deletedPhotoIds) {
        await apiRequest("DELETE", `/api/photos/${photoId}`);
      }
      if (uploadedPhotos.length > 0 && id) {
        await uploadPhotos(id);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", id] });
      toast({
        title: "Ürün güncellendi",
        description: "Ürün bilgileri başarıyla güncellendi.",
      });
      navigate(`/products/${id}`);
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ürün güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const uploadPhotos = async (prodId: string) => {
    setIsUploading(true);
    try {
      for (let i = 0; i < uploadedPhotos.length; i++) {
        const formData = new FormData();
        formData.append("photo", uploadedPhotos[i]);
        formData.append("isMain", String(i === mainPhotoIndex - existingPhotos.filter(p => !deletedPhotoIds.includes(p.id)).length));
        
        await fetch(`/api/products/${prodId}/photos`, {
          method: "POST",
          body: formData,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = 5 - existingPhotos.filter(p => !deletedPhotoIds.includes(p.id)).length - uploadedPhotos.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    if (filesToAdd.length < files.length) {
      toast({
        title: "Uyarı",
        description: "Maksimum 5 fotoğraf yüklenebilir.",
        variant: "destructive",
      });
    }

    const newUrls = filesToAdd.map((file) => URL.createObjectURL(file));
    setUploadedPhotos((prev) => [...prev, ...filesToAdd]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  }, [existingPhotos, deletedPhotoIds, uploadedPhotos, toast]);

  const removeUploadedPhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    
    const existingCount = existingPhotos.filter(p => !deletedPhotoIds.includes(p.id)).length;
    const removedPhotoIndex = existingCount + index;
    if (mainPhotoIndex === removedPhotoIndex) {
      setMainPhotoIndex(0);
    } else if (mainPhotoIndex > removedPhotoIndex) {
      setMainPhotoIndex((prev) => prev - 1);
    }
  };

  const removeExistingPhoto = (photoId: string) => {
    const photoIndex = existingPhotos.findIndex(p => p.id === photoId);
    setDeletedPhotoIds((prev) => [...prev, photoId]);
    
    if (photoIndex === mainPhotoIndex) {
      setMainPhotoIndex(0);
    } else if (photoIndex < mainPhotoIndex) {
      setMainPhotoIndex((prev) => prev - 1);
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else if (barcodeMode && foundExistingProduct) {
      updateMutation.mutate({ ...data, targetId: foundExistingProduct.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;

  if (isEditing && productLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeExistingPhotos = existingPhotos.filter(p => !deletedPhotoIds.includes(p.id));
  const totalPhotos = activeExistingPhotos.length + uploadedPhotos.length;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={isEditing ? `/products/${productId}` : "/products"}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isEditing ? "Ürün Düzenle" : "Yeni Ürün"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Ürün bilgilerini güncelleyin" : "Yeni bir ürün ekleyin"}
          </p>
        </div>
        {!isEditing && (
          <Button
            type="button"
            variant={barcodeMode ? "default" : "outline"}
            onClick={() => {
              const newMode = !barcodeMode;
              setBarcodeMode(newMode);
              if (newMode) {
                resetBarcodeSearch();
              } else {
                setBarcodeInput("");
                setBarcodeStatus("idle");
                setFoundExistingProduct(null);
                form.reset({
                  stockCode: "",
                  name: "",
                  productType: "",
                  description: "",
                  quantity: 0,
                  barcode: "",
                  warehouseId: "",
                  entryPrice: 0,
                  exitPrice: 0,
                });
              }
            }}
            data-testid="button-barcode-mode"
          >
            <Barcode className="h-4 w-4 mr-2" />
            Barkod ile
          </Button>
        )}
      </div>

      {!isEditing && barcodeMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Barcode className="h-5 w-5 text-primary" />
              Barkod ile Ürün Ara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Barcode className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Barkod veya stok kodunu okutun"
                  className="pl-11 h-12 text-lg font-mono"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoComplete="off"
                  data-testid="input-barcode-search"
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                disabled={!barcodeInput.trim() || barcodeStatus === "searching"}
                data-testid="button-search-barcode"
              >
                {barcodeStatus === "searching" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Barkod okuyucunuz ile tarayın. Ürün veritabanında varsa bilgileri otomatik yüklenir.
            </p>

            {barcodeStatus === "found" && foundExistingProduct && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-primary/10 border border-primary/30">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    Mevcut ürün bulundu: {foundExistingProduct.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stok: {foundExistingProduct.quantity} adet • Bilgiler forma yüklendi
                  </p>
                </div>
                <Badge variant="secondary">{foundExistingProduct.stockCode}</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetBarcodeSearch}
                  data-testid="button-reset-barcode"
                >
                  Sıfırla
                </Button>
              </div>
            )}

            {barcodeStatus === "not-found" && (
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted border">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Ürün bulunamadı</p>
                  <p className="text-xs text-muted-foreground">
                    "{barcodeInput}" için kayıt yok. Barkod numarası forma eklendi, yeni ürün olarak kaydedebilirsiniz.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetBarcodeSearch}
                  data-testid="button-try-another"
                >
                  Başka Ara
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stockCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stok Kodu *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="STK-001"
                          {...field}
                          data-testid="input-stock-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barkod No</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="8690123456789"
                          {...field}
                          data-testid="input-barcode"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün Adı *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ürün adını girin"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün Türü *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Elektronik, Giyim, Gıda, vb."
                        {...field}
                        data-testid="input-product-type"
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
                        placeholder="Ürün açıklaması (opsiyonel)"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stok ve Fiyat Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adet *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entryPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giriş Fiyatı (₺) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          data-testid="input-entry-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="exitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Çıkış Fiyatı (₺) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          data-testid="input-exit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="warehouseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-warehouse">
                          <SelectValue placeholder="Depo seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Depo Seçilmedi</SelectItem>
                        {warehouses?.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Fotoğraflar ({totalPhotos}/5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalPhotos > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {activeExistingPhotos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                        index === mainPhotoIndex
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={`/api/photos/${photo.id}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white"
                          onClick={() => setMainPhotoIndex(index)}
                          data-testid={`button-set-main-existing-${photo.id}`}
                        >
                          <Star className={`h-4 w-4 ${index === mainPhotoIndex ? "fill-yellow-400" : ""}`} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white"
                          onClick={() => removeExistingPhoto(photo.id)}
                          data-testid={`button-remove-existing-${photo.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {index === mainPhotoIndex && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          Ana
                        </div>
                      )}
                    </div>
                  ))}
                  {previewUrls.map((url, index) => {
                    const photoIndex = activeExistingPhotos.length + index;
                    return (
                      <div
                        key={url}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                          photoIndex === mainPhotoIndex
                            ? "border-primary"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                            onClick={() => setMainPhotoIndex(photoIndex)}
                            data-testid={`button-set-main-${index}`}
                          >
                            <Star className={`h-4 w-4 ${photoIndex === mainPhotoIndex ? "fill-yellow-400" : ""}`} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                            onClick={() => removeUploadedPhoto(index)}
                            data-testid={`button-remove-${index}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {photoIndex === mainPhotoIndex && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                            Ana
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {totalPhotos < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Fotoğraf yüklemek için tıklayın
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG veya WEBP (maks. {5 - totalPhotos} fotoğraf daha)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    data-testid="input-photo-upload"
                  />
                </label>
              )}

              {totalPhotos === 0 && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mr-2 opacity-50" />
                  <span>Henüz fotoğraf eklenmedi</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href={isEditing ? `/products/${productId}` : "/products"}>
              <Button type="button" variant="outline" data-testid="button-cancel">
                İptal
              </Button>
            </Link>
            <Button type="submit" disabled={isPending} data-testid="button-save">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing || (barcodeMode && foundExistingProduct) ? "Güncelle" : "Kaydet"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

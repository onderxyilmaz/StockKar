import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Loader2,
  Search,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Project } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const projectFormSchema = z.object({
  name: z.string().min(1, "İsim zorunludur"),
  type: z.string().min(1, "Tür zorunludur"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Geçerli bir e-posta adresi girin").optional().or(z.literal("")),
  address: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function Projects() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      type: "project",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      await apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Kayıt oluşturuldu",
        description: "Yeni kayıt başarıyla eklendi.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kayıt oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProjectFormValues & { id: string }) => {
      await apiRequest("PATCH", `/api/projects/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Kayıt güncellendi",
        description: "Kayıt bilgileri başarıyla güncellendi.",
      });
      setIsDialogOpen(false);
      setEditingProject(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kayıt güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Kayıt silindi",
        description: "Kayıt başarıyla silindi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Kayıt silinirken bir hata oluştu. Bu kayıta bağlı stok hareketi olabilir.",
        variant: "destructive",
      });
    },
  });

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || project.type === typeFilter;

    return matchesSearch && matchesType;
  }) || [];

  const onSubmit = (data: ProjectFormValues) => {
    if (editingProject) {
      updateMutation.mutate({ ...data, id: editingProject.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      type: project.type,
      contactPerson: project.contactPerson || "",
      phone: project.phone || "",
      email: project.email || "",
      address: project.address || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingProject(null);
    form.reset({
      name: "",
      type: "project",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
    setIsDialogOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Projeler / Firmalar
          </h1>
          <p className="text-muted-foreground">
            Satış yapacağınız proje ve firmaları yönetin
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="button-add-project">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? "Kayıt Düzenle" : "Yeni Kayıt Ekle"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İsim *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Proje veya firma adı"
                          {...field}
                          data-testid="input-project-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tür *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-type">
                            <SelectValue placeholder="Tür seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="project">Proje</SelectItem>
                          <SelectItem value="company">Firma</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yetkili Kişi</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="İletişim kurulacak kişi"
                          {...field}
                          data-testid="input-contact-person"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0555 555 55 55"
                            {...field}
                            data-testid="input-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@ornek.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Adres bilgisi"
                          {...field}
                          data-testid="input-address"
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
                    data-testid="button-cancel-project"
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={isPending} data-testid="button-save-project">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : editingProject ? (
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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="İsim veya yetkili kişi ara"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-type-filter">
            <SelectValue placeholder="Tür Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="project">Projeler</SelectItem>
            <SelectItem value="company">Firmalar</SelectItem>
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
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Kayıt Bulunamadı</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || typeFilter !== "all"
                ? "Arama kriterlerinize uygun kayıt bulunamadı"
                : "Henüz proje veya firma eklenmemiş."}
            </p>
            {!searchQuery && typeFilter === "all" && (
              <Button onClick={openNewDialog} data-testid="button-add-first-project">
                <Plus className="h-4 w-4 mr-2" />
                İlk Kaydı Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover-elevate" data-testid={`project-card-${project.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {project.type === "project" ? (
                    <FolderKanban className="h-5 w-5 text-primary" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                  <span className="truncate flex-1">{project.name}</span>
                  <Badge variant="secondary" className="shrink-0">
                    {project.type === "project" ? "Proje" : "Firma"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.contactPerson && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{project.contactPerson}</span>
                  </div>
                )}
                {project.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{project.phone}</span>
                  </div>
                )}
                {project.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{project.email}</span>
                  </div>
                )}
                {project.address && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{project.address}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(project)}
                    data-testid={`button-edit-project-${project.id}`}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Düzenle
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Kaydı silmek istediğinize emin misiniz?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Bu işlem geri alınamaz. Bu kayda bağlı stok hareketleri varsa işlem başarısız olacaktır.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(project.id)}
                          className="bg-destructive text-destructive-foreground"
                          data-testid={`button-confirm-delete-project-${project.id}`}
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
                    <TableHead>İsim</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Yetkili Kişi</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id} data-testid={`project-row-${project.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {project.type === "project" ? (
                            <FolderKanban className="h-4 w-4 text-primary" />
                          ) : (
                            <Building2 className="h-4 w-4 text-primary" />
                          )}
                          <span className="font-medium">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {project.type === "project" ? "Proje" : "Firma"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {project.contactPerson || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {project.phone || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {project.email || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(project)}
                            data-testid={`button-edit-project-${project.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-delete-project-${project.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Kaydı silmek istediğinize emin misiniz?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bu işlem geri alınamaz. Bu kayda bağlı stok hareketleri varsa işlem başarısız olacaktır.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>İptal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate(project.id)}
                                  className="bg-destructive text-destructive-foreground"
                                  data-testid={`button-confirm-delete-project-${project.id}`}
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

      <div className="text-sm text-muted-foreground">
        {filteredProjects.length} kayıt gösteriliyor
        {(searchQuery || typeFilter !== "all") && ` (toplam ${projects?.length || 0} kayıt)`}
      </div>
    </div>
  );
}

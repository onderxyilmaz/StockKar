import { useLocation, Link } from "wouter";
import {
  Package,
  Warehouse,
  Building2,
  ArrowLeftRight,
  LayoutDashboard,
  Barcode,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Ürünler",
    url: "/products",
    icon: Package,
  },
  {
    title: "Depolar",
    url: "/warehouses",
    icon: Warehouse,
  },
  {
    title: "Projeler / Firmalar",
    url: "/projects",
    icon: Building2,
  },
  {
    title: "Stok Hareketleri",
    url: "/movements",
    icon: ArrowLeftRight,
  },
  {
    title: "Barkod Okuyucu",
    url: "/barcode",
    icon: Barcode,
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-sidebar-foreground">
              Stok Yönetimi
            </span>
            <span className="text-xs text-muted-foreground">
              Envanter Takip Sistemi
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Ana Menü
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url || 
                  (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10"
                      data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <div className="text-xs text-muted-foreground text-center">
          Stok Yönetim Sistemi v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

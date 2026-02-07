import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { UserAvatar } from "@/components/user-avatar";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import NotFound from "@/features/dashboard/pages/not-found";
import Dashboard from "@/features/dashboard/pages/dashboard";
import Products from "@/features/products/pages/products";
import ProductDetail from "@/features/products/pages/product-detail";
import ProductForm from "@/features/products/pages/product-form";
import Warehouses from "@/features/warehouses/pages/warehouses";
import Projects from "@/features/projects/pages/projects";
import StockMovements from "@/features/stock-movements/pages/stock-movements";
import BarcodeScanner from "@/features/barcode-scanner/pages/barcode-scanner";
import Login from "@/features/auth/pages/login";
import Setup from "@/features/auth/pages/setup";
import Profile from "@/features/auth/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/setup" component={Setup} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/products">
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      </Route>
      <Route path="/products/new">
        <ProtectedRoute>
          <ProductForm />
        </ProtectedRoute>
      </Route>
      <Route path="/products/:id">
        <ProtectedRoute>
          <ProductDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/products/:id/edit">
        <ProtectedRoute>
          <ProductForm />
        </ProtectedRoute>
      </Route>
      <Route path="/warehouses">
        <ProtectedRoute>
          <Warehouses />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <Projects />
        </ProtectedRoute>
      </Route>
      <Route path="/movements">
        <ProtectedRoute>
          <StockMovements />
        </ProtectedRoute>
      </Route>
      <Route path="/barcode">
        <ProtectedRoute>
          <BarcodeScanner />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  } as React.CSSProperties;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="stock-ui-theme">
        <TooltipProvider>
          <RouterWithLayout sidebarStyle={sidebarStyle} />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RouterWithLayout({ sidebarStyle }: { sidebarStyle: React.CSSProperties }) {
  const [location] = useLocation();
  const isAuthPage = location === "/login" || location === "/setup";

  if (isAuthPage) {
    return <Router />;
  }

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserAvatar />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default App;

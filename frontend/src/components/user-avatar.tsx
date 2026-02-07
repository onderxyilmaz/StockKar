import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, User as UserIcon, LogOut } from "lucide-react";
import type { User } from "@stockkar/shared/features/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { clearTokens } from "@/lib/token";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export function UserAvatar() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
      toast({
        title: "Çıkış yapıldı",
        description: "Güvenle çıkış yaptınız.",
      });
      setLocation("/login");
    },
    onError: () => {
      // Even if logout fails, clear tokens and cache and redirect
      clearTokens();
      queryClient.clear();
      setLocation("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  const isSuperAdmin = user.role === "super_admin";
  const avatarBgColor = isSuperAdmin ? "bg-orange-500" : "bg-blue-500";
  const avatarTextColor = "text-white";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={`${avatarBgColor} ${avatarTextColor}`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {user.firstName} {user.lastName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setLocation("/profile")}>
          <UserIcon className="h-4 w-4 mr-2" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Çıkış
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema } from "@stockkar/shared/features/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { saveTokens } from "@/lib/token";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  // Check if setup is needed
  const { data: setupCheck } = useQuery<{ hasUsers: boolean }>({
    queryKey: ["/api/auth/check-setup"],
    retry: false,
  });

  // Check if already logged in
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (setupCheck !== undefined) {
      setIsCheckingSetup(false);
      if (!setupCheck.hasUsers) {
        setLocation("/setup");
      }
    }
  }, [setupCheck, setLocation]);

  useEffect(() => {
    if (currentUser) {
      setLocation("/");
    }
  }, [currentUser, setLocation]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      const result = await res.json();
      return result;
    },
    onSuccess: (data) => {
      // Token'ları kaydet
      if (data.tokens) {
        saveTokens(data.tokens);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Giriş başarılı",
        description: "Hoş geldiniz!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Giriş başarısız",
        description: error.response || "E-posta veya şifre hatalı.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  if (isCheckingSetup || currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Giriş Yap</CardTitle>
          <CardDescription className="text-center">
            StockKar Stok Yönetim Sistemi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ornek@email.com"
                        autoFocus
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Giriş Yap
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

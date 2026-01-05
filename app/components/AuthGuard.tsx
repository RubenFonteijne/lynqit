"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientClient } from "@/lib/supabase-client";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredUserId?: string; // Optional: check if user owns a specific resource
}

export default function AuthGuard({ children, requiredUserId }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const supabase = createClientClient();
        
        // Get current session
        let session = null;
        let error = null;
        
        try {
          const sessionData = await supabase.auth.getSession();
          session = sessionData.data?.session || null;
          error = sessionData.error || null;
        } catch (e) {
          error = e as any;
        }
        
        // Fallback: check localStorage for user data if Supabase session is not available
        if ((error || !session || !session.user)) {
          const cachedUser = localStorage.getItem("lynqit_user");
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              // User exists in localStorage, create a mock session
              session = {
                user: { email: user.email },
              } as any;
            } catch (e) {
              // Invalid cache
              if (!isMounted) return;
              setIsLoading(false);
              router.push("/");
              return;
            }
          } else {
            // No session and no cached user
            if (!isMounted) return;
            setIsLoading(false);
            router.push("/");
            return;
          }
        }
        
        if (!isMounted) return;

        // Get user from session
        const user = session.user;
        
        // If requiredUserId is provided, check if user owns the resource or is admin
        if (requiredUserId && user.email !== requiredUserId) {
          // Check if user is admin
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, email')
            .eq('email', user.email)
            .single();
          
          if (!isMounted) return;
          
          if (userError) {
            console.error("[AuthGuard] Error fetching user data:", userError);
            setIsLoading(false);
            router.push("/");
            return;
          }
          
          const isAdmin = userData?.role === 'admin' && userData?.email === 'rubenfonteijne@gmail.com';
          
          if (!isAdmin) {
            setIsLoading(false);
            router.push("/");
            return;
          }
        }

        if (isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[AuthGuard] Error checking auth:", error);
        if (isMounted) {
          setIsLoading(false);
          router.push("/");
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, [requiredUserId]); // Removed router from dependencies to prevent loops

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect, so don't render anything
  }

  return <>{children}</>;
}

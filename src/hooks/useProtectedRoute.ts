import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export type UserRole = 'user' | 'admin' | 'superadmin' | 'police' | 'hospital';

/**
 * Get the appropriate route path based on user role
 */
export const getRouteForRole = (role: UserRole | string | undefined): string => {
  switch (role) {
    case 'superadmin':
      return '/(superadmin)/dashboard';
    case 'admin':
      return '/(admin)/dashboard';
    case 'police':
      return '/(police)/dashboard';
    case 'hospital':
      return '/(hospital)/dashboard';
    case 'user':
    default:
      return '/(tabs)/home';
  }
};

/**
 * Get the route group for a role
 */
export const getRouteGroupForRole = (role: UserRole | string | undefined): string => {
  switch (role) {
    case 'superadmin':
      return '(superadmin)';
    case 'admin':
      return '(admin)';
    case 'police':
      return '(police)';
    case 'hospital':
      return '(hospital)';
    case 'user':
    default:
      return '(tabs)';
  }
};

interface UseProtectedRouteOptions {
  /**
   * Required role(s) to access this route.
   * If not specified, any authenticated user can access.
   */
  requiredRole?: UserRole | UserRole[];
}

/**
 * Hook to protect routes based on authentication and role
 * 
 * @example
 * // In a layout file, protect for specific role
 * useProtectedRoute({ requiredRole: 'admin' });
 * 
 * @example
 * // Allow multiple roles
 * useProtectedRoute({ requiredRole: ['admin', 'superadmin'] });
 */
export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { requiredRole } = options;
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const currentSegment = segments[0] as string;
    const inAuthGroup = currentSegment === '(auth)';
    const inPublicRoute = currentSegment === 'index' || !currentSegment;
    const userRole = user?.role;

    // Not authenticated
    if (!isAuthenticated) {
      // If trying to access protected route, redirect to login
      if (!inAuthGroup && !inPublicRoute) {
        router.replace('/(auth)/login');
      }
      return;
    }

    // Authenticated user trying to access auth pages (login/signup)
    if (inAuthGroup || inPublicRoute) {
      // Redirect to appropriate dashboard
      const redirectPath = getRouteForRole(userRole);
      router.replace(redirectPath as any);
      return;
    }

    // Check role-based access if requiredRole is specified
    if (requiredRole && userRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const hasRequiredRole = allowedRoles.includes(userRole as UserRole);
      
      // Special case: superadmin can access admin routes
      const isSuperAdminAccessingAdminRoute = 
        userRole === 'superadmin' && allowedRoles.includes('admin');

      if (!hasRequiredRole && !isSuperAdminAccessingAdminRoute) {
        // Redirect to appropriate dashboard based on actual role
        const redirectPath = getRouteForRole(userRole);
        router.replace(redirectPath as any);
      }
    }
  }, [isAuthenticated, isLoading, user, segments, requiredRole]);

  return { isLoading, isAuthenticated, user };
}

/**
 * Hook to protect public routes (login, signup) from authenticated users
 * Redirects authenticated users to their appropriate dashboard
 */
export function usePublicRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      const redirectPath = getRouteForRole(user?.role);
      router.replace(redirectPath as any);
    }
  }, [isAuthenticated, isLoading, user]);

  return { isLoading, isAuthenticated };
}

export default useProtectedRoute;

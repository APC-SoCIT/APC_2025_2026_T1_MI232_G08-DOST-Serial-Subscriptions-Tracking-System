import React from 'react';
import { usePage, router } from '@inertiajs/react';

/**
 * RequireRole Component
 * 
 * Protects content based on user roles. If user doesn't have the required role,
 * they will be redirected to their appropriate dashboard.
 * 
 * Usage:
 * <RequireRole roles={['admin', 'tpu']}>
 *   <YourProtectedContent />
 * </RequireRole>
 * 
 * @param {string|string[]} roles - Single role or array of allowed roles
 * @param {React.ReactNode} children - Content to render if authorized
 * @param {React.ReactNode} fallback - Optional content to show if unauthorized (default: redirect)
 */
export default function RequireRole({ roles, children, fallback = null }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    
    // If no user is logged in, redirect to login
    if (!user) {
        if (typeof window !== 'undefined') {
            router.visit('/login');
        }
        return null;
    }
    
    // Normalize roles to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has one of the allowed roles
    const hasRole = allowedRoles.includes(user.role);
    
    if (!hasRole) {
        // If fallback is provided, show it
        if (fallback) {
            return fallback;
        }
        
        // Otherwise redirect to user's dashboard
        const roleRoutes = {
            admin: '/dashboard-Admin',
            supplier: '/dashboard-Supplier',
            gsps: '/dashboard-gsps',
            tpu: '/dashboard-tpu',
            inspection: '/inspection-dashboard',
        };
        
        const redirectPath = roleRoutes[user.role] || '/dashboard';
        
        if (typeof window !== 'undefined') {
            router.visit(redirectPath);
        }
        
        return null;
    }
    
    return children;
}

/**
 * Hook to check if current user has a specific role
 * 
 * Usage:
 * const { hasRole, userRole, isAdmin, isTpu, isGsps, isSupplier, isInspection } = useRole();
 * 
 * if (hasRole('admin')) { ... }
 */
export function useRole() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const userRole = user?.role || null;
    
    const hasRole = (roles) => {
        if (!userRole) return false;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        return allowedRoles.includes(userRole);
    };
    
    return {
        user,
        userRole,
        hasRole,
        isAdmin: userRole === 'admin',
        isTpu: userRole === 'tpu',
        isGsps: userRole === 'gsps',
        isSupplier: userRole === 'supplier',
        isInspection: userRole === 'inspection',
        isAuthenticated: !!user,
    };
}

/**
 * Component to conditionally render content based on role
 * 
 * Usage:
 * <RoleGate roles={['admin']}>
 *   <AdminOnlyButton />
 * </RoleGate>
 */
export function RoleGate({ roles, children, fallback = null }) {
    const { hasRole } = useRole();
    
    if (hasRole(roles)) {
        return children;
    }
    
    return fallback;
}

import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { GoShieldX } from 'react-icons/go';

export default function Unauthorized() {
    const { auth } = usePage().props;
    const user = auth?.user;
    
    // Get the appropriate dashboard route for the user's role
    const getDashboardRoute = () => {
        const roleRoutes = {
            admin: '/dashboard-Admin',
            supplier: '/dashboard-Supplier',
            gsps: '/dashboard-gsps',
            tpu: '/dashboard-tpu',
            inspection: '/inspection-dashboard',
        };
        
        return user?.role ? roleRoutes[user.role] || '/dashboard' : '/login';
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <GoShieldX size={40} className="text-red-500" />
                    </div>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    Access Denied
                </h1>
                
                <p className="text-gray-600 mb-6">
                    You don't have permission to access this page. 
                    {user?.role && (
                        <span className="block mt-2 text-sm">
                            Your current role: <strong className="capitalize">{user.role}</strong>
                        </span>
                    )}
                </p>
                
                <div className="space-y-3">
                    <button
                        onClick={() => router.visit(getDashboardRoute())}
                        className="w-full bg-[#0f57a3] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#0b4a8a] transition-colors"
                    >
                        Go to My Dashboard
                    </button>
                    
                    <button
                        onClick={() => window.history.back()}
                        className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}

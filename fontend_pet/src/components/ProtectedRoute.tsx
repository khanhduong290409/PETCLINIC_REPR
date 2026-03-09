import type { ReactNode } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
    allowedRoles: string[];
    children: ReactNode;
} 

export default function ProtectedRoute({ allowedRoles, children } : Props) {
    const { user, loading } = useAuth();

    if(loading) {
        return (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
    </div>
        )
    }
    if(!user) return <Navigate to="/login" replace />;
    
    if(!allowedRoles.includes(user.role)) return <Navigate to="/" replace/>;
    return <>{children}</>
}

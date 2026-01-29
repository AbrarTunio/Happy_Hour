import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../context/StaffAuthContext';

/**
 * A wrapper component that checks for staff authentication.
 * - If the staff member is logged in, it renders the requested component (`children`).
 * - If the staff member is NOT logged in, it redirects them to the login page.
 */
const ProtectedRoute = ({ children }) => {
    const { loggedInStaff } = useStaffAuth();
    const location = useLocation();

    // If there is no logged-in staff member, redirect to the login page.
    if (!loggedInStaff) {
        // 'replace' prevents the user from clicking the browser's back button
        // to return to the protected page after being redirected.
        return <Navigate to="/staff/time-clock" state={{ from: location }} replace />;
    }

    // If they are logged in, render the component they were trying to access.
    return children;
};

export default ProtectedRoute;

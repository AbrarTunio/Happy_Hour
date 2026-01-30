import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const StaffAuthContext = createContext(null);

// 2. Create the Provider component
// This component will wrap our application and manage the authentication state.
export const StaffAuthProvider = ({ children }) => {
    // Attempt to get the logged-in user from localStorage on initial load.
    // This allows the session to persist across page reloads.
    const [loggedInStaff, setLoggedInStaff] = useState(() => {
        try {
            const item = window.localStorage.getItem('loggedInStaff');
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error("Error reading from localStorage", error);
            return null;
        }
    });

    // Function to call upon successful login
    const login = (staffData) => {
        setLoggedInStaff(staffData);
        // Persist the logged-in user to localStorage
        window.localStorage.setItem('loggedInStaff', JSON.stringify(staffData));
    };

    // Function to call when signing out
    const logout = () => {
        setLoggedInStaff(null);
        // Remove the user from localStorage
        window.localStorage.removeItem('loggedInStaff');
    };

    // The value provided to all consuming components
    const value = { loggedInStaff, login, logout };

    return (
        <StaffAuthContext.Provider value={value}>
            {children}
        </StaffAuthContext.Provider>
    );
};

// 3. Create a custom hook for easy access to the context
// This simplifies using the context in our components.
export const useStaffAuth = () => {
    return useContext(StaffAuthContext);
};

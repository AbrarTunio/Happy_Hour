// --- START OF FILE Layout.jsx ---

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <h1 className="sidebar-header">OnlyMetric</h1>
                <nav className="sidebar-nav">
                    <ul>
                        <li><NavLink to="/">Dashboard</NavLink></li>
                        <li><NavLink to="/recipes">Recipes</NavLink></li>
                        <li><NavLink to="/ingredients">Ingredients</NavLink></li>
                        <li><NavLink to="/invoices">Invoices</NavLink></li>
                        <li><NavLink to="/suppliers">Suppliers</NavLink></li>
                        <li><NavLink to="/staff">Staff</NavLink></li>
                        {/* DELETED the link to Staff Clock-In */}
                    </ul>
                </nav>
            </aside>
            <main className="main-content-area">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
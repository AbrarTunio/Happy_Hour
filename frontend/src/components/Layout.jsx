import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();


    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <>
            <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
            <div className="app-layout">
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="sidebar-header-container">
                        <h1 className="sidebar-header">OnlyMetric</h1>
                        <button className="sidebar-close-btn" onClick={toggleSidebar}>
                            &times;
                        </button>
                    </div>


                    <nav className="sidebar-nav">
                        <ul>
                            <li><NavLink to="/">Dashboard</NavLink></li>
                            <li><NavLink to="/suppliers">Suppliers</NavLink></li>
                            <li><NavLink to="/invoices">Invoices</NavLink></li>
                            <li><NavLink to="/ingredients">Ingredients</NavLink></li>
                            <li><NavLink to="/recipes">Recipes</NavLink></li>
                            <li><NavLink to="/staff">Staff & Rostering</NavLink></li>
                            <li><NavLink to="/ai-insights">AI Insights & KPI Manager</NavLink></li>
                            <li><NavLink to="/sales-reconciliation">Sales Reconciliation</NavLink></li>
                        </ul>
                    </nav>


                </aside>

                <main className="main-content-area">
                    <div className="mobile-header">
                        <button className="hamburger-btn" onClick={toggleSidebar}>
                            &#9776;
                        </button>
                        <span className="mobile-header-title">OnlyMetric</span>

                    </div>
                    <div className="content-wrapper">
                        <Outlet />
                    </div>
                </main>
            </div>
        </>
    );
};

export default Layout;

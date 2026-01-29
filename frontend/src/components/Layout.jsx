import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../pages/Login';
import { toast } from 'react-hot-toast';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { admin, logout } = useAdminAuth();

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
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

                    {/* Logout Button */}
                    <div style={{
                        padding: '15px',
                        borderTop: '1px solid var(--light-gray)',
                        marginTop: 'auto'
                    }}>
                        <button
                            onClick={handleLogout}
                            className="btn btn-danger"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                style={{ width: '20px', height: '20px' }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                                />
                            </svg>
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="main-content-area">
                    <div className="mobile-header">
                        <button className="hamburger-btn" onClick={toggleSidebar}>
                            &#9776;
                        </button>
                        <span className="mobile-header-title">OnlyMetric</span>

                        {/* Mobile Logout Button */}
                        <button
                            onClick={handleLogout}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-color)',
                                cursor: 'pointer',
                                padding: '5px 10px',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }}
                        >
                            Logout
                        </button>
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

import React, { useState, useContext, createContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';


export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(() => {
        const storedAdmin = localStorage.getItem('adminUser');
        return storedAdmin ? JSON.parse(storedAdmin) : null;
    });

    const login = async (username, password) => {
        try {
            // Point to your Laravel API
            const response = await axios.post('/api/admin/login', {
                username,
                password
            });

            if (response.data.success) {
                const { user, token } = response.data;

                // Save user and token
                localStorage.setItem('adminUser', JSON.stringify(user));
                localStorage.setItem('adminToken', token);

                // Set default header for future axios calls
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setAdmin(user);
                toast.success('Login successful!');
                return { success: true };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Login failed';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const logout = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.post('/api/admin/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            localStorage.removeItem('adminUser');
            localStorage.removeItem('adminToken');
            delete axios.defaults.headers.common['Authorization'];
            setAdmin(null);
            toast.success('Logged out');
        }
    };

    return (
        <AdminAuthContext.Provider value={{ admin, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

// Custom hook to use admin auth context
export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
};

// Protected Route Component
export const AdminProtectedRoute = ({ children }) => {
    const { admin } = useAdminAuth();

    if (!admin) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Login Page Component
const Login = () => {
    const navigate = useNavigate();
    const { admin, login } = useAdminAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If already logged in, redirect to dashboard
    if (admin) {
        return <Navigate to="/" replace />;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error on input change
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // FIX: You must 'await' the login function because it is asynchronous
            const result = await login(formData.username, formData.password);

            if (result && result.success) {
                // Navigate to dashboard after successful login
                navigate('/', { replace: true });
            } else {
                // error is returned from the catch block in AdminAuthProvider
                setError(result.error || 'Login failed. Please try again.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="time-clock-page-centered">
            <div className="time-clock-login-card">
                {/* Login Icon */}
                <div className="login-icon-container">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                    </svg>
                </div>

                {/* Header */}
                <h2>Admin Portal Login</h2>
                <p>Enter your credentials to access the management system</p>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-block"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login to Dashboard'}
                    </button>
                </form>

                {/* Demo Credentials */}
                {/* <div className="demo-codes">
                    <p>Demo Credentials:</p>
                    <div>
                        <span>
                            <strong>Username:</strong> admin
                        </span>
                        <span>
                            <strong>Password:</strong> password123
                        </span>
                    </div>
                </div> */}

                {/* Additional Links */}
                {/* <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--dark-gray)' }}>
                    <p>
                        Forgot your password?{' '}
                        <button
                            className="btn-link"
                            onClick={() => toast('Please contact system administrator')}
                            style={{ padding: '0', fontSize: 'inherit' }}
                        >
                            Reset here
                        </button>
                    </p>
                </div> */}
            </div>
        </div>
    );
};

export default Login;

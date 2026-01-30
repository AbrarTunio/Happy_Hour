import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useStaffAuth } from '../../context/StaffAuthContext';

const StaffTimeClockLogin = () => {
    const [staffCode, setStaffCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login, loggedInStaff } = useStaffAuth();

    // If a user is already logged in and tries to visit the login page,
    // redirect them to their dashboard.
    useEffect(() => {
        if (loggedInStaff) {
            navigate(`/staff/time-clock/${loggedInStaff.id}`);
        }
    }, [loggedInStaff, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/teams/login-by-code', { staff_code: staffCode });
            login(response.data);
            navigate(`/staff/time-clock/${response.data.id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="time-clock-page-centered">
            <div className="time-clock-login-card">
                <div className="login-icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <h2>Staff Clock In</h2>
                <p>Enter your staff code to access the system</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="staffCode">Staff Code</label>
                        <input
                            type="text"
                            id="staffCode"
                            value={staffCode}
                            onChange={(e) => setStaffCode(e.target.value)}
                            placeholder="Enter code"
                            autoComplete="off"
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-block" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="demo-codes">
                    <p>Demo Codes:</p>
                    <span>1234 (Manager)</span>
                    <span>5678 (Barista)</span>
                </div>
            </div>
        </div>
    );
};

export default StaffTimeClockLogin;

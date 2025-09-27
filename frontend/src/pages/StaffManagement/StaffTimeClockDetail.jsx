import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClockIn from '../ClockIn';

const StaffTimeClockDetail = () => {
    const { staffId } = useParams();
    const navigate = useNavigate();
    const [staffMember, setStaffMember] = useState(null);
    const [activeSheet, setActiveSheet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStatus = async () => {
        // Keep loading false on refetch to avoid screen flicker
        try {
            const [staffRes, statusRes] = await Promise.all([
                axios.get(`/api/teams/${staffId}`),
                axios.get(`/api/teams/${staffId}/status`)
            ]);
            setStaffMember(staffRes.data);
            setActiveSheet(statusRes.data);
        } catch (err) {
            setError('Failed to load staff data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [staffId]);

    const handleAction = async (endpoint) => {
        try {
            await axios.post(endpoint, { team_id: staffId });
            fetchStatus(); // Refresh status after any action
        } catch (error) {
            alert('An error occurred: ' + (error.response?.data?.message || 'Please try again.'));
            console.error(error);
        }
    };

    const handleClockIn = () => handleAction('/api/timesheets/clock-in');
    const handleClockOut = () => handleAction('/api/timesheets/clock-out');
    const handleTakeBreak = () => handleAction('/api/timesheets/take-break');
    const handleEndBreak = () => handleAction('/api/timesheets/end-break');
    const handleSwitchUser = () => navigate('/staff/timesheets');


    if (loading) return <p>Loading time clock status...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <>
            <header>
                <Link to="/staff/timesheets" className="btn-link" style={{ textDecoration: 'none' }}>
                    &larr; Back to Timesheets
                </Link>
            </header>
            <div className="clock-in-wrapper" style={{ minHeight: 'auto', background: 'none', padding: 0, boxShadow: 'none' }}>
                {staffMember && (
                    <ClockIn
                        user={staffMember}
                        activeSheet={activeSheet}
                        onClockIn={handleClockIn}
                        onClockOut={handleClockOut}
                        onTakeBreak={handleTakeBreak}
                        onEndBreak={handleEndBreak}
                        onSwitchUser={handleSwitchUser}
                    />
                )}
            </div>
        </>
    );
};

export default StaffTimeClockDetail;
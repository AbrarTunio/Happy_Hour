import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClockIn from '../../components/ClockIn';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { format, parseISO, differenceInMinutes } from 'date-fns';

const StaffTimeClockDetail = () => {
    const navigate = useNavigate();
    const { loggedInStaff, logout } = useStaffAuth();

    const [activeSheet, setActiveSheet] = useState(null);
    const [recentTimesheets, setRecentTimesheets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to get today's schedule from the staff object
    const getTodaySchedule = () => {
        if (!loggedInStaff || !loggedInStaff.schedule) return null;

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = days[new Date().getDay()]; // 0 = Sunday

        const scheduleForToday = loggedInStaff.schedule[dayName];

        if (scheduleForToday && scheduleForToday.active) {
            return `${scheduleForToday.start} - ${scheduleForToday.end}`;
        }
        return null;
    };

    const todayScheduleText = getTodaySchedule();

    // Helper function to parse time
    const parseTime = (dateStr) => {
        if (!dateStr) return null;
        try {
            if (dateStr instanceof Date) return dateStr;
            if (dateStr.includes('T') && (dateStr.includes('Z') || dateStr.includes('+'))) {
                return new Date(dateStr);
            }
            if (dateStr.includes(' ') && dateStr.includes(':')) {
                const isoStr = dateStr.replace(' ', 'T') + 'Z';
                return new Date(isoStr);
            }
            return new Date(dateStr);
        } catch (error) {
            console.error('Error parsing date:', dateStr, error);
            return null;
        }
    };

    // Helper function to format time display
    const formatTimeDisplay = (date) => {
        if (!date) return 'N/A';
        try {
            const dateObj = typeof date === 'string' ? parseTime(date) : date;
            if (!dateObj) return 'N/A';
            return format(dateObj, 'hh:mm a');
        } catch (error) {
            console.error('Error formatting date:', date, error);
            return 'Invalid Time';
        }
    };

    // Helper function to format date display
    const formatDateDisplay = (date) => {
        if (!date) return 'N/A';
        try {
            const dateObj = typeof date === 'string' ? parseTime(date) : date;
            if (!dateObj) return 'N/A';
            return format(dateObj, 'MMM dd, yyyy');
        } catch (error) {
            console.error('Error formatting date:', date, error);
            return 'Invalid Date';
        }
    };

    const fetchData = useCallback(async () => {
        if (!loggedInStaff) return;
        setLoading(true);
        try {
            const [statusRes, timesheetsRes] = await Promise.all([
                axios.get(`/api/teams/${loggedInStaff.id}/status`),
                axios.get(`/api/teams/${loggedInStaff.id}/timesheets`)
            ]);
            setActiveSheet(statusRes.data);

            // Filter to show only clock-in entries (not manual entries)
            const allTimesheets = timesheetsRes.data || [];
            const clockInTimesheets = allTimesheets.filter(sheet => {
                // Filter for clock-in entries only
                // Check if it's a clock-in entry (not manual)
                if (sheet.entry_type === 'clock_in') return true;

                // For legacy entries without entry_type field, check for notes
                if (!sheet.entry_type && (!sheet.notes || !sheet.notes.includes('Manual'))) {
                    return true; // Assume it's a clock-in entry
                }

                return false; // Exclude manual entries
            });

            // Sort by most recent first and take the latest 10 entries
            const sortedTimesheets = clockInTimesheets.sort((a, b) => {
                const dateA = parseTime(a.clock_in);
                const dateB = parseTime(b.clock_in);
                return dateB - dateA;
            }).slice(0, 10);

            setRecentTimesheets(sortedTimesheets);
        } catch (err) {
            console.error('Failed to fetch clock data.', err);
        } finally {
            setLoading(false);
        }
    }, [loggedInStaff]);

    useEffect(() => {
        if (loggedInStaff && loggedInStaff.status === 'active') {
            fetchData();
        } else if (loggedInStaff) {
            setLoading(false);
        }
    }, [fetchData, loggedInStaff]);

    const handleAction = async (endpoint) => {
        try {
            await axios.post(endpoint, { team_id: loggedInStaff.id });
            fetchData();
        } catch (error) {
            alert('An error occurred: ' + (error.response?.data?.message || 'Please try again.'));
        }
    };

    const handleClockIn = () => handleAction('/api/timesheets/clock-in');
    const handleClockOut = () => handleAction('/api/timesheets/clock-out');
    const handleTakeBreak = () => handleAction('/api/timesheets/take-break');
    const handleEndBreak = () => handleAction('/api/timesheets/end-break');

    const handleSignOut = () => {
        logout();
        navigate('/staff/time-clock');
    };

    if (!loggedInStaff) {
        return <div className="time-clock-page"><p>Loading User...</p></div>;
    }

    if (loggedInStaff.status !== 'active') {
        return (
            <div className="time-clock-page">
                <div className="time-clock-dashboard">
                    <header className="dashboard-header">
                        <div className="user-info">
                            <div className="avatar">{loggedInStaff.first_name.charAt(0)}</div>
                            <div>
                                <strong>{loggedInStaff.first_name} {loggedInStaff.last_name}</strong>
                                <small>{loggedInStaff.position} • {loggedInStaff.branch}</small>
                            </div>
                        </div>
                        <button onClick={handleSignOut} className="btn-sign-out">Sign Out</button>
                    </header>
                    <div className="dashboard-card" style={{ textAlign: 'center' }}>
                        <h3>Account Inactive</h3>
                        <p style={{ color: '#6b7280', padding: '20px 0' }}>
                            Your account is currently inactive. Please contact a manager to reactivate it.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="time-clock-page">
            <div className="time-clock-dashboard">

                <header className="dashboard-header">
                    <div className="user-info">
                        <div className="avatar">{loggedInStaff.first_name.charAt(0)}</div>
                        <div>
                            <strong>{loggedInStaff.first_name} {loggedInStaff.last_name}</strong>
                            <small>{loggedInStaff.position} • {loggedInStaff.branch}</small>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="btn-sign-out">Sign Out</button>
                </header>

                {loading ? <p>Loading clock status...</p> : (
                    <ClockIn
                        user={loggedInStaff}
                        activeSheet={activeSheet}
                        onClockIn={handleClockIn}
                        onClockOut={handleClockOut}
                        onTakeBreak={handleTakeBreak}
                        onEndBreak={handleEndBreak}
                    />
                )}

                <div className="dashboard-card">
                    <h3>Today's Schedule</h3>
                    {todayScheduleText ? (
                        <p style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', color: 'var(--primary-blue)', margin: '10px 0' }}>
                            {todayScheduleText}
                        </p>
                    ) : (
                        <p className="no-schedule-message" style={{ textAlign: 'center', color: '#6b7280', padding: '10px 0' }}>
                            You're not scheduled to work today.
                        </p>
                    )}
                </div>

                <div className="dashboard-card">
                    <h3>Recent Clock-In Activity</h3>
                    <div className="activity-log">
                        {loading ? (
                            <p>Loading activity...</p>
                        ) : recentTimesheets.length === 0 ? (
                            <p className="no-activity-message" style={{ textAlign: 'center', color: '#6b7280', padding: '10px 0' }}>No recent clock-in activity found.</p>
                        ) : (
                            recentTimesheets.map(sheet => {
                                const date = formatDateDisplay(sheet.clock_in);
                                const startTime = formatTimeDisplay(sheet.clock_in);
                                const endTime = sheet.clock_out ? formatTimeDisplay(sheet.clock_out) : 'Active';
                                const statusText = sheet.status ? sheet.status.replace('_', ' ') : 'Completed';

                                // Calculate hours worked if clocked out
                                let hoursWorked = null;
                                if (sheet.clock_out) {
                                    const start = parseTime(sheet.clock_in);
                                    const end = parseTime(sheet.clock_out);
                                    const mins = differenceInMinutes(end, start);
                                    hoursWorked = (mins / 60).toFixed(1);
                                }

                                return (
                                    <div className="activity-item" key={sheet.id}>
                                        <div>
                                            <p><strong>{date}</strong></p>
                                            <small>
                                                {startTime} - {endTime}
                                                {hoursWorked && ` • ${hoursWorked}h`}
                                            </small>
                                            {sheet.break_start && (
                                                <small style={{ display: 'block', color: '#f97316', marginTop: '2px' }}>
                                                    Includes break time
                                                </small>
                                            )}
                                        </div>
                                        <span className={`status-tag status-${sheet.status || 'completed'}`}>
                                            {statusText}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffTimeClockDetail;

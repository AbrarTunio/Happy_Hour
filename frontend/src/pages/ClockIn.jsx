import React, { useState, useEffect } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

const ClockIn = ({ user, activeSheet, onClockIn, onClockOut, onTakeBreak, onEndBreak, onSwitchUser }) => {
    const [time, setTime] = useState(new Date());
    const [todayHours, setTodayHours] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (activeSheet?.clock_in) {
            const clockInTime = parseISO(activeSheet.clock_in);
            const interval = setInterval(() => {
                const seconds = differenceInSeconds(new Date(), clockInTime);
                setTodayHours(seconds / 3600); // convert seconds to hours
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setTodayHours(0);
        }
    }, [activeSheet]);

    const todaysEarnings = (todayHours * (user?.hourly_rate || 0)).toFixed(2);

    const renderView = () => {
        const status = activeSheet?.status;

        if (status === 'active') {
            return (
                <>
                    <h4>{user.first_name} {user.last_name}</h4>
                    <div className="clock-time">{time.toLocaleTimeString()}</div>
                    <div className="clock-date">{time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    <div className="status-bar">
                        <div><strong>Today's Hours</strong><br />{todayHours.toFixed(1)}h</div>
                        <div><strong>Today's Earnings</strong><br />${todaysEarnings}</div>
                    </div>
                    <button className="btn btn-danger" onClick={onClockOut}>Clock Out</button>
                    <button className="btn btn-break" onClick={onTakeBreak}>Take Break</button>
                    <button className="btn btn-link" onClick={onSwitchUser} style={{ marginTop: '10px' }}>Switch User</button>
                </>
            );
        }

        if (status === 'on_break') {
            return (
                <>
                    <h4>{user.first_name} {user.last_name}</h4>
                    <div className="clock-time">{time.toLocaleTimeString()}</div>
                    <p>Currently On Break</p>
                    <button className="btn btn-end-break" onClick={onEndBreak}>End Break</button>
                    <button className="btn btn-link" onClick={onSwitchUser} style={{ marginTop: '10px' }}>Switch User</button>
                </>
            );
        }

        // Default to clocked out
        return (
            <>
                <h4>{user.first_name} {user.last_name}</h4>
                <div className="clock-time">{time.toLocaleTimeString()}</div>
                <p>You are currently clocked out.</p>
                <button className="btn btn-primary" onClick={onClockIn}>Clock In</button>
                <button className="btn btn-link" onClick={onSwitchUser} style={{ marginTop: '10px' }}>Switch User</button>
            </>
        );
    };

    return <div className="clock-in-container">{renderView()}</div>;
};

export default ClockIn;
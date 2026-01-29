import React, { useState, useEffect } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';

const ClockIn = ({ user, activeSheet, onClockIn, onClockOut, onTakeBreak, onEndBreak }) => {
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
                const now = new Date();
                if (activeSheet.status === 'on_break' && activeSheet.break_start) {
                    const breakStartTime = parseISO(activeSheet.break_start);
                    const secondsWorkedBeforeBreak = differenceInSeconds(breakStartTime, clockInTime);
                    setTodayHours(secondsWorkedBeforeBreak / 3600);
                } else {
                    const seconds = differenceInSeconds(now, clockInTime);
                    setTodayHours(seconds / 3600);
                }
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setTodayHours(0);
        }
    }, [activeSheet]);

    const todaysEarnings = (todayHours * (user?.hourly_rate || 0)).toFixed(2);
    const lastActionTime = activeSheet?.clock_in
        ? `Last clocked in at ${new Date(activeSheet.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'You are currently clocked out';

    const renderStatus = () => {
        const status = activeSheet?.status;
        if (status === 'active') return <span className="status-indicator clocked-in">Clocked In</span>;
        if (status === 'on_break') return <span className="status-indicator on-break">On Break</span>;
        return <span className="status-indicator clocked-out">Clocked Out</span>;
    };

    const renderButtons = () => {
        const status = activeSheet?.status;

        if (status === 'active') {
            return (
                <div className="action-buttons">
                    <button className="btn-clock-out" onClick={onClockOut}>Clock Out</button>
                    <button className="btn-take-break" onClick={onTakeBreak}>Take Break</button>
                </div>
            );
        }

        if (status === 'on_break') {
            const breakStartTime = activeSheet.break_start ? new Date(activeSheet.break_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            return (
                <div className="action-buttons on-break-view">
                    <p>On Break... <small>Started: {breakStartTime}</small></p>
                    <button className="btn-end-break" onClick={onEndBreak}>End Break</button>
                </div>
            );
        }

        return (
            <div className="action-buttons">
                <button className="btn-clock-in" onClick={onClockIn}>Clock In</button>
            </div>
        );
    };

    return (
        <>
            <div className="time-display-card">
                <div className="current-time">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                <div className="current-date">{time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>

            <div className="dashboard-card">
                <div className="card-header">
                    <h3>Clock Status</h3>
                    {renderStatus()}
                </div>
                <p className="last-action-text">{lastActionTime}</p>
                <div className="metrics-bar">
                    <div>
                        <strong>{todayHours.toFixed(1)}h</strong>
                        <small>Today's Hours</small>
                    </div>
                    <div>
                        <strong>${todaysEarnings}</strong>
                        <small>Today's Earnings</small>
                    </div>
                </div>
                {renderButtons()}
            </div>
        </>
    );
};

export default ClockIn;

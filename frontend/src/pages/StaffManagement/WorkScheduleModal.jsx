import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, isAfter, isBefore } from 'date-fns';
import Modal from '../../components/Modal';
import { toast } from 'react-hot-toast';

const WorkScheduleModal = ({ staff, onClose }) => {
    const now = new Date();
    const [activeTab, setActiveTab] = useState('regular');
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(now, { weekStartsOn: 1 }));
    const [regularPattern, setRegularPattern] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyWeeksCount, setCopyWeeksCount] = useState(1);

    const daysKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const getDefaultSchedule = () => ({
        monday: { active: false, start: '09:00', end: '17:00' },
        tuesday: { active: false, start: '09:00', end: '17:00' },
        wednesday: { active: false, start: '09:00', end: '17:00' },
        thursday: { active: false, start: '09:00', end: '17:00' },
        friday: { active: false, start: '09:00', end: '17:00' },
        saturday: { active: false, start: '10:00', end: '16:00' },
        sunday: { active: false, start: '10:00', end: '16:00' },
    });

    const fetchSchedule = async () => {
        if (!staff?.id) return;

        setLoading(true);
        try {
            const dateStr = format(currentWeekStart, 'yyyy-MM-dd');
            const res = await axios.get(`/api/teams/${staff.id}/schedule`, {
                params: { date: dateStr }
            });

            const regular = res.data.regular || getDefaultSchedule();
            setRegularPattern(regular);
        } catch (error) {
            toast.error("Failed to load schedule.");
            setRegularPattern(getDefaultSchedule());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [staff?.id, currentWeekStart]);

    // Logic to determine week status
    const getWeekStatus = () => {
        const currentWk = startOfWeek(now, { weekStartsOn: 1 });
        const upcomingWk = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

        if (isSameDay(currentWeekStart, currentWk)) {
            return { label: 'Current Week', type: 'current' };
        } else if (isSameDay(currentWeekStart, upcomingWk)) {
            return { label: 'Upcoming Week', type: 'upcoming' };
        } else if (isAfter(currentWeekStart, upcomingWk)) {
            return { label: 'Future Week', type: 'future' };
        } else if (isBefore(currentWeekStart, currentWk)) {
            return { label: 'Past Week', type: 'past' };
        }
        return { label: '', type: 'other' };
    };

    const weekStatus = getWeekStatus();
    const isCurrentWeek = weekStatus.type === 'current';

    // Dynamic tab label logic based on the navigated week
    const getDynamicTabLabel = () => {
        switch (weekStatus.type) {
            case 'current': return 'This Week Only';
            case 'upcoming': return 'Next Week';
            case 'future': return 'Future Week';
            case 'past': return 'Past Week';
            default: return 'This Week Only';
        }
    };

    const handleToggle = (day, status) => {
        setRegularPattern({
            ...regularPattern,
            [day]: { ...regularPattern[day], active: status }
        });
    };

    const handleTimeChange = (day, field, value) => {
        setRegularPattern({
            ...regularPattern,
            [day]: { ...regularPattern[day], [field]: value }
        });
    };

    const handleSave = async () => {
        const loadingToast = toast.loading('Saving schedule...');
        try {
            const payload = { week_start_date: null, data: regularPattern };
            await axios.post(`/api/teams/${staff.id}/schedule`, payload);
            toast.success("Schedule saved!", { id: loadingToast });
            await fetchSchedule();
        } catch (error) {
            toast.error("Failed to save schedule.", { id: loadingToast });
        }
    };

    const handleCopyToFutureWeeks = async () => {
        const loadingToast = toast.loading(`Copying schedule...`);
        try {
            const currentWeekStartDate = startOfWeek(now, { weekStartsOn: 1 });
            const promises = [];
            for (let i = 1; i <= copyWeeksCount; i++) {
                const targetWeekStart = addWeeks(currentWeekStartDate, i);
                const payload = {
                    week_start_date: format(targetWeekStart, 'yyyy-MM-dd'),
                    data: regularPattern
                };
                promises.push(axios.post(`/api/teams/${staff.id}/schedule`, payload));
            }
            await Promise.all(promises);
            toast.success(`Schedule copied!`, { id: loadingToast });
            setShowCopyModal(false);
            await fetchSchedule();
        } catch (error) {
            toast.error("Failed to copy schedule.", { id: loadingToast });
        }
    };

    if (!staff) return null;

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={`Work Schedule: ${staff.first_name}`} modalClass="modal-lg">
                <div className="schedule-app-container">
                    <p className="modal-subtitle">Manage weekly availability</p>

                    <div className="schedule-header-nav">
                        <button className="nav-arrow-btn" onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>&larr;</button>
                        <div className="week-display-info">
                            <span className="date-range-text">
                                Week of {format(currentWeekStart, 'dd MMM')} – {format(addDays(currentWeekStart, 6), 'dd MMM')}
                            </span>
                            {weekStatus.label && (
                                <div className={`week-status-badge status-${weekStatus.type}`}>
                                    {weekStatus.type === 'current' ? '📌 ' : weekStatus.type === 'upcoming' ? '📅 ' : weekStatus.type === 'future' ? '🚀 ' : '🕐 '}
                                    {weekStatus.label.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button className="nav-arrow-btn" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>&rarr;</button>

                        {isCurrentWeek && (
                            <button
                                className="btn-jump-today"
                                onClick={() => setCurrentWeekStart(startOfWeek(now, { weekStartsOn: 1 }))}
                            >
                                Today
                            </button>
                        )}
                    </div>

                    <div className="tab-switcher">
                        {/* Intelligent Tab Label: Updates for Past, This Week, Next Week, and Future Weeks */}
                        <button
                            className={activeTab === 'this-week' ? 'active' : ''}
                            onClick={() => setActiveTab('this-week')}
                        >
                            {getDynamicTabLabel()}
                        </button>
                        <button
                            className={activeTab === 'regular' ? 'active' : ''}
                            onClick={() => setActiveTab('regular')}
                        >
                            Regular Pattern
                        </button>
                    </div>

                    <div className="instruction-box">
                        {activeTab === 'regular' ? (
                            <span><strong>Regular pattern:</strong> Set a default availability pattern that applies every week.</span>
                        ) : (
                            <span><strong>Specific Week:</strong> Changes made here only apply to this specific date range.</span>
                        )}
                    </div>

                    <div className="rows-container">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
                        ) : daysKeys.map((day, index) => {
                            const dayDate = addDays(currentWeekStart, index);
                            const isToday = isSameDay(dayDate, now);
                            const data = regularPattern[day];
                            const isActive = data?.active ?? false;

                            return (
                                <div key={day} className={`day-row ${isToday && isCurrentWeek ? 'is-today' : ''}`}>
                                    <div className="day-meta">
                                        <span className="day-name" style={{ textTransform: 'capitalize' }}>{day}</span>
                                        <div className="date-label">
                                            {activeTab === 'this-week' ? format(dayDate, 'dd MMM') : 'Every week'}
                                            {isToday && isCurrentWeek && <span className="today-chip">Today</span>}
                                        </div>
                                    </div>

                                    <div className="action-toggles">
                                        <div className="segmented-control">
                                            <button className={isActive ? 'selected-available' : ''} onClick={() => handleToggle(day, true)}>Available</button>
                                            <button className={!isActive ? 'selected-off' : ''} onClick={() => handleToggle(day, false)}>Day Off</button>
                                        </div>
                                    </div>

                                    <div className="time-config">
                                        {isActive ? (
                                            <div className="time-pickers">
                                                <input type="time" value={data?.start || '09:00'} onChange={(e) => handleTimeChange(day, 'start', e.target.value)} />
                                                <span>&rarr;</span>
                                                <input type="time" value={data?.end || '17:00'} onChange={(e) => handleTimeChange(day, 'end', e.target.value)} />
                                            </div>
                                        ) : (
                                            <span className="not-available-label">Not available</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="modal-actions-footer">
                        {/* Requirement: Copy button only shows in Current Week AND NOT in Regular Pattern tab */}
                        {isCurrentWeek && activeTab !== 'regular' && (
                            <button className="btn-secondary-outline" onClick={() => setShowCopyModal(true)}>📑 Copy to Future Weeks</button>
                        )}
                        <div className="right-buttons">
                            <button className="btn-ghost" onClick={onClose}>Cancel</button>
                            <button className="btn-primary-solid" onClick={handleSave}>Save Changes</button>
                        </div>
                    </div>
                </div>
            </Modal>

            {showCopyModal && (
                <Modal isOpen={showCopyModal} onClose={() => setShowCopyModal(false)} title="Copy to Future Weeks" modalClass="modal-sm">
                    <div style={{ padding: '20px' }}>
                        <p style={{ marginBottom: '20px', color: '#6b7280' }}>Copy availability settings to:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            {[1, 2, 3, 4].map((weeks) => (
                                <label key={weeks} style={{ display: 'flex', alignItems: 'center', padding: '12px', border: copyWeeksCount === weeks ? '2px solid #3b82f6' : '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', backgroundColor: copyWeeksCount === weeks ? '#eff6ff' : 'transparent' }}>
                                    <input type="radio" name="copyWeeks" value={weeks} checked={copyWeeksCount === weeks} onChange={(e) => setCopyWeeksCount(parseInt(e.target.value))} style={{ marginRight: '10px' }} />
                                    <span>Next {weeks} week{weeks > 1 ? 's' : ''}</span>
                                </label>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => setShowCopyModal(false)}>Cancel</button>
                            <button className="btn-primary-solid" onClick={handleCopyToFutureWeeks}>Copy</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default WorkScheduleModal;

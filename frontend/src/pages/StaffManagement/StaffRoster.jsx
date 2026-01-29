import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    format,
    startOfWeek,
    endOfWeek,
    addDays,
    addWeeks,
    subWeeks,
    parse,
    addHours,
    differenceInMinutes,
    isSameDay,
    parseISO,
    isAfter,
    isWithinInterval
} from 'date-fns';
import { X, Plus, Edit2, Trash2, CheckCircle, Clock, Users, Save, FileDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import RosterPDFModal from './RosterPDFModal';

const StaffRoster = () => {
    // --- STATE ---
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [rosterShifts, setRosterShifts] = useState([]);
    const [selectedShift, setSelectedShift] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
    const [isAddingStaffDropdown, setIsAddingStaffDropdown] = useState(false);

    // Edit States
    const [isEditingShift, setIsEditingShift] = useState(false);
    const [editStartTime, setEditStartTime] = useState('');
    const [editEndTime, setEditEndTime] = useState('');

    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    const timeSlots = ['09:00', '11:00', '15:00', '19:00', '23:30'];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/teams');
            setTeamMembers(response.data);

            const rosterRes = await axios.get('/api/roster', {
                params: { week_start: format(currentWeekStart, 'yyyy-MM-dd') }
            });

            const mappedShifts = rosterRes.data.map(s => ({
                id: `${s.day}-${s.start_time}`,
                day: s.day,
                startTime: s.start_time.substring(0, 5),
                endTime: s.end_time.substring(0, 5),
                target: s.target,
                assignedStaff: s.assigned_staff || []
            }));
            setRosterShifts(mappedShifts);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load roster data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [currentWeekStart]);

    // --- NAVIGATION LABELS ---
    const getWeekLabel = () => {
        if (isSameDay(currentWeekStart, todayWeekStart)) return 'CURRENT WEEK';
        const upcomingWeek = addWeeks(todayWeekStart, 1);
        if (isSameDay(currentWeekStart, upcomingWeek)) return 'UPCOMING WEEK';
        if (isAfter(currentWeekStart, upcomingWeek)) return 'FUTURE WEEK';
        return 'PAST WEEK';
    };

    const handleSaveRoster = async () => {
        const loadingToast = toast.loading("Saving Roster...");
        try {
            await axios.post('/api/roster/save', {
                week_start: format(currentWeekStart, 'yyyy-MM-dd'),
                shifts: rosterShifts
            });
            toast.success("Roster saved successfully!", { id: loadingToast });
        } catch (err) {
            toast.error("Error saving roster.", { id: loadingToast });
        }
    };

    const getHoursStats = (member) => {
        let weeklyScheduledMins = 0;
        if (member.schedule) {
            Object.values(member.schedule).forEach(day => {
                if (day.active && day.start && day.end) {
                    const start = parse(day.start, 'HH:mm', new Date());
                    const end = parse(day.end, 'HH:mm', new Date());
                    weeklyScheduledMins += differenceInMinutes(end, start);
                }
            });
        }
        let workedMins = 0;
        if (member.timesheets) {
            member.timesheets.forEach(ts => {
                const tsDate = parseISO(ts.clock_in);
                if (isWithinInterval(tsDate, { start: currentWeekStart, end: currentWeekEnd })) {
                    if (ts.clock_in && ts.clock_out) workedMins += differenceInMinutes(parseISO(ts.clock_out), parseISO(ts.clock_in));
                }
            });
        }
        const worked = (workedMins / 60).toFixed(1);
        const scheduled = (weeklyScheduledMins / 60).toFixed(0);
        return { worked, scheduled, percent: weeklyScheduledMins > 0 ? (workedMins / weeklyScheduledMins) * 100 : 0 };
    };

    const getShiftColor = (shift) => {
        if (!shift || shift.assignedStaff.length === 0) return '#ffffff';
        const count = shift.assignedStaff.length;
        const target = shift.target || 6;
        if (count >= target) return '#e8f5e9';
        if (count >= 4) return '#fff8e1';
        return '#ffebee';
    };

    const handleCellClick = (day, time) => {
        const id = `${day}-${time}`;
        const existing = rosterShifts.find(s => s.id === id);
        setIsEditingShift(false);
        setIsAddingStaffDropdown(false);

        if (existing) {
            setSelectedShift(existing);
        } else {
            const startTime = parse(time, 'HH:mm', new Date());
            const newShift = {
                id, day, startTime: time,
                endTime: format(addHours(startTime, 3), 'HH:mm'),
                target: (time === '15:00' ? 5 : 6),
                assignedStaff: []
            };
            setRosterShifts([...rosterShifts, newShift]);
            setSelectedShift(newShift);
        }
        setIsSidebarOpen(true);
    };

    const isAvailable = (member, dayLabel, time) => {
        const dayMap = { 'MON': 'monday', 'TUE': 'tuesday', 'WED': 'wednesday', 'THU': 'thursday', 'FRI': 'friday', 'SAT': 'saturday', 'SUN': 'sunday' };
        const sched = member.schedule?.[dayMap[dayLabel]];
        if (!sched || !sched.active) return false;
        const shiftTime = parse(time, 'HH:mm', new Date());
        return shiftTime >= parse(sched.start, 'HH:mm', new Date()) && shiftTime < parse(sched.end, 'HH:mm', new Date());
    };

    return (
        <div style={{ display: 'flex', gap: '24px', padding: '24px', background: 'var(--light-gray)', minHeight: '90vh' }}>
            <style>{`
                .roster-grid { flex: 1; transition: 0.3s; }
                .grid-table td { border: 1px solid var(--border-color); height: 95px; cursor: pointer; vertical-align: top; }
                .cell-content { padding: 8px; height: 100%; display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: 0.2s; }
                .cell-content.selected { border: 2px solid var(--primary-blue); margin: -1px; z-index: 5; }
                .sidebar-card { background: white; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow); padding: 24px; position: sticky; top: 24px; width: 380px; height: calc(100vh - 120px); overflow-y: auto; }
            `}</style>

            <div className="roster-grid">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 700 }}>Staff Rostering</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--dark-gray)' }}>Week of {format(currentWeekStart, 'dd MMM')}</span>
                            <span style={{
                                color: getWeekLabel().includes('PAST') ? 'var(--dark-gray)' : 'var(--red)',
                                fontSize: '11px', fontWeight: 600,
                                background: 'var(--light-red-bg)',
                                padding: '3px 10px', borderRadius: '4px'
                            }}>
                                📌 {getWeekLabel()}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleSaveRoster} className="btn btn-primary"><Save size={18}/> Save Roster</button>
                        <button onClick={() => setIsPDFModalOpen(true)} className="btn btn-secondary"><FileDown size={18}/> PDF</button>
                        <div style={{ display: 'flex', background: 'white', borderRadius: '8px', border: '1px solid #ddd', overflow: 'hidden' }}>
                            <button className="btn-link" style={{padding: '5px 12px', borderRight: '1px solid #ddd'}} onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}>‹</button>
                            <button className="btn-link" style={{padding: '5px 12px'}} onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}>›</button>
                        </div>

                        {/* "Today" only shown in Current Week */}
                        {isSameDay(currentWeekStart, todayWeekStart) && (
                            <button onClick={() => setCurrentWeekStart(todayWeekStart)} className="btn btn-secondary">Today</button>
                        )}

                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="btn btn-blue">
                            {isSidebarOpen ? 'Hide Sidebar' : 'Show Staff'}
                        </button>
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="grid-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fafafa' }}>
                                <th style={{ padding: '15px', color: 'var(--dark-gray)', fontSize: '11px', width: '80px' }}>TIME</th>
                                {days.map((day, i) => (
                                    <th key={day} style={{ padding: '15px' }}>
                                        <div style={{ fontSize: '10px', color: 'var(--dark-gray)' }}>{day}</div>
                                        <div style={{ fontWeight: 600 }}>{format(addDays(currentWeekStart, i), 'dd MMM')}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(time => (
                                <tr key={time}>
                                    <td style={{ textAlign: 'center', fontWeight: 700, background: '#fafafa' }}>{time}</td>
                                    {days.map(day => {
                                        const shift = rosterShifts.find(s => s.id === `${day}-${time}`);
                                        const isSelected = selectedShift?.id === `${day}-${time}`;
                                        return (
                                            <td key={day} onClick={() => handleCellClick(day, time)}>
                                                <div className={`cell-content ${isSelected ? 'selected' : ''}`} style={{ background: getShiftColor(shift) }}>
                                                    <div style={{ display: 'flex', justify: 'space-between', fontSize: '10px', color: '#999' }}>
                                                        <span>{shift ? shift.startTime : time}</span>
                                                        <Plus size={10} style={{ opacity: 0.5 }} />
                                                    </div>
                                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, textAlign: 'center', color: '#333' }}>
                                                        {shift ? shift.assignedStaff.length : 0}/{shift ? shift.target : 6}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isSidebarOpen && (
                <div className="sidebar-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0 }}>{selectedShift ? 'Shift Details' : 'Available Staff'}</h4>
                        {/* Sidebar Closes when X is clicked */}
                        <button className="btn-close" onClick={() => setIsSidebarOpen(false)} style={{background:'none', border:'none', cursor:'pointer'}}><X size={20} /></button>
                    </div>

                    {!selectedShift ? (
                        <div style={{ color: 'var(--dark-gray)', textAlign: 'center', padding: '20px' }}>
                             <Users size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                             <p>Select a shift on the grid to manage assignments.</p>
                        </div>
                    ) : (
                        <>
                            <h2 style={{ margin: '0 0 10px 0' }}>{selectedShift.day}</h2>

                            {isEditingShift ? (
                                <div style={{ background: 'var(--light-gray)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                                    <div className="form-group"><label>Start</label><input type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)} /></div>
                                    <div className="form-group"><label>End</label><input type="time" value={editEndTime} onChange={e => setEditEndTime(e.target.value)} /></div>
                                    <button
                                        className="btn btn-primary w-100"
                                        onClick={() => {
                                            const updated = { ...selectedShift, startTime: editStartTime, endTime: editEndTime };
                                            setRosterShifts(rosterShifts.map(s => s.id === selectedShift.id ? updated : s));
                                            setSelectedShift(updated);
                                            setIsEditingShift(false);
                                            toast.success("Time updated!");
                                        }}
                                    >Save Changes</button>
                                </div>
                            ) : (
                                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--dark-gray)' }}>
                                    <Clock size={16} /> <span>{selectedShift.startTime} - {selectedShift.endTime}</span>
                                </div>
                            )}

                            <div style={{ background: 'var(--light-blue-bg)', padding: '15px', borderRadius: '10px', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    <span>Assigned: <strong>{selectedShift.assignedStaff.length}</strong></span>
                                    <span>Target: <strong>{selectedShift.target}</strong></span>
                                </div>
                                <div style={{ height: '8px', background: 'white', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: 'var(--primary-blue)', width: `${(selectedShift.assignedStaff.length / selectedShift.target) * 100}%` }} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h5 style={{ margin: 0 }}>ASSIGNED</h5>
                                <button onClick={() => setIsAddingStaffDropdown(!isAddingStaffDropdown)} className="btn btn-blue btn-sm">+ Add Staff</button>
                            </div>

                            {isAddingStaffDropdown && (
                                <select
                                    className="form-group"
                                    style={{width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd'}}
                                    onChange={(e) => {
                                        const sid = parseInt(e.target.value);
                                        const updated = { ...selectedShift, assignedStaff: [...selectedShift.assignedStaff, sid] };
                                        setRosterShifts(rosterShifts.map(s => s.id === selectedShift.id ? updated : s));
                                        setSelectedShift(updated);
                                        setIsAddingStaffDropdown(false);
                                    }}
                                >
                                    <option value="">Select staff member...</option>
                                    {teamMembers.filter(m => isAvailable(m, selectedShift.day, selectedShift.startTime) && !selectedShift.assignedStaff.includes(m.id)).map(m => (
                                        <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                    ))}
                                </select>
                            )}

                            {selectedShift.assignedStaff.map(id => {
                                const staff = teamMembers.find(t => t.id === id);
                                return (
                                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--light-green-bg)', padding: '10px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #b7eb8f' }}>
                                        <span>{staff?.first_name} {staff?.last_name}</span>
                                        <button
                                            onClick={() => {
                                                const updated = { ...selectedShift, assignedStaff: selectedShift.assignedStaff.filter(sid => sid !== id) };
                                                setRosterShifts(rosterShifts.map(s => s.id === selectedShift.id ? updated : s));
                                                setSelectedShift(updated);
                                            }}
                                            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                                        >✕</button>
                                    </div>
                                );
                            })}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                                <button className="btn btn-secondary btn-sm flex-grow-1" onClick={() => {
                                    setEditStartTime(selectedShift.startTime);
                                    setEditEndTime(selectedShift.endTime);
                                    setIsEditingShift(true);
                                }}>Edit Shift</button>
                                <button className="btn btn-danger btn-sm" onClick={() => { setRosterShifts(rosterShifts.filter(s => s.id !== selectedShift.id)); setSelectedShift(null); }}>Delete</button>
                            </div>
                        </>
                    )}
                </div>
            )}
            {isPDFModalOpen && <RosterPDFModal isOpen={isPDFModalOpen} onClose={() => setIsPDFModalOpen(false)} currentWeekStart={currentWeekStart} teamMembers={teamMembers} shifts={rosterShifts} />}
        </div>
    );
};

export default StaffRoster;

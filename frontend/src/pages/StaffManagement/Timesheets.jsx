import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatsCard';
import Modal from '../../components/Modal';
import AddTimeEntryForm from './AddTimeEntryForm';
import axios from 'axios';
import { differenceInHours, parseISO, format } from 'date-fns';

const Timesheets = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTeamMembers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/teams');
            setTeamMembers(response.data);
        } catch (err) {
            setError('Failed to load team members.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const getTimesheetStats = (member) => {
        const timesheets = member.timesheets || [];
        if (!timesheets.length) {
            return { actualHours: 'No entries', totalPay: '$0.00', status: 'No timesheet' };
        }

        const latest = timesheets[timesheets.length - 1];
        const totalHours = timesheets.reduce((acc, sheet) => {
            if (sheet.clock_out && sheet.clock_in) {
                return acc + differenceInHours(parseISO(sheet.clock_out), parseISO(sheet.clock_in));
            }
            return acc;
        }, 0);

        const hourlyRate = member.hourly_rate || 0;

        return {
            actualHours: `${totalHours.toFixed(1)}h`,
            totalPay: `$${(totalHours * hourlyRate).toFixed(2)}`,
            status: latest.status === 'completed' ? 'Submitted' : latest.status,
        };
    };

    return (
        <>
            <header>
                <h1>Timesheet Management</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Time Entry</button>
            </header>
            <div className="grid-container">
                <StatCard title="Total Staff" value={teamMembers.length} />
                <StatCard title="Weekly Payroll" value="$1,777" />
                <StatCard title="Pending Applications" value="2" />
                <StatCard title="Pending Timesheets" value="1" />
            </div>
            <div className="card">
                <h4>Weekly Timesheets</h4>
                {loading && <p>Loading staff...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && (
                    <table className="data-table" style={{ marginTop: '15px' }}>
                        <thead><tr><th>Employee</th><th>Scheduled Hours</th><th>Actual Hours</th><th>Total Pay</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {teamMembers.map(member => {
                                const stats = getTimesheetStats(member);
                                return (
                                    <tr key={member.id}>
                                        <td><strong>{member.first_name} {member.last_name}</strong><br /><small>{member.position}</small></td>
                                        <td>40h</td>
                                        <td>{stats.actualHours}</td>
                                        <td>{stats.totalPay}</td>
                                        <td><span className={`status-tag status-${stats.status}`}>{stats.status}</span></td>
                                        <td><Link to={`/staff/timesheets/${member.id}`} className="btn-link">View Details</Link></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Time Entry">
                <AddTimeEntryForm
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        fetchTeamMembers();
                        setIsModalOpen(false);
                    }}
                    teamMembers={teamMembers}
                />
            </Modal>
        </>
    );
};

export default Timesheets;
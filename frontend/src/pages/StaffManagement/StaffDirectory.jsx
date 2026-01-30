import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Modal from '../../components/Modal';
import AddTeamMemberForm from './AddTeamMemberForm';
import WorkScheduleModal from './WorkScheduleModal'; // The Advanced Modal
import axios from 'axios';
import { toast } from 'react-hot-toast';

const StaffDirectory = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchTeamMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/teams');
            setTeamMembers(response.data);
        } catch (err) {
            setError('Failed to load team members.');
            toast.error('Failed to fetch staff data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const handleViewSchedule = (staffMember) => {
        setSelectedStaff(staffMember);
        setIsScheduleModalOpen(true);
    };

    const handleEditDetails = (staffMember) => {
        setSelectedStaff(staffMember);
        setIsEditModalOpen(true);
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/staff/register`;
        navigator.clipboard.writeText(link);
        toast.success('Registration Link Copied!');
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            const loadingToast = toast.loading('Deleting...');
            try {
                await axios.delete(`/api/teams/${id}`);
                toast.success(`${name} has been deleted.`, { id: loadingToast });
                fetchTeamMembers();
            } catch (err) {
                toast.error(`Failed to delete ${name}.`, { id: loadingToast });
            }
        }
    };

    const handleStatusToggle = async (member) => {
        const newStatus = member.status === 'active' ? 'inactive' : 'active';
        const originalMembers = [...teamMembers];

        // Optimistic UI Update
        setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));

        try {
            await axios.patch(`/api/teams/${member.id}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            setTeamMembers(originalMembers); // Revert on failure
            toast.error('Failed to update status.');
        }
    };

    // Derived Stats
    const activeStaffCount = teamMembers.filter(member => member.status === 'active').length;
    const paidMembers = teamMembers.filter(member => Number(member.hourly_rate) > 0);
    const totalRateSum = paidMembers.reduce((sum, member) => sum + Number(member.hourly_rate), 0);
    const averageHourlyRate = teamMembers.length > 0 ? (totalRateSum / teamMembers.length) : 0;

    return (
        <div className="staff-directory-page">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <h1>Staff Management</h1>
                <div style={{ display: 'flex', gap: '10px' }}>

                    <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Team Member</button>
                </div>
            </header>

            <div className="grid-container" style={{ marginBottom: '30px' }}>
                <div className="card stat-card"><div className="stat-card-title">Total Staff</div><div className="stat-card-value">{teamMembers.length}</div></div>
                <div className="card stat-card"><div className="stat-card-title">Active Staff</div><div className="stat-card-value">{activeStaffCount}</div></div>
                <div className="card stat-card"><div className="stat-card-title">Average Hourly Rate</div><div className="stat-card-value">${averageHourlyRate.toFixed(2)}</div></div>
            </div>

            <div className="card table-container">
                {loading ? <p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p> : error ? <p className="error-message" style={{ padding: '20px' }}>{error}</p> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Position & Branch</th>
                                <th>Hourly Rate</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--dark-gray)' }}>
                                        No staff members found.
                                    </td>
                                </tr>
                            ) : (
                                teamMembers.map(member => (
                                    <tr key={member.id}>
                                        <td><strong>{member.first_name} {member.last_name}</strong><br /><small>{member.email}</small></td>
                                        <td><strong>{member.position}</strong><br /><small>{member.branch}</small></td>
                                        <td><strong>${Number(member.hourly_rate || 0).toFixed(2)}/hr</strong><br /><small>{member.employment_type}</small></td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <label className="switch">
                                                    <input type="checkbox" checked={member.status === 'active'} onChange={() => handleStatusToggle(member)} />
                                                    <span className="slider round"></span>
                                                </label>
                                                <span style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{member.status}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <Link to={`/staff/${member.id}`} className="btn-link">View Detail</Link>
                                                <button onClick={() => handleViewSchedule(member)} className="btn-link">Schedule</button>
                                                <button onClick={() => handleEditDetails(member)} className="btn-link">Edit</button>
                                                <button onClick={() => handleDelete(member.id, `${member.first_name} ${member.last_name}`)} className="btn-delete">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal for Adding New Member */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} modalClass="modal-lg modal-no-header">
                <AddTeamMemberForm onClose={() => setIsAddModalOpen(false)} onSave={fetchTeamMembers} />
            </Modal>

            {/* Modal for Editing Existing Member */}
            {isEditModalOpen && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} modalClass="modal-lg modal-no-header">
                    <AddTeamMemberForm
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={fetchTeamMembers}
                        initialData={selectedStaff}
                    />
                </Modal>
            )}

            {/* The Advanced Work Schedule Manager Modal */}
            {isScheduleModalOpen && (
                <WorkScheduleModal
                    staff={selectedStaff}
                    onClose={() => setIsScheduleModalOpen(false)}
                />
            )}
        </div>
    );
};

export default StaffDirectory;

import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatsCard';
import ProgressBar from '../../components/ProgressBar';
import Stepper from '../../components/Stepper';
import axios from 'axios';

const AddTeamMemberForm = ({ onClose, onSave }) => {
    const [step, setStep] = useState(1);
    const steps = ['Personal', 'Employment', 'Schedule', 'Permissions', 'KPIs'];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone_number: '', date_of_birth: '',
        home_address: '', position: '', employment_type: 'Full-Time', hourly_rate: '',
        start_date: '', branch: '',
        schedule: {
            monday: { active: true, start: '09:00', end: '17:00' },
            tuesday: { active: true, start: '09:00', end: '17:00' },
            wednesday: { active: true, start: '09:00', end: '17:00' },
            thursday: { active: true, start: '09:00', end: '17:00' },
            friday: { active: true, start: '09:00', end: '17:00' },
            saturday: { active: false, start: '', end: '' },
            sunday: { active: false, start: '', end: '' },
        },
        permissions: [],
        kpi_sales_target: '', kpi_customer_satisfaction: '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "permissions") {
            setFormData(prev => ({ ...prev, permissions: checked ? [...prev.permissions, value] : prev.permissions.filter(p => p !== value) }));
        } else if (name.startsWith("schedule.")) {
            const [, day, field] = name.split('.');
            setFormData(prev => ({ ...prev, schedule: { ...prev.schedule, [day]: { ...prev.schedule[day], [field]: type === 'checkbox' ? checked : value } } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/teams', formData);
            alert('Team member added!');
            onSave();
            onClose();
        } catch (err) {
            let errorMessage = 'An unexpected error occurred.';
            if (err.response?.data?.errors) {
                errorMessage = Object.values(err.response.data.errors).flat().join(' \n');
            }
            setError(errorMessage);
            alert('Error: \n' + errorMessage);
        } finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stepper steps={steps} currentStep={step} />

            <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                <h4>Personal Information</h4>
                <div className="input-group">
                    <div className="form-group"><label>First Name *</label><input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Last Name *</label><input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required /></div>
                </div>
                <div className="form-group"><label>Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
            </div>

            <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                <h4>Employment Details</h4>
                <div className="input-group">
                    <div className="form-group"><label>Position *</label><input type="text" name="position" value={formData.position} onChange={handleChange} required /></div>
                    <div className="form-group"><label>Employment Type *</label><select name="employment_type" value={formData.employment_type} onChange={handleChange} required><option>Full-Time</option><option>Part-Time</option></select></div>
                </div>
                <div className="input-group">
                    <div className="form-group"><label>Hourly Rate ($)</label><input type="number" step="0.01" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} /></div>
                    <div className="form-group"><label>Start Date</label><input type="date" name="start_date" value={formData.start_date} onChange={handleChange} /></div>
                </div>
                <div className="form-group"><label>Branch / Location</label><select name="branch" value={formData.branch} onChange={handleChange}><option value="">Select Branch</option><option>Sydney CBD</option><option>Melbourne Central</option></select></div>
            </div>

            <div className={`form-step ${step === 3 ? 'active' : ''}`}>
                <h4>Work Schedule</h4>
                {Object.keys(formData.schedule).map(day => (
                    <div className="schedule-row" key={day}>
                        <div className="checkbox-item" style={{ flexBasis: '120px' }}>
                            <input type="checkbox" name={`schedule.${day}.active`} checked={formData.schedule[day].active} onChange={handleChange} id={`schedule-${day}`} />
                            <label htmlFor={`schedule-${day}`} style={{ textTransform: 'capitalize' }}>{day}</label>
                        </div>
                        <div className="input-group">
                            <div className="form-group"><label>Start Time</label><input type="time" name={`schedule.${day}.start`} value={formData.schedule[day].start} onChange={handleChange} disabled={!formData.schedule[day].active} /></div>
                            <div className="form-group"><label>End Time</label><input type="time" name={`schedule.${day}.end`} value={formData.schedule[day].end} onChange={handleChange} disabled={!formData.schedule[day].active} /></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`form-step ${step === 5 ? 'active' : ''}`}>
                <h4>Key Performance Indicators (KPIs)</h4>
                <div className="form-group"><label>Monthly Sales Target ($)</label><input type="number" name="kpi_sales_target" value={formData.kpi_sales_target} onChange={handleChange} /></div>
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                {step > 1 && <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Previous</button>}
                {step < steps.length && <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>}
                {step === steps.length && <button type="submit" className="btn btn-blue" disabled={loading}>{loading ? 'Saving...' : 'Add Member'}</button>}
            </div>
            {error && <p className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>}
        </form>
    );
};

const StaffDirectory = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTeamMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/teams');
            setTeamMembers(response.data);
        } catch (err) {
            setError('Failed to load team members.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeamMembers(); }, []);

    return (
        <>
            <header>
                <h1>Staff Management</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Team Member</button>
            </header>
            <div className="grid-container">
                <StatCard title="Total Staff" value={teamMembers.length} />
                <StatCard title="Weekly Payroll" value="$2,601.75" />
                <StatCard title="Active Staff" value={teamMembers.length} />
                <StatCard title="Avg KPI Score" value="85%" />
            </div>
            <div className="card">
                {loading && <p>Loading...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && !error && (
                    <table className="data-table">
                        <thead><tr><th>Staff Member</th><th>Position & Branch</th><th>Employment</th><th>Actions</th></tr></thead>
                        <tbody>
                            {teamMembers.map(member => (
                                <tr key={member.id}>
                                    <td>
                                        <div className="staff-member-cell">
                                            <img src={`https://i.pravatar.cc/40?u=${member.email}`} alt="avatar" className="staff-avatar" />
                                            <div><strong>{member.first_name} {member.last_name}</strong><br /><small>{member.email}</small></div>
                                        </div>
                                    </td>
                                    <td>{member.position}<br /><small>{member.branch || 'N/A'}</small></td>
                                    <td>${Number(member.hourly_rate || 0).toFixed(2)}/hr<br /><small>{member.employment_type}</small></td>
                                    <td><a href="#!" className="btn-link">View Details</a></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Team Member">
                <AddTeamMemberForm onClose={() => setIsModalOpen(false)} onSave={fetchTeamMembers} />
            </Modal>
        </>
    );
};
export default StaffDirectory;
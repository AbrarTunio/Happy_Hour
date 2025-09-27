// --- START OF FILE pages/StaffManagement/AddTimeEntryForm.jsx ---

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddTimeEntryForm = ({ onClose, onSave, teamMembers }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        clock_in: '',
        clock_out: '',
        notes: ''
    });
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Find the full employee object when the selection changes
        const employee = teamMembers.find(member => member.id == formData.employee_id);
        setSelectedEmployee(employee || null);
    }, [formData.employee_id, teamMembers]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/timesheets', formData);
            alert('Time entry added successfully!');
            onSave();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to add time entry.';
            setError(errorMessage);
            alert('Error: ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total scheduled hours
    const totalScheduledHours = selectedEmployee?.schedule ?
        Object.values(selectedEmployee.schedule).reduce((total, day) => {
            if (day.active && day.start && day.end) {
                const start = new Date(`1970-01-01T${day.start}`);
                const end = new Date(`1970-01-01T${day.end}`);
                return total + (end - start) / (1000 * 60 * 60);
            }
            return total;
        }, 0) : 0;


    return (
        <form onSubmit={handleSubmit}>
            <p>Record work hours for team members</p>

            <div className="form-group">
                <label>Employee *</label>
                <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                    <option value="">Select Employee</option>
                    {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                            {member.first_name} {member.last_name} - {member.position}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Date *</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>

            <div className="input-group">
                <div className="form-group">
                    <label>Clock In *</label>
                    <input type="time" name="clock_in" value={formData.clock_in} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Clock Out *</label>
                    <input type="time" name="clock_out" value={formData.clock_out} onChange={handleChange} required />
                </div>
            </div>

            <div className="form-group">
                <label>Notes (optional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any additional notes about this shift..."></textarea>
            </div>

            {/* Display schedule if an employee is selected */}
            {selectedEmployee && selectedEmployee.schedule && (
                <div className="schedule-summary-box">
                    <h4>{selectedEmployee.first_name}'s Schedule</h4>
                    <ul>
                        {Object.entries(selectedEmployee.schedule).map(([day, details]) => details.active && (
                            <li key={day}>
                                <span>{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                                <span>{details.start} - {details.end}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="total-hours">
                        <strong>Total Scheduled: {totalScheduledHours.toFixed(2)}h</strong>
                    </div>
                </div>
            )}


            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Time Entry'}
                </button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </form>
    );
};

export default AddTimeEntryForm;
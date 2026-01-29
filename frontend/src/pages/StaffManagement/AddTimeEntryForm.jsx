import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AddTimeEntryForm = ({ onClose, onSave, teamMembers }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
        clock_in: '',
        clock_out: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Get current local time for intelligent defaults
    useEffect(() => {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

        // Set intelligent defaults only if clock_in is empty
        if (!formData.clock_in) {
            setFormData(prev => ({
                ...prev,
                clock_in: currentTime,
                // Default clock out to 1 hour later
                clock_out: new Date(now.getTime() + 60 * 60 * 1000).toTimeString().slice(0, 5)
            }));
        }
    }, [formData.clock_in]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Validate required fields
        if (!formData.employee_id) {
            setErrors({ employee_id: ['Please select an employee'] });
            setLoading(false);
            return;
        }

        // Validate times
        if (formData.clock_in && formData.clock_out) {
            const [inHours, inMinutes] = formData.clock_in.split(':').map(Number);
            const [outHours, outMinutes] = formData.clock_out.split(':').map(Number);

            // Check for invalid time (clock out before clock in)
            if (outHours < inHours || (outHours === inHours && outMinutes < inMinutes)) {
                setErrors({
                    clock_out: ['Clock out time must be after clock in time']
                });
                setLoading(false);
                return;
            }
        }

        const loadingToast = toast.loading('Saving time entry...');

        // Get user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const dataToSubmit = {
            employee_id: formData.employee_id,
            date: formData.date,
            clock_in: formData.clock_in,
            clock_out: formData.clock_out,
            notes: formData.notes.trim() || 'Manual entry'
        };

        try {
            // Send with timezone header
            await axios.post('/api/timesheets', dataToSubmit, {
                headers: {
                    'Timezone': userTimezone
                }
            });
            toast.success('Time entry added successfully!', { id: loadingToast });
            onSave();
            onClose();
        } catch (err) {
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors);
                toast.error('Please correct the errors in the form.', { id: loadingToast });
            } else {
                toast.error('An unexpected error occurred.', { id: loadingToast });
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label htmlFor="employee_id">Employee</label>
                <select
                    id="employee_id"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    required
                    className={errors.employee_id ? 'error' : ''}
                >
                    <option value="" disabled>Select an employee</option>
                    {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                        </option>
                    ))}
                </select>
                {errors.employee_id && <p className="error-text">{errors.employee_id[0]}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className={errors.date ? 'error' : ''}
                />
                {errors.date && <p className="error-text">{errors.date[0]}</p>}
            </div>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                    <label htmlFor="clock_in">Clock In Time</label>
                    <input
                        type="time"
                        id="clock_in"
                        name="clock_in"
                        value={formData.clock_in}
                        onChange={handleChange}
                        required
                        className={errors.clock_in ? 'error' : ''}
                    />
                    {errors.clock_in && <p className="error-text">{errors.clock_in[0]}</p>}
                </div>
                <div className="form-group">
                    <label htmlFor="clock_out">Clock Out Time</label>
                    <input
                        type="time"
                        id="clock_out"
                        name="clock_out"
                        value={formData.clock_out}
                        onChange={handleChange}
                        required
                        className={errors.clock_out ? 'error' : ''}
                    />
                    {errors.clock_out && <p className="error-text">{errors.clock_out[0]}</p>}
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="Add any notes about this time entry..."
                ></textarea>
                {errors.notes && <p className="error-text">{errors.notes[0]}</p>}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Entry'}
                </button>
            </div>
        </form>
    );
};

export default AddTimeEntryForm;

import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { differenceInMinutes } from 'date-fns';
import { toast } from 'react-hot-toast';

// --- Country Codes ---
const countryCodes = [
    { name: "Australia", dial_code: "+61", code: "AU" },
    { name: "United States", dial_code: "+1", code: "US" },
    { name: "United Kingdom", dial_code: "+44", code: "GB" },
    { name: "New Zealand", dial_code: "+64", code: "NZ" },
].sort((a, b) => a.name.localeCompare(b.name));

const Stepper = ({ steps, currentStep }) => (
    <div className="stepper-pills">
        {steps.map((step, index) => (
            <div key={index} className={`step-item ${index + 1 <= currentStep ? 'active' : ''}`}>
                <span>{step}</span>
            </div>
        ))}
    </div>
);

const AddTeamMemberForm = ({ onClose, onSave, initialData = null }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const steps = ['Personal', 'Employment', 'Schedule'];

    const initialSchedule = {
        monday: { active: false, start: '09:00', end: '17:00' },
        tuesday: { active: false, start: '09:00', end: '17:00' },
        wednesday: { active: false, start: '09:00', end: '17:00' },
        thursday: { active: false, start: '09:00', end: '17:00' },
        friday: { active: false, start: '09:00', end: '17:00' },
        saturday: { active: false, start: '10:00', end: '16:00' },
        sunday: { active: false, start: '10:00', end: '16:00' },
    };

    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', date_of_birth: '',
        phone_country_code: '+61', phone_number: '',
        emergency_contact_name: '', emergency_phone_country_code: '+61', emergency_contact_phone: '',

        tax_file_number: '', home_address: '',
        position: '', branch: '', department: '', employment_type: 'Full-Time',
        hourly_rate: '', start_date: '', staff_code: '',
        schedule: initialSchedule,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            // Split phone numbers if they exist
            const splitPhone = (fullNumber) => {
                if (!fullNumber) return { code: '+61', num: '' };
                const match = countryCodes.find(c => fullNumber.startsWith(c.dial_code));
                return match
                    ? { code: match.dial_code, num: fullNumber.replace(match.dial_code, '').trim() }
                    : { code: '+61', num: fullNumber };
            };

            const phoneData = splitPhone(initialData.phone_number);
            const emergencyPhoneData = splitPhone(initialData.emergency_contact_phone);

            setFormData(prevData => ({
                ...prevData,
                ...initialData,
                phone_country_code: phoneData.code,
                phone_number: phoneData.num,
                emergency_phone_country_code: emergencyPhoneData.code,
                emergency_contact_phone: emergencyPhoneData.num,

                tax_file_number: initialData.tax_file_number || '',
                schedule: initialData.schedule || initialSchedule,
                date_of_birth: initialData.date_of_birth ? initialData.date_of_birth.split('T')[0] : '',
                start_date: initialData.start_date ? initialData.start_date.split('T')[0] : '',
            }));
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleScheduleChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            schedule: { ...prev.schedule, [day]: { ...prev.schedule[day], [field]: value } }
        }));
    };

    const toggleDayActive = (day) => {
        const currentState = formData.schedule[day].active;
        handleScheduleChange(day, 'active', !currentState);
    };

    const applyScheduleTemplate = (type) => {
        let newSchedule = JSON.parse(JSON.stringify(initialSchedule));
        if (type === 'full-time') {
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
                newSchedule[day].active = true;
                newSchedule[day].start = '09:00';
                newSchedule[day].end = '17:00';
            });
        } else if (type === 'weekends') {
            ['saturday', 'sunday'].forEach(day => {
                newSchedule[day].active = true;
                newSchedule[day].start = '10:00';
                newSchedule[day].end = '16:00';
            });
        }
        setFormData(prev => ({ ...prev, schedule: newSchedule }));
        toast.success(`Applied template`);
    };

    const calculateHours = (start, end) => {
        if (!start || !end) return 0;
        try {
            const startTime = new Date(`1970-01-01T${start}:00`);
            const endTime = new Date(`1970-01-01T${end}:00`);
            const diff = differenceInMinutes(endTime, startTime);
            return diff > 0 ? diff / 60 : 0;
        } catch (e) { return 0; }
    };

    const weeklySummary = useMemo(() => {
        const totalHours = Object.values(formData.schedule).reduce((acc, day) => {
            if (day.active) {
                const hours = calculateHours(day.start, day.end);
                return acc + (hours > 0 ? hours : 0);
            }
            return acc;
        }, 0);
        const estimatedPay = totalHours * (parseFloat(formData.hourly_rate) || 0);
        return { totalHours, estimatedPay };
    }, [formData.schedule, formData.hourly_rate]);

    const validateStep = (step) => {
        const newErrors = {};
        let isValid = true;

        if (step === 1) {
            if (!formData.first_name.trim()) newErrors.first_name = "Required";
            if (!formData.last_name.trim()) newErrors.last_name = "Required";
            if (!formData.email.trim()) newErrors.email = "Required";
            if (!formData.phone_number.trim()) newErrors.phone_number = "Required";
            if (!formData.staff_code.trim()) newErrors.staff_code = "Required";
        }

        if (step === 2) {
            if (!formData.position) newErrors.position = "Required";
            if (!formData.branch) newErrors.branch = "Required";
            if (!formData.department) newErrors.department = "Required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            isValid = false;
            toast.error("Please fill in required fields.");
        }

        return isValid;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep(currentStep)) return;

        setLoading(true);
        setErrors({});

        const loadingToast = toast.loading('Saving team member...');

        // Combine Phone Numbers
        const payload = {
            ...formData,
            phone_number: `${formData.phone_country_code} ${formData.phone_number}`,
            emergency_contact_phone: `${formData.emergency_phone_country_code} ${formData.emergency_contact_phone}`
        };
        // Cleanup temp fields
        delete payload.phone_country_code;
        delete payload.emergency_phone_country_code;

        try {
            if (initialData && initialData.id) {
                await axios.put(`/api/teams/${initialData.id}`, payload);
                toast.success('Team member updated!', { id: loadingToast });
            } else {
                await axios.post('/api/teams', payload);
                toast.success('Team member added!', { id: loadingToast });
            }
            onSave();
            onClose();
        } catch (err) {
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors);
                toast.error('Validation error.', { id: loadingToast });
            } else {
                toast.error('Error occurred.', { id: loadingToast });
            }
        } finally {
            setLoading(false);
        }
    };
    const handleCopyLink = () => {
        const formLink = `${window.location.origin}/staff/register`;
        navigator.clipboard.writeText(formLink);
        toast.success('Form link copied to clipboard!');
    };

    return (
        <form onSubmit={handleSubmit} className="add-member-form">
            <div className="add-member-header">
                <h3>{initialData ? 'Edit Team Member' : 'Add New Team Member'}</h3>
                <span>Step {currentStep} of {steps.length} - {steps[currentStep - 1]}</span>
            </div>

            {currentStep === 1 && !initialData && (
                <div className="send-form-banner">
                    <p>Send as Link Instead? Package this form and send it to the applicant.</p>
                    <button type="button" className="btn btn-secondary" onClick={handleCopyLink}>📋 Copy Form Link</button>
                </div>
            )}

            <Stepper steps={steps} currentStep={currentStep} />

            <div className="form-body">
                {currentStep === 1 && (
                    <div className="form-step active">
                        <h4>Personal Information</h4>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className={errors.first_name ? 'error-input' : ''} />
                            </div>
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className={errors.last_name ? 'error-input' : ''} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email Address *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? 'error-input' : ''} />
                        </div>

                        <div className="form-group">
                            <label>Phone Number *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                                <select name="phone_country_code" value={formData.phone_country_code} onChange={handleChange}>
                                    {countryCodes.map(c => <option key={c.code} value={c.dial_code}>{c.name} ({c.dial_code})</option>)}
                                </select>
                                <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className={errors.phone_number ? 'error-input' : ''} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Date of Birth</label>
                            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Staff Code (Login) *</label>
                            <input type="password" name="staff_code" value={formData.staff_code} onChange={handleChange} placeholder="4-digit code" autoComplete="new-password" className={errors.staff_code ? 'error-input' : ''} />
                        </div>
                        <div className="form-group">
                            <label>Tax File Number</label>
                            <input type="text" name="tax_file_number" value={formData.tax_file_number} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Home Address</label>
                            <textarea name="home_address" value={formData.home_address} onChange={handleChange} rows="2"></textarea>
                        </div>

                        <div className="form-group">
                            <label>Emergency Contact Name</label>
                            <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Emergency Contact Phone</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                                <select name="emergency_phone_country_code" value={formData.emergency_phone_country_code} onChange={handleChange}>
                                    {countryCodes.map(c => <option key={c.code} value={c.dial_code}>{c.name} ({c.dial_code})</option>)}
                                </select>
                                <input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STEP 2 & 3 Remain exactly as they were in previous version --- */}
                {currentStep === 2 && (
                    <div className="form-step active">
                        {/* ... Employment Fields ... */}
                        <h4>Employment Details</h4>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Position *</label>
                                <select name="position" value={formData.position} onChange={handleChange} className={errors.position ? 'error-input' : ''}>
                                    <option value="">Select position</option>
                                    <option>Manager</option>
                                    <option>Barista</option>
                                    <option>Chef</option>
                                    <option>Waiter</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Branch *</label>
                                <select name="branch" value={formData.branch} onChange={handleChange} className={errors.branch ? 'error-input' : ''}>
                                    <option value="">Select branch</option>
                                    <option>Sydney CBD</option>
                                    <option>Melbourne Central</option>
                                </select>
                            </div>
                        </div>
                        {/* ... Rest of employment fields ... */}
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Department *</label>
                                <select name="department" value={formData.department} onChange={handleChange} className={errors.department ? 'error-input' : ''}>
                                    <option value="">Select department</option>
                                    <option>Front of House</option>
                                    <option>Back of House</option>
                                    <option>Management</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Employment Type</label>
                                <select name="employment_type" value={formData.employment_type} onChange={handleChange}>
                                    <option>Full-Time</option>
                                    <option>Part-Time</option>
                                    <option>Casual</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Hourly Rate (AUD) *</label>
                                <input type="number" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} step="0.01" className={errors.hourly_rate ? 'error-input' : ''} />
                            </div>
                            <div className="form-group">
                                <label>Start Date</label>
                                <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="form-step active">
                        {/* ... Schedule Logic (Same as before) ... */}
                        <h4>Work Schedule</h4>
                        <div className="schedule-builder">
                            {Object.keys(formData.schedule).map(day => (
                                <div
                                    key={day}
                                    className={`schedule-row ${formData.schedule[day].active ? 'row-active' : ''}`}
                                    onClick={() => toggleDayActive(day)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input type="checkbox" checked={formData.schedule[day].active} onChange={() => { }} style={{ pointerEvents: 'none' }} />
                                    <label style={{ cursor: 'pointer', minWidth: '80px' }}>{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                                    <div className="time-inputs" onClick={(e) => e.stopPropagation()}>
                                        <input type="time" value={formData.schedule[day].start} onChange={e => handleScheduleChange(day, 'start', e.target.value)} disabled={!formData.schedule[day].active} />
                                        <span style={{ margin: '0 10px' }}>to</span>
                                        <input type="time" value={formData.schedule[day].end} onChange={e => handleScheduleChange(day, 'end', e.target.value)} disabled={!formData.schedule[day].active} />
                                    </div>
                                    <span className="hours-display">({calculateHours(formData.schedule[day].start, formData.schedule[day].end).toFixed(1)}h)</span>
                                </div>
                            ))}
                        </div>

                        <div className="info-box green">
                            <h4>Schedule Summary</h4>
                            <p><span>Total weekly hours:</span> <strong>{weeklySummary.totalHours.toFixed(2)} hours</strong></p>
                            <p><span>Estimated weekly pay:</span> <strong>${weeklySummary.estimatedPay.toFixed(2)}</strong></p>
                        </div>

                        <div className="info-box yellow">
                            <h4>⚡️ Quick Schedule Templates</h4>
                            <div className="template-buttons">
                                <button type="button" onClick={() => applyScheduleTemplate('full-time')}>Full-time (M-F)</button>
                                <button type="button" onClick={() => applyScheduleTemplate('weekends')}>Part-time (Weekends)</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {currentStep > 1 && <button type="button" className="btn btn-secondary" onClick={handlePrevious}>← Previous</button>}
                    {currentStep < 3 && <button type="button" className="btn btn-primary" onClick={handleNext}>Next →</button>}
                    {currentStep === 3 && <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Member'}</button>}
                </div>
            </div>
        </form>
    );
};

export default AddTeamMemberForm;

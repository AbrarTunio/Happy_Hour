import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { differenceInMinutes } from 'date-fns';

// --- Country Codes List ---
const countryCodes = [
    { name: "Australia", dial_code: "+61", code: "AU" },
    { name: "United States", dial_code: "+1", code: "US" },
    { name: "United Kingdom", dial_code: "+44", code: "GB" },
    { name: "New Zealand", dial_code: "+64", code: "NZ" },
    { name: "Singapore", dial_code: "+65", code: "SG" },
    { name: "Canada", dial_code: "+1", code: "CA" },
    { name: "India", dial_code: "+91", code: "IN" },
    { name: "Germany", dial_code: "+49", code: "DE" },
    { name: "France", dial_code: "+33", code: "FR" },
    { name: "South Africa", dial_code: "+27", code: "ZA" },
    { name: "South Korea", dial_code: "+82", code: "KR" },
    { name: "Japan", dial_code: "+81", code: "JP" },
    { name: "Italy", dial_code: "+39", code: "IT" },
    { name: "Brazil", dial_code: "+55", code: "BR" },
    { name: "Mexico", dial_code: "+52", code: "MX" },
    { name: "Russia", dial_code: "+7", code: "RU" },
    { name: "United Arab Emirates", dial_code: "+971", code: "AE" },
    { name: "Turkey", dial_code: "+90", code: "TR" },
    { name: "Saudi Arabia", dial_code: "+966", code: "SA" },
    { name: "Qatar", dial_code: "+974", code: "QA" },
    { name: "Lebanon", dial_code: "+961", code: "LB" },
    { name: "Syria", dial_code: "+963", code: "SY" },
    { name: "Kuwait", dial_code: "+965", code: "KW" },
    { name: "Oman", dial_code: "+968", code: "OM" },
    { name: "Yemen", dial_code: "+967", code: "YE" },
    { name: "Iraq", dial_code: "+964", code: "IQ" },
    { name: "Bahrain", dial_code: "+973", code: "BH" },
    { name: "Pakistan", dial_code: "+92", code: "PK" },
].sort((a, b) => a.name.localeCompare(b.name));

const RegisterStaff = () => {
    const navigate = useNavigate();

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
        // Personal
        first_name: '',
        last_name: '',
        email: '',
        date_of_birth: '',
        home_address: '',
        tax_file_number: '',

        // Phone Fields
        phone_country_code: '+61',
        phone_number: '',

        // Emergency Contact Phone
        emergency_contact_name: '',
        emergency_phone_country_code: '+61',
        emergency_contact_phone: '',

        // Employment
        start_date: '',

        // Hourly Rate
        hourly_rate: '',

        // Schedule
        schedule: initialSchedule,
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    // const [generatedStaffCode, setGeneratedStaffCode] = useState('');

    // Calculate minimum date for date of birth (16 years ago from today)
    const getMinDateOfBirth = () => {
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
        return minDate.toISOString().split('T')[0];
    };

    // Get today's date for start date validation
    const getTodayDate = () => {
        return new Date().toISOString().split('T')[0];
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Phone number validation - only allow digits
        if (name === 'phone_number' || name === 'emergency_contact_phone') {
            const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits
            if (digitsOnly.length <= 10) { // Maximum 10 digits
                setFormData(prev => ({ ...prev, [name]: digitsOnly }));
            }
        }
        // Home address character limit
        else if (name === 'home_address') {
            if (value.length <= 100) {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
        // Date of birth validation
        else if (name === 'date_of_birth') {
            const selectedDate = new Date(value);
            const today = new Date();
            const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

            if (selectedDate > today) {
                setErrors(prev => ({ ...prev, [name]: 'Date of birth cannot be in the future' }));
                return;
            } else if (selectedDate > minDate) {
                setErrors(prev => ({ ...prev, [name]: 'You must be at least 16 years old' }));
                return;
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
        // Start date validation
        else if (name === 'start_date') {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                setErrors(prev => ({ ...prev, [name]: 'Start date cannot be in the past' }));
                return;
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    // --- SCHEDULE LOGIC ---
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

    const calculateHours = (start, end) => {
        if (!start || !end) return 0;
        try {
            const startTime = new Date(`1970-01-01T${start}:00`);
            const endTime = new Date(`1970-01-01T${end}:00`);
            const diff = differenceInMinutes(endTime, startTime);
            return diff > 0 ? diff / 60 : 0;
        } catch (e) { return 0; }
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
        toast.success(`Applied ${type === 'full-time' ? 'Full-Time' : 'Weekend'} template`);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Validate phone number length
        if (formData.phone_number.length < 9 || formData.phone_number.length > 10) {
            setErrors({ phone_number: ['Phone number must be 9-10 digits'] });
            toast.error('Phone number must be 9-10 digits');
            setLoading(false);
            return;
        }

        // Validate emergency phone number length
        if (formData.emergency_contact_phone.length < 9 || formData.emergency_contact_phone.length > 10) {
            setErrors({ emergency_contact_phone: ['Emergency phone must be 9-10 digits'] });
            toast.error('Emergency phone must be 9-10 digits');
            setLoading(false);
            return;
        }

        // Combine Phone Numbers & Handle Rate
        const payload = {
            ...formData,
            phone_number: `${formData.phone_country_code} ${formData.phone_number}`,
            emergency_contact_phone: `${formData.emergency_phone_country_code} ${formData.emergency_contact_phone}`,
            hourly_rate: formData.hourly_rate || 0,
        };

        try {
            const response = await axios.post('/api/staff/register', payload);
            toast.success('Registration Successful!');
            // setGeneratedStaffCode(response.data.staff_code); // Store the generated staff code
            setSuccess(true);
        } catch (err) {
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors);
                toast.error('Please fix the errors.');
            } else {
                toast.error('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="time-clock-page-centered">
                <div className="time-clock-login-card" style={{ maxWidth: '500px', textAlign: 'center' }}>
                    <div style={{ padding: '30px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '8px' }}>
                        <h3>✅ Registration Submitted!</h3>
                        <p>Your details have been sent to management for approval.</p>

                        <p style={{ marginTop: '20px', fontSize: '1rem', color: '#065f46' }}>
                            Kindly wait for your account to be activated. You will be notified once approved.
                        </p>

                        <button
                            onClick={() => navigate('/staff/time-clock')}
                            className="btn-block"
                            style={{ marginTop: '30px' }}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="time-clock-page-centered">
            <div className="time-clock-login-card" style={{ maxWidth: '800px', textAlign: 'left' }}>
                <h2 style={{ textAlign: 'center' }}>Staff Registration</h2>
                <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
                    Fill out your details to create an account.
                </p>

                <form onSubmit={handleSubmit}>
                    <h4>Personal Information</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                            {errors.first_name && <small className="error-text">{errors.first_name[0]}</small>}
                        </div>
                        <div className="form-group">
                            <label>Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                            />
                            {errors.last_name && <small className="error-text">{errors.last_name[0]}</small>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && <small className="error-text">{errors.email[0]}</small>}
                    </div>

                    {/* Phone Number with Country Code */}
                    <div className="form-group">
                        <label>Phone Number * (9-10 digits)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                            <select
                                name="phone_country_code"
                                value={formData.phone_country_code}
                                onChange={handleChange}
                            >
                                {countryCodes.map(c => (
                                    <option key={c.code} value={c.dial_code}>
                                        {c.name} ({c.dial_code})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                required
                                placeholder="412345678"
                                maxLength="10"
                            />
                        </div>
                        {errors.phone_number && <small className="error-text">{errors.phone_number[0]}</small>}
                        <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                            Enter 9-10 digits only (no spaces or special characters)
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Date of Birth * (Must be 16 years or older)</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            required
                            max={getMinDateOfBirth()}
                        />
                        {errors.date_of_birth && <small className="error-text">{errors.date_of_birth}</small>}
                    </div>

                    <div className="form-group">
                        <label>Tax File Number (TFN)</label>
                        <input
                            type="text"
                            name="tax_file_number"
                            value={formData.tax_file_number}
                            onChange={handleChange}
                            placeholder="e.g. 123 456 789"
                        />
                        {errors.tax_file_number && <small className="error-text">{errors.tax_file_number[0]}</small>}
                    </div>

                    <div className="form-group">
                        <label>Home Address * (Max 100 characters)</label>
                        <textarea
                            name="home_address"
                            value={formData.home_address}
                            onChange={handleChange}
                            rows="2"
                            required
                            maxLength="100"
                        ></textarea>
                        <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                            {formData.home_address.length}/100 characters
                        </small>
                        {errors.home_address && <small className="error-text">{errors.home_address[0]}</small>}
                    </div>

                    {/* Emergency Contact */}
                    <div className="form-group">
                        <label>Emergency Contact Name *</label>
                        <input
                            type="text"
                            name="emergency_contact_name"
                            value={formData.emergency_contact_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Emergency Contact Phone * (9-10 digits)</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                            <select
                                name="emergency_phone_country_code"
                                value={formData.emergency_phone_country_code}
                                onChange={handleChange}
                            >
                                {countryCodes.map(c => (
                                    <option key={c.code} value={c.dial_code}>
                                        {c.name} ({c.dial_code})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="emergency_contact_phone"
                                value={formData.emergency_contact_phone}
                                onChange={handleChange}
                                required
                                placeholder="412345678"
                                maxLength="10"
                            />
                        </div>
                        {errors.emergency_contact_phone && <small className="error-text">{errors.emergency_contact_phone[0]}</small>}
                        <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                            Enter 9-10 digits only (no spaces or special characters)
                        </small>
                    </div>

                    <hr style={{ margin: '30px 0' }} />
                    <h4>Employment Details</h4>

                    <div className="form-group">
                        <label>Requested Hourly Rate ($)</label>
                        <input
                            type="number"
                            name="hourly_rate"
                            value={formData.hourly_rate}
                            onChange={handleChange}
                            step="0.01"
                            placeholder="0.00 (Optional)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Anticipated Start Date * (Today or future)</label>
                        <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                            min={getTodayDate()}
                        />
                        {errors.start_date && <small className="error-text">{errors.start_date}</small>}
                    </div>

                    <hr style={{ margin: '30px 0' }} />

                    {/* --- WORK SCHEDULE SECTION --- */}
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h4 style={{ margin: 0 }}>Availability / Schedule</h4>
                            <div className="template-buttons" style={{ margin: 0 }}>
                                <button
                                    type="button"
                                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                    onClick={() => applyScheduleTemplate('full-time')}
                                >
                                    Full-time (M-F)
                                </button>
                                <button
                                    type="button"
                                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                                    onClick={() => applyScheduleTemplate('weekends')}
                                >
                                    Weekends
                                </button>
                            </div>
                        </div>

                        <div className="schedule-builder">
                            {Object.keys(formData.schedule).map(day => (
                                <div
                                    key={day}
                                    className={`schedule-row ${formData.schedule[day].active ? 'row-active' : ''}`}
                                    onClick={() => toggleDayActive(day)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.schedule[day].active}
                                        onChange={() => { }}
                                        style={{ pointerEvents: 'none' }}
                                    />

                                    <label style={{ cursor: 'pointer', minWidth: '80px' }}>
                                        {day.charAt(0).toUpperCase() + day.slice(1)}
                                    </label>

                                    <div className="time-inputs" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="time"
                                            value={formData.schedule[day].start}
                                            onChange={e => handleScheduleChange(day, 'start', e.target.value)}
                                            disabled={!formData.schedule[day].active}
                                        />
                                        <span style={{ margin: '0 10px' }}>to</span>
                                        <input
                                            type="time"
                                            value={formData.schedule[day].end}
                                            onChange={e => handleScheduleChange(day, 'end', e.target.value)}
                                            disabled={!formData.schedule[day].active}
                                        />
                                    </div>

                                    <span className="hours-display">
                                        ({calculateHours(formData.schedule[day].start, formData.schedule[day].end).toFixed(1)}h)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-block"
                        disabled={loading}
                        style={{ marginTop: '20px' }}
                    >
                        {loading ? 'Submitting...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link to="/staff/time-clock" className="btn-link">
                        Already have an account? Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterStaff;

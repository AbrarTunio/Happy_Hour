import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../../components/StatsCard';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

const StaffDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStaffDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/teams/${id}`);
                setStaff(response.data);
            } catch (err) {
                toast.error('Failed to load staff member details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStaffDetails();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete ${staff.first_name} ${staff.last_name}?`)) {
            const loadingToast = toast.loading('Deleting member...');
            try {
                await axios.delete(`/api/teams/${id}`);
                toast.success('Staff member deleted successfully.', { id: loadingToast });
                navigate('/staff');
            } catch (err) {
                toast.error('Failed to delete member.', { id: loadingToast });
                console.error(err);
            }
        }
    };

    if (loading) return <div className="main-content-area"><p>Loading staff details...</p></div>;
    if (!staff) return <div className="main-content-area"><p>No staff member data found.</p></div>;

    const scheduleKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return (
        <div className="staff-detail-container">
            <header className="page-header">
                <div>
                    <Link to="/staff" className="btn-link" style={{ marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Staff Directory</Link>
                    <h1>{staff.first_name} {staff.last_name}</h1>
                </div>
                <button onClick={handleDelete} className="btn btn-danger">Delete Member</button>
            </header>

            {/* Top Overview Stats */}
            <div className="grid-container" style={{ marginBottom: '25px' }}>
                <StatCard title="Position" value={staff.position} />
                <StatCard title="Branch" value={staff.branch} />
                <StatCard title="Hourly Rate" value={`$${Number(staff.hourly_rate || 0).toFixed(2)}`} />
                <StatCard
                    title="Current Status"
                    value={staff.status}
                    type={staff.status === 'active' ? 'decrease' : 'increase'}
                />
            </div>

            {/* Detailed Information Sections */}
            <div className="detail-sections-grid">

                {/* Personal Information */}
                <div className="card info-section">
                    <h3>Personal Information</h3>
                    <div className="info-grid">
                        <div className="info-item"><label>Full Name</label><span>{staff.first_name} {staff.last_name}</span></div>
                        <div className="info-item"><label>Email Address</label><span>{staff.email}</span></div>
                        <div className="info-item"><label>Phone Number</label><span>{staff.phone_number || 'N/A'}</span></div>
                        <div className="info-item">
                            <label>Date of Birth</label>
                            <span>{staff.date_of_birth ? format(parseISO(staff.date_of_birth), 'dd MMMM yyyy') : 'N/A'}</span>
                        </div>
                        <div className="info-item full-width"><label>Home Address</label><span>{staff.home_address || 'N/A'}</span></div>
                    </div>
                </div>

                {/* Employment Information */}
                <div className="card info-section">
                    <h3>Employment Details</h3>
                    <div className="info-grid">
                        <div className="info-item"><label>Department</label><span>{staff.department}</span></div>
                        <div className="info-item"><label>Employment Type</label><span>{staff.employment_type}</span></div>
                        <div className="info-item">
                            <label>Start Date</label>
                            <span>{staff.start_date ? format(parseISO(staff.start_date), 'dd MMMM yyyy') : 'N/A'}</span>
                        </div>
                        <div className="info-item"><label>Login Code</label><span>{staff.staff_code}</span></div>
                        <div className="info-item"><label>Tax File Number (TFN)</label><span>{staff.tax_file_number || 'N/A'}</span></div>
                    </div>
                </div>

            </div>

            {/* Work Schedule Section */}
            <div className="card info-section">
                <h3>Regular Work Schedule</h3>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Status</th>
                                <th>Working Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scheduleKeys.map((day) => {
                                const dayData = staff.schedule?.[day];
                                return (
                                    <tr key={day}>
                                        <td style={{ textTransform: 'capitalize', fontWeight: '600' }}>{day}</td>
                                        <td>
                                            <span className={`status-tag ${dayData?.active ? 'status-active' : 'status-uploaded'}`}>
                                                {dayData?.active ? 'Working' : 'Off'}
                                            </span>
                                        </td>
                                        <td>{dayData?.active ? `${dayData.start} - ${dayData.end}` : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffDetail;

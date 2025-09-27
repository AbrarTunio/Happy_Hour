// --- START OF FILE pages/SupplierManagement.jsx ---

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import Stepper from '../components/Stepper';
import axios from 'axios';

// ... (AddSupplierForm component remains exactly the same)
const AddSupplierForm = ({ onClose, onSupplierAdded }) => {
    const [step, setStep] = useState(1);
    const steps = ['ABN Lookup', 'Basic Info', 'Address', 'Business Details'];

    const [formData, setFormData] = useState({
        abn: '',
        company_name: '',
        primary_contact_person: '',
        email_address: '',
        phone_number: '',
        street_address: '',
        city: '',
        state: '',
        postcode: '',
        entity_type: '',
        entity_status: '',
        product_categories: [],
    });

    const [lookupResult, setLookupResult] = useState(null);
    const [lookupError, setLookupError] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === "product_categories") {
            setFormData(prev => ({
                ...prev,
                product_categories: checked
                    ? [...prev.product_categories, value]
                    : prev.product_categories.filter(c => c !== value),
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLookup = async () => {
        setLookupLoading(true);
        setLookupError('');
        setLookupResult(null);
        try {
            const response = await axios.post('/api/suppliers/abn-lookup', { abn: formData.abn });
            setLookupResult(response.data);
        } catch (err) {
            setLookupError(err.response?.data?.message || 'An unexpected error occurred.');
        } finally {
            setLookupLoading(false);
        }
    };

    const parseAddress = (fullAddress = '') => {
        const [street_address = '', ...rest] = fullAddress.split(', ');
        const addressRest = rest.join(', ');
        const parts = addressRest.split(' ');
        const postcode = parts.pop() || '';
        const state = parts.pop() || '';
        const city = parts.join(' ') || '';
        return { street_address, city, state, postcode };
    };

    const handleQuickAdd = async () => {
        if (!lookupResult) return;
        const addressParts = parseAddress(lookupResult.address);
        const newSupplierData = {
            ...formData,
            company_name: lookupResult.business_name,
            entity_type: lookupResult.entity_type,
            entity_status: lookupResult.status,
            ...addressParts,
            primary_contact_person: 'To be confirmed',
            email_address: `orders@${lookupResult.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone_number: 'N/A',
        };
        try {
            await axios.post('/api/suppliers', newSupplierData);
            alert('Supplier quickly added!');
            onSupplierAdded();
            onClose();
        } catch (err) {
            alert('Error during quick add: ' + (err.response?.data?.message || 'Unknown error'));
        }
    };

    const handleReviewAndContinue = () => {
        if (!lookupResult) return;
        const addressParts = parseAddress(lookupResult.address);
        setFormData(prev => ({
            ...prev,
            company_name: lookupResult.business_name,
            entity_type: lookupResult.entity_type,
            entity_status: lookupResult.status,
            ...addressParts,
        }));
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/suppliers', formData);
            alert('Supplier successfully added!');
            onSupplierAdded();
            onClose();
        } catch (err) {
            alert('Error adding supplier: ' + (err.response?.data?.message || 'Please check your input'));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stepper steps={steps} currentStep={step} />

            <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                <h4>Business Lookup</h4>
                <p>Enter the ABN to automatically retrieve business details</p>
                <div className="form-group">
                    <label htmlFor="abn">Australian Business Number (ABN) *</label>
                    <input type="text" id="abn" name="abn" value={formData.abn} onChange={handleChange} placeholder="12345678901" />
                    <small>Format: XXX XXX XXX XXX (11 digits)</small>
                </div>
                <button type="button" className="btn btn-blue" onClick={handleLookup} disabled={lookupLoading}>
                    {lookupLoading ? 'Looking up...' : 'Lookup'}
                </button>

                {lookupError && !lookupResult && (
                    <div className="lookup-result error">
                        <h4>Business Not Found</h4>
                        <p>{lookupError}</p>
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Continue Manually</button>
                    </div>
                )}
                {lookupResult && (
                    <div className="lookup-result success">
                        <h4>Business Found!</h4>
                        <p><strong>Business Name:</strong> {lookupResult.business_name}</p>
                        <p><strong>Entity Type:</strong> {lookupResult.entity_type}</p>
                        <p><strong>Status:</strong> {lookupResult.status}</p>
                        <p><strong>Address:</strong> {lookupResult.address}</p>
                        <div className="quick-add-options">
                            <p>Add this supplier with the fetched details, or continue to review and add additional information.</p>
                            <div className="modal-footer" style={{ justifyContent: 'flex-start', borderTop: 'none', padding: '15px 0 0 0' }}>
                                <button type="button" className="btn btn-primary" onClick={handleQuickAdd}>Quick Add Supplier</button>
                                <button type="button" className="btn btn-secondary" onClick={handleReviewAndContinue}>Review & Edit Details</button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="test-abns">
                    <h5>Test ABNs (for demo):</h5>
                    <ul>
                        <li>12345678901 - Sydney Fresh Foods (Active)</li>
                        <li>98765432109 - Melbourne Coffee Roasters (Active)</li>
                        <li>55555555555 - Inactive Business (Cancelled)</li>
                        <li>11111111111 - Not Found (for testing)</li>
                    </ul>
                </div>
            </div>

            {step > 1 && (
                <>
                    <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                        <h4>Basic Information</h4>
                        <div className="form-group"><label>Company Name *</label><input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Primary Contact Person *</label><input type="text" name="primary_contact_person" value={formData.primary_contact_person} onChange={handleChange} placeholder="Full name of primary contact" required /></div>
                        <div className="form-group"><label>Email Address *</label><input type="email" name="email_address" value={formData.email_address} onChange={handleChange} placeholder="orders@company.com" required /></div>
                        <div className="form-group"><label>Phone Number *</label><input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="+61 2 1234 5678" required /></div>
                        <div className="info-box">💡 Business name and address have been auto-populated from ABN lookup. You can modify them if needed.</div>
                    </div>
                    <div className={`form-step ${step === 3 ? 'active' : ''}`}>
                        <h4>Address Information</h4>
                        <div className="form-group"><label>Street Address</label><input type="text" name="street_address" value={formData.street_address} onChange={handleChange} /></div>
                        <div className="input-group">
                            <div className="form-group"><label>City</label><input type="text" name="city" value={formData.city} onChange={handleChange} /></div>
                            <div className="form-group"><label>State</label><select name="state" value={formData.state} onChange={handleChange}><option value="">Select State</option><option value="NSW">NSW</option><option value="VIC">VIC</option><option value="QLD">QLD</option><option value="SA">SA</option><option value="WA">WA</option><option value="TAS">TAS</option><option value="NT">NT</option><option value="ACT">ACT</option></select></div>
                        </div>
                        <div className="form-group"><label>Postcode</label><input type="text" name="postcode" value={formData.postcode} onChange={handleChange} /></div>
                        <div className="info-box">💡 Address information is optional but helps with delivery coordination and supplier management.</div>
                    </div>
                    <div className={`form-step ${step === 4 ? 'active' : ''}`}>
                        <h4>Business Details</h4>
                        <div className="form-group"><label>ABN (Australian Business Number)</label><input type="text" value={formData.abn} disabled /><small>ABN is auto-populated from lookup and cannot be modified</small></div>
                        <div className="input-group">
                            <div className="form-group"><label>Entity Type</label><input type="text" value={formData.entity_type} disabled /></div>
                            <div className="form-group"><label>Entity Status</label><input type="text" value={formData.entity_status} disabled /></div>
                        </div>
                        <div className="form-group"><label>Product Categories</label>
                            <div className="checkbox-group vertical">
                                <div className="checkbox-item"><input type="checkbox" name="product_categories" value="Coffee" onChange={handleChange} checked={formData.product_categories.includes('Coffee')} /> Coffee</div>
                                <div className="checkbox-item"><input type="checkbox" name="product_categories" value="Dairy" onChange={handleChange} checked={formData.product_categories.includes('Dairy')} /> Dairy</div>
                                <div className="checkbox-item"><input type="checkbox" name="product_categories" value="Produce" onChange={handleChange} checked={formData.product_categories.includes('Produce')} /> Produce</div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                {step > 1 && <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>← Previous</button>}
                {step > 1 && step < steps.length && <button type="button" className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>}
                {step === steps.length && <button type="submit" className="btn btn-primary">Add Supplier</button>}
            </div>
        </form>
    );
};

const SupplierManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAiInsights, setShowAiInsights] = useState(true);

    const fetchSuppliers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/suppliers');
            setSuppliers(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load suppliers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const totalSuppliers = suppliers.length;
    const totalMonthlySpend = "$13,290"; // Dummy data

    return (
        <>
            <header>
                <h1>Supplier Management</h1>
                <div>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Supplier</button>
                    <button className="btn btn-tertiary" onClick={() => setShowAiInsights(!showAiInsights)}>
                        {showAiInsights ? 'Hide AI Insights' : 'Show AI Insights'}
                    </button>
                </div>
            </header>

            {showAiInsights && (
                <div className="ai-insights-section">
                    <div className="ai-insights-header"><h3>Supplier Opportunities</h3><span>2 Found</span></div>
                </div>
            )}

            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
                <StatCard title="Total Suppliers" value={totalSuppliers} />
                <StatCard title="Total Monthly Spend" value={totalMonthlySpend} />
                <StatCard title="Active Suppliers" value={totalSuppliers} />
            </div>

            <div className="card">
                {loading && <p>Loading suppliers...</p>}
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    <table className="data-table">
                        <thead><tr><th>Supplier</th><th>Location</th><th>Monthly Spend</th><th>Last Order</th><th>Actions</th></tr></thead>
                        <tbody>
                            {suppliers.length > 0 ? suppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td><strong>{supplier.company_name}</strong><br /><small>{supplier.email_address}</small></td>
                                    <td>{supplier.city}, {supplier.state}</td>
                                    <td>$2,840</td>
                                    <td>2025-08-05</td>
                                    {/* Updated Action Link */}
                                    <td><Link to={`/suppliers/${supplier.id}`} className="btn-link">View Details</Link></td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No suppliers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Supplier">
                <AddSupplierForm onClose={() => setIsModalOpen(false)} onSupplierAdded={fetchSuppliers} />
            </Modal>
        </>
    );
};

export default SupplierManagement;
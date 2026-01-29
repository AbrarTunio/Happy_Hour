import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import Stepper from '../components/Stepper';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// --- Comprehensive List of Country Codes ---
const countryCodes = [
    { name: "Australia", dial_code: "+61", code: "AU" },
    { name: "United States", dial_code: "+1", code: "US" },
    { name: "United Kingdom", dial_code: "+44", code: "GB" },
    { name: "New Zealand", dial_code: "+64", code: "NZ" },
    { name: "Canada", dial_code: "+1", code: "CA" },
    { name: "China", dial_code: "+86", code: "CN" },
    { name: "India", dial_code: "+91", code: "IN" },
    { name: "Indonesia", dial_code: "+62", code: "ID" },
    { name: "Japan", dial_code: "+81", code: "JP" },
    { name: "Malaysia", dial_code: "+60", code: "MY" },
    { name: "Philippines", dial_code: "+63", code: "PH" },
    { name: "Singapore", dial_code: "+65", code: "SG" },
    { name: "South Korea", dial_code: "+82", code: "KR" },
    { name: "Thailand", dial_code: "+66", code: "TH" },
    { name: "Vietnam", dial_code: "+84", code: "VN" },
    { name: "Germany", dial_code: "+49", code: "DE" },
    { name: "France", dial_code: "+33", code: "FR" },
    { name: "Italy", dial_code: "+39", code: "IT" },
    { name: "Spain", dial_code: "+34", code: "ES" },
].sort((a, b) => a.name.localeCompare(b.name));

export const AddSupplierForm = ({ onClose, onSupplierAdded, initialData }) => {
    const [step, setStep] = useState(1);
    const steps = ['ABN Lookup', 'Basic Info', 'Address', 'Business Details'];

    const [formData, setFormData] = useState({
        abn: '',
        company_name: '',
        primary_contact_person: '',
        email_address: '',
        phone_country_code: '+61',
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
    const [lookupLoading, setLookupLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            let phone = initialData.phone_number || '';
            let code = '+61';

            const matchedCountry = countryCodes.find(c => phone.startsWith(c.dial_code));
            if (matchedCountry) {
                code = matchedCountry.dial_code;
                phone = phone.replace(code, '').trim();
            }

            setFormData({
                ...initialData,
                phone_country_code: code,
                phone_number: phone,
                abn: initialData.abn || '',
                street_address: initialData.street_address || '',
                city: initialData.city || '',
                state: initialData.state || '',
                postcode: initialData.postcode || '',
                entity_type: initialData.entity_type || '',
                entity_status: initialData.entity_status || '',
            });
            setStep(2);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLookup = async () => {
        if (!formData.abn) {
            toast.error('Please enter an ABN first.');
            return;
        }
        setLookupLoading(true);
        const loadingToast = toast.loading('Looking up ABN...');
        setLookupResult(null);
        try {
            const response = await axios.post('/api/suppliers/abn-lookup', { abn: formData.abn });
            setLookupResult(response.data);
            toast.success('Business Found!', { id: loadingToast });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lookup failed.', { id: loadingToast });
        } finally {
            setLookupLoading(false);
        }
    };

    const handleReviewAndContinue = () => {
        if (!lookupResult) return;
        const { address_components } = lookupResult;
        setFormData(prev => ({
            ...prev,
            abn: formData.abn,
            company_name: lookupResult.business_name,
            entity_type: lookupResult.entity_type,
            entity_status: lookupResult.status,
            street_address: address_components.street_address || '',
            city: address_components.city || '',
            state: address_components.state || '',
            postcode: address_components.postcode || '',
        }));
        setStep(2);
    };

    const handleQuickAdd = async () => {
        if (!lookupResult) return;
        const { address_components } = lookupResult;

        const newSupplierData = {
            abn: formData.abn,
            company_name: lookupResult.business_name,
            entity_type: lookupResult.entity_type,
            entity_status: lookupResult.status,
            street_address: address_components.street_address,
            city: address_components.city,
            state: address_components.state,
            postcode: address_components.postcode,
            primary_contact_person: 'To be confirmed',
            email_address: `orders@${lookupResult.business_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            phone_number: 'N/A',
            product_categories: [],
        };

        const loadingToast = toast.loading('Adding supplier...');
        try {
            await axios.post('/api/suppliers', newSupplierData);
            toast.success('Supplier quickly added!', { id: loadingToast });
            onSupplierAdded();
            onClose();
        } catch (err) {
            toast.error('Error during quick add.', { id: loadingToast });
        }
    };

    // --- VALIDATION FUNCTION ---
    const validateForm = () => {
        if (!formData.company_name.trim()) {
            toast.error("Company Name is required.");
            return false;
        }
        if (!formData.primary_contact_person.trim()) {
            toast.error("Contact Person is required.");
            return false;
        }
        if (!formData.email_address.trim()) {
            toast.error("Email Address is required.");
            return false;
        }
        // Basic email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email_address)) {
            toast.error("Please enter a valid email address.");
            return false;
        }
        if (!formData.phone_number.trim()) {
            toast.error("Phone Number is required.");
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        if (step === 2) {
            if (!validateForm()) return; // Stop if validation fails
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return; // Final check

        const loadingToast = toast.loading(initialData ? 'Updating supplier...' : 'Adding supplier...');

        const fullPhone = `${formData.phone_country_code} ${formData.phone_number}`;
        const payload = { ...formData, phone_number: fullPhone };
        delete payload.phone_country_code;

        try {
            if (initialData) {
                await axios.put(`/api/suppliers/${initialData.id}`, payload);
                toast.success('Supplier Updated Successfully!', { id: loadingToast });
            } else {
                await axios.post('/api/suppliers', payload);
                toast.success('Supplier Added Successfully!', { id: loadingToast });
            }
            onSupplierAdded();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error saving supplier.', { id: loadingToast });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stepper steps={steps} currentStep={step} />

            <div className={`form-step ${step === 1 ? 'active' : ''}`}>
                <h4>Business Lookup</h4>
                <div className="form-group"><label>ABN</label><input type="text" name="abn" value={formData.abn} onChange={handleChange} placeholder="e.g. 36103573806" /></div>
                <button type="button" className="btn btn-blue" onClick={handleLookup} disabled={lookupLoading}>{lookupLoading ? 'Looking up...' : 'Lookup'}</button>

                {lookupResult && (
                    <div className="lookup-result success" style={{ marginTop: '15px' }}>
                        <p><strong>Found:</strong> {lookupResult.business_name}</p>
                        <div className="quick-add-options">
                            <button type="button" className="btn btn-primary" onClick={handleQuickAdd} style={{ marginRight: '10px' }}>Quick Add</button>
                            <button type="button" className="btn btn-secondary" onClick={handleReviewAndContinue}>Review & Edit</button>
                        </div>
                    </div>
                )}
            </div>

            {step > 1 && (
                <>
                    <div className={`form-step ${step === 2 ? 'active' : ''}`}>
                        <h4>Basic Information</h4>
                        <div className="form-group"><label>Company Name *</label><input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Contact Person *</label><input type="text" name="primary_contact_person" value={formData.primary_contact_person} onChange={handleChange} required /></div>
                        <div className="form-group"><label>Email *</label><input type="email" name="email_address" value={formData.email_address} onChange={handleChange} required /></div>

                        <div className="form-group">
                            <label>Phone Number *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '10px' }}>
                                <select
                                    name="phone_country_code"
                                    value={formData.phone_country_code}
                                    onChange={handleChange}
                                    style={{ width: '100%' }}
                                >
                                    {countryCodes.map((country) => (
                                        <option key={country.code} value={country.dial_code}>
                                            {country.name} ({country.dial_code})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="412 345 678"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={`form-step ${step === 3 ? 'active' : ''}`}>
                        <h4>Address</h4>
                        <div className="form-group"><label>Street</label><input type="text" name="street_address" value={formData.street_address} onChange={handleChange} /></div>
                        <div className="input-group">
                            <div className="form-group"><label>City</label><input type="text" name="city" value={formData.city} onChange={handleChange} /></div>
                            <div className="form-group"><label>State</label><input type="text" name="state" value={formData.state} onChange={handleChange} /></div>
                        </div>
                        <div className="form-group"><label>Postcode</label><input type="text" name="postcode" value={formData.postcode} onChange={handleChange} /></div>
                    </div>

                    <div className={`form-step ${step === 4 ? 'active' : ''}`}>
                        <h4>Business Details</h4>
                        <div className="form-group">
                            <label>Australian Business Number (ABN)</label>
                            <input type="text" name="abn" value={formData.abn} onChange={handleChange} placeholder="36 103 573 806" />
                        </div>
                        <div className="input-group">
                            <div className="form-group">
                                <label>Entity Type</label>
                                <input type="text" name="entity_type" value={formData.entity_type} onChange={handleChange} placeholder="e.g. Australian Private Company" />
                            </div>
                            <div className="form-group">
                                <label>Entity Status</label>
                                <input type="text" name="entity_status" value={formData.entity_status} onChange={handleChange} placeholder="e.g. Active" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                {step > 1 && <button type="button" className="btn btn-secondary" onClick={() => setStep(s => s - 1)}>Back</button>}

                {/* Step 2 & 3 go to Next, Step 4 submits */}
                {step > 1 && step < 4 && (
                    <button type="button" className="btn btn-primary" onClick={handleNextStep}>Next</button>
                )}
                {step === 4 && (
                    <button type="submit" className="btn btn-primary">
                        {initialData ? 'Update Supplier' : 'Add Supplier'}
                    </button>
                )}
            </div>
        </form>
    );
};

const SupplierManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/suppliers');
            setSuppliers(response.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load suppliers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            const loadingToast = toast.loading('Deleting supplier...');
            try {
                await axios.delete(`/api/suppliers/${id}`);
                toast.success('Supplier deleted successfully.', { id: loadingToast });
                fetchSuppliers();
            } catch (err) {
                toast.error('Failed to delete supplier.', { id: loadingToast });
            }
        }
    };

    const totalMonthlySpend = suppliers.reduce((sum, supplier) => {
        return sum + parseFloat(supplier.invoices_sum_total || 0);
    }, 0);

    return (
        <>
            <header>
                <h1>Supplier Management</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Supplier</button>
            </header>

            <div className="grid-container">
                <StatCard title="Total Suppliers" value={suppliers.length} />
                <StatCard title="Total Monthly Spend" value={`$${totalMonthlySpend.toFixed(2)}`} />
                <StatCard title="Active Suppliers" value={suppliers.length} />
            </div>

            <div className="card table-container">
                {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading suppliers...</p>}
                {!loading && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Location</th>
                                <th>Contact</th>
                                <th>Monthly Spend</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map(supplier => (
                                <tr key={supplier.id}>
                                    <td><strong>{supplier.company_name}</strong></td>
                                    <td>{`${supplier.city || ''}${supplier.state ? `, ${supplier.state}` : ''}`}</td>
                                    <td>{supplier.primary_contact_person}<br /><small>{supplier.email_address}</small></td>
                                    <td>${Number(supplier.invoices_sum_total || 0).toFixed(2)}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <Link to={`/suppliers/${supplier.id}`} className="btn-link">View Details</Link>
                                            <button onClick={() => handleDelete(supplier.id, supplier.company_name)} className="btn-delete">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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

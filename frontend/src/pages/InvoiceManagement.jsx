// --- START OF FILE pages/InvoiceManagement.jsx ---

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import axios from 'axios';

// ... (UploadInvoiceForm component remains exactly the same)
const UploadInvoiceForm = ({ onClose, onInvoiceUploaded, suppliers }) => {
    const [formData, setFormData] = useState({
        supplier_id: '',
        invoice_date: '',
        due_date: '',
        invoice_file: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // We need to send the data as FormData because it includes a file
        const data = new FormData();
        for (const key in formData) {
            data.append(key, formData[key]);
        }

        try {
            await axios.post('/api/invoices', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Invoice Uploaded and is being processed!');
            onInvoiceUploaded(); // Refresh the list in the parent component
            onClose();
        } catch (err) {
            console.error('Failed to upload invoice:', err);
            const message = err.response?.data?.message || 'Failed to upload invoice. Please check your input.';
            setError(message);
            alert('Error: ' + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: 'auto' }}>
            <div className="form-group">
                <label htmlFor="supplier_id">Supplier</label>
                <select id="supplier_id" name="supplier_id" value={formData.supplier_id} onChange={handleChange} required>
                    <option value="">Select supplier</option>
                    {/* Populate dropdown from the suppliers prop */}
                    {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="invoice_date">Invoice Date</label>
                <input type="date" id="invoice_date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="due_date">Due Date</label>
                <input type="date" id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="invoice_file">Upload Invoice File</label>
                <input type="file" id="invoice_file" name="invoice_file" onChange={handleChange} required />
                <small style={{ color: 'var(--dark-gray)' }}>Supported formats: PDF, JPG, PNG</small>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Uploading...' : 'Upload & Process'}</button>
            </div>
            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        </form>
    );
};


const InvoiceManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // For the dropdown in the modal
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch both invoices and suppliers when the component mounts
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use Promise.all to fetch both data sets in parallel for efficiency
            const [invoicesResponse, suppliersResponse] = await Promise.all([
                axios.get('/api/invoices'),
                axios.get('/api/suppliers')
            ]);
            setInvoices(invoicesResponse.data);
            setSuppliers(suppliersResponse.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load page data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Calculate stats based on fetched invoices
    const processingQueue = invoices.filter(inv => inv.status === 'processing').length;
    const needsReview = invoices.filter(inv => inv.status === 'needs review').length;
    const processed = invoices.filter(inv => inv.status === 'processed').length;
    const matchRate = '94%'; // This would be a more complex calculation

    return (
        <>
            <header>
                <h1>Invoice Management</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Upload Invoice</button>
            </header>
            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <StatCard title="Processing Queue" value={processingQueue} />
                <StatCard title="Needs Review" value={needsReview} />
                <StatCard title="Approved" value={processed} />
                <StatCard title="Match Rate" value={matchRate} />
            </div>

            <div className="card">
                {loading && <p>Loading invoices...</p>}
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Supplier</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center' }}>No invoices found.</td></tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.invoice_number || `INV-${invoice.id}`}</td>
                                        {/* Find the supplier name from the suppliers list */}
                                        <td>{suppliers.find(s => s.id === invoice.supplier_id)?.company_name || 'N/A'}</td>
                                        <td>{invoice.invoice_date}</td>
                                        <td>{invoice.due_date}</td>
                                        <td>${Number(invoice.total || 0).toFixed(2)}</td>
                                        <td><span className={`status-tag status-${invoice.status.replace(' ', '-')}`}>{invoice.status}</span></td>
                                        {/* Updated Action Link */}
                                        <td><Link to={`/invoices/${invoice.id}`} className="btn-link">View Details</Link></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload New Invoice">
                <UploadInvoiceForm
                    onClose={() => setIsModalOpen(false)}
                    onInvoiceUploaded={fetchData} // Refetch all data after upload
                    suppliers={suppliers}
                />
            </Modal>
        </>
    );
};

export default InvoiceManagement;
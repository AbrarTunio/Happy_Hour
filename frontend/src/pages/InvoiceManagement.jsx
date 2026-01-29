import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AddSupplierForm } from './SupplierManagement';

// --- Updated Upload Form Component with Toast & Add Supplier ---
const UploadInvoiceForm = ({ onClose, onInvoiceUploaded, suppliers, onAddNewSupplier }) => {
    const [formData, setFormData] = useState({
        supplier_id: '',
        invoice_date: '',
        due_date: '',
        invoice_file: null,
    });
    const [loading, setLoading] = useState(false);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'invoice_file' && files && files[0]) {
            const file = files[0];
            setFormData(prev => ({ ...prev, invoice_file: file }));
            setFilePreview(URL.createObjectURL(file));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleClearFile = () => {
        setFormData(prev => ({ ...prev, invoice_file: null }));
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const loadingToast = toast.loading('Uploading invoice...');

        const data = new FormData();
        for (const key in formData) {
            if (formData[key]) {
                data.append(key, formData[key]);
            }
        }

        try {
            await axios.post('/api/invoices', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Invoice Uploaded! Processing queued.', { id: loadingToast });
            onInvoiceUploaded();
            onClose();
        } catch (err) {
            console.error('Failed to upload invoice:', err);
            const message = err.response?.data?.message || 'Failed to upload. Please check your input and try again.';
            toast.error(message, { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="supplier_id">Supplier</label>
                {suppliers.length > 0 ? (
                    <select id="supplier_id" name="supplier_id" value={formData.supplier_id} onChange={handleChange} required>
                        <option value="">Select a supplier</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>{supplier.company_name}</option>
                        ))}
                    </select>
                ) : (
                    <div style={{ border: '1px solid #ccc', padding: '10px', textAlign: 'center', borderRadius: '6px', background: '#f9f9f9' }}>
                        <p style={{ fontSize: '0.9em', marginBottom: '10px' }}>No suppliers found.</p>
                        <button type="button" className="btn btn-secondary" onClick={onAddNewSupplier}>+ Add New Supplier</button>
                    </div>
                )}
            </div>
            <div className="input-group">
                <div className="form-group">
                    <label htmlFor="invoice_date">Invoice Date</label>
                    <input type="date" id="invoice_date" name="invoice_date" value={formData.invoice_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="due_date">Due Date</label>
                    <input type="date" id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} required />
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="invoice_file">Upload Invoice File</label>
                <input ref={fileInputRef} type="file" id="invoice_file" name="invoice_file" onChange={handleChange} required accept=".pdf,.jpg,.jpeg,.png" />
                <small>Supported formats: PDF, JPG, PNG</small>
            </div>

            {filePreview && (
                <div style={{ marginTop: '20px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', position: 'relative' }}>
                    <h4 style={{ marginBottom: '10px' }}>File Preview</h4>
                    <button
                        type="button"
                        onClick={handleClearFile}
                        style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}
                        title="Clear selection"
                    >
                        &times;
                    </button>
                    {formData.invoice_file?.type === 'application/pdf' ? (
                        <iframe src={filePreview} title="Invoice Preview" width="100%" height="450px" style={{ border: 'none' }}></iframe>
                    ) : (
                        <img src={filePreview} alt="Invoice Preview" style={{ maxWidth: '100%', maxHeight: '450px', display: 'block', margin: '0 auto' }} />
                    )}
                </div>
            )}

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading || (!formData.supplier_id && suppliers.length > 0)}>
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
        </form>
    );
};

// --- Main InvoiceManagement Component ---
const InvoiceManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [stats, setStats] = useState({
        processing_queue: 0,
        needs_review: 0,
        approved: 0,
        match_rate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invoicesResponse, suppliersResponse] = await Promise.all([
                axios.get('/api/invoices'),
                axios.get('/api/suppliers')
            ]);
            setInvoices(invoicesResponse.data.invoices);
            setStats(invoicesResponse.data.stats);
            setSuppliers(suppliersResponse.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            toast.error('Failed to load page data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id, number) => {
        if (window.confirm(`Are you sure you want to delete invoice "${number}"?`)) {
            const loadingToast = toast.loading('Deleting invoice...');
            try {
                await axios.delete(`/api/invoices/${id}`);
                toast.success(`Invoice "${number}" deleted successfully.`, { id: loadingToast });
                fetchData();
            } catch (err) {
                toast.error('Failed to delete invoice.', { id: loadingToast });
            }
        }
    };

    const handleProcessWithAI = async (invoiceId) => {
        setProcessingId(invoiceId);
        const loadingToast = toast.loading('Sending for AI processing...');
        try {
            const response = await axios.post(`/api/invoices/${invoiceId}/process-ai`);

            if (response.data.status === 'rejected') {
                toast.error('Document Rejected: ' + response.data.message, { id: loadingToast });
            } else {
                toast.success('Invoice sent for AI processing. Please wait...', { id: loadingToast });
            }

            fetchData();
        } catch (err) {
            if (err.response?.data?.status === 'rejected') {
                toast.error('Document Rejected: ' + err.response.data.message, { id: loadingToast });
                fetchData();
            } else {
                toast.error('Failed to start AI processing.', { id: loadingToast });
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleSupplierAdded = async () => {
        const res = await axios.get('/api/suppliers');
        setSuppliers(res.data);
        setIsSupplierModalOpen(false);
    };

    // Enhanced status display
    const displayStatus = (status) => {
        switch (status) {
            case 'needs review': return 'Needs Review';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    };

    return (
        <>
            <header>
                <h1>Invoice Management</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Upload Invoice</button>
            </header>
            <div className="grid-container">
                <StatCard title="Processing Queue" value={stats.processing_queue} />
                <StatCard title="Needs Review" value={stats.needs_review} />
                <StatCard title="Approved" value={stats.approved} />
                <StatCard
                    title="Match Rate"
                    value={invoices.length > 0 ? `${stats.match_rate}%` : 'N/A'}
                />
            </div>

            <div className="card table-container">
                {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading invoices...</p>}
                {!loading && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Supplier</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No invoices found.</td></tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td>{invoice.invoice_number || `INV-${invoice.id}`}</td>
                                        <td>{suppliers.find(s => s.id === invoice.supplier_id)?.company_name || 'N/A'}</td>
                                        <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                        <td>${Number(invoice.total || 0).toFixed(2)}</td>
                                        <td>
                                            <span className={`status-tag status-${(invoice.status || 'uploaded').replace(' ', '-')}`}>
                                                {displayStatus(invoice.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                {/* Show Process with AI for uploaded, needs review, AND rejected invoices */}
                                                {(invoice.status === 'uploaded' || invoice.status === 'needs review' || invoice.status === 'rejected') && (
                                                    <button onClick={() => handleProcessWithAI(invoice.id)} className="btn-link" disabled={processingId === invoice.id}>
                                                        {processingId === invoice.id ? 'Processing...' : 'Process with AI'}
                                                    </button>
                                                )}
                                                <Link to={`/invoices/${invoice.id}`} className="btn-link">View Details</Link>
                                                <button onClick={() => handleDelete(invoice.id, invoice.invoice_number || `INV-${invoice.id}`)} className="btn-delete">Delete</button>
                                            </div>
                                        </td>
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
                    onInvoiceUploaded={fetchData}
                    suppliers={suppliers}
                    onAddNewSupplier={() => setIsSupplierModalOpen(true)}
                />
            </Modal>

            {/* Nested Supplier Modal */}
            {isSupplierModalOpen && (
                <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add New Supplier">
                    <AddSupplierForm onClose={() => setIsSupplierModalOpen(false)} onSupplierAdded={handleSupplierAdded} />
                </Modal>
            )}
        </>
    );
};

export default InvoiceManagement;

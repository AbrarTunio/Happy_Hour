import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';
import { toast } from 'react-hot-toast';

const InvoiceDetail = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Track which cell is being edited: { rowIndex: number, field: 'price' | 'qty' }
    const [editingCell, setEditingCell] = useState(null);

    const fetchInvoiceDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`/api/invoices/${id}`);
            setInvoice(response.data);
        } catch (err) {
            setError('Failed to load invoice details.');
            toast.error('Error loading invoice.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoiceDetails();
    }, [id]);

    const handleProcessWithAI = async () => {
        setProcessing(true);
        const loadingToast = toast.loading('Processing with AI...');
        try {
            const response = await axios.post(`/api/invoices/${id}/process-ai`);

            if (response.data.status === 'rejected') {
                toast.error('Document Rejected: ' + response.data.message, { id: loadingToast });
            } else {
                toast.success(response.data.message || 'Processed successfully!', { id: loadingToast });
            }

            setTimeout(() => { fetchInvoiceDetails(); }, 1000);
        } catch (err) {
            if (err.response?.status === 409) {
                toast.success('Already processed. Refreshing...', { id: loadingToast });
                fetchInvoiceDetails();
            } else if (err.response?.data?.status === 'rejected') {
                toast.error('Document Rejected: ' + err.response.data.message, { id: loadingToast });
                fetchInvoiceDetails();
            } else {
                const errorMsg = err.response?.data?.message || 'Failed to process invoice.';
                toast.error(errorMsg, { id: loadingToast });
            }
        } finally {
            setProcessing(false);
        }
    };

    // Enhanced status display
    const displayStatus = (status) => {
        switch (status) {
            case 'needs review': return 'Needs Review';
            case 'rejected': return 'Rejected - Not an Invoice';
            default: return status;
        }
    };

    const statusClass = (status) => {
        switch (status) {
            case 'needs review': return 'status-needs-review';
            case 'rejected': return 'status-rejected';
            default: return `status-${status}`;
        }
    };

    // --- FIXED: Logic to check math and auto-approve on manual edit ---
    const handleUpdateInvoiceData = async (updatedOrders) => {
        const loadingToast = toast.loading('Saving changes...');

        // 1. Recalculate logic to check if it's now valid
        let isMathCorrect = true;
        let grandTotal = 0;

        const cleanOrders = updatedOrders.map(item => {
            const qty = item.qty !== undefined ? parseFloat(item.qty) : 0;
            const price = item.price !== undefined ? parseFloat(item.price) : 0;
            const total = qty * price; // Force correct total based on inputs

            grandTotal += total;

            return {
                ...item,
                description: item.description || 'N/A',
                qty,
                price,
                total,
                gst: item.gst !== undefined ? parseFloat(item.gst) : 0
            };
        });

        // 2. Send Update Request
        try {
            const res = await axios.put(`/api/invoices/${id}/update-items`, {
                orders: cleanOrders,
            });

            toast.success('Saved & Recalculated!', { id: loadingToast });

            // 3. Update local state with the backend response (which should have 'processed' status)
            setInvoice(res.data.invoice);

        } catch (err) {
            console.error("Save Error:", err.response?.data);
            toast.error('Failed to save changes.', { id: loadingToast });
            fetchInvoiceDetails();
        }
    };

    const handleCellChange = (e, index, field) => {
        const rawValue = e.target.value;

        const updatedOrders = invoice.ai_extraction_data.orders.map((item, idx) => {
            if (idx === index) {
                const newItem = { ...item };

                newItem[field] = rawValue;

                let valPrice = parseFloat(newItem.price);
                let valQty = parseFloat(newItem.qty);

                if (isNaN(valPrice)) valPrice = 0;
                if (isNaN(valQty)) valQty = 0;

                // Live preview of calculation
                newItem.total = valPrice * valQty;

                return newItem;
            }
            return item;
        });

        setInvoice(prev => ({
            ...prev,
            ai_extraction_data: {
                ...prev.ai_extraction_data,
                orders: updatedOrders,
            }
        }));
    };

    const handleBlur = () => {
        if (editingCell === null) return;
        setEditingCell(null); // Exit edit mode first

        // Trigger save
        handleUpdateInvoiceData(invoice.ai_extraction_data.orders);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setEditingCell(null);
            fetchInvoiceDetails();
        }
    };

    const calculateDynamicTotals = (orders) => {
        if (!orders || !Array.isArray(orders)) return null;
        let subtotal = 0;
        let gst = 0;
        orders.forEach(item => {
            const itemTotal = parseFloat(item.total) || 0;
            const itemGST = parseFloat(item.gst || item.GST || 0);
            subtotal += itemTotal;
            gst += itemGST;
        });
        const grandTotal = subtotal + gst;
        return { subtotal, gst, grandTotal };
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
    if (error) return <div className="error-message" style={{ padding: '20px' }}>{error}</div>;
    if (!invoice) return <div style={{ padding: '20px' }}>No invoice found.</div>;

    const extractedData = invoice.ai_extraction_data || {};
    const orders = extractedData.orders || [];
    const dynamicTotals = calculateDynamicTotals(orders);

    return (
        <>
            <header>
                <div>
                    <Link to="/invoices" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Invoices</Link>
                    <h1>Invoice #{invoice.invoice_number}</h1>
                    <p>{invoice.supplier?.company_name}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span className={`status-tag ${statusClass(invoice.status)}`}>
                        {displayStatus(invoice.status)}
                    </span>

                    {/* Show "Process with AI" for uploaded, needs review, AND rejected invoices */}
                    {(invoice.status === 'uploaded' || invoice.status === 'needs review' || invoice.status === 'rejected') && (
                        <button onClick={handleProcessWithAI} className="btn btn-primary" disabled={processing}>
                            {processing ? 'Processing...' : 'Process with AI'}
                        </button>
                    )}
                </div>
            </header>

            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <StatCard title="Invoice Date" value={new Date(invoice.invoice_date).toLocaleDateString()} />
                <StatCard title="Due Date" value={new Date(invoice.due_date).toLocaleDateString()} />
                <StatCard title="Total Items" value={orders.length} />
                <StatCard title="Final Total" value={`$${Number(dynamicTotals?.grandTotal || 0).toFixed(2)}`} />
            </div>

            <div className="card">
                <h3>Scanned Invoice Items</h3>

                {invoice.status === 'rejected' ? (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff5f5', borderRadius: '8px' }}>
                        <h4 style={{ color: '#e53e3e' }}>❌ Document Rejected</h4>
                        <p style={{ color: '#718096', marginTop: '10px' }}>
                            {extractedData.invalid_reason || 'This document is not a valid supplier invoice.'}
                        </p>
                        <p style={{ color: '#718096', marginTop: '5px', fontSize: '0.9em' }}>
                            Only supplier invoices can be processed. Please upload a valid invoice document.
                        </p>
                    </div>
                ) : invoice.status === 'processing' ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}><h4>⏳ AI Processing in Progress...</h4></div>
                ) : orders.length > 0 ? (
                    <>
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Item Description</th>
                                        <th style={{ width: '100px' }}>Qty (Edit)</th>
                                        <th style={{ width: '120px' }}>Unit Price (Edit)</th>
                                        <th>GST</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.code || 'N/A'}</td>
                                            <td>{item.description || 'N/A'}</td>

                                            <td
                                                onDoubleClick={() => setEditingCell({ rowIndex: index, field: 'qty' })}
                                                style={{ cursor: 'pointer', position: 'relative', background: editingCell?.rowIndex === index && editingCell?.field === 'qty' ? '#fff' : 'inherit' }}
                                                title="Double click to edit"
                                            >
                                                {editingCell?.rowIndex === index && editingCell?.field === 'qty' ? (
                                                    <input
                                                        type="number"
                                                        value={item.qty !== undefined && item.qty !== null ? item.qty : ''}
                                                        onChange={(e) => handleCellChange(e, index, 'qty')}
                                                        onBlur={handleBlur}
                                                        onKeyDown={handleKeyDown}
                                                        autoFocus
                                                        style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
                                                    />
                                                ) : (
                                                    <span>{item.qty}</span>
                                                )}
                                            </td>

                                            <td
                                                onDoubleClick={() => setEditingCell({ rowIndex: index, field: 'price' })}
                                                style={{ cursor: 'pointer', position: 'relative', background: editingCell?.rowIndex === index && editingCell?.field === 'price' ? '#fff' : 'inherit' }}
                                                title="Double click to edit"
                                            >
                                                {editingCell?.rowIndex === index && editingCell?.field === 'price' ? (
                                                    <input
                                                        type="number"
                                                        value={item.price !== undefined && item.price !== null ? item.price : ''}
                                                        onChange={(e) => handleCellChange(e, index, 'price')}
                                                        onBlur={handleBlur}
                                                        onKeyDown={handleKeyDown}
                                                        autoFocus
                                                        style={{ width: '100%', padding: '4px', boxSizing: 'border-box' }}
                                                        step="0.01"
                                                    />
                                                ) : (
                                                    <span>${Number(item.price || 0).toFixed(2)}</span>
                                                )}
                                            </td>

                                            <td>${Number(item.gst || item.GST || 0).toFixed(2)}</td>
                                            <td>${Number(item.total || 0).toFixed(2)}</td>
                                            <td>
                                                {item.is_new_system ? (
                                                    <span style={{ color: 'var(--primary-blue)', fontSize: '0.85em' }}>✨ New</span>
                                                ) : (
                                                    <span style={{ color: 'var(--primary-green)', fontSize: '0.85em' }}>✓ Matched</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h4>Order Summary</h4>
                            <div className="breakdown-list">
                                <p><span>Subtotal:</span><span>${Number(dynamicTotals?.subtotal).toFixed(2)}</span></p>
                                <p><span>GST:</span><span>${Number(dynamicTotals?.gst).toFixed(2)}</span></p>
                                <p><strong><span>Grand Total:</span><span>${Number(dynamicTotals?.grandTotal).toFixed(2)}</span></strong></p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <h4>📄 Invoice Not Processed</h4>
                        <p>Click "Process with AI" to extract items.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default InvoiceDetail;

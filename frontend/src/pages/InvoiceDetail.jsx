import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';

const InvoiceDetail = () => {
    const { id } = useParams();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoiceDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/invoices/${id}`);
                setInvoice(response.data);
            } catch (err) {
                setError('Failed to load invoice details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoiceDetails();
    }, [id]);

    if (loading) return <p>Loading invoice details...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!invoice) return <p>No invoice data found.</p>;

    return (
        <>
            <header>
                <div>
                    <Link to="/invoices" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Invoices</Link>
                    <h1>Invoice #{invoice.invoice_number}</h1>
                    {/* FIX: Use supplier object from relation */}
                    <p>{invoice.supplier?.company_name}</p>
                </div>
                <span className={`status-tag status-${(invoice.status || '').replace(' ', '-')}`}>{invoice.status}</span>
            </header>

            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard title="Invoice Date" value={invoice.invoice_date} />
                <StatCard title="Due Date" value={invoice.due_date} />
                {/* FIX: Add safety check */}
                <StatCard title="Total Items" value={invoice.items?.length ?? 0} />
                <StatCard title="Final Total" value={`$${Number(invoice.total ?? 0).toFixed(2)}`} />
            </div>

            <div className="card">
                <h3>Scanned Invoice Items</h3>
                <table className="data-table">
                    <thead><tr><th>Item</th><th>Quantity</th><th>Unit Price</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                        {invoice.items?.map(item => (
                            <tr key={item.id} className={item.status === 'Needs Review' ? 'warning-row' : ''}>
                                <td>
                                    {item.name}
                                    {item.review_reason && <small style={{ display: 'block', color: 'var(--orange)' }}>{item.review_reason}</small>}
                                </td>
                                <td>{item.quantity} {item.unit}</td>
                                <td>${Number(item.unit_price ?? 0).toFixed(2)}</td>
                                <td>${(item.quantity * (item.unit_price ?? 0)).toFixed(2)}</td>
                                <td>{item.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="invoice-details-grid">
                <div className="card">
                    <h4>Invoice Breakdown</h4>
                    <div className="breakdown-list">
                        <p><span>Subtotal:</span><span>${Number(invoice.breakdown?.subtotal ?? 0).toFixed(2)}</span></p>
                        <p><span>Tax:</span><span>${Number(invoice.breakdown?.tax ?? 0).toFixed(2)}</span></p>
                        <p><span>Discounts:</span><span className="price-change decrease">-${Math.abs(invoice.breakdown?.discounts ?? 0).toFixed(2)}</span></p>
                        <p><strong><span>Final Total:</span><span>${Number(invoice.breakdown?.final_total ?? 0).toFixed(2)}</span></strong></p>
                    </div>
                </div>
                <div className="card" style={{ backgroundColor: 'var(--light-blue-bg)' }}>
                    <h4>AI Processing Insights</h4>
                    <div className="breakdown-list">
                        <p><span>Confidence Score:</span><span>{invoice.ai_insights?.confidence_score ?? 'N/A'}%</span></p>
                        <p><span>Items Matched:</span><span>{invoice.ai_insights?.items_matched ?? 'N/A'}</span></p>
                        <p><span>Processing Time:</span><span>{invoice.ai_insights?.processing_time ?? 'N/A'} seconds</span></p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InvoiceDetail;
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';

const SupplierDetail = () => {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSupplierDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/suppliers/${id}`);
                setSupplier(response.data);
            } catch (err) {
                setError('Failed to load supplier details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSupplierDetails();
    }, [id]);

    if (loading) return <p>Loading supplier details...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!supplier) return <p>No supplier data found.</p>;

    return (
        <>
            <header>
                <div>
                    <Link to="/suppliers" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Suppliers</Link>
                    <h1>{supplier.company_name}</h1>
                </div>
                <div>
                    <button className="btn btn-secondary">Edit Supplier</button>
                    <button className="btn btn-primary">Place New Order</button>
                </div>
            </header>

            <div className="card">
                <h3>Performance Metrics</h3>
                <div className="metrics-grid">
                    <p><span>Overall Rating:</span> <span>{supplier.performance?.overall_rating ?? 'N/A'} ⭐</span></p>
                    <p><span>Total Orders:</span> <span>{supplier.performance?.total_orders ?? 'N/A'}</span></p>
                    <p><span>On-Time Delivery:</span> <span>{supplier.performance?.on_time_delivery ?? 'N/A'}%</span></p>
                    <p><span>Quality Rating:</span> <span>{supplier.performance?.quality_rating ?? 'N/A'} ⭐</span></p>
                </div>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--light-green-bg)' }}>
                <h3>Financial Summary</h3>
                <div className="metrics-grid">
                    <p><span>Monthly Spend:</span> <strong>${Number(supplier.financials?.monthly_spend ?? 0).toFixed(2)}</strong></p>
                    <p><span>Last Order:</span> <span>{supplier.financials?.last_order_date ?? 'N/A'}</span></p>
                    <p><span>Supplier Type:</span> <span>{supplier.financials?.supplier_type ?? 'N/A'}</span></p>
                </div>
            </div>

            <div className="card">
                <h3>Ingredients from {supplier.company_name}</h3>
                <table className="data-table">
                    <thead><tr><th>Ingredient</th><th>Current Price</th><th>7d Change</th></tr></thead>
                    <tbody>
                        {(supplier.ingredients || []).map(ing => (
                            <tr key={ing.id}>
                                <td>{ing.ingredient_name}</td>
                                <td>${Number(ing.current_price ?? 0).toFixed(2)} /{ing.unit}</td>
                                <td className={(ing.seven_day_change ?? 0) > 0 ? 'price-change increase' : 'price-change decrease'}>
                                    {(ing.seven_day_change ?? 0) > 0 ? '+' : ''}{ing.seven_day_change ?? 0}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="card">
                <h3>Recent Order History</h3>
                <table className="data-table">
                    <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th></tr></thead>
                    <tbody>
                        {/* This will now render the dynamic invoice data from the backend */}
                        {(supplier.order_history || []).map(order => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{order.date}</td>
                                <td>{order.items}</td>
                                <td><span className={`status-tag status-delivered`}>{order.status}</span></td>
                                <td>${Number(order.total ?? 0).toFixed(2)}</td>
                            </tr>
                        ))}
                        {(!supplier.order_history || supplier.order_history.length === 0) && (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No order history found for this supplier.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default SupplierDetail;
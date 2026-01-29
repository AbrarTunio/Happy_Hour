import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { AddSupplierForm } from './SupplierManagement'; // Import the form

const SupplierDetail = () => {
    const { id } = useParams();
    const [supplier, setSupplier] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for modal

    const fetchSupplierDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/suppliers/${id}`);
            setSupplier(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSupplierDetails();
    }, [id]);

    if (loading) return <p style={{ padding: '20px' }}>Loading supplier details...</p>;
    if (!supplier) return <p style={{ padding: '20px' }}>Supplier not found.</p>;

    // Safely calculate total spend
    const totalSpend = (supplier.invoices || []).reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

    return (
        <>
            <header>
                <div>
                    <Link to="/suppliers" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Suppliers</Link>
                    <h1>{supplier.company_name}</h1>
                </div>
                <div>
                    {/* Clicking this button opens the modal */}
                    <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(true)}>Edit Supplier</button>
                </div>
            </header>

            <div className="grid-container">
                <StatCard title="Total Spend" value={`$${totalSpend.toFixed(2)}`} />
                <StatCard title="Total Invoices" value={supplier.invoices?.length || 0} />
                <StatCard title="Ingredients Supplied" value={supplier.ingredients?.length || 0} />
            </div>

            <div className="card">
                <h3>Ingredients from {supplier.company_name}</h3>
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Ingredient</th><th>Current Price</th><th>Unit</th></tr></thead>
                        <tbody>
                            {(supplier.ingredients || []).map(ing => (
                                <tr key={ing.id}>
                                    <td>{ing.ingredient_name}</td>
                                    <td>${Number(ing.current_price ?? 0).toFixed(2)}</td>
                                    <td>/{ing.unit}</td>
                                </tr>
                            ))}
                            {(!supplier.ingredients || supplier.ingredients.length === 0) && (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No ingredients supplied by this supplier.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card">
                <h3>Recent Invoices</h3>
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Invoice #</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
                        <tbody>
                            {(supplier.invoices || []).map(invoice => (
                                <tr key={invoice.id}>
                                    <td><Link to={`/invoices/${invoice.id}`} className="btn-link">{invoice.invoice_number}</Link></td>
                                    <td>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                    <td><span className={`status-tag status-${invoice.status}`}>{invoice.status}</span></td>
                                    <td>${Number(invoice.total ?? 0).toFixed(2)}</td>
                                </tr>
                            ))}
                            {(!supplier.invoices || supplier.invoices.length === 0) && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No invoice history found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- EDIT SUPPLIER MODAL --- */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Supplier">
                <AddSupplierForm
                    onClose={() => setIsEditModalOpen(false)}
                    onSupplierAdded={fetchSupplierDetails} // Refresh data after update
                    initialData={supplier} // Pass current data to pre-fill the form
                />
            </Modal>
        </>
    );
};

export default SupplierDetail;

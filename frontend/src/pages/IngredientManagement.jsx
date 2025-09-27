// --- START OF FILE pages/IngredientManagement.jsx ---

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import Stepper from '../components/Stepper';
import axios from 'axios';

// ... (AddIngredientForm component remains exactly the same)
const AddIngredientForm = ({ onClose, onSave, suppliers }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const steps = ['Basic Info', 'Supplier', 'Storage', 'Inventory'];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        ingredient_name: '', category: '', unit: '', current_price: '',
        primary_supplier_id: '', brand: '', storage_type: 'Dry Storage',
        shelf_life: '', reorder_level: '0', maximum_stock: '0', notes: '',
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/ingredients', formData);
            alert('Ingredient Added!');
            onSave();
            onClose();
        } catch (err) {
            let errorMessage = 'An unexpected error occurred.';
            if (err.response?.data?.errors) {
                errorMessage = Object.values(err.response.data.errors).flat().join(' \n');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            console.error("Submission Error:", err.response || err);
            setError(errorMessage);
            alert('Error: \n' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stepper steps={steps} currentStep={currentStep} />

            <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                <h4>Basic Information</h4>
                <div className="form-group"><label>Ingredient Name *</label><input type="text" name="ingredient_name" value={formData.ingredient_name} onChange={handleChange} required /></div>
                <div className="input-group">
                    <div className="form-group"><label>Category *</label><select name="category" value={formData.category} onChange={handleChange} required><option value="">Select category</option><option>Produce</option><option>Dairy</option><option>Meat</option></select></div>
                    <div className="form-group"><label>Unit *</label><select name="unit" value={formData.unit} onChange={handleChange} required><option value="">Select unit</option><option>kg</option><option>g</option><option>each</option></select></div>
                </div>
                <div className="form-group"><label>Current Price * (AUD)</label><input type="number" step="0.01" name="current_price" value={formData.current_price} onChange={handleChange} required /></div>
            </div>

            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                <h4>Supplier Details</h4>
                <div className="form-group"><label>Primary Supplier *</label>
                    <select name="primary_supplier_id" value={formData.primary_supplier_id} onChange={handleChange} required>
                        <option value="">Select a supplier</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                    </select>
                </div>
                <div className="form-group"><label>Brand</label><input type="text" name="brand" value={formData.brand} onChange={handleChange} /></div>
            </div>

            <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
                <h4>Storage Information</h4>
                <div className="form-group"><label>Storage Type</label><select name="storage_type" value={formData.storage_type} onChange={handleChange}><option>Dry Storage</option><option>Refrigerated</option></select></div>
                <div className="form-group"><label>Shelf Life (days)</label><input type="number" name="shelf_life" value={formData.shelf_life} onChange={handleChange} /></div>
            </div>

            <div className={`form-step ${currentStep === 4 ? 'active' : ''}`}>
                <h4>Inventory & Notes</h4>
                <div className="input-group">
                    <div className="form-group"><label>Reorder Level</label><input type="number" name="reorder_level" value={formData.reorder_level} onChange={handleChange} /></div>
                    <div className="form-group"><label>Maximum Stock</label><input type="number" name="maximum_stock" value={formData.maximum_stock} onChange={handleChange} /></div>
                </div>
                <div className="form-group"><label>Notes</label><textarea name="notes" value={formData.notes} onChange={handleChange}></textarea></div>
                <div className="review-box">
                    <h4>Review Your Ingredient</h4>
                    <p><span>Name:</span> {formData.ingredient_name || 'N/A'}</p>
                    <p><span>Supplier:</span> {suppliers.find(s => s.id == formData.primary_supplier_id)?.company_name || 'N/A'}</p>
                </div>
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                {currentStep > 1 && <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(s => s - 1)}>← Previous</button>}
                {currentStep < steps.length && <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(s => s + 1)}>Next →</button>}
                {currentStep === steps.length && <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Add Ingredient'}</button>}
            </div>
            {error && <p className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>}
        </form>
    );
};


const IngredientManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ingredients, setIngredients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ingredientsRes, suppliersRes] = await Promise.all([
                axios.get('/api/ingredients'),
                axios.get('/api/suppliers')
            ]);
            setIngredients(ingredientsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load page data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const priceIncreases = ingredients.filter(i => i.seven_day_change > 0).length;
    const priceDecreases = ingredients.filter(i => i.seven_day_change < 0).length;

    return (
        <>
            <header><h1>Ingredient Management</h1><button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ Add Ingredient</button></header>
            <div className="grid-container">
                <StatCard title="Total Ingredients" value={ingredients.length} /><StatCard title="Price Increases" value={priceIncreases} type="increase" />
                <StatCard title="Price Decreases" value={priceDecreases} type="decrease" /><StatCard title="Avg Price Change" value="+5.2%" type="avg-change" />
            </div>
            <div className="card">
                {loading && <p>Loading...</p>}
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                {!loading && !error && (
                    <table className="data-table">
                        <thead><tr><th>Ingredient</th><th>Current Price</th><th>Unit</th><th>7d Change</th><th>Actions</th></tr></thead>
                        <tbody>
                            {ingredients.map(ingredient => {
                                const change = ingredient.seven_day_change;
                                let changeClass = '';
                                let changeText = '—';
                                if (change > 0) {
                                    changeClass = 'price-change increase';
                                    changeText = `+${change}%`;
                                } else if (change < 0) {
                                    changeClass = 'price-change decrease';
                                    changeText = `${change}%`;
                                }
                                return (
                                    <tr key={ingredient.id}>
                                        <td>{ingredient.ingredient_name}</td>
                                        <td>${ingredient.current_price ? Number(ingredient.current_price).toFixed(2) : 'N/A'}</td>
                                        <td>/{ingredient.unit}</td>
                                        <td className={changeClass}>{changeText}</td>
                                        {/* Updated Action Link */}
                                        <td><Link to={`/ingredients/${ingredient.id}`} className="btn-link">View Analysis</Link></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Ingredient">
                <AddIngredientForm onClose={() => setIsModalOpen(false)} onSave={loadData} suppliers={suppliers} />
            </Modal>
        </>
    );
};
export default IngredientManagement;
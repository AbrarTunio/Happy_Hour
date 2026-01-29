import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import Stepper from '../components/Stepper';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AddSupplierForm } from './SupplierManagement';

// ... (Imports remain the same)

export const AddIngredientForm = ({ onClose, onSave, suppliers, onAddNewSupplier, initialData }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const steps = ['Basic Info', 'Supplier', 'Storage', 'Inventory'];
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        ingredient_name: '', category: '',
        unit: 'kg', // Default unit
        current_price: '',
        primary_supplier_id: '', brand: '', storage_type: 'Dry Storage',
        shelf_life: '', reorder_level: '0', maximum_stock: '0', notes: '',
    });

    // ... (useEffect for initialData remains same) ...
    useEffect(() => {
        if (initialData) {
            setFormData({
                ingredient_name: initialData.ingredient_name,
                category: initialData.category,
                unit: initialData.unit || 'kg',
                current_price: initialData.current_price,
                primary_supplier_id: initialData.primary_supplier_id || '',
                brand: initialData.brand || '',
                storage_type: initialData.storage_type || 'Dry Storage',
                shelf_life: initialData.shelf_life || '',
                reorder_level: initialData.reorder_level || '0',
                maximum_stock: initialData.maximum_stock || '0',
                notes: initialData.notes || '',
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // ... (handleSubmit remains same) ...
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (initialData) {
                await axios.put(`/api/ingredients/${initialData.id}`, formData);
                toast.success('Ingredient Updated Successfully!');
            } else {
                await axios.post('/api/ingredients', formData);
                toast.success('Ingredient Added Successfully!');
            }
            onSave();
            onClose();
        } catch (err) {
            let errorMessage = 'An unexpected error occurred.';
            if (err.response?.data?.errors) {
                errorMessage = Object.values(err.response.data.errors).flat().join(', ');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            toast.error(errorMessage);
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
                    <div className="form-group"><label>Category *</label><input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Dairy, Produce" required /></div>

                    {/* --- UPDATED UNIT INPUT TO DROPDOWN --- */}
                    <div className="form-group">
                        <label>Unit *</label>
                        <select name="unit" value={formData.unit} onChange={handleChange} required>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="litre">Litre</option>
                        </select>
                    </div>
                    {/* --------------------------------------- */}

                </div>
                <div className="form-group"><label>Current Price * (AUD)</label><input type="number" step="0.01" name="current_price" value={formData.current_price} onChange={handleChange} required /></div>
            </div>

            {/* ... (Steps 2, 3, 4 remain exactly the same) ... */}
            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                <h4>Supplier Details</h4>
                <div className="form-group">
                    <label>Primary Supplier *</label>
                    {suppliers.length > 0 ? (
                        <select name="primary_supplier_id" value={formData.primary_supplier_id} onChange={handleChange} required>
                            <option value="">Select a supplier</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
                        </select>
                    ) : (
                        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                            <p style={{ marginBottom: '10px', fontSize: '0.9em' }}>No suppliers found.</p>
                            <button type="button" className="btn btn-secondary" onClick={onAddNewSupplier}>+ Add New Supplier</button>
                        </div>
                    )}
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
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                {currentStep > 1 && <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(s => s - 1)}>← Previous</button>}
                {currentStep < steps.length && <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(s => s + 1)}>Next →</button>}
                {currentStep === steps.length && (
                    <button type="submit" className="btn btn-primary" disabled={loading || (!formData.primary_supplier_id && suppliers.length > 0)}>
                        {loading ? 'Saving...' : (initialData ? 'Update Ingredient' : 'Add Ingredient')}
                    </button>
                )}
            </div>
        </form>
    );
};

// ... (IngredientManagement component remains unchanged) ...
const IngredientManagement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [ingredients, setIngredients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIngredient, setSelectedIngredient] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [ingredientsRes, suppliersRes] = await Promise.all([
                axios.get('/api/ingredients'),
                axios.get('/api/suppliers')
            ]);
            setIngredients(ingredientsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            toast.error('Failed to load page data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSupplierAdded = async () => {
        const res = await axios.get('/api/suppliers');
        setSuppliers(res.data);
        setIsSupplierModalOpen(false);
    };

    const handleEdit = (ingredient) => {
        setSelectedIngredient(ingredient);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedIngredient(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Delete "${name}"?`)) {
            const loadingToast = toast.loading('Deleting...');
            try {
                await axios.delete(`/api/ingredients/${id}`);
                toast.success(`Ingredient "${name}" deleted.`, { id: loadingToast });
                loadData();
            } catch (err) {
                toast.error('Failed to delete ingredient.', { id: loadingToast });
            }
        }
    };

    const calculateAvgChange = () => {
        const ingredientsWithChange = ingredients.filter(i => typeof i.seven_day_change === 'number');
        if (ingredientsWithChange.length === 0) return '0.0%';
        const totalChange = ingredientsWithChange.reduce((sum, i) => sum + i.seven_day_change, 0);
        return (totalChange / ingredientsWithChange.length).toFixed(1) + '%';
    };

    const renderChange = (change) => {
        if (!change && change !== 0) return '-';
        const val = parseFloat(change);
        if (val > 0) {
            return <span style={{ color: '#e02424', fontWeight: 'bold' }}>+{val.toFixed(1)}%</span>;
        } else if (val < 0) {
            return <span style={{ color: '#0e9f6e', fontWeight: 'bold' }}>{val.toFixed(1)}%</span>;
        }
        return <span>{val.toFixed(1)}%</span>;
    };

    return (
        <>
            <header>
                <h1>Ingredient Management</h1>
                <button className="btn btn-primary" onClick={handleAdd}>+ Add Ingredient</button>
            </header>
            <div className="grid-container">
                <StatCard title="Total Ingredients" value={ingredients.length} />
                <StatCard title="Avg Price Change" value={calculateAvgChange()} type="avg-change" />
            </div>

            <div className="card table-container">
                <table className="data-table">
                    <thead><tr><th>Ingredient</th><th>Current Price</th><th>Unit</th><th>7d Change</th><th>Actions</th></tr></thead>
                    <tbody>
                        {ingredients.map(ingredient => (
                            <tr key={ingredient.id}>
                                <td>{ingredient.ingredient_name}</td>
                                <td>${Number(ingredient.current_price).toFixed(2)}</td>
                                <td>/{ingredient.unit}</td>
                                <td>{renderChange(ingredient.seven_day_change)}</td>
                                <td>
                                    <div className="actions-cell">
                                        <Link to={`/ingredients/${ingredient.id}`} className="btn-link">View</Link>
                                        <button onClick={() => handleEdit(ingredient)} className="btn-link">Edit</button>
                                        <button onClick={() => handleDelete(ingredient.id, ingredient.ingredient_name)} className="btn-delete">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedIngredient ? "Edit Ingredient" : "Add New Ingredient"}>
                <AddIngredientForm
                    onClose={() => setIsModalOpen(false)}
                    onSave={loadData}
                    suppliers={suppliers}
                    onAddNewSupplier={() => setIsSupplierModalOpen(true)}
                    initialData={selectedIngredient}
                />
            </Modal>

            {isSupplierModalOpen && (
                <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Add New Supplier">
                    <AddSupplierForm
                        onClose={() => setIsSupplierModalOpen(false)}
                        onSupplierAdded={handleSupplierAdded}
                    />
                </Modal>
            )}
        </>
    );
};
export default IngredientManagement;

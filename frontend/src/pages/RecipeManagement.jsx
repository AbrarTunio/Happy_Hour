import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import StatCard from '../components/StatsCard';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { AddIngredientForm } from './IngredientManagement';

// Updated Props: Added 'initialData' as a separate prop
export const CreateRecipeModal = ({ onClose, onSave, initialData, availableIngredients, onAddNewIngredient }) => {
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [formData, setFormData] = useState({ recipe_name: '', selling_price: '', target_margin: '' });
    const [loading, setLoading] = useState(false);

    const totalCost = recipeIngredients.reduce((acc, item) => acc + (item.current_price * item.quantity), 0);

    // Use the new 'initialData' prop here
    useEffect(() => {
        if (initialData) {
            setFormData({
                recipe_name: initialData.recipe_name,
                selling_price: initialData.selling_price,
                target_margin: initialData.target_margin || ''
            });
            const existing = initialData.ingredients.map(ing => ({
                ...ing,
                quantity: parseFloat(ing.pivot.quantity)
            }));
            setRecipeIngredients(existing);
        }
    }, [initialData]);

    const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleMarginChange = (e) => {
        const marginVal = e.target.value;
        setFormData(prev => ({ ...prev, target_margin: marginVal }));
        const marginNum = parseFloat(marginVal);
        if (!isNaN(marginNum) && totalCost > 0 && marginNum < 100) {
            const suggestedPrice = totalCost / (1 - (marginNum / 100));
            setFormData(prev => ({ ...prev, selling_price: suggestedPrice.toFixed(2) }));
        }
    };

    const addIngredient = (ingredient) => {
        if (recipeIngredients.some(item => item.id === ingredient.id)) {
            toast.error('Ingredient already added');
            return;
        }
        setRecipeIngredients(prev => [...prev, { ...ingredient, quantity: 1 }]);
        toast.success('Ingredient Added');
    };

    const handleQuantityChange = (id, newQuantity) => {
        const quantity = Math.max(0, parseFloat(newQuantity) || 0);
        setRecipeIngredients(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
    };

    const removeIngredient = (id) => {
        setRecipeIngredients(prev => prev.filter(item => item.id !== id));
        toast.success('Ingredient Removed');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (recipeIngredients.length === 0) {
            toast.error('Please add at least one ingredient.');
            return;
        }

        const sellingPriceNum = Number(formData.selling_price);
        if (sellingPriceNum < totalCost) {
            toast.error('Selling price cannot be less than total cost.');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            selling_price: sellingPriceNum,
            target_margin: Number(formData.target_margin) || 0,
            ingredients: recipeIngredients
                .filter(ing => ing.quantity > 0)
                .map(ing => ({ id: ing.id, quantity: ing.quantity })),
        };

        try {
            if (initialData) {
                await axios.put(`/api/recipes/${initialData.id}`, payload);
                toast.success('Recipe Updated Successfully!');
            } else {
                await axios.post('/api/recipes', payload);
                toast.success('Recipe Created Successfully!');
            }

            // FIX: Ensure onSave is a function before calling
            if (typeof onSave === 'function') {
                onSave();
            }

            onClose();
        } catch (err) {
            console.error("Recipe Save Error:", err);
            let errorMessage = 'An unexpected error occurred.';

            if (err.response) {
                if (err.response.status === 422) {
                    const errors = err.response.data.errors;
                    if (errors) {
                        errorMessage = Object.values(errors).flat().join('\n');
                    }
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            }
            toast.error(errorMessage);
        } finally { setLoading(false); }
    };

    const ingredientsToAdd = availableIngredients.filter(
        ing => !recipeIngredients.some(item => item.id === ing.id)
    );

    const sellingPriceNum = Number(formData.selling_price) || 0;
    const profit = sellingPriceNum - totalCost;
    const actualMargin = sellingPriceNum > 0 ? (profit / sellingPriceNum) * 100 : 0;

    return (
        <form onSubmit={handleSubmit}>
            <div className="recipe-modal-content">
                <div>
                    <h4>Recipe Information</h4>
                    <div className="form-group">
                        <label>Recipe Name *</label>
                        <input type="text" name="recipe_name" value={formData.recipe_name} onChange={handleChange} required placeholder="e.g. Smashed Avocado" />
                    </div>
                    <div className="input-group">
                        <div className="form-group">
                            <label>Target Margin %</label>
                            <input type="number" step="0.1" name="target_margin" value={formData.target_margin} onChange={handleMarginChange} placeholder="e.g. 70" />
                        </div>
                        <div className="form-group">
                            <label>Selling Price ($) *</label>
                            <input type="number" step="0.01" name="selling_price" value={formData.selling_price} onChange={handleChange} required placeholder="0.00" />
                        </div>
                    </div>
                </div>
                <div className="recipe-summary-card">
                    <h4>Recipe Summary</h4>
                    <p><span>Total Cost:</span> <span>${totalCost.toFixed(2)}</span></p>
                    <p><span>Selling Price:</span> <span>${sellingPriceNum.toFixed(2)}</span></p>
                    <p><span>Profit:</span> <span style={{ color: profit < 0 ? 'red' : 'inherit' }}>${profit.toFixed(2)}</span></p>
                    <p><strong><span>Actual Margin:</span> <span style={{ color: actualMargin < 0 ? 'red' : 'inherit' }}>{actualMargin.toFixed(1)}%</span></strong></p>
                </div>
                <div>
                    <h4>Available Ingredients</h4>
                    <div className="ingredients-list-container">
                        {ingredientsToAdd.length > 0 ? (
                            ingredientsToAdd.map(ing => (
                                <div key={ing.id} className="ingredient-item">
                                    <span>{ing.ingredient_name} <small>({ing.unit})</small></span>
                                    <button type="button" className="btn btn-primary" onClick={() => addIngredient(ing)}>Add</button>
                                </div>
                            ))
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#666' }}>
                                <p style={{ marginBottom: '10px' }}>No ingredients available.</p>
                                <button type="button" className="btn btn-secondary" onClick={onAddNewIngredient}>+ Add New Ingredient</button>
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h4>Recipe Ingredients *</h4>
                    <div className="ingredients-list-container">
                        {recipeIngredients.length > 0 ? recipeIngredients.map(ing => (
                            <div key={ing.id} className="ingredient-item">
                                <span>{ing.ingredient_name}</span>
                                <div className="ingredient-controls">
                                    <div className="quantity-control">
                                        <input type="number" step="0.01" value={ing.quantity} onChange={(e) => handleQuantityChange(ing.id, e.target.value)} />
                                    </div>
                                    <button type="button" className="btn-delete" onClick={() => removeIngredient(ing.id)}>Remove</button>
                                </div>
                            </div>
                        )) : <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No ingredients added yet.</p>}
                    </div>
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : (initialData ? 'Update Recipe' : 'Create Recipe')}</button>
            </div>
        </form>
    );
};

const RecipeManagement = () => {
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
    const [recipes, setRecipes] = useState([]);
    const [ingredients, setIngredients] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recipesRes, ingredientsRes, suppliersRes] = await Promise.all([
                axios.get('/api/recipes'),
                axios.get('/api/ingredients'),
                axios.get('/api/suppliers')
            ]);
            setRecipes(recipesRes.data);
            setIngredients(ingredientsRes.data);
            setSuppliers(suppliersRes.data);
        } catch (err) {
            toast.error('Failed to load page data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to delete the recipe "${name}"?`)) {
            const loadingToast = toast.loading('Deleting recipe...');
            try {
                await axios.delete(`/api/recipes/${id}`);
                toast.success(`Recipe "${name}" deleted.`, { id: loadingToast });
                loadData();
            } catch (err) {
                toast.error('Failed to delete recipe.', { id: loadingToast });
            }
        }
    };

    const handleIngredientSaved = async () => {
        const ingredientsRes = await axios.get('/api/ingredients');
        setIngredients(ingredientsRes.data);
        setIsIngredientModalOpen(false);
    };

    const avgRecipeCost = recipes.length > 0 ? (recipes.reduce((sum, r) => sum + Number(r.cost), 0) / recipes.length).toFixed(2) : '0.00';
    const avgMargin = recipes.length > 0 ? (recipes.reduce((sum, r) => sum + Number(r.margin), 0) / recipes.length).toFixed(1) : '0.0';

    return (
        <>
            <header><h1>Recipe Cost Management</h1><button className="btn btn-primary" onClick={() => setIsRecipeModalOpen(true)}>+ Create Recipe</button></header>
            <div className="grid-container">
                <StatCard title="Total Recipes" value={recipes.length} />
                <StatCard title="Avg Recipe Cost" value={`$${avgRecipeCost}`} />
                <StatCard title="Avg Margin" value={`${avgMargin}%`} />
            </div>
            <div className="card table-container">
                {loading && <p style={{ padding: '20px' }}>Loading...</p>}
                {!loading && (
                    <table className="data-table">
                        <thead><tr><th>Recipe</th><th>Cost</th><th>Selling Price</th><th>Margin</th><th>Actions</th></tr></thead>
                        <tbody>
                            {recipes.map(recipe => (
                                <tr key={recipe.id}>
                                    <td>{recipe.recipe_name}</td>
                                    <td>${Number(recipe.cost).toFixed(2)}</td>
                                    <td>${Number(recipe.selling_price).toFixed(2)}</td>
                                    <td>{Number(recipe.margin).toFixed(1)}%</td>
                                    <td>
                                        <div className="actions-cell">
                                            <Link to={`/recipes/${recipe.id}`} className="btn-link">View Details</Link>
                                            <button onClick={() => handleDelete(recipe.id, recipe.recipe_name)} className="btn-delete">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isRecipeModalOpen} onClose={() => setIsRecipeModalOpen(false)} title="Create New Recipe" modalClass="modal-lg">
                <CreateRecipeModal
                    onClose={() => setIsRecipeModalOpen(false)}
                    onSave={loadData}
                    // No initialData passed here for create mode
                    availableIngredients={ingredients}
                    onAddNewIngredient={() => setIsIngredientModalOpen(true)}
                />
            </Modal>

            {isIngredientModalOpen && (
                <Modal isOpen={isIngredientModalOpen} onClose={() => setIsIngredientModalOpen(false)} title="Add New Ingredient">
                    <AddIngredientForm onClose={() => setIsIngredientModalOpen(false)} onSave={handleIngredientSaved} suppliers={suppliers} />
                </Modal>
            )}
        </>
    );
};
export default RecipeManagement;

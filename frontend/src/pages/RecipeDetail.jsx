import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';
import Modal from '../components/Modal';
import { CreateRecipeModal } from './RecipeManagement'; // Import the modal form

const RecipeDetail = () => {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
    const [ingredients, setIngredients] = useState([]); // Available ingredients for dropdown

    // Fetch details + all ingredients (needed for the edit modal dropdown)
    const fetchRecipeDetails = async () => {
        setLoading(true);
        try {
            const [recipeRes, ingredientsRes] = await Promise.all([
                axios.get(`/api/recipes/${id}`),
                axios.get('/api/ingredients')
            ]);
            setRecipe(recipeRes.data);
            setIngredients(ingredientsRes.data);
        } catch (err) {
            setError('Failed to load recipe details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipeDetails();
    }, [id]);

    if (loading) return <p style={{ padding: '20px' }}>Loading recipe details...</p>;
    if (error) return <p className="error-message" style={{ padding: '20px' }}>{error}</p>;
    if (!recipe) return <p style={{ padding: '20px' }}>No recipe data found.</p>;

    return (
        <>
            <header>
                <div>
                    <Link to="/recipes" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Recipes</Link>
                    <h1>{recipe.recipe_name}</h1>
                </div>
                {/* Edit Button triggers modal */}
                <button className="btn btn-primary" onClick={() => setIsEditModalOpen(true)}>Edit Recipe</button>
            </header>

            <div className="grid-container">
                <StatCard title="Recipe Cost" value={`$${Number(recipe.cost ?? 0).toFixed(2)}`} />
                <StatCard title="Selling Price" value={`$${Number(recipe.selling_price ?? 0).toFixed(2)}`} />
                <StatCard title="Profit Margin" value={`${Number(recipe.margin ?? 0).toFixed(1)}%`} />
                <StatCard title="Ingredient Count" value={recipe.ingredients?.length || 0} />
            </div>

            <div className="card">
                <h3>Ingredients Breakdown</h3>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Ingredient</th>
                                <th>Quantity</th>
                                <th>Cost</th>
                                <th>% of Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(recipe.ingredients || []).map(ing => {
                                const cost = Number(ing.current_price ?? 0) * Number(ing.pivot?.quantity ?? 0);
                                const percentOfRecipe = (recipe.cost > 0) ? (cost / recipe.cost) * 100 : 0;
                                return (
                                    <tr key={ing.id}>
                                        <td><Link to={`/ingredients/${ing.id}`} className="btn-link">{ing.ingredient_name}</Link></td>
                                        <td>{Number(ing.pivot?.quantity ?? 0).toFixed(2)} {ing.unit}</td>
                                        <td>${cost.toFixed(2)}</td>
                                        <td>{percentOfRecipe.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="2" style={{ textAlign: 'right' }}><strong>Total Recipe Cost:</strong></td>
                                <td colSpan="2"><strong>${Number(recipe.cost ?? 0).toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* --- EDIT RECIPE MODAL --- */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Recipe" modalClass="modal-lg">
                <CreateRecipeModal
                    onClose={() => setIsEditModalOpen(false)}
                    // FIX: Pass onSave as a function, and initialData separately
                    onSave={() => {
                        fetchRecipeDetails();
                    }}
                    initialData={recipe} // Correctly passing initialData

                    availableIngredients={ingredients}
                    onAddNewIngredient={() => alert('To add completely new ingredients to the system, please go to the Ingredients page.')}
                />
            </Modal>
        </>
    );
};

export default RecipeDetail;

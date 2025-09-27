import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';

const RecipeDetail = () => {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecipeDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/recipes/${id}`);
                setRecipe(response.data);
            } catch (err) {
                setError('Failed to load recipe details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecipeDetails();
    }, [id]);

    if (loading) return <p>Loading recipe details...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!recipe) return <p>No recipe data found.</p>;

    return (
        <>
            <header>
                <div>
                    <Link to="/recipes" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Recipes</Link>
                    <h1>{recipe.recipe_name}</h1>
                </div>
                <button className="btn btn-primary">Edit Recipe</button>
            </header>

            <div className="grid-container">
                <StatCard title="Recipe Cost" value={`$${Number(recipe.cost ?? 0).toFixed(2)}`} />
                <StatCard title="Selling Price" value={`$${Number(recipe.selling_price ?? 0).toFixed(2)}`} />
                <StatCard title="Profit Margin" value={`${Number(recipe.margin ?? 0).toFixed(1)}%`} />
            </div>

            <div className="card">
                <h3>Ingredients</h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Ingredient</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Cost</th>
                            <th>% of Recipe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipe.ingredients?.map(ing => {
                            // --- THE FIX IS HERE ---
                            // Explicitly convert API strings to numbers before calculations.
                            const unitPrice = Number(ing.current_price ?? 0);
                            const quantity = Number(ing.pivot?.quantity ?? 0);
                            const cost = unitPrice * quantity;
                            const percentOfRecipe = (recipe.cost > 0) ? (cost / recipe.cost) * 100 : 0;

                            return (
                                <tr key={ing.id}>
                                    <td>{ing.ingredient_name}</td>
                                    <td>{quantity.toFixed(2)} {ing.unit}</td>
                                    {/* Now that unitPrice is a number, .toFixed() will work correctly */}
                                    <td>${unitPrice.toFixed(2)}</td>
                                    <td>${cost.toFixed(2)}</td>
                                    <td>{percentOfRecipe.toFixed(1)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'right' }}><strong>Total Recipe Cost:</strong></td>
                            <td colSpan="2"><strong>${Number(recipe.cost ?? 0).toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </>
    );
};

export default RecipeDetail;
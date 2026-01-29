import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatCard from '../components/StatsCard';

const IngredientDetail = () => {
    const { id } = useParams();
    const [ingredient, setIngredient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIngredientDetails = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/api/ingredients/${id}`);
                setIngredient(response.data);
            } catch (err) {
                setError('Failed to load ingredient details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchIngredientDetails();
    }, [id]);

    if (loading) return <p>Loading ingredient analysis...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!ingredient) return <p>No ingredient data found.</p>;

    return (
        <>
            <header>
                <div>
                    <Link to="/ingredients" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Ingredients</Link>
                    <h1>{ingredient.ingredient_name} Analysis</h1>
                </div>
            </header>

            <div className="grid-container">
                <StatCard title="Current Price" value={`$${Number(ingredient.current_price || 0).toFixed(2)} /${ingredient.unit}`} />
                <StatCard title="Category" value={ingredient.category} />
                <StatCard title="Primary Supplier" value={ingredient.supplier?.company_name || 'N/A'} />
                <StatCard title="Used In Recipes" value={ingredient.recipes.length} />
            </div>

            <div className="card">
                <h3>Recipe Cost Analysis</h3>
                {ingredient.recipes.length === 0 ? <p>This ingredient is not currently used in any recipes.</p> :
                    ingredient.recipes.map(recipe => {
                        const quantityUsed = recipe.pivot?.quantity || 0;
                        const costInRecipe = quantityUsed * (ingredient.current_price || 0);
                        const recipeTotalCost = recipe.cost || 0;
                        const percentOfRecipeCost = recipeTotalCost > 0 ? (costInRecipe / recipeTotalCost) * 100 : 0;

                        return (
                            <div className="recipe-analysis-item" key={recipe.id}>
                                <div className="usage-details">
                                    <h4><Link to={`/recipes/${recipe.id}`} className="btn-link">{recipe.recipe_name}</Link></h4>
                                    <p><strong>Usage:</strong> {quantityUsed} {ingredient.unit}s</p>
                                    <p><strong>Cost in Recipe:</strong> ${costInRecipe.toFixed(2)}</p>
                                    <p><strong>% of Recipe Cost:</strong> {percentOfRecipeCost.toFixed(1)}%</p>
                                </div>
                                <div className="profitability">
                                    <h4>Recipe Profitability</h4>
                                    <p><strong>Total Cost:</strong> ${Number(recipe.cost || 0).toFixed(2)}</p>
                                    <p><strong>Sell Price:</strong> ${Number(recipe.selling_price || 0).toFixed(2)}</p>
                                    <p><strong>Margin:</strong> {Number(recipe.margin || 0).toFixed(1)}%</p>
                                </div>
                            </div>
                        );
                    })
                }
            </div>

            <div className="card">
                <h3>Price History</h3>
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Logged Price per Unit</th></tr></thead>
                        <tbody>
                            {ingredient.price_history.map(log => (
                                <tr key={log.id}>
                                    <td>{new Date(log.log_date).toLocaleDateString()}</td>
                                    <td>${Number(log.price || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default IngredientDetail;

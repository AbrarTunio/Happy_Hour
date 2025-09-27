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

    // Calculate monthly cost safely, providing a default of 0 if usage is missing
    const monthlyUsage = ingredient.monthly_usage || 0;
    const monthlyCost = (ingredient.current_price * monthlyUsage).toFixed(2);


    return (
        <>
            <header>
                <div>
                    <Link to="/ingredients" className="btn-link" style={{ marginBottom: '10px', display: 'block' }}>&larr; Back to Ingredients</Link>
                    <h1>{ingredient.ingredient_name} Analysis</h1>
                </div>
            </header>

            <div className="grid-container" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <StatCard title="Current Price" value={`$${Number(ingredient.current_price || 0).toFixed(2)}`} />
                <StatCard title="Monthly Usage" value={`${monthlyUsage} ${ingredient.unit}s`} />
                <StatCard title="Monthly Cost" value={`$${monthlyCost}`} />
                <StatCard title="Used In Recipes" value={ingredient.recipes.length} />
            </div>

            <div className="card">
                <h3>Recipe Analysis</h3>
                {ingredient.recipes.map(recipe => {
                    // --- FIX IS HERE: Use correct properties from Laravel Models ---
                    const quantityUsed = recipe.pivot?.quantity || 0;
                    const costInRecipe = quantityUsed * (ingredient.current_price || 0);
                    const recipeTotalCost = recipe.cost || 0;
                    const percentOfRecipeCost = recipeTotalCost > 0 ? (costInRecipe / recipeTotalCost) * 100 : 0;

                    return (
                        <div className="recipe-analysis-item" key={recipe.id}>
                            <div className="usage-details">
                                <h4>{recipe.recipe_name}</h4>
                                <p><strong>Usage in Recipe</strong></p>
                                <p>Quantity: {quantityUsed} {ingredient.unit}s</p>
                                <p>Cost in Recipe: ${costInRecipe.toFixed(2)}</p>
                                <p>% of Recipe Cost: {percentOfRecipeCost.toFixed(2)}%</p>
                            </div>
                            <div className="profitability">
                                <h4>Recipe Profitability</h4>
                                {/* Use optional chaining (?.) and provide defaults (|| 0) to prevent crashes */}
                                <p>Recipe Cost: ${Number(recipe.cost || 0).toFixed(2)}</p>
                                <p>Selling Price: ${Number(recipe.selling_price || 0).toFixed(2)}</p>
                                <p>Margin: {Number(recipe.margin || 0).toFixed(1)}%</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="card">
                {/* --- FIX IS HERE: Renamed to Price History to match API data --- */}
                <h3>Price History</h3>
                <table className="data-table">
                    <thead><tr><th>Date</th><th>Logged Price per Unit</th></tr></thead>
                    <tbody>
                        {/* Use price_history from the API */}
                        {ingredient.price_history.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.log_date).toLocaleDateString()}</td>
                                <td>${Number(log.price || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default IngredientDetail;
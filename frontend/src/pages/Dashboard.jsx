import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatCard from '../components/StatsCard';
import { startOfMonth, parseISO, isAfter } from 'date-fns';

const Dashboard = () => {
    const [metrics, setMetrics] = useState({
        totalCogs: 0,
        priceAlerts: 0,
        potentialSavings: 0,
        invoicesProcessed: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch data from all necessary endpoints
                const [historyRes, ingredientsRes, insightsRes, invoicesRes] = await Promise.all([
                    // 1. Sales History for COGS (Defaulting to Sydney CBD for main dashboard)
                    axios.get('/api/sales-reconciliation/history', { params: { branch: 'Sydney CBD' } }),
                    // 2. Ingredients for Price Alerts
                    axios.get('/api/ingredients'),
                    // 3. AI Insights for Savings
                    axios.get('/api/ai-insights'),
                    // 4. Invoices for Processed Count
                    axios.get('/api/invoices')
                ]);

                // --- 1. Calculate Total COGS (MTD) ---
                // Filter history items that are in the current month
                const salesHistory = historyRes.data || [];
                const startOfCurrentMonth = startOfMonth(new Date());

                const totalCogs = salesHistory.reduce((sum, record) => {
                    const recordDate = parseISO(record.date);
                    // Check if date is in current month (or after start of month)
                    if (isAfter(recordDate, startOfCurrentMonth) || recordDate.getTime() === startOfCurrentMonth.getTime()) {
                        return sum + (parseFloat(record.total_cogs) || 0);
                    }
                    return sum;
                }, 0);

                // --- 2. Price Alerts (Ingredients with Increase OR Decrease) ---
                const ingredients = ingredientsRes.data || [];
                // Count ingredients where 7-day change is NOT 0
                const alertsCount = ingredients.filter(ing => Math.abs(ing.seven_day_change || 0) > 0).length;

                // --- 3. Potential Savings (AI Insights) ---
                const insights = insightsRes.data || [];
                const totalSavings = insights.reduce((sum, insight) => {
                    const val = parseFloat(insight.data?.impactValue || 0);
                    const unit = insight.data?.impactUnit || '';
                    // Only sum up monetary savings
                    if (val > 0 && (unit.includes('$') || unit.toLowerCase().includes('aud'))) {
                        return sum + val;
                    }
                    return sum;
                }, 0);

                // --- 4. Invoices Processed ---
                // If the API returns a stats object, use it, otherwise count manually
                const invoicesData = invoicesRes.data;
                let processedCount = 0;

                if (invoicesData.stats && typeof invoicesData.stats.approved !== 'undefined') {
                    processedCount = invoicesData.stats.approved;
                } else if (Array.isArray(invoicesData.invoices)) {
                    processedCount = invoicesData.invoices.filter(inv => inv.status === 'processed').length;
                } else if (Array.isArray(invoicesData)) {
                    // Fallback if API returns direct array
                    processedCount = invoicesData.filter(inv => inv.status === 'processed').length;
                }

                setMetrics({
                    totalCogs,
                    priceAlerts: alertsCount,
                    potentialSavings: totalSavings,
                    invoicesProcessed: processedCount
                });

            } catch (error) {
                console.error("Failed to load dashboard metrics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <>
            <header>
                <h1>COGS Dashboard</h1>
            </header>
            <div className="grid-container">
                <StatCard
                    title="Total COGS (MTD)"
                    value={loading ? "..." : `$${metrics.totalCogs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    type="increase" // Red/Blue to indicate cost
                />
                <StatCard
                    title="Price Alerts"
                    value={loading ? "..." : `${metrics.priceAlerts} Active`}
                    type={metrics.priceAlerts > 0 ? "danger" : ""} // Red if there are alerts
                />
                <StatCard
                    title="Potential Savings"
                    value={loading ? "..." : `$${metrics.potentialSavings.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
                    type="decrease" // Green to indicate savings
                />
                <StatCard
                    title="Invoices Processed"
                    value={loading ? "..." : metrics.invoicesProcessed}
                />
            </div>

            {/* Example: Re-add the waste prediction card if needed */}
            {/*
            <div className="card">
                <h3>Inventory Waste Prediction</h3>
                <div className="ai-card yellow-theme" style={{ marginTop: '20px' }}>
                    <h4>High Risk Items</h4>
                    <p>Spinach - Expires in 2 days. Predicted waste value: $147</p>
                </div>
            </div>
            */}
        </>
    );
};

export default Dashboard;

import React from 'react';
import StatCard from '../components/StatsCard';

const Dashboard = () => {
    return (
        <>
            <header>
                <h1>COGS Dashboard</h1>
                {/* You can add a dropdown here if needed */}
            </header>
            <div className="grid-container">
                <StatCard title="Total COGS (MTD)" value="$12,840" type="increase" />
                <StatCard title="Price Alerts" value="3 Critical" type="danger" />
                <StatCard title="Potential Savings" value="$2,140" type="decrease" />
                <StatCard title="Invoices Processed" value="24" />
            </div>

            <div className="card">
                <h3>Inventory Waste Prediction</h3>
                <div className="ai-card yellow-theme" style={{ marginTop: '20px' }}>
                    <h4>High Risk Items</h4>
                    <p>Spinach - Expires in 2 days. Predicted waste value: $147</p>
                    <p>Salmon Fillet - Expires in 3 days. Predicted waste value: $89</p>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
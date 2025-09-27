import React from 'react';

const StatCard = ({ title, value, type = '' }) => {
    return (
        <div className="card stat-card">
            <div className="stat-card-title">{title}</div>
            <div className={`stat-card-value ${type}`}>{value}</div>
        </div>
    );
};

export default StatCard;
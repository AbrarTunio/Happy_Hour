import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, addWeeks } from 'date-fns';
import KpiCreationModal from '../components/KpiCreationModal';

const InsightDetail = () => {
    const { id } = useParams();
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);

    const fetchInsight = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/ai-insights/${id}`);
            setInsight(response.data);
        } catch (error) {
            console.error("Failed to fetch insight", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInsight();
    }, [id]);

    if (loading) return <div className="card"><p style={{ padding: '20px' }}>Loading insight details...</p></div>;
    if (!insight) return <div className="card"><p style={{ padding: '20px' }}>Insight not found.</p></div>;

    const { data, kpi } = insight;

    // --- DYNAMIC DUE DATE LOGIC ---
    const getDynamicDueDate = () => {
        // 1. If a KPI exists, use the REAL Target Date
        if (kpi && kpi.end_date) {
            return {
                label: 'Target Deadline',
                value: format(parseISO(kpi.end_date), 'MMMM dd, yyyy'),
                isConcrete: true
            };
        }

        // 2. If no KPI, parse the AI's 'time_to_impact' text
        if (data.time_to_impact) {
            const impactText = data.time_to_impact.toLowerCase();

            // Try to find a number in the string (e.g. "2 weeks")
            const match = impactText.match(/(\d+)/);

            if (match && impactText.includes('week')) {
                const weeks = parseInt(match[0]);
                const projectedDate = addWeeks(new Date(), weeks);
                return {
                    label: 'Estimated Timeframe',
                    value: `${data.time_to_impact} (approx. ${format(projectedDate, 'MMM dd')})`,
                    isConcrete: false
                };
            }

            // Fallback if just text like "Immediate"
            return {
                label: 'Estimated Timeframe',
                value: data.time_to_impact,
                isConcrete: false
            };
        }

        return { label: 'Due Date', value: 'Not Set', isConcrete: false };
    };

    const dueDateInfo = getDynamicDueDate();

    return (
        <>
            <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <Link to="/ai-insights" className="btn-link" style={{ fontSize: '1.2rem' }}>&larr;</Link>
                <div>
                    <h1 style={{ margin: 0 }}>{data.name}</h1>
                    <span style={{ color: 'var(--dark-gray)' }}>{data.typeOfInsight} Insight</span>
                </div>
            </header>

            {/* --- Top Stats Grid --- */}
            <div className="grid-container" style={{ marginBottom: '20px' }}>
                <div className="card stat-card">
                    <div className="stat-card-title">Potential Impact</div>
                    <div className="stat-card-value decrease">
                        {data.impactValue ? `${data.impactValue}${data.impactUnit}` : 'N/A'}
                    </div>
                    <small>{data.insightType}</small>
                </div>

                <div className="card stat-card">
                    <div className="stat-card-title">Urgency</div>
                    <div className={`stat-card-value ${data.urgency >= 4 ? 'danger' : ''}`}>
                        {data.urgency}/5
                    </div>
                    <small>{data.urgency >= 4 ? 'Immediate Action' : 'Monitor'}</small>
                </div>

                {/* --- DYNAMIC DATE CARD --- */}
                <div className="card stat-card">
                    <div className="stat-card-title">{dueDateInfo.label}</div>
                    <div className="stat-card-value" style={{ fontSize: dueDateInfo.isConcrete ? '1.5rem' : '1.2rem' }}>
                        {dueDateInfo.value}
                    </div>
                    <small>{kpi ? 'Locked in KPI' : 'AI Projection'}</small>
                </div>
            </div>

            <div className="card">
                {/* Header / Summary */}
                <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3>Executive Summary</h3>
                    <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: '#555', lineHeight: '1.6' }}>
                        "{data.overall_summary}"
                    </p>
                </div>

                {/* Detailed Analysis */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
                    <div>
                        <h4>Analysis Details</h4>
                        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                            <h5 style={{ marginTop: 0, color: 'var(--primary-blue)', fontSize: '1.1rem' }}>{data.analysis_details?.title}</h5>
                            <p><strong>Root Cause:</strong> {data.analysis_details?.rootCause}</p>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                                {data.analysis_details?.commentary}
                            </div>
                        </div>

                        <h4>Recommended Actions</h4>
                        <ul className="insight-recommendations" style={{ fontSize: '1rem', paddingLeft: '20px' }}>
                            {data.recommendations?.map((rec, idx) => (
                                <li key={idx} style={{ marginBottom: '10px' }}>{rec}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Sidebar: KPI Status */}
                    <div>
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
                            <h4 style={{ marginTop: 0 }}>Status</h4>
                            {kpi ? (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <span className="status-tag status-active" style={{ fontSize: '1rem', padding: '8px 12px' }}>
                                            ✅ KPI Active
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#666' }}>Goal:</strong>
                                        {/* MODIFIED: Removed {kpi.unit} here */}
                                        <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                            {Number(kpi.baseline_value).toLocaleString()} &rarr; {Number(kpi.target_value).toLocaleString()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.9em', color: '#666', margin: 0 }}>
                                        Started: {format(parseISO(kpi.start_date), 'MMM dd, yyyy')}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p style={{ color: '#666', marginBottom: '20px' }}>No active KPI is tracking this insight yet.</p>
                                    <button className="btn btn-primary btn-full" onClick={() => setIsKpiModalOpen(true)}>
                                        Create KPI Now
                                    </button>
                                </>
                            )}
                        </div>

                        {data.financial_risk_level && (
                            <div style={{ marginTop: '20px', padding: '15px', background: '#fff1f0', borderRadius: '8px', border: '1px solid #ffa39e' }}>
                                <strong style={{ color: '#cf1322' }}>Risk Level: {data.financial_risk_level.toUpperCase()}</strong>
                                <p style={{ fontSize: '0.9em', margin: '5px 0 0 0' }}>
                                    Confidence Score: {data.data_confidence_level}%
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reuse the KPI Modal */}
            <KpiCreationModal
                isOpen={isKpiModalOpen}
                insight={insight}
                onClose={() => setIsKpiModalOpen(false)}
                onSave={() => {
                    fetchInsight(); // Refresh to show the new KPI
                    setIsKpiModalOpen(false);
                }}
            />
        </>
    );
};

export default InsightDetail;

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, addWeeks } from 'date-fns';
import Modal from '../components/Modal';
import KpiCreationModal from '../components/KpiCreationModal';

// --- InsightCard Component (unchanged) ---
const InsightCard = ({ insight, onCreateKpi }) => {
    const { data, kpi } = insight;
    if (!data) return null;

    const suggestedKpiTitle = `${data.typeOfInsight} ${data.insightType.replace(/ /g, '')} Initiative`;

    const getDueDateDisplay = () => {
        if (kpi && kpi.end_date) {
            return format(parseISO(kpi.end_date), 'MMM dd, yyyy');
        }
        if (data.time_to_impact) {
            const impactText = data.time_to_impact.toLowerCase();
            const weekMatch = impactText.match(/(\d+)\s*week/);
            if (weekMatch) {
                const weeks = parseInt(weekMatch[1]);
                const projectedDate = addWeeks(new Date(), weeks);
                return format(projectedDate, 'MMM dd') + ' (Est.)';
            }
            return data.time_to_impact;
        }
        return 'TBD';
    };

    const dueDateDisplay = getDueDateDisplay();

    return (
        <div className="insight-card actionable">
            <div className="insight-header">
                <div className="insight-title">
                    <h4>{data.name}</h4>
                </div>
                <div>
                    <span className={`tag tag-priority-${data.urgency}`}>{data.urgency >= 4 ? 'High Priority' : 'Actionable'}</span>
                </div>
            </div>
            <p className="insight-summary">{data.overall_summary}</p>

            <div className="insight-meta-grid compact">
                <div>
                    <span className="meta-title">Savings</span>
                    <span className="meta-value impact">{data.impactValue ? `${data.impactValue}${data.impactUnit}` : 'N/A'}</span>
                </div>
                <div>
                    <span className="meta-title">Confidence</span>
                    <span className="meta-value">{data.data_confidence_level || 'N/A'}%</span>
                </div>
                <div>
                    <span className="meta-title">Due Date</span>
                    <span className="meta-value">{dueDateDisplay}</span>
                </div>
            </div>

            {insight.kpi ? (
                <div className="suggested-kpi-box kpi-created">
                    <span>✓ KPI Created: <strong>{insight.kpi.title}</strong></span>
                </div>
            ) : (
                <div className="suggested-kpi-box">
                    <div>
                        <strong>💡 Suggested KPI</strong>
                        <p>{suggestedKpiTitle}</p>
                        <small>Target: {data.recommendations ? data.recommendations[0] : 'Improve metric'}</small>
                    </div>
                    <button className="btn btn-primary" onClick={() => onCreateKpi(insight)}>
                        Create KPI
                    </button>
                </div>
            )}

            <div className="insight-footer-actions">
                <Link to={`/ai-insights/${insight.id}`} className="btn-link">View Details &rarr;</Link>
            </div>
        </div>
    );
};

// --- Main Component ---
const AiInsights = () => {
    const [allInsights, setAllInsights] = useState([]);
    const [allKpis, setAllKpis] = useState([]); // State for KPIs
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Modal States
    const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
    const [isActiveKpisListOpen, setIsActiveKpisListOpen] = useState(false); // State for List Modal

    const [selectedInsight, setSelectedInsight] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [insightsRes, kpisRes] = await Promise.all([
                axios.get('/api/ai-insights'),
                axios.get('/api/kpis')
            ]);
            setAllInsights(insightsRes.data);
            setAllKpis(kpisRes.data);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateInsights = async () => {
        setGenerating(true);
        try {
            await axios.post('/api/ai-insights/generate');
            alert("New insights generated! Refreshing...");
            fetchData();
        } catch (error) {
            const errorMessage = error.response?.data?.message || "Failed to generate insights.";
            alert(`Error: ${errorMessage.split('\n\n')[0]}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleCreateKpi = (insight) => {
        setSelectedInsight(insight);
        setIsKpiModalOpen(true);
    };

    // Filters
    const { supplierInsights, recipeInsights, ingredientInsights } = useMemo(() => {
        const supplierInsights = allInsights.filter(i => i.insightable_type && i.insightable_type.endsWith('Supplier'));
        const recipeInsights = allInsights.filter(i => i.insightable_type && i.insightable_type.endsWith('Recipe'));
        const ingredientInsights = allInsights.filter(i => i.insightable_type && i.insightable_type.endsWith('Ingredient'));
        return { supplierInsights, recipeInsights, ingredientInsights };
    }, [allInsights]);

    const activeKpis = useMemo(() => allKpis.filter(k => k.status === 'active'), [allKpis]);
    const kpisCreatedFromInsightsCount = useMemo(() => allInsights.filter(i => !!i.kpi).length, [allInsights]);

    const totalPotentialImpact = useMemo(() => allInsights.reduce((sum, i) => {
        if (i.data && (String(i.data.impactUnit).includes('$') || String(i.data.impactUnit).toLowerCase().includes('aud'))) {
            return sum + (parseFloat(i.data.impactValue) || 0);
        }
        return sum;
    }, 0), [allInsights]);

    const highPriorityCount = useMemo(() => allInsights.filter(i => i.data && i.data.urgency >= 4).length, [allInsights]);

    return (
        <>
            <header>
                <div>
                    <h1>AI Insights & KPI Manager</h1>
                    <p style={{ color: 'var(--dark-gray)', marginTop: '5px' }}>Transform AI insights into actionable KPIs and track performance</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* --- ACTIVE KPIs BUTTON --- */}
                    <button className="btn btn-secondary" onClick={() => setIsActiveKpisListOpen(true)}>
                        Active KPIs ({activeKpis.length})
                    </button>

                    <button className="btn btn-primary" onClick={handleGenerateInsights} disabled={generating || loading}>
                        {generating ? 'Analyzing...' : '💡 AI Insights'}
                    </button>
                </div>
            </header>

            <div className="grid-container" style={{ marginBottom: '30px' }}>
                <div className="stat-card minimal"><div className="stat-card-title">New Insights</div><div className="stat-card-value">{allInsights.length}</div><small>Ready for action</small></div>
                <div className="stat-card minimal"><div className="stat-card-title">Potential Impact</div><div className="stat-card-value">${totalPotentialImpact.toLocaleString()}</div><small>Monthly savings</small></div>
                <div className="stat-card minimal"><div className="stat-card-title">High Priority</div><div className="stat-card-value">{highPriorityCount}</div><small>Need immediate attention</small></div>
                <div className="stat-card minimal"><div className="stat-card-title">KPIs Created</div><div className="stat-card-value">{kpisCreatedFromInsightsCount}</div><small>From insights</small></div>
            </div>

            <div className="card">
                <div className="insights-tabs">
                    <button className="active">Total Insights <span className="count-badge">{allInsights.length}</span></button>
                </div>

                <div className="insights-container">
                    {loading ? <p style={{ textAlign: 'center', padding: '40px' }}>Loading insights...</p> : (
                        allInsights.length > 0 ? (
                            <>
                                {supplierInsights.length > 0 && (
                                    <div className="insight-section">
                                        <h3><span className="icon">🚚</span> Suppliers Insights <span className="count-badge">{supplierInsights.length}</span></h3>
                                        <div className="insights-grid">
                                            {supplierInsights.map(insight => <InsightCard key={insight.id} insight={insight} onCreateKpi={handleCreateKpi} />)}
                                        </div>
                                    </div>
                                )}
                                {recipeInsights.length > 0 && (
                                    <div className="insight-section">
                                        <h3><span className="icon">🍲</span> Recipes Insights <span className="count-badge">{recipeInsights.length}</span></h3>
                                        <div className="insights-grid">
                                            {recipeInsights.map(insight => <InsightCard key={insight.id} insight={insight} onCreateKpi={handleCreateKpi} />)}
                                        </div>
                                    </div>
                                )}
                                {ingredientInsights.length > 0 && (
                                    <div className="insight-section">
                                        <h3><span className="icon">🌿</span> Ingredients Insights <span className="count-badge">{ingredientInsights.length}</span></h3>
                                        <div className="insights-grid">
                                            {ingredientInsights.map(insight => <InsightCard key={insight.id} insight={insight} onCreateKpi={handleCreateKpi} />)}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '50px', margin: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <h3>No Insights Found</h3>
                                <p>Click the "AI Insights" button to analyze your data.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            {selectedInsight && (
                <KpiCreationModal
                    isOpen={isKpiModalOpen}
                    insight={selectedInsight}
                    onClose={() => setIsKpiModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            {/* --- ACTIVE KPIS MODAL --- */}
            <Modal isOpen={isActiveKpisListOpen} onClose={() => setIsActiveKpisListOpen(false)} title={`Active KPIs (${activeKpis.length})`}>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {activeKpis.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No active KPIs found.</p>
                    ) : (
                        activeKpis.map(kpi => (
                            <div key={kpi.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{kpi.title}</h4>
                                    <span className="status-tag status-active">Active</span>
                                </div>
                                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>
                                    Target: {Number(kpi.target_value).toLocaleString()} {kpi.unit} (By {format(parseISO(kpi.end_date), 'MMM dd')})
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                                    <div style={{ flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                        {/* Simple progress bar visualization */}
                                        <div style={{
                                            width: '20%', // Placeholder progress
                                            height: '100%',
                                            background: 'var(--primary-blue)'
                                        }}></div>
                                    </div>
                                    {kpi.ai_insight_id && (
                                        <Link to={`/ai-insights/${kpi.ai_insight_id}`} className="btn-link" onClick={() => setIsActiveKpisListOpen(false)}>
                                            View Insight
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setIsActiveKpisListOpen(false)}>Close</button>
                </div>
            </Modal>

        </>
    );
};

export default AiInsights;

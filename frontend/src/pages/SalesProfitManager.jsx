import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import Modal from '../components/Modal';
import { toast } from 'react-hot-toast';

const UploadReceiptModal = ({ isOpen, onClose, onUpload, date }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => setFile(e.target.files[0]);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('receipt', file);
        try {
            await onUpload(formData);
            onClose();
        } catch (error) {
            // Toast is handled in parent
        } finally {
            setUploading(false);
            setFile(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Upload Receipt">
            <div className="upload-dropzone" onClick={() => document.getElementById('receipt-file-input').click()}>
                <input type="file" id="receipt-file-input" hidden onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
                {file ? <p>Selected: {file.name}</p> : <p>Click to upload<br /><small>PDF, JPG or PNG</small></p>}
            </div>
            <p style={{ textAlign: 'center', margin: '15px 0', color: '#666' }}>
                Upload the Z-Read or POS receipt for {date}
            </p>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
        </Modal>
    );
};

const SalesProfitManager = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [branch, setBranch] = useState('Sydney CBD');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [initialViewMode, setInitialViewMode] = useState(null);
    const [currentReconId, setCurrentReconId] = useState(null);

    const navigateToHistory = () => setActiveTab('history');

    const handleEditFromHistory = (id, targetDate) => {
        setDate(targetDate);
        setCurrentReconId(id);
        setInitialViewMode('entry');
        setActiveTab('reconciliation');
    };

    const handleUploadFromDashboard = (uploadDate) => {
        setDate(uploadDate);
        setCurrentReconId(null);
        setInitialViewMode('entry');
        setActiveTab('reconciliation');
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'reconciliation') {
            setCurrentReconId(null);
            setInitialViewMode(null);
        }
    };

    return (
        <>
            <header>
                <div>
                    <h1>Sales & Profit Manager</h1>
                    <p style={{ color: 'var(--dark-gray)' }}>Daily receipts, recipe breakdown & reconciliation</p>
                </div>
                <div className="recon-tabs">
                    <button onClick={() => handleTabChange('dashboard')} className={activeTab === 'dashboard' ? 'active' : ''}>📊 Dashboard</button>
                    <button onClick={() => handleTabChange('reconciliation')} className={activeTab === 'reconciliation' ? 'active' : ''}>📋 Reconciliation</button>
                    <button onClick={() => handleTabChange('history')} className={activeTab === 'history' ? 'active' : ''}>🗂️ History</button>
                </div>
            </header>

            {activeTab !== 'dashboard' && (
                <div className="card filter-bar">
                    <div className="form-group"><label>Branch</label><select value={branch} onChange={e => setBranch(e.target.value)}><option>Sydney CBD</option></select></div>
                    <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e => { setDate(e.target.value); setCurrentReconId(null); }} /></div>
                </div>
            )}

            {activeTab === 'dashboard' && (
                <DashboardView branch={branch} onUploadSuccess={handleUploadFromDashboard} />
            )}

            {activeTab === 'reconciliation' && (
                <ReconciliationWorkflowView
                    key={`${date}-${currentReconId}`}
                    branch={branch}
                    date={date}
                    reconId={currentReconId}
                    forcedViewMode={initialViewMode}
                    onNavigateToHistory={navigateToHistory}
                    onNavigateToDashboard={() => setActiveTab('dashboard')}
                />
            )}

            {activeTab === 'history' && (
                <HistoryView branch={branch} onEdit={handleEditFromHistory} />
            )}
        </>
    );
};

const DashboardView = ({ branch, onUploadSuccess }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const today = format(new Date(), 'yyyy-MM-dd');

    useEffect(() => {
        setLoading(true);
        axios.get('/api/sales-reconciliation/dashboard', { params: { branch } })
            .then(res => setStats(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [branch]);

    const handleUpload = async (formData) => {
        const loadingToast = toast.loading('Processing Receipt...');
        try {
            const res = await axios.get(`/api/sales-reconciliation?branch=${branch}&date=${today}`);
            const reconId = res.data.id;
            await axios.post(`/api/sales-reconciliation/${reconId}/upload`, formData);

            toast.success('Receipt Uploaded!', { id: loadingToast });
            setIsUploadModalOpen(false);
            onUploadSuccess(today);
        } catch (err) {
            const msg = err.response?.data?.message || 'Upload failed.';
            toast.error(msg, { id: loadingToast });
        }
    };

    if (loading || !stats) return <div className="card"><p>Loading dashboard...</p></div>;

    return (
        <>
            <div className="card">
                <div className="grid-container recon-stats">
                    <div className="recon-stat-card"><h3>Total Sales (MTD)</h3><p>${Number(stats.total_sales_mtd).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                    <div className="recon-stat-card"><h3>Avg. Variance</h3><p className={Math.abs(stats.avg_variance_percent) > 2 ? 'variance-error' : ''}>{stats.avg_variance_percent.toFixed(1)}%</p></div>
                    <div className="recon-stat-card"><h3>Pending</h3><p>{stats.pending_reconciliations}</p></div>
                    <div className="recon-stat-card"><h3>Needs Review</h3><p>{stats.needs_review_reconciliations}</p></div>
                </div>
            </div>

            <div className="card" style={{ marginTop: '20px', textAlign: 'center', padding: '40px', border: '2px dashed var(--border-color)' }}>
                <h3>📅 Today's Reconciliation ({today})</h3>
                <p style={{ color: '#666', margin: '10px 0 20px' }}>Upload your Z-Read receipt to automatically extract sales data and begin reconciliation.</p>
                <button className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '12px 24px' }} onClick={() => setIsUploadModalOpen(true)}>
                    📤 Upload Receipt for Today
                </button>
            </div>

            <UploadReceiptModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUpload} date={today} />
        </>
    );
};

const ReconciliationWorkflowView = ({ branch, date, reconId, forcedViewMode, onNavigateToHistory, onNavigateToDashboard }) => {
    const [reconciliation, setReconciliation] = useState(null);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const [breakdownItems, setBreakdownItems] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [editingIndex, setEditingIndex] = useState(null);
    const [editQuantity, setEditQuantity] = useState(1);

    const [viewMode, setViewMode] = useState('initial');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recipesRes, historyRes] = await Promise.all([
                axios.get('/api/recipes'),
                // If editing specific ID, get history to find it. Otherwise get current.
                // Note: Optimal backend would have /api/sales-reconciliation/{id} endpoint.
                // For now, we filter history if reconId is passed.
                axios.get(`/api/sales-reconciliation/history`, { params: { branch } })
            ]);

            setRecipes(recipesRes.data);

            let targetRecon = null;

            if (reconId) {
                // Find specific historical record
                targetRecon = historyRes.data.find(r => r.id === reconId);
            }

            // If not found in history or not editing specific ID, fetch/create for date
            if (!targetRecon) {
                const dateRes = await axios.get(`/api/sales-reconciliation?branch=${branch}&date=${date}`);
                targetRecon = dateRes.data;
            }

            setReconciliation(targetRecon);

            // Populate Breakdown Items from the target record
            if (targetRecon && targetRecon.recipe_breakdown && Array.isArray(targetRecon.recipe_breakdown)) {
                const mappedItems = targetRecon.recipe_breakdown.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    actual_price: Number(item.actual_price),
                    total_sale: Number(item.quantity) * Number(item.actual_price),
                    unit_cogs: Number(item.unit_cogs),
                    total_cogs: Number(item.total_cogs)
                }));
                setBreakdownItems(mappedItems);
            } else {
                setBreakdownItems([]);
            }

            // Set View Mode
            if (forcedViewMode) {
                setViewMode(forcedViewMode);
            } else if (targetRecon && targetRecon.total_sales_from_receipt) {
                if (targetRecon.status === 'pending') {
                    setViewMode('entry');
                } else {
                    setViewMode('review');
                }
            } else {
                setViewMode('initial');
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [branch, date, reconId]);

    const handleRecipeChange = (val) => setSelectedRecipe(val);

    const handleAddItem = () => {
        if (!selectedRecipe || quantity <= 0) return;
        const recipe = recipes.find(r => r.id == selectedRecipe);
        if (!recipe) return;

        if (breakdownItems.some(i => i.recipe_id === recipe.id)) {
            toast.error("This recipe has already been added.");
            return;
        }

        const newItem = {
            recipe_id: recipe.id, name: recipe.recipe_name, quantity: Number(quantity), actual_price: Number(recipe.selling_price),
            total_sale: Number(quantity) * Number(recipe.selling_price), unit_cogs: Number(recipe.cost), total_cogs: Number(recipe.cost) * Number(quantity)
        };
        setBreakdownItems(prev => [...prev, newItem]);
        setSelectedRecipe(''); setQuantity(1);
    };

    const handleDeleteItem = (indexToDelete) => setBreakdownItems(prev => prev.filter((_, index) => index !== indexToDelete));

    const handleEditItem = (index) => {
        const item = breakdownItems[index];
        setEditQuantity(item.quantity);
        setEditingIndex(index);
    };

    const handleUpdateItem = () => {
        if (editingIndex === null) return;
        const updatedItems = breakdownItems.map((item, index) => {
            if (index === editingIndex) {
                const newQty = Number(editQuantity);
                return {
                    ...item,
                    quantity: newQty,
                    total_sale: newQty * item.actual_price,
                    total_cogs: item.unit_cogs * newQty
                };
            }
            return item;
        });
        setBreakdownItems(updatedItems);
        handleCancelEdit();
    };

    const handleCancelEdit = () => { setEditingIndex(null); setEditQuantity(1); };

    const handleUpload = async (formData) => {
        if (!reconciliation) return;
        const loadingToast = toast.loading('Processing Receipt...');
        try {
            await axios.post(`/api/sales-reconciliation/${reconciliation.id}/upload`, formData);
            await fetchData();
            toast.success('Receipt Uploaded!', { id: loadingToast });
            setViewMode('entry');
        } catch (err) {
            const msg = err.response?.data?.message || 'Upload failed.';
            toast.error(msg, { id: loadingToast });
            fetchData(); // Refresh
        }
    };

    const handleReconcile = async () => {
        if (!reconciliation) return;
        setLoading(true);
        const loadingToast = toast.loading('Reconciling...');
        try {
            const payload = { items: breakdownItems };
            const res = await axios.put(`/api/sales-reconciliation/${reconciliation.id}/breakdown`, payload);
            setReconciliation(res.data);
            toast.success('Reconciliation Saved', { id: loadingToast });
            setViewMode('review');
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to save reconciliation.";
            toast.error(msg, { id: loadingToast });
        }
        finally { setLoading(false); }
    };

    const handleFlagForReview = async () => {
        if (!reconciliation) return;
        setLoading(true);
        try {
            await axios.post(`/api/sales-reconciliation/${reconciliation.id}/flag`);
            toast.success('Flagged for Review');
            onNavigateToHistory();
        } catch (error) { toast.error("Failed to flag."); }
        finally { setLoading(false); }
    };

    const handleConfirm = async () => {
        if (!reconciliation) return;
        setLoading(true);
        try {
            await axios.post(`/api/sales-reconciliation/${reconciliation.id}/confirm`);
            toast.success('Confirmed & Closed');
            onNavigateToHistory();
        } catch (error) { toast.error("Failed to confirm."); }
        finally { setLoading(false); }
    };

    // Calculate dynamic totals for current state
    const breakdownTotal = useMemo(() => breakdownItems.reduce((sum, item) => sum + (Number(item.total_sale) || 0), 0), [breakdownItems]);
    const variance = useMemo(() => (Number(reconciliation?.total_sales_from_receipt) || 0) - breakdownTotal, [reconciliation, breakdownTotal]);

    if (loading) return <div className="card"><p>Loading...</p></div>;

    return (
        <>
            {viewMode !== 'initial' && viewMode !== 'review' && (
                <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                    <button className="btn btn-secondary" onClick={() => setIsUploadModalOpen(true)}>Re-upload Receipt</button>
                </div>
            )}

            {viewMode === 'initial' && (
                <InitialView
                    onUploadClick={() => setIsUploadModalOpen(true)}
                    date={date}
                    status={reconciliation?.status}
                />
            )}

            {viewMode === 'entry' && (
                <DataEntryView
                    reconciliation={reconciliation}
                    recipes={recipes}
                    breakdownItems={breakdownItems}
                    selectedRecipe={selectedRecipe}
                    quantity={quantity}
                    breakdownTotal={breakdownTotal}
                    variance={variance}
                    editingIndex={editingIndex}
                    editQuantity={editQuantity}
                    setQuantity={setQuantity}
                    handleRecipeChange={handleRecipeChange}
                    handleAddItem={handleAddItem}
                    handleDeleteItem={handleDeleteItem}
                    handleEditItem={handleEditItem}
                    setEditQuantity={setEditQuantity}
                    handleUpdateItem={handleUpdateItem}
                    handleCancelEdit={handleCancelEdit}
                    onReconcile={handleReconcile}
                />
            )}

            {viewMode === 'review' && (
                <ReconciliationResultView
                    reconciliation={reconciliation}
                    onConfirm={handleConfirm}
                    onFlagForReview={handleFlagForReview}
                    onBackToDashboard={onNavigateToDashboard}
                    onBackToEdit={() => setViewMode('entry')}
                />
            )}

            <UploadReceiptModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleUpload} date={date} />
        </>
    );
};

// ... (InitialView remains the same)
const InitialView = ({ onUploadClick, date, status }) => (
    <>
        <div className="grid-container recon-stats">
            <div className="recon-stat-card"><h3>Total Sales</h3><p>$0.00</p><small>Waiting for receipt</small></div>
            <div className="recon-stat-card"><h3>Breakdown</h3><p>$0.00</p><small>0 recipes</small></div>
            <div className="recon-stat-card"><h3>Variance</h3><p>$0.00</p><small>--</small></div>
            <div className="recon-stat-card">
                <h3>Status</h3>
                {status === 'rejected' ? (
                    <p style={{ color: 'var(--red)', fontSize: '1.2rem', fontWeight: 'bold' }}>❌ Rejected</p>
                ) : (
                    <p>⏳ Pending</p>
                )}
            </div>
        </div>

        {status === 'rejected' && (
            <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', border: '1px solid #f87171' }}>
                <strong>Error:</strong> The uploaded file was identified as <u>NOT</u> a valid Sales Receipt. Please upload a correct Z-Read or Sales Summary.
            </div>
        )}

        <div className="upload-prompt">
            <h4>📤 Upload Receipt</h4>
            <p>No valid receipt uploaded yet for {date}</p>
            <button className="btn btn-primary" onClick={onUploadClick}>Upload Receipt Now</button>
        </div>
    </>
);

const DataEntryView = (props) => {
    const selectedRecipeData = useMemo(() => props.recipes.find(r => r.id == props.selectedRecipe), [props.selectedRecipe, props.recipes]);

    const availableRecipes = useMemo(() => {
        return props.recipes.filter(r => !props.breakdownItems.some(b => b.recipe_id === r.id));
    }, [props.recipes, props.breakdownItems]);

    const receiptFileName = props.reconciliation.receipt_file_path
        ? props.reconciliation.receipt_file_path.split('/').pop()
        : 'No File Uploaded';

    return (
        <>
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="receipt-details-bar" style={{ border: 'none', padding: 0 }}>
                    <div>
                        <small>Receipt File</small>
                        <p>{receiptFileName}</p>
                    </div>
                    <div>
                        <small>Receipt Total</small>
                        <h4>${Number(props.reconciliation.total_sales_from_receipt || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    </div>
                    <span className="status-tag status-pending">Data Entry In Progress</span>
                </div>
            </div>

            <div className="card">
                <div className="breakdown-section">
                    <h4>📊 Recipe Sales Breakdown</h4>
                    <p>Enter recipes sold to match the receipt total of <strong>${Number(props.reconciliation.total_sales_from_receipt || 0).toLocaleString()}</strong></p>

                    <div className="add-item-form">
                        <select value={props.selectedRecipe} onChange={e => props.handleRecipeChange(e.target.value)}>
                            <option value="">Select a recipe...</option>
                            {availableRecipes.map(r => <option key={r.id} value={r.id}>{r.recipe_name} (${Number(r.selling_price).toFixed(2)})</option>)}
                        </select>
                        <input type="number" value={props.quantity} onChange={e => props.setQuantity(e.target.value)} min="1" placeholder="Qty" />
                        <div className="form-group-static"><label>Price</label><span>${selectedRecipeData ? Number(selectedRecipeData.selling_price).toFixed(2) : '0.00'}</span></div>
                        {props.editingIndex !== null ? (
                            <div className="edit-buttons"><button className="btn btn-primary" onClick={props.handleUpdateItem}>Update</button><button className="btn btn-secondary" onClick={props.handleCancelEdit}>Cancel</button></div>
                        ) : (
                            <button className="btn btn-primary" onClick={props.handleAddItem}>+ Add</button>
                        )}
                    </div>
                </div>

                {/* Ensure this section renders if items exist */}
                {props.breakdownItems && props.breakdownItems.length > 0 && (
                    <div className="recipes-recorded-section">
                        <h4>Recorded Items</h4>
                        {props.breakdownItems.map((item, index) => (
                            <div key={index} className={`recorded-item ${props.editingIndex === index ? 'editing' : ''}`}>
                                {props.editingIndex === index ? (
                                    <div className="edit-form">
                                        <p>{item.name}</p>
                                        <input type="number" value={props.editQuantity} onChange={e => props.setEditQuantity(e.target.value)} autoFocus />
                                        <div className="form-group-static"><label>Price</label><span>${Number(item.actual_price).toFixed(2)}</span></div>
                                        <button className="btn btn-primary" onClick={props.handleUpdateItem}>Save</button>
                                        <button className="btn btn-secondary" onClick={props.handleCancelEdit}>Cancel</button>
                                    </div>
                                ) : (
                                    <>
                                        <p>{item.name}</p>
                                        <span>Qty: {item.quantity} @ ${Number(item.actual_price).toFixed(2)} = <strong>${item.total_sale.toFixed(2)}</strong></span>
                                        <div>
                                            <button className="btn-link" onClick={() => props.handleEditItem(index)}>Edit</button>
                                            <button className="btn-delete" onClick={() => props.handleDeleteItem(index)}>Delete</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="reconciliation-summary">
                    <div><small>Receipt Total</small><h4>${Number(props.reconciliation.total_sales_from_receipt || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4></div>
                    <div><small>Current Breakdown</small><h4>${props.breakdownTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4></div>
                    <div className="variance-box">
                        <small>Remaining Variance</small>
                        <h4 style={{ color: props.variance === 0 ? 'green' : 'red' }}>${props.variance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h4>
                    </div>
                </div>

                <button className="btn btn-primary btn-full" onClick={props.onReconcile}>
                    ✓ Reconcile & Review
                </button>
            </div>
        </>
    );
};

const ReconciliationResultView = ({ reconciliation, onConfirm, onFlagForReview, onBackToDashboard, onBackToEdit }) => (
    <div className="card">
        <div className={`status-banner status-${reconciliation.status.replace('_', '-')}`}>
            <h4>Status: {reconciliation.status.replace('_', ' ')}</h4>
            <p>{reconciliation.status === 'needs_review' ? 'Needs investigation - significant variance' : 'Reconciled successfully.'}</p>
        </div>

        <div className="variance-analysis">
            <h4>Variance Analysis</h4>
            <h2>${Math.abs(reconciliation.variance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            <p>Variance of {(((reconciliation.total_sales_from_receipt || 0) > 0 ? reconciliation.variance / reconciliation.total_sales_from_receipt : 0) * 100).toFixed(2)}%</p>
            <div className="progress-bar-container">
                <div style={{ width: `${Math.min(100, Math.abs((((reconciliation.total_sales_from_receipt || 0) > 0 ? reconciliation.variance / reconciliation.total_sales_from_receipt : 0) * 100)))}%`, background: 'var(--red)' }} className="progress-bar"></div>
            </div>
        </div>

        <div className="profitability-analysis">
            <h4>Profitability</h4>
            <p><span>Total Sales</span> <span>${Number(reconciliation.total_sales_from_receipt || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
            <p><span>Est. COGS</span> <span>${Number(reconciliation.total_cogs || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
            <p><strong><span>Gross Profit</span> <span>${(reconciliation.total_sales_from_receipt - reconciliation.total_cogs).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></strong></p>
        </div>

        <div className="table-container">
            <h4>Detailed Reconciliation</h4>
            <table className="data-table">
                <thead><tr><th>Recipe</th><th>Qty</th><th>Unit Price</th><th>Total Sale</th><th>COGS/Unit</th><th>Total COGS</th><th>Margin</th></tr></thead>
                <tbody>
                    {(reconciliation.recipe_breakdown || []).map((item, i) => {
                        const totalSale = item.quantity * item.actual_price;
                        const margin = totalSale > 0 ? ((totalSale - item.total_cogs) / totalSale) * 100 : 0;
                        return (<tr key={i}><td>{item.name}</td><td>{item.quantity}</td><td>${Number(item.actual_price).toFixed(2)}</td><td>${totalSale.toFixed(2)}</td><td>${Number(item.unit_cogs).toFixed(2)}</td><td>${Number(item.total_cogs).toFixed(2)}</td><td style={{ color: margin < 0 ? 'var(--red)' : 'var(--primary-green)' }}>{margin.toFixed(1)}%</td></tr>)
                    })}
                </tbody>
            </table>
        </div>

        <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onBackToDashboard}>Back to Dashboard</button>
            <button className="btn btn-secondary" onClick={onBackToEdit}>Modify Data</button>
            <button className="btn btn-secondary" onClick={onFlagForReview} style={{ backgroundColor: 'var(--yellow)' }}>Flag for Review</button>
            <button className="btn btn-primary" onClick={onConfirm}>✓ Confirm & Close</button>
        </div>
    </div>
);

const HistoryView = ({ branch, onEdit }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/sales-reconciliation/history', { params: { branch } });
                setHistory(res.data);
            } catch (error) { console.error("Failed to fetch history:", error); }
            finally { setLoading(false); }
        };
        fetchHistory();
    }, [branch]);

    if (loading) return <div className="card"><p>Loading history...</p></div>;
    if (history.length === 0) return <div className="card"><p style={{ textAlign: 'center', padding: '30px' }}>No reconciliation history found for this branch.</p></div>

    return (
        <div className="history-list">
            <h3>Sales History - {branch}</h3>
            {history.map(item => (
                <div className="card history-list-item" key={item.id}>
                    <div className="history-item-header">
                        <div>
                            <h4>{format(parseISO(item.date), 'yyyy-MM-dd')}</h4>
                            <span style={{ fontSize: '0.8em', color: '#666' }}>ID: #{item.id}</span>
                        </div>
                        <div>
                            <span className={`status-tag status-${item.status.replace('_', '-')}`}>{item.status.replace('_', ' ')}</span>
                            {/* Pass both ID and Date */}
                            <button className="btn btn-primary" onClick={() => onEdit(item.id, format(parseISO(item.date), 'yyyy-MM-dd'))}>Edit</button>
                        </div>
                    </div>
                    <div className="history-item-body">
                        <div><small>Receipt Total</small><p>${Number(item.total_sales_from_receipt).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                        <div><small>Breakdown</small><p>${Number(item.total_breakdown_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                        <div><small>Variance</small><p style={{ color: 'var(--red)' }}>{(((item.total_sales_from_receipt || 0) > 0 ? item.variance / item.total_sales_from_receipt : 0) * 100).toFixed(1)}%</p></div>
                        <div><small>Recipes Tracked</small><p>{item.recipe_breakdown?.length || 0}</p></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SalesProfitManager;

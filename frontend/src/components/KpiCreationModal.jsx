import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import Modal from './Modal';
import Stepper from './Stepper';

const KpiCreationModal = ({ insight, onClose, isOpen, onSave }) => {
    const steps = ['Basic Setup', 'Timeline', 'Assignment', 'Tracking'];
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        ai_insight_id: '',
        title: '',
        description: '',
        baseline_value: '',
        target_value: '',
        unit: '', // Kept in state for backend validation, but hidden from UI
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: '',
        milestones: [],
    });

    useEffect(() => {
        if (insight) {
            setFormData({
                ai_insight_id: insight.id,
                title: `${insight.data.typeOfInsight} ${insight.data.insightType.replace(/ /g, '')} Initiative`,
                description: insight.data.overall_summary,
                baseline_value: '',
                target_value: insight.data.impactValue || '',
                // Auto-set unit from AI data, or default to empty string if missing
                unit: insight.data.impactUnit || '',
                start_date: format(new Date(), 'yyyy-MM-dd'),
                end_date: '',
                milestones: [],
            });
        }
    }, [insight]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const addMilestone = () => {
        setFormData(prev => ({
            ...prev,
            milestones: [...prev.milestones, { name: '', target_date: '', target_value: '' }]
        }));
    };

    const handleMilestoneChange = (index, field, value) => {
        const updatedMilestones = formData.milestones.map((m, i) => i === index ? { ...m, [field]: value } : m);
        setFormData(prev => ({ ...prev, milestones: updatedMilestones }));
    };

    const removeMilestone = (index) => {
        setFormData(prev => ({
            ...prev,
            milestones: formData.milestones.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            await axios.post('/api/kpis', formData);
            alert('KPI Created Successfully!');
            onSave();
            onClose();
        } catch (err) {
            if (err.response && err.response.status === 422) {
                setErrors(err.response.data.errors);
                alert('Please correct the errors before submitting.');
            } else {
                alert(err.response?.data?.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const projectDuration = formData.start_date && formData.end_date
        ? differenceInDays(new Date(formData.end_date), new Date(formData.start_date))
        : 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create KPI from AI Insight" modalClass="modal-lg">
            <form onSubmit={handleSubmit}>
                <Stepper steps={steps} currentStep={currentStep} />

                <div className="source-insight-box">
                    <h4>Source Insight</h4>
                    <p><strong>{insight.data.name}</strong>: {insight.data.overall_summary}</p>
                </div>

                {/* Step 1: Basic Setup */}
                <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
                    <h4>Basic KPI Information</h4>
                    <div className="form-group">
                        <label>KPI Title *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required />
                        {errors.title && <small className="error-text">{errors.title[0]}</small>}
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>
                    </div>

                    {/* MODIFIED: Removed Unit Input, kept Baseline and Target */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Current/Baseline *</label>
                            <input type="number" step="any" name="baseline_value" value={formData.baseline_value} onChange={handleChange} required />
                            {errors.baseline_value && <small className="error-text">{errors.baseline_value[0]}</small>}
                        </div>
                        <div className="form-group">
                            <label>Target Value *</label>
                            <input type="number" step="any" name="target_value" value={formData.target_value} onChange={handleChange} required />
                            {errors.target_value && <small className="error-text">{errors.target_value[0]}</small>}
                        </div>
                    </div>
                </div>

                {/* Step 2: Timeline */}
                <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
                    <h4>Timeline & Deadlines</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Start Date *</label>
                            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                            {errors.start_date && <small className="error-text">{errors.start_date[0]}</small>}
                        </div>
                        <div className="form-group">
                            <label>Target Deadline *</label>
                            <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
                            {errors.end_date && <small className="error-text">{errors.end_date[0]}</small>}
                        </div>
                    </div>
                    <div className="project-duration-box">
                        <span>Project Duration: <strong>{projectDuration >= 0 ? `${projectDuration} days` : 'Invalid dates'}</strong></span>
                        <button type="button" className="btn btn-secondary">Auto-Generate Milestones</button>
                    </div>
                    <h4>Progress Milestones</h4>
                    {formData.milestones.map((milestone, index) => (
                        <div className="milestone-row" key={index}>
                            <input type="text" placeholder="Milestone Name" value={milestone.name} onChange={e => handleMilestoneChange(index, 'name', e.target.value)} required />
                            <input type="date" value={milestone.target_date} onChange={e => handleMilestoneChange(index, 'target_date', e.target.value)} required />
                            <input type="number" step="any" placeholder="Target" value={milestone.target_value} onChange={e => handleMilestoneChange(index, 'target_value', e.target.value)} />
                            <button type="button" onClick={() => removeMilestone(index)} className="btn-delete">&times;</button>
                        </div>
                    ))}
                    <button type="button" onClick={addMilestone} className="btn-link">+ Add Custom Milestone</button>
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    {currentStep > 1 && <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(s => s - 1)}>← Previous</button>}
                    {currentStep < 2 && <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(s => s + 1)}>Next Step &rarr;</button>}
                    {currentStep === 2 && <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Create KPI'}</button>}
                </div>
            </form>
        </Modal>
    );
};

export default KpiCreationModal;

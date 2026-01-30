import React from 'react';
import Modal from '../../components/Modal';
import { format, addDays } from 'date-fns';

const RosterPDFModal = ({ isOpen, onClose, currentWeekStart, teamMembers, shifts }) => {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const generatedAt = format(new Date(), 'M/d/yyyy, h:mm:ss a');

    const handlePrint = () => {
        const printContent = document.getElementById('printable-roster-area').innerHTML;

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Staff Roster</title>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        font-family: 'Inter', sans-serif;
                        background: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .roster-pdf-container {
                        padding: 10px;
                        background: #fff;
                    }
                    .roster-pdf-header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .roster-pdf-header h1 {
                        font-size: 2rem;
                        font-weight: 800;
                        color: #1e293b;
                        margin: 0;
                        letter-spacing: 1px;
                    }
                    .roster-pdf-header p {
                        color: #64748b;
                        font-size: 0.9rem;
                        margin: 5px 0 0 0;
                    }
                    .roster-pdf-table {
                        width: 100%;
                        border-collapse: collapse;
                        border: 1px solid #e2e8f0;
                        table-layout: fixed;
                    }
                    .roster-pdf-table th {
                        background: #f8f9fa !important;
                        padding: 8px 4px;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        font-size: 0.7rem;
                        text-align: center;
                    }
                    .roster-pdf-table td {
                        padding: 6px;
                        border: 1px solid #e2e8f0;
                        text-align: center;
                        vertical-align: middle;
                        height: 50px;
                    }
                    .staff-info-col {
                        text-align: left !important;
                        width: 140px;
                    }
                    .staff-name-text {
                        font-weight: 700;
                        color: #1e293b;
                        display: block;
                        font-size: 0.85rem;
                    }
                    .staff-role-text {
                        font-size: 0.75rem;
                        color: #64748b;
                    }
                    .status-cell-box {
                        min-height: 35px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        border-radius: 4px;
                    }
                    .status-assigned {
                        background-color: #f0fdf4 !important;
                        border: 1px solid #bbf7d0;
                    }
                    .status-assigned .check-mark {
                        color: #16a34a;
                        font-size: 0.9rem;
                        font-weight: bold;
                    }
                    .status-assigned .time-range {
                        color: #166534;
                        font-size: 0.6rem;
                        font-weight: 700;
                    }
                    .status-empty {
                        color: #cbd5e1;
                        font-size: 0.8rem;
                    }
                    .roster-pdf-footer {
                        margin-top: 20px;
                        text-align: center;
                        color: #94a3b8;
                        font-size: 0.7rem;
                    }

                    /* Hide Buttons in the Print Window */
                    .print-actions-container {
                        display: none !important;
                    }

                    @media print {
                        @page {
                            size: landscape;
                            margin: 1cm;
                        }
                        body {
                            padding: 0 !important;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        printWindow.document.close();

        // Wait for styles and content to load, then print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Weekly Roster - ${format(currentWeekStart, 'dd MMM')}`} modalClass="modal-xl">
            <style>{`
                .roster-pdf-container {
                    padding: 20px;
                    background: #fff;
                    font-family: 'Inter', sans-serif;
                }
                .roster-pdf-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .roster-pdf-header h1 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #1e293b;
                    margin: 0;
                    letter-spacing: 1px;
                }
                .roster-pdf-header p {
                    color: #64748b;
                    font-size: 1rem;
                    margin: 5px 0 0 0;
                }

                .roster-pdf-table {
                    width: 100%;
                    border-collapse: collapse;
                    border: 1px solid #e2e8f0;
                }
                .roster-pdf-table th {
                    background: #f8f9fa;
                    padding: 10px 8px;
                    border: 1px solid #e2e8f0;
                    color: #475569;
                    font-size: 0.75rem;
                }
                .roster-pdf-table td {
                    padding: 8px;
                    border: 1px solid #e2e8f0;
                    text-align: center;
                    vertical-align: middle;
                }

                .staff-info-col {
                    text-align: left !important;
                    min-width: 150px;
                }
                .staff-name-text {
                    font-weight: 700;
                    color: #1e293b;
                    display: block;
                }
                .staff-role-text {
                    font-size: 0.8rem;
                    color: #64748b;
                }

                .status-cell-box {
                    min-height: 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    border-radius: 4px;
                }
                .status-assigned {
                    background-color: #f0fdf4;
                    border: 1px solid #bbf7d0;
                }
                .status-assigned .check-mark {
                    color: #16a34a;
                    font-size: 1rem;
                    font-weight: bold;
                }
                .status-assigned .time-range {
                    color: #166534;
                    font-size: 0.6rem;
                    font-weight: 700;
                    margin-top: 2px;
                }
                .status-empty {
                    color: #cbd5e1;
                    font-size: 0.9rem;
                }

                .roster-pdf-footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.75rem;
                }

                .print-button {
                    background-color: #22c55e !important;
                    border-color: #22c55e !important;
                    color: #fff !important;
                    font-weight: bold !important;
                }
            `}</style>

            <div id="printable-roster-area" className="roster-pdf-container">
                <div className="roster-pdf-header">
                    <h1>STAFF ROSTER</h1>
                    <p>Week of {format(currentWeekStart, 'dd MMM')} – {format(addDays(currentWeekStart, 6), 'dd MMM')}</p>
                    <small style={{ color: '#94a3b8' }}>Main Location</small>
                </div>

                <table className="roster-pdf-table">
                    <thead>
                        <tr>
                            <th className="staff-info-col">Staff Name</th>
                            <th className="staff-info-col">Role</th>
                            {days.map((d, i) => (
                                <th key={d}>
                                    <div style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{d}</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', marginTop: '2px' }}>
                                        {format(addDays(currentWeekStart, i), 'dd MMM')}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teamMembers.map(member => (
                            <tr key={member.id}>
                                <td className="staff-info-col">
                                    <span className="staff-name-text">{member.first_name} {member.last_name}</span>
                                </td>
                                <td className="staff-info-col">
                                    <span className="staff-role-text">{member.position}</span>
                                </td>
                                {days.map(day => {
                                    const shift = shifts.find(s => s.day === day && s.assignedStaff.includes(member.id));

                                    return (
                                        <td key={day}>
                                            {shift ? (
                                                <div className="status-cell-box status-assigned">
                                                    <div className="check-mark">✓</div>
                                                    <div className="time-range">{shift.startTime}-{shift.endTime}</div>
                                                </div>
                                            ) : (
                                                <div className="status-cell-box">
                                                    <span className="status-empty">✕</span>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="roster-pdf-footer">
                    <p>Generated on {generatedAt}</p>
                    <p style={{ fontWeight: 600, color: '#64748b', marginTop: '5px' }}>✓ = Available | ✕ = Not Available</p>
                </div>

                {/* Wrapped buttons in a class to hide them during print */}
                <div className="print-actions-container" style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        className="btn btn-primary print-button"
                        onClick={handlePrint}
                        style={{ padding: '10px 25px' }}
                    >
                        Print PDF
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        style={{ padding: '10px 25px' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RosterPDFModal;

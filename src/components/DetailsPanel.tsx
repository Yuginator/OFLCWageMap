import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { WageData } from '../types';

interface DetailsPanelProps {
    fips: string;
    data: WageData;
    meta?: any;
    personalSalary: number | null;
    onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ fips, data, meta, personalSalary, onClose }) => {
    const formatWage = (v: number) => `$${v.toLocaleString()}`;

    // Determine what level the user's personal salary meets
    const userTier = React.useMemo(() => {
        if (!personalSalary || !data || data.level1 === 0) return null;
        if (personalSalary >= data.level4) return 4;
        if (personalSalary >= data.level3) return 3;
        if (personalSalary >= data.level2) return 2;
        if (personalSalary >= data.level1) return 1;
        return 0; // Fails L1
    }, [personalSalary, data]);

    return (
        <div className="overlay-panel details-panel">
            <div className="details-header">
                <div>
                    <h2>{data.county}</h2>
                    <p>{data.state}</p>
                </div>
                <button
                    onClick={onClose}
                    className="panel-close-btn"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="details-content">
                <div className="mb-4">
                    <label>Occupation</label>
                    <div className="text-sm">
                        <span className="font-mono text-primary mr-2">{meta?.soc}</span>
                        {meta?.soc_title}
                    </div>
                </div>

                {personalSalary && personalSalary > 0 && userTier !== null && (
                    <div className="mb-4 p-3 rounded" style={{
                        background: userTier === 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${userTier === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                    }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>YOUR ENTERED SALARY: {formatWage(personalSalary)}</div>
                        <div style={{ fontSize: '13px', color: userTier === 0 ? '#fca5a5' : '#93c5fd' }}>
                            {userTier === 4 ? 'Exceeds Level 4 requirements.' :
                                userTier === 3 ? 'Meets Level 3 requirements.' :
                                    userTier === 2 ? 'Meets Level 2 requirements.' :
                                        userTier === 1 ? 'Meets Level 1 requirements.' :
                                            'Does not meet Level 1 minimum requirements.'}
                        </div>
                    </div>
                )}

                <div
                    className="details-row"
                    style={userTier === 1 ? { background: 'rgba(249, 115, 22, 0.15)', borderLeft: '3px solid #f97316', paddingLeft: '8px' } : {}}
                >
                    <strong>Level I</strong>
                    <span>{formatWage(data.level1)}</span>
                </div>
                <div
                    className="details-row"
                    style={userTier === 2 ? { background: 'rgba(234, 179, 8, 0.15)', borderLeft: '3px solid #eab308', paddingLeft: '8px' } : {}}
                >
                    <strong>Level II</strong>
                    <span>{formatWage(data.level2)}</span>
                </div>
                <div
                    className="details-row"
                    style={userTier === 3 ? { background: 'rgba(20, 184, 166, 0.15)', borderLeft: '3px solid #14b8a6', paddingLeft: '8px' } : {}}
                >
                    <strong>Level III</strong>
                    <span>{formatWage(data.level3)}</span>
                </div>
                <div
                    className="details-row"
                    style={userTier === 4 ? { background: 'rgba(59, 130, 246, 0.15)', borderLeft: '3px solid #3b82f6', paddingLeft: '8px' } : {}}
                >
                    <strong>Level IV</strong>
                    <span>{formatWage(data.level4)}</span>
                </div>

                <div className="details-row mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <strong style={{ color: 'var(--primary)' }}>Average Annual Wage</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{formatWage(data.average)}</span>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
                    <div className="flex items-center gap-1">
                        <span>Wage Year: {meta?.wage_year}</span>
                    </div>
                    <div>Source: {meta?.source}</div>
                    <div className="italic text-[10px]">
                        Note: Annual wages = hourly × 2080 (OFLC standard)
                    </div>
                    <a
                        href="https://flag.dol.gov/wage-data/wage-data-downloads"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:underline mt-2"
                    >
                        Visit DOL FLAG <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DetailsPanel;

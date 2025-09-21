import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Collaboration } from '../types';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from './common/Icons';

const displayColumns: (keyof Collaboration)[] = [
    '引合番号', '担当', '地域', '代理', '機種', '台数', 
    '顧客情報', '確度', '出荷可能時期', '最終結果', '出荷日(実際）',
    '備考①引合詳細、補充内容', '備考②引合状況変化記録等'
];

const filterKeys: (keyof Collaboration)[] = ['担当', '地域', '代理', '機種', '最終結果'];

const initialCollaborationState: Collaboration = {
    id: '', '引合番号': '', '担当': '', '地域': '', '代理': '', '機種': '', 
    '台数': '', '顧客情報': '', '案件発生年月': '', '访问方式': '', '訪問回数': '',
    '確度': '', '確度変更': '', '確度変更理由': '', '出荷可能時期': '', '最終結果': '', 
    '出荷日(実際）': '', '備考①引合詳細、補充内容': '', '備考②引合状況変化記録等': '', '備考③': ''
};

// --- Detail/Edit View Component ---
const CollaborationForm: React.FC<{
    collaboration: Collaboration;
    onSave: (collaboration: Collaboration) => void;
    onCancel: () => void;
}> = ({ collaboration, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Collaboration>(collaboration);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const fields = Object.keys(initialCollaborationState).filter(k => k !== 'id') as (keyof Omit<Collaboration, 'id'>)[];

    return (
        <div>
             <div className="flex items-center mb-6">
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 mr-4">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                </button>
                <h2 className="text-3xl font-bold text-gray-800">{collaboration.id ? '编辑引合记录' : '新建引合记录'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {fields.map(key => {
                        const isTextArea = key.startsWith('備考');
                        const inputType = key === '台数' ? 'number' : (key.includes('年月') ? 'month' : (key.includes('時期') || key.includes('日')) ? 'date' : 'text');
                        
                        return (
                            <div key={key} className={isTextArea ? 'md:col-span-2' : ''}>
                                <label htmlFor={key} className="block text-sm font-medium text-gray-700">{key}</label>
                                {isTextArea ? (
                                     <textarea
                                        id={key}
                                        name={key}
                                        value={formData[key] as string || ''}
                                        onChange={handleChange}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                ) : (
                                    <input
                                        type={inputType}
                                        id={key}
                                        name={key}
                                        value={formData[key] as any}
                                        onChange={handleChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="flex justify-end mt-6">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 mr-2">取消</button>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button>
                </div>
            </form>
        </div>
    );
};

// --- Main Collaborations Component ---
export const Collaborations: React.FC = () => {
    const [collaborations, setCollaborations] = useLocalStorage<Collaboration[]>('collaborations', []);
    const [view, setView] = useState<{ mode: 'list' | 'detail'; id: string | null }>({ mode: 'list', id: null });
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filterOptions = useMemo(() => {
        const options: Record<string, string[]> = {};
        filterKeys.forEach(key => {
            options[key] = [...new Set(collaborations.map(c => c[key]).filter(Boolean))] as string[];
        });
        return options;
    }, [collaborations]);

    const filteredCollaborations = useMemo(() => {
        return collaborations.filter(c => {
            // This .every() ensures that every active filter condition must be true (AND logic).
            return Object.entries(filters).every(([key, value]) => {
                // If a filter is not set (value is empty), it should not filter out anything.
                // Otherwise, the collaboration's property must match the filter value.
                return !value || String(c[key as keyof Collaboration]) === value;
            });
        });
    }, [collaborations, filters]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredCollaborations.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} records?`)) {
            setCollaborations(collaborations.filter(c => !selectedIds.has(c.id)));
            setSelectedIds(new Set());
        }
    };

    const handleSave = (collaboration: Collaboration) => {
        if (collaboration.id) {
            setCollaborations(collaborations.map(c => c.id === collaboration.id ? collaboration : c));
        } else {
            setCollaborations([...collaborations, { ...collaboration, id: crypto.randomUUID() }]);
        }
        setView({ mode: 'list', id: null });
    };

    const openDetailView = (id: string | null) => {
        setView({ mode: 'detail', id });
    };

    if (view.mode === 'detail') {
        const currentCollaboration = view.id ? collaborations.find(c => c.id === view.id) : { ...initialCollaborationState };
        if (!currentCollaboration) {
            setView({ mode: 'list', id: null }); // Failsafe
            return null;
        }
        return <CollaborationForm collaboration={currentCollaboration} onSave={handleSave} onCancel={() => setView({ mode: 'list', id: null })} />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">引合记录管理</h2>
                <button onClick={() => openDetailView(null)} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    新建引合
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 bg-white p-4 rounded-lg shadow">
                {filterKeys.map(key => (
                    <div key={key}>
                        <label htmlFor={`filter-${key}`} className="block text-sm font-medium text-gray-700">{key}</label>
                        <select
                            id={`filter-${key}`}
                            onChange={(e) => handleFilterChange(key, e.target.value)}
                            value={filters[key] || ''}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">All</option>
                            {filterOptions[key]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>
            
            {selectedIds.size > 0 && (
                <div className="mb-4 flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-md">
                    <span>{selectedIds.size} record(s) selected</span>
                    <button onClick={handleBulkDelete} className="flex items-center bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600">
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Selected
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredCollaborations.length} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                            </th>
                            {displayColumns.map(col => <th key={col} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCollaborations.map(c => (
                            <tr key={c.id} onClick={() => openDetailView(c.id)} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => handleSelect(c.id)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                                </td>
                                {displayColumns.map(col => (
                                    <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{String(c[col])}</td>
                                ))}
                            </tr>
                        ))}
                         {filteredCollaborations.length === 0 && (
                            <tr><td colSpan={displayColumns.length + 1} className="text-center py-10 text-gray-500">No records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
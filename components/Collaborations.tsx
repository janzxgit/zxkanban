import React, { useState, useMemo } from 'react';
import type { Collaboration, Personnel, Agent, Product, Customer } from '../types';
import { PlusIcon, TrashIcon, ArrowLeftIcon, DownloadIcon } from './common/Icons';
import { utils, writeFile } from 'xlsx';

const initialCollaborationState: Omit<Collaboration, 'id'> = {
    '引合番号': '', '担当': '', '地域': '', '代理': '', '機種': '',
    '台数': '', '顧客情報': '', '案件発生年月': '', '访问方式': '',
    '訪問回数': '', '確度': '', '確度変更': '', '確度変更理由': '',
    '出荷可能時期': '', '最終結果': '', '出荷日(実際）': '',
    '備考①引合詳細、補充内容': '', '備考②引合状況変化記録等': '', '備考③': '',
};

const collaborationFields: { key: keyof Omit<Collaboration, 'id'>; label: string; type: 'text' | 'date' | 'textarea' | 'number' | 'select'; gridSpan: string; }[] = [
    { key: '引合番号', label: '引合番号', type: 'text', gridSpan: 'md:col-span-2' }, 
    { key: '担当', label: '担当', type: 'select', gridSpan: 'md:col-span-2' },
    { key: '地域', label: '地域', type: 'text', gridSpan: 'md:col-span-2' }, 
    { key: '代理', label: '代理', type: 'select', gridSpan: 'md:col-span-3' },
    { key: '機種', label: '機種', type: 'select', gridSpan: 'md:col-span-3' }, 
    { key: '台数', label: '台数', type: 'number', gridSpan: 'md:col-span-1' },
    { key: '訪問回数', label: '訪問回数', type: 'number', gridSpan: 'md:col-span-1' },
    { key: '案件発生年月', label: '案件発生年月', type: 'date', gridSpan: 'md:col-span-2' },
    { key: '出荷可能時期', label: '出荷可能時期', type: 'date', gridSpan: 'md:col-span-2' },
    { key: '確度', label: '確度', type: 'text', gridSpan: 'md:col-span-1' }, 
    { key: '確度変更', label: '確度変更', type: 'text', gridSpan: 'md:col-span-1' },
    { key: '访问方式', label: '访问方式', type: 'text', gridSpan: 'md:col-span-2' }, 
    { key: '最終結果', label: '最終結果', type: 'text', gridSpan: 'md:col-span-2' }, 
    { key: '出荷日(実際）', label: '出荷日(実際）', type: 'date', gridSpan: 'md:col-span-2' },
    { key: '顧客情報', label: '顧客情報', type: 'select', gridSpan: 'md:col-span-6' },
    { key: '確度変更理由', label: '確度変更理由', type: 'textarea', gridSpan: 'md:col-span-6' }, 
    { key: '備考①引合詳細、補充内容', label: '備考①', type: 'textarea', gridSpan: 'md:col-span-6' },
    { key: '備考②引合状況変化記録等', label: '備考②', type: 'textarea', gridSpan: 'md:col-span-6' },
    { key: '備考③', label: '備考③', type: 'textarea', gridSpan: 'md:col-span-6' },
];

const displayColumns: (keyof Collaboration)[] = ['引合番号', '担当', '地域', '代理', '機種', '台数', '顧客情報', '確度', '出荷可能時期', '最終結果', '出荷日(実際）', '備考①引合詳細、補充内容', '備考②引合状況変化記録等'];
const filterKeys: (keyof Collaboration)[] = ['担当', '地域', '代理', '機種', '最終結果', '出荷日(実際）'];
const EMPTY_VALUE_SENTINEL = '__EMPTY_VALUE__';

const exportToExcel = (data: any[], filename: string) => {
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Data");
    writeFile(wb, filename);
};

const exportToCSV = (data: any[], headers: string[], filename: string) => {
    const escapeCSVValue = (value: any): string => {
        if (value === null || value === undefined) {
            return '';
        }
        let strValue = Array.isArray(value) ? value.join('; ') : String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            strValue = strValue.replace(/"/g, '""');
            return `"${strValue}"`;
        }
        return strValue;
    };

    const csvRows = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => escapeCSVValue(row[header])).join(',')
        )
    ];

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const commonInputClasses = "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";

interface CollaborationsProps {
    collaborations: Collaboration[];
    setCollaborations: React.Dispatch<React.SetStateAction<Collaboration[]>>;
    personnel: Personnel[];
    agents: Agent[];
    products: Product[];
    customers: Customer[];
}

export const Collaborations: React.FC<CollaborationsProps> = ({ collaborations, setCollaborations, personnel, agents, products, customers }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentCollaboration, setCurrentCollaboration] = useState<Omit<Collaboration, 'id'>>(initialCollaborationState);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Partial<Record<keyof Collaboration, string>>>({});

  const filteredCollaborations = useMemo(() => {
    return collaborations.filter(c => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true; // 'All' option with value=""
        if (value === EMPTY_VALUE_SENTINEL) {
            return !c[key as keyof Collaboration]; // Filter for empty/falsy values
        }
        return c[key as keyof Collaboration] === value;
      });
    });
  }, [collaborations, filters]);

  const filterOptions = useMemo(() => {
    const options: Partial<Record<keyof Collaboration, string[]>> = {};
    filterKeys.forEach(filterKey => {
        const relevantData = collaborations.filter(c => {
            return Object.entries(filters).every(([key, value]) => {
                if (key === filterKey || !value) return true;
                if (value === EMPTY_VALUE_SENTINEL) {
                    return !c[key as keyof Collaboration];
                }
                return c[key as keyof Collaboration] === value;
            });
        });
        const uniqueValues = [...new Set(relevantData.map(c => c[filterKey] || ''))];
        options[filterKey] = uniqueValues.sort((a, b) => {
            if (a === '') return -1; // Keep empty string at the top
            if (b === '') return 1;
            return a.localeCompare(b);
        });
    });
    return options;
  }, [collaborations, filters]);


  const handleFilterChange = (key: keyof Collaboration, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters({});

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
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

  const openAddView = () => {
    setEditingId(null);
    setCurrentCollaboration(initialCollaborationState);
    setView('edit');
  };

  const openEditView = (collab: Collaboration) => {
    setEditingId(collab.id);
    const { id, ...data } = collab;
    setCurrentCollaboration(data);
    setView('edit');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentCollaboration(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!currentCollaboration['引合番号']) {
      alert('引合番号 is required.');
      return;
    }
    setCollaborations(prev => {
        if (editingId) {
            return prev.map(c => c.id === editingId ? { ...currentCollaboration, id: editingId } : c);
        } else {
            return [...prev, { ...currentCollaboration, id: crypto.randomUUID() }];
        }
    });
    setView('list');
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} record(s)?`)) {
        setCollaborations(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
    }
  };
  
  const handleExcelExport = () => {
    exportToExcel(filteredCollaborations, 'collaborations.xlsx');
  };

  const handleCsvExport = () => {
    const headers = collaborationFields.map(f => f.key);
    exportToCSV(filteredCollaborations, headers, 'collaborations.csv');
  };

  const renderFormField = ({ key, type }: { key: keyof Omit<Collaboration, 'id'>, type: string }) => {
    const commonProps = {
        id: key,
        name: key,
        value: currentCollaboration[key] || '',
        onChange: handleInputChange,
        className: commonInputClasses
    };

    if (type === 'select') {
        let options: { value: string; label: string; }[] = [];
        switch(key) {
            case '担当':
                options = personnel.map(p => ({ value: p.name, label: p.name }));
                break;
            case '代理':
                options = agents.map(a => ({ value: a['代理商'], label: a['代理商'] }));
                break;
            case '機種':
                options = products.map(p => ({ value: p['機種'], label: p['機種'] }));
                break;
            case '顧客情報':
                options = customers.map(c => ({ value: c.name, label: c.name }));
                break;
        }

        return (
            <select {...commonProps}>
                <option value="">请选择</option>
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        );
    }
      
    if (type === 'textarea') {
      return <textarea {...commonProps} rows={3} />;
    }
    
    return <input type={type} {...commonProps} />;
  };


  if (view === 'edit') {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h2 className="text-3xl font-bold text-gray-800">{editingId ? '编辑引合记录' : '新建引合记录'}</h2>
          <button onClick={() => setView('list')} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            返回列表
          </button>
        </div>
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {collaborationFields.map((field) => (
                <div key={field.key} className={field.gridSpan}>
                    <label htmlFor={field.key} className={commonLabelClasses}>{field.label}</label>
                    {renderFormField(field)}
                </div>
            ))}
          </div>
          <div className="flex justify-end pt-8 mt-8 border-t">
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">保存</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 pb-4 border-b">
        <h2 className="text-3xl font-bold text-gray-800">引合记录管理</h2>
        <div className="flex items-center space-x-2">
            <button onClick={handleCsvExport} className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                <DownloadIcon className="w-5 h-5 mr-2" />
                导出CSV
            </button>
            <button onClick={handleExcelExport} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                <DownloadIcon className="w-5 h-5 mr-2" />
                导出Excel
            </button>
            {selectedIds.size > 0 && (
                <button onClick={handleDeleteSelected} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                    <TrashIcon className="w-5 h-5 mr-2" />
                    删除已选 ({selectedIds.size})
                </button>
            )}
            <button onClick={openAddView} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                <PlusIcon className="w-5 h-5 mr-2" />
                新建记录
            </button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap items-center gap-4">
            <div className="grid flex-grow grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filterKeys.map(key => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <label htmlFor={`filter-${key}`} className="block text-center text-sm font-medium text-gray-600 mb-2">{key}</label>
                        <select
                            id={`filter-${key}`}
                            value={filters[key] || ''}
                            onChange={(e) => handleFilterChange(key, e.target.value)}
                            className={`w-full p-2 border rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500 transition ${
                                filters[key] ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-gray-300'
                            }`}
                        >
                            <option value="">全部</option>
                            {filterOptions[key]?.map(opt => {
                               if (opt === '') {
                                   return <option key={EMPTY_VALUE_SENTINEL} value={EMPTY_VALUE_SENTINEL}>空</option>;
                               }
                               return <option key={opt} value={opt}>{opt}</option>;
                            })}
                        </select>
                    </div>
                ))}
            </div>
            <div className="flex-shrink-0">
                 <button onClick={resetFilters} className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors whitespace-nowrap">重置过滤</button>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredCollaborations.length} className="rounded" />
              </th>
              {displayColumns.map(key => (
                <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCollaborations.map(collab => (
              <tr key={collab.id} onClick={() => openEditView(collab)} className="cursor-pointer hover:bg-gray-50">
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(collab.id)} onChange={() => handleSelect(collab.id)} className="rounded" />
                </td>
                {displayColumns.map(key => (
                  <td key={key} className="px-4 py-4 text-sm text-gray-600 whitespace-normal break-words">{collab[key]}</td>
                ))}
              </tr>
            ))}
            {filteredCollaborations.length === 0 && (
                <tr><td colSpan={displayColumns.length + 1} className="text-center py-10 text-gray-500">
                    {collaborations.length > 0 ? '无匹配记录，请尝试调整过滤条件' : '暂无引合记录'}
                </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
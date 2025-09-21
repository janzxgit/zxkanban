import React, { useState, useMemo } from 'react';
import type { Contract, Personnel, Agent, Product } from '../types';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from './common/Icons';

const initialContractState: Omit<Contract, 'id'> = {
    '担当': '', '機種': '', '区分': '', '機号': '', '契約日': '',
    '代理名称': '', '契約状態': '', '契約書NO': '', '出荷指示書№': '',
    '契約日付': '', '単価': '', '台数': '', '割賦時間': '',
    '備考①': '', '備考②': '',
};

const contractFields: { key: keyof Omit<Contract, 'id'>; label: string; type: 'text' | 'date' | 'textarea' | 'number' | 'select' }[] = [
    { key: '契約書NO', label: '契約書NO', type: 'text' },
    { key: '担当', label: '担当', type: 'select' },
    { key: '代理名称', label: '代理名称', type: 'select' },
    { key: '機種', label: '機種', type: 'select' },
    { key: '区分', label: '区分', type: 'text' },
    { key: '機号', label: '機号', type: 'text' },
    { key: '契約日', label: '契約日', type: 'date' },
    { key: '契約状態', label: '契約状態', type: 'text' },
    { key: '出荷指示書№', label: '出荷指示書№', type: 'text' },
    { key: '契約日付', label: '契約日付', type: 'date' },
    { key: '単価', label: '単価', type: 'number' },
    { key: '台数', label: '台数', type: 'number' },
    { key: '割賦時間', label: '割賦時間', type: 'text' },
    { key: '備考①', label: '備考①', type: 'textarea' },
    { key: '備考②', label: '備考②', type: 'textarea' },
];

const displayColumns: (keyof Contract)[] = ['契約書NO', '担当', '代理名称', '機種', '契約日', '契約状態', '単価', '台数'];
const filterKeys: (keyof Contract)[] = ['担当', '代理名称', '機種', '契約状態'];
const EMPTY_VALUE_SENTINEL = '__EMPTY_VALUE__';

interface ContractsProps {
    contracts: Contract[];
    setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
    personnel: Personnel[];
    agents: Agent[];
    products: Product[];
}

export const Contracts: React.FC<ContractsProps> = ({ contracts, setContracts, personnel, agents, products }) => {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [currentContract, setCurrentContract] = useState<Omit<Contract, 'id'>>(initialContractState);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<Partial<Record<keyof Contract, string>>>({});

    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                if (value === EMPTY_VALUE_SENTINEL) {
                    return !c[key as keyof Contract];
                }
                return c[key as keyof Contract] === value;
            });
        });
    }, [contracts, filters]);

    const filterOptions = useMemo(() => {
        const options: Partial<Record<keyof Contract, string[]>> = {};
        filterKeys.forEach(filterKey => {
            const relevantData = contracts.filter(c => {
                return Object.entries(filters).every(([key, value]) => {
                    if (key === filterKey || !value) return true;
                    if (value === EMPTY_VALUE_SENTINEL) {
                        return !c[key as keyof Contract];
                    }
                    return c[key as keyof Contract] === value;
                });
            });
            const uniqueValues = [...new Set(relevantData.map(c => c[filterKey] || ''))];
            options[filterKey] = uniqueValues.sort((a, b) => {
                if (a === '') return -1;
                if (b === '') return 1;
                return a.localeCompare(b);
            });
        });
        return options;
    }, [contracts, filters]);


    const handleFilterChange = (key: keyof Contract, value: string) => {
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
            setSelectedIds(new Set(filteredContracts.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const openAddView = () => {
        setEditingId(null);
        setCurrentContract(initialContractState);
        setView('edit');
    };

    const openEditView = (contract: Contract) => {
        setEditingId(contract.id);
        const { id, ...data } = contract;
        setCurrentContract(data);
        setView('edit');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentContract(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = () => {
        if (!currentContract['契約書NO']) {
            alert('契約書NO is required.');
            return;
        }
        if (editingId) {
            setContracts(contracts.map(c => c.id === editingId ? { ...currentContract, id: editingId } : c));
        } else {
            setContracts([...contracts, { ...currentContract, id: crypto.randomUUID() }]);
        }
        setView('list');
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        if (window.confirm(`Are you sure you want to delete ${selectedIds.size} record(s)?`)) {
            setContracts(contracts.filter(c => !selectedIds.has(c.id)));
            setSelectedIds(new Set());
        }
    };

    const renderFormField = ({ key, label, type }: (typeof contractFields)[0]) => {
        const commonProps = {
            id: key,
            name: key,
            value: currentContract[key] || '',
            onChange: handleInputChange,
            className: "mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
        };

        if (type === 'select') {
            let options: { value: string; label: string; }[] = [];
            switch(key) {
                case '担当':
                    options = personnel.map(p => ({ value: p.name, label: p.name }));
                    break;
                case '代理名称':
                    options = agents.map(a => ({ value: a['代理商'], label: a['代理商'] }));
                    break;
                case '機種':
                    options = products.map(p => ({ value: p['機種'], label: p['機種'] }));
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
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">{editingId ? '编辑合同' : '新建合同'}</h2>
              <button onClick={() => setView('list')} className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                返回列表
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {contractFields.map((field) => {
                    const fullWidth = field.type === 'textarea';
                    return (
                        <div key={field.key} className={fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}>
                            <label htmlFor={field.key} className="block text-sm font-medium text-gray-700">{field.label}</label>
                            {renderFormField(field)}
                        </div>
                    );
                })}
              </div>
              <div className="flex justify-end pt-6">
                <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button>
              </div>
            </div>
          </div>
        );
    }

    return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-gray-800">合同管理</h2>
            <div className="flex items-center space-x-2">
                {selectedIds.size > 0 && (
                    <button onClick={handleDeleteSelected} className="flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                        <TrashIcon className="w-5 h-5 mr-2" />
                        删除已选 ({selectedIds.size})
                    </button>
                )}
                <button onClick={openAddView} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    新建合同
                </button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filterKeys.map(key => (
                    <div key={key}>
                        <label htmlFor={`filter-${key}`} className="text-sm font-medium text-gray-700">{key}</label>
                        <select
                            id={`filter-${key}`}
                            value={filters[key] || ''}
                            onChange={(e) => handleFilterChange(key, e.target.value)}
                            className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm text-sm"
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
                <div className="flex items-end">
                     <button onClick={resetFilters} className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">重置过滤</button>
                </div>
            </div>
          </div>
    
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size > 0 && selectedIds.size === filteredContracts.length} className="rounded" />
                  </th>
                  {displayColumns.map(key => (
                    <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContracts.map(contract => (
                  <tr key={contract.id} onClick={() => openEditView(contract)} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(contract.id)} onChange={() => handleSelect(contract.id)} className="rounded" />
                    </td>
                    {displayColumns.map(key => (
                      <td key={key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{contract[key]}</td>
                    ))}
                  </tr>
                ))}
                {filteredContracts.length === 0 && (
                    <tr><td colSpan={displayColumns.length + 1} className="text-center py-10 text-gray-500">
                        {contracts.length > 0 ? '无匹配记录，请尝试调整过滤条件' : '暂无合同记录'}
                    </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
};

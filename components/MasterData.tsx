import React, { useState, useMemo } from 'react';
import type { Personnel, Agent, Product, Customer, Collaboration, Contract } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Modal } from './common/Modal';
import { PlusIcon, TrashIcon, PencilIcon, CloudUploadIcon, XIcon, DownloadIcon } from './common/Icons';

// --- SHARED UTILS ---
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

const parseCSV = (text: string): string[][] => {
  const result: string[][] = [];
  let currentLine: string[] = [];
  let inQuotes = false;
  let value = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i+1] === '"') {
        value += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(value.trim());
        value = '';
      } else if (char === '\n' || char === '\r') {
        if (i > 0 && text[i-1] !== '\n' && text[i-1] !== '\r') {
          currentLine.push(value.trim());
          result.push(currentLine);
          currentLine = [];
          value = '';
        }
        if (char === '\r' && text[i+1] === '\n') i++; // Handle CRLF
      } else {
        value += char;
      }
    }
  }
  if (value || currentLine.length > 0) {
     currentLine.push(value.trim());
     result.push(currentLine);
  }
  return result.filter(line => line.length > 1 || (line.length === 1 && line[0] !== ''));
};

const commonInputClasses = "block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm";
const commonLabelClasses = "block text-sm font-medium text-gray-700 mb-1";


// --- DATA IMPORTER ---
type ImportType = 'collaborations' | 'contracts' | 'agents' | 'products' | 'customers';

const validationSchemas: Record<ImportType, { header: string; required?: boolean; type?: 'number' }[]> = {
  collaborations: [ { header: '引合番号', required: true }, { header: '担当' }, { header: '地域' }, { header: '代理' }, { header: '機種' }, { header: '台数' }, { header: '顧客情報' }, { header: '案件発生年月' }, { header: '访问方式' }, { header: '訪問回数' }, { header: '確度' }, { header: '確度変更' }, { header: '確度変更理由' }, { header: '出荷可能時期' }, { header: '最終結果' }, { header: '出荷日(実際）' }, { header: '備考①引合詳細、補充内容' }, { header: '備考②引合状況変化記録等' }, { header: '備考③' } ],
  contracts: [ { header: '担当' }, { header: '機種' }, { header: '区分' }, { header: '機号' }, { header: '契約日' }, { header: '代理名称' }, { header: '契約状態' }, { header: '契約書NO', required: true }, { header: '出荷指示書№' }, { header: '契約日付' }, { header: '単価', type: 'number' }, { header: '台数', type: 'number' }, { header: '割賦時間' }, { header: '備考①' }, { header: '備考②' } ],
  agents: [ { header: 'SS担当' }, { header: '代理区域' }, { header: '代理商', required: true }, { header: '联系人' }, { header: '电话' }, { header: '公司地址' }, { header: '合同日期' }, { header: '代理状态' }, { header: '备考' } ],
  products: [ { header: '機種', required: true }, { header: '区分' }, { header: '代理価格', type: 'number' }, { header: '仕切り価格', type: 'number' }, { header: 'オプション' }, { header: '備考' } ],
  customers: [ { header: 'name', required: true }, { header: 'contact' } ],
};

const DataImporter: React.FC<{
  setCollaborations: React.Dispatch<React.SetStateAction<Collaboration[]>>;
  setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}> = ({ setCollaborations, setContracts, setAgents, setProducts, setCustomers }) => {
  const [importType, setImportType] = useState<ImportType>('collaborations');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleImport = async () => {
    if (!file) {
      setFeedback({ type: 'error', message: '请选择一个CSV文件。' });
      return;
    }
    setIsLoading(true);
    setFeedback(null);

    const text = await file.text();
    const parsed = parseCSV(text);
    const header = parsed[0];
    const rows = parsed.slice(1);
    
    const schema = validationSchemas[importType];
    const headerMap: Record<string, number> = {};
    header.forEach((h, i) => { headerMap[h.trim()] = i; });

    const errors: string[] = [];
    schema.forEach(field => {
        if (field.required && headerMap[field.header] === undefined) {
            errors.push(`CSV文件缺少必需的列: ${field.header}`);
        }
    });

    if (errors.length > 0) {
        setFeedback({ type: 'error', message: errors.join('\n') });
        setIsLoading(false);
        return;
    }
    
    const newRecords: any[] = [];
    rows.forEach((row, rowIndex) => {
        const record: any = { id: crypto.randomUUID() };
        let hasError = false;

        schema.forEach(field => {
            const cellValue = row[headerMap[field.header]]?.trim() || '';
            if (field.required && !cellValue) {
                errors.push(`第 ${rowIndex + 2} 行: 必需字段 '${field.header}' 为空。`);
                hasError = true;
            }
            if (field.type === 'number' && cellValue && isNaN(Number(cellValue))) {
                errors.push(`第 ${rowIndex + 2} 行: 字段 '${field.header}' 必须是数字。`);
                hasError = true;
            }
            record[field.header] = cellValue;
        });
        if (!hasError) newRecords.push(record);
    });

    if (errors.length > 0) {
        setFeedback({ type: 'error', message: `发现 ${errors.length} 个错误，导入已中止。\n- ${errors.slice(0, 10).join('\n- ')}` });
        setIsLoading(false);
        return;
    }
    
    switch (importType) {
      case 'collaborations': setCollaborations(prev => [...prev, ...newRecords]); break;
      case 'contracts': setContracts(prev => [...prev, ...newRecords]); break;
      case 'agents': setAgents(prev => [...prev, ...newRecords]); break;
      case 'products': setProducts(prev => [...prev, ...newRecords]); break;
      case 'customers': setCustomers(prev => [...prev, ...newRecords]); break;
    }

    setFeedback({ type: 'success', message: `导入成功。添加了 ${newRecords.length} 条记录。`});
    setFile(null);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <select value={importType} onChange={e => setImportType(e.target.value as ImportType)} className="p-2 border rounded-md">
          <option value="collaborations">引合数据</option>
          <option value="contracts">合同数据</option>
          <option value="agents">代理商列表</option>
          <option value="products">产品列表</option>
          <option value="customers">客户列表</option>
        </select>
        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="flex-grow"/>
        <button onClick={handleImport} disabled={isLoading} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
          <CloudUploadIcon className="w-5 h-5 mr-2" />
          {isLoading ? '导入中...' : '导入'}
        </button>
      </div>
      {feedback && (
        <div className={`p-4 rounded-md text-sm whitespace-pre-wrap ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

// --- PERSONNEL MANAGER ---
const PersonnelManager: React.FC<{
  personnel: Personnel[];
  setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
  agents: Agent[];
}> = ({ personnel, setPersonnel, agents }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Personnel | null>(null);
    const [currentItem, setCurrentItem] = useState<Omit<Personnel, 'id'>>({ name: '', position: '', area: [], birthdate: '' });
    
    const allAgentRegions = useMemo(() => [...new Set(agents.map(a => a['代理区域']).filter(Boolean))], [agents]);

    const handleOpenModal = (item: Personnel | null = null) => {
        setEditingItem(item);
        setCurrentItem(item ? { name: item.name, position: item.position, area: item.area || [], birthdate: item.birthdate } : { name: '', position: '', area: [], birthdate: '' });
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!currentItem.name) return;
        if (editingItem) {
            setPersonnel(prev => prev.map(p => p.id === editingItem.id ? { ...currentItem, id: editingItem.id } : p));
        } else {
            setPersonnel(prev => [...prev, { ...currentItem, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const calculateAge = (birthdate: string) => {
        if (!birthdate) return '';
        const age = new Date().getFullYear() - new Date(birthdate).getFullYear();
        return age > 0 ? `${age}岁` : '';
    };

    const handleExport = () => {
        const headers = ['id', 'name', 'position', 'birthdate', 'area'];
        exportToCSV(personnel, headers, 'personnel.csv');
    };
    
    const TagInput: React.FC<{ value: string[]; onChange: (value: string[]) => void; suggestions: string[]; id: string; }> = ({ value, onChange, suggestions, id }) => {
        const [inputValue, setInputValue] = useState('');

        const handleAdd = (newValue: string) => {
            if (newValue && !value.includes(newValue)) {
                onChange([...value, newValue]);
            }
            setInputValue('');
        };
        const handleRemove = (tagToRemove: string) => {
            onChange(value.filter(tag => tag !== tagToRemove));
        };
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                handleAdd(inputValue.trim());
            }
        };

        return (
            <div className={`flex flex-wrap gap-2 p-2 rounded-md min-h-[42px] mt-1 ${commonInputClasses}`}>
                {value.map(tag => (
                    <div key={tag} className="flex items-center bg-indigo-100 text-indigo-800 text-sm font-medium px-2 py-1 rounded-full">
                        {tag}
                        <button onClick={() => handleRemove(tag)} className="ml-2 text-indigo-500 hover:text-indigo-700">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                <input
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => handleAdd(inputValue.trim())}
                    placeholder="添加区域..."
                    list="agent-regions-list"
                    className="flex-grow p-1 outline-none bg-transparent"
                />
                <datalist id="agent-regions-list">
                    {suggestions.filter(s => !value.includes(s)).map(s => <option key={s} value={s} />)}
                </datalist>
            </div>
        );
    };

    return (
        <div>
            <div className="flex items-center space-x-2 mb-4">
                <button onClick={handleExport} className="flex-1 flex justify-center items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                    <DownloadIcon className="w-5 h-5 mr-2" /> 导出
                </button>
                <button onClick={() => handleOpenModal()} className="flex-1 flex justify-center items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" /> 添加担当
                </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {personnel.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                        <div>
                            <span className="font-semibold">{p.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{p.position}</span>
                            <span className="text-sm text-gray-500 ml-2">{calculateAge(p.birthdate)}</span>
                             <p className="text-xs text-gray-600">{p.area?.join(', ')}</p>
                        </div>
                        <div>
                            <button onClick={() => handleOpenModal(p)} className="text-gray-400 hover:text-blue-500 mr-2"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => setPersonnel(prev => prev.filter(i => i.id !== p.id))} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? "编辑担当" : "添加担当"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="personnel-name" className={commonLabelClasses}>姓名</label>
                        <input id="personnel-name" value={currentItem.name} onChange={e => setCurrentItem(c => ({...c, name: e.target.value}))} placeholder="姓名" className={commonInputClasses}/>
                    </div>
                    <div>
                        <label htmlFor="personnel-position" className={commonLabelClasses}>职位</label>
                        <input id="personnel-position" value={currentItem.position} onChange={e => setCurrentItem(c => ({...c, position: e.target.value}))} placeholder="职位" className={commonInputClasses}/>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="personnel-birthdate" className={commonLabelClasses}>出生年月日</label>
                        <input id="personnel-birthdate" type="date" value={currentItem.birthdate} onChange={e => setCurrentItem(c => ({...c, birthdate: e.target.value}))} className={commonInputClasses}/>
                    </div>
                    <div className="md:col-span-2">
                         <label htmlFor="personnel-area" className={commonLabelClasses}>担当区域</label>
                         <TagInput id="personnel-area" value={currentItem.area || []} onChange={v => setCurrentItem(c => ({...c, area: v}))} suggestions={allAgentRegions} />
                    </div>
                </div>
                 <div className="flex justify-end pt-8 mt-8 border-t"><button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-md">保存</button></div>
            </Modal>
        </div>
    );
};

// --- GENERIC CRUD MANAGER FOR OTHER TYPES ---
const CrudManager: React.FC<{
    title: string;
    items: any[];
    setItems: (items: any) => void;
    fields: { key: string; label: string; type: 'text' | 'number' | 'date' | 'select' | 'textarea'; options?: string[]; gridSpan?: string }[];
    displayColumns: string[];
    initialState: any;
    exportFilename: string;
}> = ({ title, items, setItems, fields, displayColumns, initialState, exportFilename }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [currentItem, setCurrentItem] = useState(initialState);

    const handleOpenModal = (item: any | null = null) => {
        setEditingItem(item);
        setCurrentItem(item ? { ...item } : initialState);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (editingItem) {
            setItems((prev: any[]) => prev.map(p => p.id === editingItem.id ? currentItem : p));
        } else {
            setItems((prev: any[]) => [...prev, { ...currentItem, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const handleExport = () => {
        const headers = ['id', ...fields.map(f => f.key)];
        exportToCSV(items, headers, `${exportFilename}.csv`);
    };

    return (
        <div>
            <div className="flex items-center space-x-2 mb-4">
                <button onClick={handleExport} className="flex-1 flex justify-center items-center bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                    <DownloadIcon className="w-5 h-5 mr-2" /> 导出
                </button>
                <button onClick={() => handleOpenModal()} className="flex-1 flex justify-center items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" /> 添加{title}
                </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100"><tr>{displayColumns.map(k => <th key={k} className="p-2 text-left font-medium">{k}</th>)}<th/></tr></thead>
                    <tbody>
                        {items.map(item => (
                            <tr key={item.id} className="border-b">
                                {displayColumns.map(key => <td key={key} className="p-2 truncate max-w-[100px]">{item[key]}</td>)}
                                <td className="p-2 text-right">
                                    <button onClick={() => handleOpenModal(item)} className="text-gray-400 hover:text-blue-500 mr-2"><PencilIcon className="w-5 h-5" /></button>
                                    <button onClick={() => setItems((prev: any[]) => prev.filter(i => i.id !== item.id))} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? "编辑" : "添加"}${title}`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {fields.map(field => (
                        <div key={field.key} className={field.gridSpan || 'md:col-span-2'}>
                             <label htmlFor={field.key} className={commonLabelClasses}>{field.label}</label>
                             {field.type === 'select' ? (
                                <select id={field.key} name={field.key} value={currentItem[field.key] || ''} onChange={e => setCurrentItem(c => ({...c, [field.key]: e.target.value}))} className={commonInputClasses}>
                                    <option value="">请选择</option>
                                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                             ) : field.type === 'textarea' ? (
                                <textarea id={field.key} name={field.key} value={currentItem[field.key] || ''} onChange={e => setCurrentItem(c => ({...c, [field.key]: e.target.value}))} rows={3} className={commonInputClasses}/>
                             ) : (
                                <input id={field.key} name={field.key} type={field.type} value={currentItem[field.key] || ''} onChange={e => setCurrentItem(c => ({...c, [field.key]: e.target.value}))} className={commonInputClasses}/>
                             )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-8 mt-8 border-t"><button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-md">保存</button></div>
            </Modal>
        </div>
    );
}

export const MasterData: React.FC<{
    personnel: Personnel[]; setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
    agents: Agent[]; setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    customers: Customer[]; setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    setCollaborations: React.Dispatch<React.SetStateAction<Collaboration[]>>;
    setContracts: React.Dispatch<React.SetStateAction<Contract[]>>;
}> = (props) => {
    const [activeTab, setActiveTab] = useState('import');

    const tabs = [
        { id: 'import', name: '数据导入' },
        { id: 'personnel', name: '担当管理' },
        { id: 'agents', name: '代理商管理' },
        { id: 'products', name: '产品管理' },
        { id: 'customers', name: '客户管理' },
    ];

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">基础数据维护</h2>
             <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                 {activeTab === 'import' && <DataImporter {...props} />}
                 {activeTab === 'personnel' && <PersonnelManager personnel={props.personnel} setPersonnel={props.setPersonnel} agents={props.agents} />}
                 {activeTab === 'agents' && <CrudManager title="代理商" items={props.agents} setItems={props.setAgents} initialState={{ 'SS担当': '', '代理区域': '', '代理商': '', '联系人': '', '电话': '', '公司地址': '', '合同日期': '', '代理状态': '合作中', '备考': '' }} displayColumns={['代理商', 'SS担当', '代理区域', '代理状态', '合同日期']} fields={[
                     { key: '代理商', label: '代理商', type: 'text', gridSpan: 'md:col-span-2' }, { key: 'SS担当', label: 'SS担当', type: 'text', gridSpan: 'md:col-span-2' }, { key: '代理区域', label: '代理区域', type: 'text', gridSpan: 'md:col-span-2' }, { key: '联系人', label: '联系人', type: 'text', gridSpan: 'md:col-span-2' }, { key: '电话', label: '电话', type: 'text', gridSpan: 'md:col-span-2' }, { key: '合同日期', label: '合同日期', type: 'date', gridSpan: 'md:col-span-2' }, { key: '代理状态', label: '代理状态', type: 'select', options: ['合作中', '已终止'], gridSpan: 'md:col-span-4' }, { key: '公司地址', label: '公司地址', type: 'textarea', gridSpan: 'md:col-span-4'}, { key: '备考', label: '备考', type: 'textarea', gridSpan: 'md:col-span-4'},
                 ]} exportFilename="agents" />}
                 {activeTab === 'products' && <CrudManager title="产品" items={props.products} setItems={props.setProducts} initialState={{'機種': '', '区分': '', '代理価格': '', '仕切り価格': '', 'オプション': '', '備考': ''}} displayColumns={['機種', '区分', '代理価格', '仕切り価格']} fields={[
                     { key: '機種', label: '機種', type: 'text', gridSpan: 'md:col-span-2' }, { key: '区分', label: '区分', type: 'text', gridSpan: 'md:col-span-2' }, { key: '代理価格', label: '代理価格', type: 'number', gridSpan: 'md:col-span-2' }, { key: '仕切り価格', label: '仕切り価格', type: 'number', gridSpan: 'md:col-span-2' }, { key: 'オプション', label: 'オプション', type: 'textarea', gridSpan: 'md:col-span-4' }, { key: '備考', label: '備考', type: 'textarea', gridSpan: 'md:col-span-4' },
                 ]} exportFilename="products" />}
                 {activeTab === 'customers' && <CrudManager title="客户" items={props.customers} setItems={props.setCustomers} initialState={{ name: '', contact: '' }} displayColumns={['name', 'contact']} fields={[
                     { key: 'name', label: '客户名称', type: 'text', gridSpan: 'md:col-span-2' }, { key: 'contact', label: '联系方式', type: 'text', gridSpan: 'md:col-span-2' },
                 ]} exportFilename="customers" />}
            </div>
        </div>
    );
};
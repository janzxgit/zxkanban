import React, { useState, useMemo, useRef } from 'react';
import type { Personnel, Agent, Product, Customer, Collaboration } from '../types';
import { Modal } from './common/Modal';
import { PlusIcon, TrashIcon, PencilIcon, CloudUploadIcon, XIcon } from './common/Icons';

// Props for the main component
interface MasterDataProps {
  personnel: Personnel[];
  setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setCollaborations: React.Dispatch<React.SetStateAction<Collaboration[]>>;
}

// Sub-component for Data Import
const DataImporter: React.FC<Pick<MasterDataProps, 'setAgents' | 'setProducts' | 'setCustomers' | 'setCollaborations'>> = ({ setCollaborations, setAgents, setProducts, setCustomers }) => {
    const [importType, setImportType] = useState<'collaborations' | 'agents' | 'products' | 'customers'>('collaborations');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setCsvFile(event.target.files[0]);
            setFeedback(null);
        }
    };
    
    const parseCsvRow = (row: string): string[] => {
        const result: string[] = [];
        let currentField = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    currentField += '"';
                    i++; 
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField);
        return result;
    };


    const handleImport = () => {
        if (!csvFile) {
            setFeedback({ type: 'error', message: '请选择一个CSV文件' });
            return;
        }

        setIsLoading(true);
        setFeedback(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split('\n').map(row => row.trim()).filter(Boolean);
                if (rows.length < 2) {
                    setFeedback({ type: 'error', message: 'CSV文件为空或只有标题行' });
                    return;
                }
                const header = parseCsvRow(rows[0].toLowerCase());
                const dataRows = rows.slice(1);

                let errors: string[] = [];
                const newItems: any[] = [];
                
                dataRows.forEach((row, index) => {
                    const values = parseCsvRow(row);
                    if (values.length !== header.length) {
                        errors.push(`Row ${index + 2}: 列数不匹配. 应为 ${header.length}, 实际为 ${values.length}.`);
                        return; // Skip this malformed row
                    }
                    const item = header.reduce((obj, nextKey, idx) => ({...obj, [nextKey]: values[idx]?.trim() || ''}), {} as any);

                    switch(importType) {
                        case 'collaborations': {
                            if (!item['引合番号']) errors.push(`Row ${index + 2}: 引合番号 不能为空.`);
                            if (item['台数'] && isNaN(Number(item['台数']))) errors.push(`Row ${index + 2}: 台数 必须是数字.`);
                            break;
                        }
                        case 'agents': {
                            if (!item['代理商']) errors.push(`Row ${index + 2}: 代理商 不能为空.`);
                            break;
                        }
                        case 'products': {
                            if (!item.name) errors.push(`Row ${index + 2}: name 不能为空.`);
                            if (!item.price || isNaN(parseFloat(item.price))) errors.push(`Row ${index + 2}: price 必须是有效的数字.`);
                            break;
                        }
                        case 'customers': {
                            if (!item.name) errors.push(`Row ${index + 2}: name 不能为空.`);
                            break;
                        }
                    }
                    newItems.push(item);
                });

                if (errors.length > 0) {
                    setFeedback({ type: 'error', message: `导入失败，发现 ${errors.length} 个错误:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...等更多错误' : ''}` });
                    return;
                }

                // If no errors, process and set data
                switch(importType) {
                    case 'collaborations': 
                        setCollaborations(prev => [...prev, ...newItems.map(item => ({...item, id: crypto.randomUUID()}))]);
                        break;
                    case 'agents':
                        setAgents(prev => [...prev, ...newItems.map(item => ({...item, id: crypto.randomUUID(), '代理状态': item['代理状态'] || '合作中'}))]);
                        break;
                    case 'products':
                        setProducts(prev => [...prev, ...newItems.map(item => ({...item, id: crypto.randomUUID(), price: parseFloat(item.price)}))]);
                        break;
                    case 'customers':
                        setCustomers(prev => [...prev, ...newItems.map(item => ({...item, id: crypto.randomUUID()}))]);
                        break;
                }
                setFeedback({ type: 'success', message: `导入成功. ${newItems.length} 条记录已添加.` });

            } catch (error) {
                setFeedback({ type: 'error', message: `解析文件时发生意外错误: ${error instanceof Error ? error.message : String(error)}`});
            } finally {
                setIsLoading(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
                setCsvFile(null);
            }
        };
        reader.onerror = () => {
             setIsLoading(false);
             setFeedback({ type: 'error', message: '读取文件失败.' });
        };
        reader.readAsText(csvFile);
    };

    return (
         <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">数据导入</h3>
            <p className="text-gray-600">从CSV文件批量导入数据。请确保CSV文件的列标题与系统字段匹配。</p>
            <div className="flex items-center space-x-4">
                <select value={importType} onChange={e => setImportType(e.target.value as any)} className="p-2 border rounded-md">
                    <option value="collaborations">引合数据</option>
                    <option value="agents">代理商列表</option>
                    <option value="products">产品列表</option>
                    <option value="customers">客户列表</option>
                </select>
                <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileChange} className="flex-1 p-1 border rounded-md" />
                <button onClick={handleImport} disabled={isLoading} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed">
                    <CloudUploadIcon className="w-5 h-5 mr-2"/>
                    {isLoading ? '导入中...' : '导入'}
                </button>
            </div>
             {feedback && (
                <div className={`p-3 rounded-md text-sm whitespace-pre-wrap ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {feedback.message}
                </div>
            )}
        </div>
    );
};


// Sub-component for Personnel Management
const PersonnelManager: React.FC<{ personnel: Personnel[], setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>, agents: Agent[] }> = ({ personnel, setPersonnel, agents }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const initialPersonnelState: Omit<Personnel, 'id'> = { name: '', position: '', area: [], dob: '' };
    const [newPersonnel, setNewPersonnel] = useState(initialPersonnelState);
    const [currentAreaInput, setCurrentAreaInput] = useState('');

    const uniqueAgentAreas = useMemo(() => [...new Set(agents.map(a => a['代理区域']).filter(Boolean))], [agents]);

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPersonnel(prev => ({ ...prev, [name]: value }));
    };

    const handleAddArea = () => {
        const areaToAdd = currentAreaInput.trim();
        if (areaToAdd && !newPersonnel.area.includes(areaToAdd)) {
            setNewPersonnel(prev => ({ ...prev, area: [...prev.area, areaToAdd] }));
        }
        setCurrentAreaInput('');
    };

    const handleRemoveArea = (areaToRemove: string) => {
        setNewPersonnel(prev => ({ ...prev, area: prev.area.filter(a => a !== areaToRemove) }));
    };
    
    const handleAreaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddArea();
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setNewPersonnel(initialPersonnelState);
        setIsModalOpen(true);
    };

    const openEditModal = (person: Personnel) => {
        setEditingId(person.id);
        setNewPersonnel({ name: person.name, position: person.position, area: person.area, dob: person.dob });
        setIsModalOpen(true);
    };
    
    const handleSubmit = () => {
        if (!newPersonnel.name) return;
        if (editingId) {
            setPersonnel(personnel.map(p => p.id === editingId ? { ...newPersonnel, id: editingId } : p));
        } else {
            setPersonnel([...personnel, { ...newPersonnel, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure?')) {
            setPersonnel(personnel.filter(p => p.id !== id));
        }
    };

    return (
         <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">担当管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    添加担当
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">职位</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当区域</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出生年月日</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年龄</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {personnel.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{p.position}</td>
                                <td className="px-6 py-4">{p.area.join(', ')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{p.dob}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{calculateAge(p.dob)}</td>
                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                    <button onClick={() => openEditModal(p)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "编辑担当" : "添加担当"}>
                <div className="space-y-4">
                    <input name="name" value={newPersonnel.name} onChange={handleInputChange} placeholder="姓名" className="w-full p-2 border rounded" />
                    <input name="position" value={newPersonnel.position} onChange={handleInputChange} placeholder="职位" className="w-full p-2 border rounded" />
                    <input name="dob" type="date" value={newPersonnel.dob} onChange={handleInputChange} className="w-full p-2 border rounded" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">担当区域</label>
                         <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px] bg-white">
                            {newPersonnel.area.map(area => (
                                <span key={area} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-sm">
                                    {area}
                                    <button onClick={() => handleRemoveArea(area)} className="text-indigo-500 hover:text-indigo-800">
                                        <XIcon className="w-3 h-3"/>
                                    </button>
                                </span>
                            ))}
                         </div>
                        <div className="flex mt-2">
                            <input
                                list="agent-areas-list"
                                value={currentAreaInput}
                                onChange={(e) => setCurrentAreaInput(e.target.value)}
                                onKeyDown={handleAreaKeyDown}
                                placeholder="输入或选择区域"
                                className="w-full p-2 border rounded-l-md"
                            />
                            <datalist id="agent-areas-list">
                                {uniqueAgentAreas.map(area => <option key={area} value={area} />)}
                            </datalist>
                            <button onClick={handleAddArea} className="bg-gray-200 text-gray-700 px-4 rounded-r-md hover:bg-gray-300">添加</button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


// Sub-component for Agent Management
const AgentManager: React.FC<{ agents: Agent[], setAgents: React.Dispatch<React.SetStateAction<Agent[]>> }> = ({ agents, setAgents }) => { 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const initialAgentState: Omit<Agent, 'id'> = { 'SS担当': '', '代理区域': '', '代理商': '', '联系人': '', '电话': '', '公司地址': '', '合同日期': '', '代理状态': '合作中', '备考': '' };
    const [currentAgent, setCurrentAgent] = useState(initialAgentState);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentAgent(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingId(null);
        setCurrentAgent(initialAgentState);
        setIsModalOpen(true);
    };

    const openEditModal = (agent: Agent) => {
        setEditingId(agent.id);
        const { id, ...data } = agent;
        setCurrentAgent(data);
        setIsModalOpen(true);
    };
    
    const handleSubmit = () => {
        if (!currentAgent['代理商']) return;
        if (editingId) {
            setAgents(agents.map(a => a.id === editingId ? { ...currentAgent, id: editingId } : a));
        } else {
            setAgents([...agents, { ...currentAgent, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure?')) {
            setAgents(agents.filter(a => a.id !== id));
        }
    };

    const agentFields: { key: keyof Omit<Agent, 'id'>, label: string, type: string }[] = [
        { key: '代理商', label: '代理商', type: 'text' },
        { key: 'SS担当', label: 'SS担当', type: 'text' },
        { key: '代理区域', label: '代理区域', type: 'text' },
        { key: '联系人', label: '联系人', type: 'text' },
        { key: '电话', label: '电话', type: 'text' },
        { key: '公司地址', label: '公司地址', type: 'text' },
        { key: '合同日期', label: '合同日期', type: 'date' },
        { key: '代理状态', label: '代理状态', type: 'select' },
        { key: '备考', label: '备考', type: 'textarea' },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">代理商管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"><PlusIcon className="w-5 h-5 mr-2" />添加代理商</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代理商</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SS担当</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代理区域</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代理状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同日期</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {agents.map(a => (
                            <tr key={a.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{a['代理商']}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{a['SS担当']}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{a['代理区域']}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{a['代理状态']}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{a['合同日期']}</td>
                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                    <button onClick={() => openEditModal(a)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "编辑代理商" : "添加代理商"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agentFields.map(field => (
                        <div key={field.key} className={['公司地址', '备考'].includes(field.key) ? 'md:col-span-2' : ''}>
                             <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                             {field.type === 'select' ? (
                                <select name={field.key} value={currentAgent[field.key]} onChange={handleInputChange} className="mt-1 block w-full p-2 border rounded">
                                    <option value="合作中">合作中</option>
                                    <option value="已终止">已终止</option>
                                </select>
                             ) : field.type === 'textarea' ? (
                                <textarea name={field.key} value={currentAgent[field.key]} onChange={handleInputChange} rows={3} className="mt-1 block w-full p-2 border rounded"/>
                             ) : (
                                <input name={field.key} type={field.type} value={currentAgent[field.key]} onChange={handleInputChange} className="mt-1 block w-full p-2 border rounded"/>
                             )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button></div>
            </Modal>
        </div>
    );
};

// Sub-component for Product Management
const ProductManager: React.FC<{ products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>> }> = ({ products, setProducts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const initialProductState: Omit<Product, 'id'> = { name: '', price: 0 };
    const [currentProduct, setCurrentProduct] = useState(initialProductState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentProduct(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
    };

    const openAddModal = () => {
        setEditingId(null);
        setCurrentProduct(initialProductState);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingId(product.id);
        setCurrentProduct({ name: product.name, price: product.price });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!currentProduct.name) return;
        if (editingId) {
            setProducts(products.map(p => p.id === editingId ? { ...currentProduct, id: editingId } : p));
        } else {
            setProducts([...products, { ...currentProduct, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure?')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">产品管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"><PlusIcon className="w-5 h-5 mr-2" />添加产品</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{p.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                    <button onClick={() => openEditModal(p)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "编辑产品" : "添加产品"}>
                <div className="space-y-4">
                    <input name="name" value={currentProduct.name} onChange={handleInputChange} placeholder="产品名称" className="w-full p-2 border rounded" />
                    <input name="price" type="number" value={currentProduct.price} onChange={handleInputChange} placeholder="价格" className="w-full p-2 border rounded" />
                </div>
                <div className="flex justify-end pt-4"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button></div>
            </Modal>
        </div>
    );
};

// Sub-component for Customer Management
const CustomerManager: React.FC<{ customers: Customer[], setCustomers: React.Dispatch<React.SetStateAction<Customer[]>> }> = ({ customers, setCustomers }) => { 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const initialCustomerState: Omit<Customer, 'id'> = { name: '', contact: '' };
    const [currentCustomer, setCurrentCustomer] = useState(initialCustomerState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentCustomer(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingId(null);
        setCurrentCustomer(initialCustomerState);
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingId(customer.id);
        setCurrentCustomer({ name: customer.name, contact: customer.contact });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!currentCustomer.name) return;
        if (editingId) {
            setCustomers(customers.map(c => c.id === editingId ? { ...currentCustomer, id: editingId } : c));
        } else {
            setCustomers([...customers, { ...currentCustomer, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure?')) {
            setCustomers(customers.filter(c => c.id !== id));
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">客户管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"><PlusIcon className="w-5 h-5 mr-2" />添加客户</button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系方式</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{c.contact}</td>
                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                    <button onClick={() => openEditModal(c)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "编辑客户" : "添加客户"}>
                <div className="space-y-4">
                    <input name="name" value={currentCustomer.name} onChange={handleInputChange} placeholder="客户名称" className="w-full p-2 border rounded" />
                    <input name="contact" value={currentCustomer.contact} onChange={handleInputChange} placeholder="联系方式" className="w-full p-2 border rounded" />
                </div>
                <div className="flex justify-end pt-4"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">保存</button></div>
            </Modal>
        </div>
    );
};


// Main MasterData Component
export const MasterData: React.FC<MasterDataProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'import' | 'personnel' | 'agents' | 'products' | 'customers'>('import');
    
    const tabs = [
        { id: 'import', label: '数据导入' },
        { id: 'personnel', label: '担当管理' },
        { id: 'agents', label: '代理商管理' },
        { id: 'products', label: '产品管理' },
        { id: 'customers', label: '客户管理' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'import':
                return <DataImporter 
                            setCollaborations={props.setCollaborations}
                            setAgents={props.setAgents}
                            setProducts={props.setProducts}
                            setCustomers={props.setCustomers}
                        />;
            case 'personnel':
                return <PersonnelManager personnel={props.personnel} setPersonnel={props.setPersonnel} agents={props.agents} />;
            case 'agents':
                return <AgentManager agents={props.agents} setAgents={props.setAgents} />;
            case 'products':
                return <ProductManager products={props.products} setProducts={props.setProducts} />;
            case 'customers':
                return <CustomerManager customers={props.customers} setCustomers={props.setCustomers} />;
            default:
                return null;
        }
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">主数据管理</h2>
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};
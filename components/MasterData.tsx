import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Personnel, Collaboration, Agent, Product, Customer } from '../types';
import { Modal } from './common/Modal';
import { PlusIcon, TrashIcon, PencilIcon, CloudUploadIcon } from './common/Icons';

type Tab = 'import' | 'personnel' | 'agents' | 'products' | 'customers';
const initialPersonnelState: Omit<Personnel, 'id'> = { name: '', position: '', area: '', dob: ''};
const initialAgentState: Omit<Agent, 'id'> = { 
    'SS担当': '', '代理区域': '', '代理商': '', '联系人': '', 
    '电话': '', '公司地址': '', '合同日期': '', '代理状态': '', '备考': '' 
};
const initialProductState: Omit<Product, 'id'> = { name: '', price: 0 };
const initialCustomerState: Omit<Customer, 'id'> = { name: '', contact: '' };

// --- Customer Management Component ---
const CustomerManager: React.FC<{
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}> = ({ customers, setCustomers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState<Omit<Customer, 'id'>>(initialCustomerState);
    const [editingId, setEditingId] = useState<string | null>(null);

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
        if (window.confirm('Are you sure you want to delete this customer?')) {
            setCustomers(customers.filter(c => c.id !== id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-700">客户管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    添加客户
                </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">联系方式</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{customer.contact}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(customer)} className="text-indigo-600 hover:text-indigo-900 mr-4"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-500">暂无客户记录</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? '编辑客户' : '添加客户'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">客户名称</label>
                        <input name="name" value={currentCustomer.name} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">联系方式</label>
                        <input name="contact" value={currentCustomer.contact} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                    <div className="flex justify-end pt-2"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md">保存</button></div>
                </div>
             </Modal>
        </div>
    );
};


// --- Product Management Component ---
const ProductManager: React.FC<{
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}> = ({ products, setProducts }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Omit<Product, 'id'>>(initialProductState);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setCurrentProduct(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value 
        }));
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
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-700">产品管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    添加产品
                </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品名称</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">¥{product.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && <tr><td colSpan={3} className="text-center py-10 text-gray-500">暂无产品记录</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? '编辑产品' : '添加产品'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">产品名称</label>
                        <input name="name" value={currentProduct.name} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">价格</label>
                        <input name="price" type="number" value={currentProduct.price} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                    <div className="flex justify-end pt-2"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md">保存</button></div>
                </div>
             </Modal>
        </div>
    );
};


// --- Agent Management Component ---
const AgentManager: React.FC<{
    agents: Agent[];
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}> = ({ agents, setAgents }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentAgent, setCurrentAgent] = useState<Omit<Agent, 'id'>>(initialAgentState);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        setCurrentAgent({ 
            'SS担当': agent['SS担当'], '代理区域': agent['代理区域'], '代理商': agent['代理商'],
            '联系人': agent['联系人'], '电话': agent['电话'], '公司地址': agent['公司地址'],
            '合同日期': agent['合同日期'], '代理状态': agent['代理状态'], '备考': agent['备考']
        });
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
        if (window.confirm('Are you sure you want to delete this agent?')) {
            setAgents(agents.filter(a => a.id !== id));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };

    const handleImport = () => {
        if (!file) {
            setMessage('Please select a CSV file to import.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("CSV file is empty or has only a header.");

                const headers = lines[0].split(',').map(h => h.trim());
                const agentHeaders = Object.keys(initialAgentState);
                const requiredHeader = '代理商';

                if (!headers.includes(requiredHeader)) {
                    throw new Error(`CSV must contain a '${requiredHeader}' column.`);
                }

                const newAgents = lines.slice(1).map(line => {
                    const fields = line.split(',');
                    const agentData: any = { id: crypto.randomUUID() };
                    headers.forEach((header, index) => {
                       if(agentHeaders.includes(header)) {
                           agentData[header] = fields[index]?.trim() || '';
                       }
                    });

                    // Set defaults for any missing fields
                    agentHeaders.forEach(h => {
                        if (!agentData[h]) agentData[h] = initialAgentState[h as keyof typeof initialAgentState];
                    });
                    
                    return agentData.代理商 ? agentData as Agent : null;
                }).filter((agent): agent is Agent => agent !== null);

                setAgents(prev => [...prev, ...newAgents]);
                setMessage(`Successfully imported ${newAgents.length} agents.`);
                setFile(null);
            } catch (error) {
                setMessage(`Error importing file: ${error instanceof Error ? error.message : String(error)}`);
            }
        };
        reader.onerror = () => setMessage('Error reading file.');
        reader.readAsText(file);
    };

    const agentFields: { key: keyof Omit<Agent, 'id'>; label: string; type: string; options?: string[]; component?: 'textarea' }[] = [
        { key: '代理商', label: '代理商', type: 'text' },
        { key: 'SS担当', label: 'SS担当', type: 'text' },
        { key: '代理区域', label: '代理区域', type: 'text' },
        { key: '联系人', label: '联系人', type: 'text' },
        { key: '电话', label: '电话', type: 'tel' },
        { key: '合同日期', label: '合同日期', type: 'date' },
        { key: '代理状态', label: '代理状态', type: 'select', options: ['合作中', '已终止'] },
        { key: '公司地址', label: '公司地址', type: 'text', component: 'textarea' },
        { key: '备考', label: '备考', type: 'text', component: 'textarea' },
    ];
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-700">代理商管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    添加代理商
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h4 className="text-md font-semibold text-gray-600 mb-2">从CSV导入</h4>
                <div className="flex items-center space-x-4">
                    <label htmlFor="agent-csv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 border border-gray-300 px-3 py-2 text-sm">
                        <span>{file ? file.name : '选择文件'}</span>
                        <input id="agent-csv-upload" name="agent-csv-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                    </label>
                    <button onClick={handleImport} disabled={!file} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                        <CloudUploadIcon className="w-5 h-5 mr-2" />
                        导入
                    </button>
                </div>
                {message && <p className={`mt-2 text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代理商</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SS担当</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代理区域</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">代理状态</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">合同日期</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {agents.map(agent => (
                            <tr key={agent.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{agent['代理商']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{agent['SS担当']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{agent['代理区域']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent['代理状态'] === '合作中' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {agent['代理状态']}
                                     </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{agent['合同日期']}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(agent)} className="text-indigo-600 hover:text-indigo-900 mr-4"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(agent.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {agents.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">暂无代理商记录</td></tr>}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? '编辑代理商' : '添加代理商'}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                     {agentFields.map(({ key, label, type, component, options }) => (
                         <div key={key} className={component === 'textarea' ? 'md:col-span-2' : ''}>
                             <label htmlFor={key} className="block text-sm font-medium text-gray-700">{label}</label>
                              {component === 'textarea' ? (
                                <textarea
                                    id={key}
                                    name={key}
                                    value={currentAgent[key] || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                             ) : type === 'select' ? (
                                <select
                                    id={key}
                                    name={key}
                                    value={currentAgent[key] || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">请选择</option>
                                    {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                             ) : (
                                <input
                                    type={type}
                                    id={key}
                                    name={key}
                                    value={currentAgent[key] || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                             )}
                         </div>
                     ))}
                 </div>
                 <div className="flex justify-end pt-6"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md">保存</button></div>
             </Modal>
        </div>
    );
};


// --- Personnel Management Component ---
const PersonnelManager: React.FC = () => {
    const [personnel, setPersonnel] = useLocalStorage<Personnel[]>('personnel', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPersonnel, setCurrentPersonnel] = useState<Omit<Personnel, 'id'>>(initialPersonnelState);
    const [editingId, setEditingId] = useState<string | null>(null);

    const calculateAge = (dob: string): number | string => {
        if (!dob) return 'N/A';
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
        setCurrentPersonnel(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        setEditingId(null);
        setCurrentPersonnel(initialPersonnelState);
        setIsModalOpen(true);
    };

    const openEditModal = (p: Personnel) => {
        setEditingId(p.id);
        setCurrentPersonnel({ name: p.name, position: p.position, area: p.area, dob: p.dob });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!currentPersonnel.name || !currentPersonnel.dob) return;
        if (editingId) {
            setPersonnel(personnel.map(p => p.id === editingId ? { ...currentPersonnel, id: editingId } : p));
        } else {
            setPersonnel([...personnel, { ...currentPersonnel, id: crypto.randomUUID() }]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this person?')) {
            setPersonnel(personnel.filter(p => p.id !== id));
        }
    };
    
    return (
        <div>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-700">担当管理</h3>
                <button onClick={openAddModal} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-200 shadow-sm">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    添加担当
                </button>
            </div>
             <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">职位</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当区域</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">出生年月日</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">年龄</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {personnel.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{p.position}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{p.area}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{p.dob}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{calculateAge(p.dob)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openEditModal(p)} className="text-indigo-600 hover:text-indigo-900 mr-4"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                        {personnel.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">暂无担当记录</td></tr>}
                    </tbody>
                </table>
             </div>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? '编辑担当' : '添加担当'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">姓名</label>
                        <input name="name" value={currentPersonnel.name} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">职位</label>
                        <input name="position" value={currentPersonnel.position} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">担当区域</label>
                        <input name="area" value={currentPersonnel.area} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">出生年月日</label>
                        <input name="dob" type="date" value={currentPersonnel.dob} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded"/>
                    </div>
                    <div className="flex justify-end pt-2"><button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-2 rounded-md">保存</button></div>
                </div>
             </Modal>
        </div>
    );
};

// --- Data Import Component ---
const DataImporter: React.FC<{
    setCollaborations: React.Dispatch<React.SetStateAction<Collaboration[]>>;
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}> = ({ setCollaborations, setAgents, setProducts, setCustomers }) => {
    const [importType, setImportType] = useState('collaborations');
    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setMessage('');
        }
    };
    
    const handleImport = () => {
        if (!file) {
            setMessage('Please select a file to import.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("CSV file is empty or has only a header.");
                
                const headers = lines[0].split(',').map(h => h.trim());
                const dataRows = lines.slice(1);

                let errors: { row: number; message: string }[] = [];
                let validData: any[] = [];
                
                const getIndex = (name: string) => headers.indexOf(name);
                
                switch (importType) {
                    case 'collaborations': {
                        const required = ['引合番号'];
                        if (!required.every(h => headers.includes(h))) throw new Error(`CSV must contain required headers: ${required.join(', ')}`);
                        
                        dataRows.forEach((line, index) => {
                            const row = line.split(',');
                            const data: Partial<Collaboration> = {};
                            headers.forEach((h, i) => (data as any)[h] = row[i]?.trim());

                            if (!data['引合番号']) errors.push({ row: index + 2, message: "Required field '引合番号' is missing." });
                            const taisu = data['台数' as keyof typeof data];
                            if (taisu && isNaN(Number(taisu))) errors.push({ row: index + 2, message: "'台数' must be a valid number." });
                            
                            validData.push({ ...data, id: crypto.randomUUID() });
                        });
                        if (errors.length > 0) break;
                        setCollaborations(prev => [...prev, ...validData]);
                        break;
                    }
                    case 'agents': {
                        const required = ['代理商'];
                        if (!required.every(h => headers.includes(h))) throw new Error(`CSV must contain required headers: ${required.join(', ')}`);
                        
                         const agentHeaders = Object.keys(initialAgentState);
                        
                        dataRows.forEach((line, index) => {
                            const fields = line.split(',');
                            const agentData: any = { id: crypto.randomUUID() };
                            let hasRequired = false;

                            headers.forEach((header, i) => {
                                if (agentHeaders.includes(header)) {
                                    agentData[header] = fields[i]?.trim() || '';
                                    if(header === '代理商' && agentData[header]) {
                                        hasRequired = true;
                                    }
                                }
                            });
                            
                            if (!hasRequired) {
                                errors.push({ row: index + 2, message: "Required field '代理商' is missing." });
                            } else {
                                validData.push(agentData);
                            }
                        });
                        if (errors.length > 0) break;
                        setAgents(prev => [...prev, ...validData]);
                        break;
                    }
                    case 'products': {
                        const required = ['name', 'price'];
                        if (!required.every(h => headers.includes(h))) throw new Error(`CSV must contain required headers: ${required.join(', ')}`);
                        
                        dataRows.forEach((line, index) => {
                            const row = line.split(',');
                            const name = row[getIndex('name')]?.trim();
                            const price = parseFloat(row[getIndex('price')]?.trim());
                            if (!name) errors.push({ row: index + 2, message: "Required field 'name' is missing." });
                            if (isNaN(price)) errors.push({ row: index + 2, message: "Field 'price' must be a valid number." });
                            validData.push({ id: crypto.randomUUID(), name, price });
                        });
                        if (errors.length > 0) break;
                        setProducts(prev => [...prev, ...validData]);
                        break;
                    }
                    case 'customers': {
                        const required = ['name'];
                        if (!required.every(h => headers.includes(h))) throw new Error(`CSV must contain required headers: ${required.join(', ')}`);
                        
                        dataRows.forEach((line, index) => {
                            const row = line.split(',');
                            const name = row[getIndex('name')]?.trim();
                            const contact = row[getIndex('contact')]?.trim() || '';
                            if (!name) errors.push({ row: index + 2, message: "Required field 'name' is missing." });
                            validData.push({ id: crypto.randomUUID(), name, contact });
                        });
                        if (errors.length > 0) break;
                        setCustomers(prev => [...prev, ...validData]);
                        break;
                    }
                }

                if (errors.length > 0) {
                    const errorMsg = "Import failed. Please fix these errors:\n" + errors.map(e => `- Row ${e.row}: ${e.message}`).join('\n');
                    throw new Error(errorMsg);
                }

                setMessage(`Successfully imported ${validData.length} records.`);
                setFile(null);

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                setMessage(`Error: ${errorMessage}`);
                console.error(error);
            }
        };
        reader.onerror = () => setMessage('Error reading file.');
        reader.readAsText(file);
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">数据导入接口</h3>
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <div>
                    <label htmlFor="importType" className="block text-sm font-medium text-gray-700 mb-1">选择导入项目</label>
                    <select id="importType" value={importType} onChange={e => setImportType(e.target.value)} className="w-full p-2 border-gray-300 rounded-md shadow-sm">
                        <option value="collaborations">引合数据</option>
                        <option value="agents">代理商列表</option>
                        <option value="products">产品列表</option>
                        <option value="customers">客户列表</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">上传CSV文件</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">CSV up to 10MB</p>
                            {file && <p className="text-sm text-green-600 pt-2">{file.name}</p>}
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end">
                    <button onClick={handleImport} className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                        <CloudUploadIcon className="w-5 h-5 mr-2" />
                        开始导入
                    </button>
                </div>
                {message && <div className={`mt-4 text-sm p-4 rounded-md whitespace-pre-wrap ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}
            </div>
        </div>
    );
};


// --- Main MasterData Component ---
export const MasterData: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('import');
    const [collaborations, setCollaborations] = useLocalStorage<Collaboration[]>('collaborations', []);
    const [agents, setAgents] = useLocalStorage<Agent[]>('agents', []);
    const [products, setProducts] = useLocalStorage<Product[]>('products', []);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);

    const renderContent = () => {
        switch(activeTab) {
            case 'import':
                return <DataImporter setCollaborations={setCollaborations} setAgents={setAgents} setProducts={setProducts} setCustomers={setCustomers} />;
            case 'personnel':
                return <PersonnelManager />;
            case 'agents':
                return <AgentManager agents={agents} setAgents={setAgents} />;
            case 'products':
                return <ProductManager products={products} setProducts={setProducts} />;
            case 'customers':
                return <CustomerManager customers={customers} setCustomers={setCustomers} />;
            default:
                return null;
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">主数据管理</h2>
            
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`${activeTab === 'import' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        数据导入
                    </button>
                    <button
                        onClick={() => setActiveTab('personnel')}
                        className={`${activeTab === 'personnel' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        担当管理
                    </button>
                    <button
                        onClick={() => setActiveTab('agents')}
                        className={`${activeTab === 'agents' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        代理商管理
                    </button>
                     <button
                        onClick={() => setActiveTab('products')}
                        className={`${activeTab === 'products' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        产品管理
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`${activeTab === 'customers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        客户管理
                    </button>
                </nav>
            </div>
            
            <div>{renderContent()}</div>
        </div>
    );
};
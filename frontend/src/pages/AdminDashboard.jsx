import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Tabs = {
    EMPLOYEES: 'EMPLOYEES',
    REPORTS: 'REPORTS',
    ANALYTICS: 'ANALYTICS',
};

const initialForm = { name: '', email: '', role: '', department: '', project: '', status: 'Active', dateHired: '', salary: '' };

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState(Tabs.ANALYTICS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Employees
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    // Reports
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportRows, setReportRows] = useState([]);
    const [reportFilter, setReportFilter] = useState({ project: '', status: '' });

    // Analytics
    const [summary, setSummary] = useState({ totalEmployees: 0, activeEmployees: 0, activeProjects: 0, employeesByDepartment: {} });

    const toast = (msg) => alert(msg);

    const fetchEmployees = async () => {
        setLoading(true); setError('');
        try {
            const res = await api.get('/api/admin/employees');
            setEmployees(res.data || []);
        } catch (e) {
            setError('Failed to load employees');
        } finally { setLoading(false); }
    };

    const fetchSummary = async () => {
        try {
            const res = await api.get('/api/admin/analytics/summary');
            setSummary(res.data || {});
        } catch (e) { /* ignore */ }
    };

    useEffect(() => {
        fetchEmployees();
        fetchSummary();
    }, []);

    const resetForm = () => { setForm(initialForm); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, salary: form.salary ? parseFloat(form.salary) : null };
            if (editingId) {
                await api.put(`/api/admin/employees/${editingId}`, payload);
                toast('Employee updated');
            } else {
                await api.post('/api/admin/employees', payload);
                toast('Employee created');
            }
            resetForm();
            fetchEmployees();
            fetchSummary();
        } catch (e) {
            setError(e?.response?.data?.message || 'Save failed');
        } finally { setLoading(false); }
    };

    const handleEdit = (emp) => {
        setEditingId(emp.id);
        setForm({
            name: emp.name || '', email: emp.email || '', role: emp.role || '', department: emp.department || '',
            project: emp.project || '', status: emp.status || 'Active', dateHired: emp.dateHired || '', salary: emp.salary || ''
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this employee?')) return;
        setLoading(true);
        try { await api.delete(`/api/admin/employees/${id}`); toast('Deleted'); fetchEmployees(); fetchSummary(); }
        catch (e) { setError('Delete failed'); }
        finally { setLoading(false); }
    };

    const deptChartData = useMemo(() => {
        const map = summary.employeesByDepartment || {};
        return Object.keys(map).map(k => ({ department: k, count: map[k] }));
    }, [summary]);

    const runHiredReport = async () => {
        if (!dateRange.start || !dateRange.end) { toast('Select start and end dates'); return; }
        setLoading(true);
        try {
            const res = await api.get('/api/admin/reports/hired', { params: dateRange });
            setReportRows(res.data || []);
        } catch (e) { setError('Report fetch failed'); }
        finally { setLoading(false); }
    };

    const runProjectReport = async () => {
        if (!reportFilter.project) { toast('Enter project'); return; }
        setLoading(true);
        try {
            const res = await api.get('/api/admin/reports/by-project', { params: { project: reportFilter.project } });
            setReportRows(res.data || []);
        } catch (e) { setError('Report fetch failed'); }
        finally { setLoading(false); }
    };

    const runStatusReport = async () => {
        if (!reportFilter.status) { toast('Enter status'); return; }
        setLoading(true);
        try {
            const res = await api.get('/api/admin/reports/by-status', { params: { status: reportFilter.status } });
            setReportRows(res.data || []);
        } catch (e) { setError('Report fetch failed'); }
        finally { setLoading(false); }
    };

    const downloadCsv = (url, params) => {
        const qp = new URLSearchParams(params || {}).toString();
        window.open(`${api.defaults.baseURL}${url}?${qp}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="w-full md:w-64 bg-white rounded-xl shadow p-4 h-max">
                        <h2 className="text-xl font-bold mb-4">Admin</h2>
                        <nav className="space-y-2">
                            <button onClick={() => setActiveTab(Tabs.ANALYTICS)} className={`w-full text-left px-4 py-2 rounded ${activeTab===Tabs.ANALYTICS?'bg-green-100 text-green-800':'hover:bg-gray-100'}`}>Analytics</button>
                            <button onClick={() => setActiveTab(Tabs.EMPLOYEES)} className={`w-full text-left px-4 py-2 rounded ${activeTab===Tabs.EMPLOYEES?'bg-green-100 text-green-800':'hover:bg-gray-100'}`}>Employee Management</button>
                            <button onClick={() => setActiveTab(Tabs.REPORTS)} className={`w-full text-left px-4 py-2 rounded ${activeTab===Tabs.REPORTS?'bg-green-100 text-green-800':'hover:bg-gray-100'}`}>Reports</button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {error && (<div className="p-3 bg-red-50 text-red-700 rounded">{error}</div>)}

                        {activeTab === Tabs.ANALYTICS && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white rounded-xl shadow p-6">
                                        <div className="text-sm text-gray-500">Total Employees</div>
                                        <div className="text-3xl font-bold">{summary.totalEmployees || 0}</div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow p-6">
                                        <div className="text-sm text-gray-500">Active Employees</div>
                                        <div className="text-3xl font-bold">{summary.activeEmployees || 0}</div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow p-6">
                                        <div className="text-sm text-gray-500">Active Projects</div>
                                        <div className="text-3xl font-bold">{summary.activeProjects || 0}</div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow p-6">
                                    <h3 className="font-semibold mb-4">Employees by Department</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={deptChartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="department" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#10B981" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === Tabs.EMPLOYEES && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow p-6">
                                    <h3 className="font-semibold mb-4">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
                                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                                        <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
                                        <input type="email" className="border p-2 rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
                                        <input className="border p-2 rounded" placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} required />
                                        <input className="border p-2 rounded" placeholder="Department" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} />
                                        <input className="border p-2 rounded" placeholder="Project" value={form.project} onChange={e=>setForm({...form,project:e.target.value})} />
                                        <select className="border p-2 rounded" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                                            <option>Active</option>
                                            <option>On Leave</option>
                                            <option>Inactive</option>
                                        </select>
                                        <input type="date" className="border p-2 rounded" value={form.dateHired} onChange={e=>setForm({...form,dateHired:e.target.value})} />
                                        <input type="number" step="0.01" className="border p-2 rounded" placeholder="Salary" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} />

                                        <div className="col-span-full flex gap-3 mt-2">
                                            <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{editingId? 'Update' : 'Create'}</button>
                                            <button type="button" onClick={resetForm} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">Reset</button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
                                    <h3 className="font-semibold mb-4">Employees</h3>
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b">
                                                <th className="p-2">Name</th>
                                                <th className="p-2">Email</th>
                                                <th className="p-2">Role</th>
                                                <th className="p-2">Dept</th>
                                                <th className="p-2">Project</th>
                                                <th className="p-2">Status</th>
                                                <th className="p-2">Hired</th>
                                                <th className="p-2 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employees.map(emp => (
                                                <tr key={emp.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2">{emp.name}</td>
                                                    <td className="p-2">{emp.email}</td>
                                                    <td className="p-2">{emp.role}</td>
                                                    <td className="p-2">{emp.department}</td>
                                                    <td className="p-2">{emp.project}</td>
                                                    <td className="p-2">{emp.status}</td>
                                                    <td className="p-2">{emp.dateHired || ''}</td>
                                                    <td className="p-2 text-right space-x-2">
                                                        <button onClick={()=>handleEdit(emp)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
                                                        <button onClick={()=>handleDelete(emp.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === Tabs.REPORTS && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Start</label>
                                        <input type="date" className="border p-2 rounded w-full" value={dateRange.start} onChange={e=>setDateRange({...dateRange,start:e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">End</label>
                                        <input type="date" className="border p-2 rounded w-full" value={dateRange.end} onChange={e=>setDateRange({...dateRange,end:e.target.value})} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={runHiredReport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Run</button>
                                        <button onClick={()=>downloadCsv('/api/admin/reports/hired.csv', dateRange)} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">Download CSV</button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Project</label>
                                        <input className="border p-2 rounded w-full" value={reportFilter.project} onChange={e=>setReportFilter({...reportFilter,project:e.target.value})} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={runProjectReport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Run</button>
                                        <button onClick={()=>downloadCsv('/api/admin/reports/by-project.csv', { project: reportFilter.project })} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">Download CSV</button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Status</label>
                                        <input className="border p-2 rounded w-full" value={reportFilter.status} onChange={e=>setReportFilter({...reportFilter,status:e.target.value})} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={runStatusReport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Run</button>
                                        <button onClick={()=>downloadCsv('/api/admin/reports/by-status.csv', { status: reportFilter.status })} className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">Download CSV</button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow p-6 overflow-x-auto">
                                    <h3 className="font-semibold mb-4">Report Results</h3>
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="text-left border-b">
                                                <th className="p-2">Name</th>
                                                <th className="p-2">Email</th>
                                                <th className="p-2">Role</th>
                                                <th className="p-2">Dept</th>
                                                <th className="p-2">Project</th>
                                                <th className="p-2">Status</th>
                                                <th className="p-2">Hired</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportRows.map((row) => (
                                                <tr key={row.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-2">{row.name}</td>
                                                    <td className="p-2">{row.email}</td>
                                                    <td className="p-2">{row.role}</td>
                                                    <td className="p-2">{row.department}</td>
                                                    <td className="p-2">{row.project}</td>
                                                    <td className="p-2">{row.status}</td>
                                                    <td className="p-2">{row.dateHired || ''}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {loading && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-white p-4 rounded shadow">Loading...</div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;



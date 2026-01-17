import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchCategory, setSearchCategory] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    is_deleted: false
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/expenses/`;
      const params = new URLSearchParams();
      if (searchCategory) params.append('category', searchCategory);
      if (searchTitle) params.append('title', searchTitle);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data.filter(e => !e.is_deleted));
    } catch (err) {
      console.error('Error fetching expenses:', err);
      alert('Error fetching expenses. Make sure backend is running on http://localhost:8080');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.amount || !formData.category || !formData.date) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    
    try {
      if (editingId) {
        await fetch(`${API_BASE_URL}/expenses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: parseInt(formData.amount)
          })
        });
        setEditingId(null);
      } else {
        await fetch(`${API_BASE_URL}/expenses/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount: parseInt(formData.amount)
          })
        });
      }
      
      setFormData({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        is_deleted: false
      });
      fetchExpenses();
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Error saving expense. Check console for details.');
    }
    setLoading(false);
  };

  const handleEdit = (expense) => {
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      is_deleted: expense.is_deleted
    });
    setEditingId(expense.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    setLoading(true);
    try {
      await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE'
      });
      fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Error deleting expense');
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      is_deleted: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">💰 Expense Tracker</h1>
        
        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? '✏️ Edit Expense' : '➕ Add New Expense'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Groceries"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Food, Transport, Shopping"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Saving...' : editingId ? 'Update Expense' : 'Add Expense'}
              </button>
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Search Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Title
              </label>
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Category
              </label>
              <input
                type="text"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={fetchExpenses}
                className="flex-1 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setSearchTitle('');
                  setSearchCategory('');
                  fetchExpenses();
                }}
                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Expenses List</h2>
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses found. Add your first expense above!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4">{expense.title}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">₹{expense.amount}</td>
                      <td className="py-3 px-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{expense.date}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Total */}
        {expenses.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold">
              Total Expenses: ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-blue-100 mt-1">Based on {expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
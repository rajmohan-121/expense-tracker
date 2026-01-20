import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchCategory, setSearchCategory] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  
  // New filter states
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [amountGreaterThan, setAmountGreaterThan] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSum, setTotalSum] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    is_deleted: false
  });

  useEffect(() => {
    fetchExpenses();
  }, [currentPage, pageSize]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Pagination
      params.append('page', currentPage);
      params.append('page_size', pageSize);
      
      // Existing filters
      if (searchCategory) params.append('category', searchCategory);
      if (searchTitle) params.append('title', searchTitle);
      
      // New filters
      if (sortBy) {
        params.append('sort_by', sortBy);
        params.append('sort_order', sortOrder);
      }
      if (amountMin) params.append('amount_min', amountMin);
      if (amountMax) params.append('amount_max', amountMax);
      if (amountGreaterThan) params.append('amount_greater_than', amountGreaterThan);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      
      const url = `${API_BASE_URL}/expenses/?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      
      // Backend sends paginated data
      setExpenses(data.expenses || []);
      setTotalPages(data.pagination?.total_pages || 0);
      setTotalCount(data.pagination?.total_count || 0);
      setTotalSum(data.summary?.total_sum || 0);
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
      const url = editingId 
        ? `${API_BASE_URL}/expenses/${editingId}`
        : `${API_BASE_URL}/expenses/`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Backend validation error
        alert(result.detail || 'Error saving expense');
        setLoading(false);
        return;
      }
      
      setEditingId(null);
      setFormData({
        title: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        is_deleted: false
      });
      setCurrentPage(1);
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

  const handleClearFilters = () => {
    setSearchTitle('');
    setSearchCategory('');
    setSortBy('');
    setSortOrder('asc');
    setAmountMin('');
    setAmountMax('');
    setAmountGreaterThan('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setTimeout(() => fetchExpenses(), 100);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Get today's date for validation
  const today = new Date().toISOString().split('T')[0];

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
                  min="0"
                  step="0.01"
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
                  min={today}
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

        {/* Search Filters - Enhanced */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🔍 Search & Filter Expenses</h2>
          <div className="space-y-4">
            {/* First Row - Basic Search */}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Default</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
                    <option value="date">Date</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">↑</option>
                    <option value="desc">↓</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Second Row - Amount & Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Greater Than
                </label>
                <input
                  type="number"
                  min="0"
                  value={amountGreaterThan}
                  onChange={(e) => setAmountGreaterThan(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Range (Min - Max)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    min="0"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  fetchExpenses();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Search
              </button>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📋 Expenses List</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {expenses.length} of {totalCount} expenses
              </div>
              <div>
                <label className="text-sm text-gray-600 mr-2">Per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses found. Add your first expense above!</p>
          ) : (
            <>
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
                        <td className="py-3 px-4 font-semibold text-green-600">
                          ₹{expense.amount.toLocaleString('en-IN')}
                        </td>
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      Previous
                    </button>
                    
                                        {/* Page Numbers */}
                    {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                      let pageNum;

                      if (totalPages <= 5) {
                        pageNum = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNum = idx + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + idx;
                      } else {
                        pageNum = currentPage - 2 + idx;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded transition text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      Next
                    </button>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Total Summary */}
        {totalCount > 0 && (
          <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold">
              Total Expenses: ₹
              {totalSum.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </h3>
            <p className="text-blue-100 mt-1">
              Based on {totalCount} expense{totalCount !== 1 ? 's' : ''}
              {totalCount !== expenses.length &&
                ` (showing ${expenses.length} on this page)`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

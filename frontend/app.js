let transactions = [];
let categories = [];
let currentEditId = null;

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  await loadCategories();
  await loadTransactions();
  updateDashboard();
  setupForm();
  setDefaultDate();
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);
      
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function showPage(pageId) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  if (pageId === 'reports') {
    loadReports();
  }
}

async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

async function loadCategories() {
  try {
    categories = await apiCall('/categories');
    populateCategorySelects();
  } catch (error) {
    categories = [
      {name: 'Food'}, {name: 'Transportation'}, {name: 'Entertainment'}, 
      {name: 'Utilities'}, {name: 'Healthcare'}, {name: 'Shopping'}, 
      {name: 'Salary'}, {name: 'Freelance'}, {name: 'Investment'}
    ];
    populateCategorySelects();
  }
}

async function loadTransactions() {
  try {
    transactions = await apiCall('/transactions');
    renderTransactions();
    updateDashboard();
  } catch (error) {
    console.error('Error loading transactions:', error);
  }
}

function populateCategorySelects() {
  const selects = ['transactionCategory', 'categoryFilter'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      if (selectId === 'categoryFilter') {
        select.innerHTML = '<option value="">All Categories</option>';
      } else {
        select.innerHTML = '';
      }
      
      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
      });
    }
  });
}

function updateDashboard() {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const balance = income - expense;
  
  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
  document.getElementById('balance').textContent = formatCurrency(balance);
  
  drawCategoryChart();
  drawTrendChart();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

function drawCategoryChart() {
  const canvas = document.getElementById('categoryChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const categoryTotals = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
    });
  
  const categories = Object.keys(categoryTotals);
  if (categories.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No expense data available', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 60;
  
  let currentAngle = 0;
  
  categories.forEach((category, index) => {
    const sliceAngle = (categoryTotals[category] / total) * 2 * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
    const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(category, labelX, labelY);
    
    const percentage = ((categoryTotals[category] / total) * 100).toFixed(1);
    ctx.fillText(`${percentage}%`, labelX, labelY + 15);
    
    currentAngle += sliceAngle;
  });
}

function drawTrendChart() {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const monthlyData = {};
  transactions.forEach(t => {
    const month = t.date.substring(0, 7);
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expense: 0 };
    }
    monthlyData[month][t.type] += parseFloat(t.amount);
  });
  
  const months = Object.keys(monthlyData).sort();
  if (months.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No transaction data available', canvas.width / 2, canvas.height / 2);
    return;
  }
  
  const maxAmount = Math.max(
    ...months.map(m => Math.max(monthlyData[m].income, monthlyData[m].expense)),
    100
  );
  
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.moveTo(50, 20);
  ctx.lineTo(50, canvas.height - 40);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(50, canvas.height - 40);
  ctx.lineTo(canvas.width - 20, canvas.height - 40);
  ctx.stroke();
  
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 0.5;
  for (let i = 1; i <= 4; i++) {
    const y = 20 + (i * (canvas.height - 60) / 4);
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(canvas.width - 20, y);
    ctx.stroke();
  }
  
  if (months.length === 1) {
    const barWidth = 40;
    const x = canvas.width / 2;
    
    const incomeHeight = (monthlyData[months[0]].income / maxAmount) * (canvas.height - 60);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(x - barWidth, canvas.height - 40 - incomeHeight, barWidth - 5, incomeHeight);
    
    const expenseHeight = (monthlyData[months[0]].expense / maxAmount) * (canvas.height - 60);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 5, canvas.height - 40 - expenseHeight, barWidth - 5, expenseHeight);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(months[0], x, canvas.height - 20);
    
  } else {
    const stepX = (canvas.width - 70) / (months.length - 1);
    
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    months.forEach((month, index) => {
      const x = 50 + index * stepX;
      const y = canvas.height - 40 - (monthlyData[month].income / maxAmount) * (canvas.height - 60);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    months.forEach((month, index) => {
      const x = 50 + index * stepX;
      const y = canvas.height - 40 - (monthlyData[month].expense / maxAmount) * (canvas.height - 60);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    months.forEach((month, index) => {
      const x = 50 + index * stepX;
      
      const incomeY = canvas.height - 40 - (monthlyData[month].income / maxAmount) * (canvas.height - 60);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, incomeY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      const expenseY = canvas.height - 40 - (monthlyData[month].expense / maxAmount) * (canvas.height - 60);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, expenseY, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    months.forEach((month, index) => {
      const x = 50 + index * stepX;
      ctx.fillText(month, x, canvas.height - 20);
    });
  }
  
  ctx.fillStyle = '#10b981';
  ctx.fillRect(canvas.width - 120, 30, 15, 3);
  ctx.fillStyle = '#1e293b';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Income', canvas.width - 100, 35);
  
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(canvas.width - 120, 50, 15, 3);
  ctx.fillStyle = '#1e293b';
  ctx.fillText('Expense', canvas.width - 100, 55);
}

function renderTransactions() {
  const tbody = document.getElementById('transactionsBody');
  tbody.innerHTML = '';
  
  transactions.forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(transaction.date)}</td>
      <td><span class="type-badge type-${transaction.type}">${transaction.type}</span></td>
      <td>${transaction.category}</td>
      <td>${formatCurrency(transaction.amount)}</td>
      <td>${transaction.note || '-'}</td>
      <td>
        <button class="btn btn-secondary" onclick="editTransaction(${transaction.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteTransaction(${transaction.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function showAddTransaction() {
  currentEditId = null;
  document.getElementById('modalTitle').textContent = 'Add Transaction';
  document.getElementById('transactionForm').reset();
  setDefaultDate();
  document.getElementById('transactionModal').style.display = 'block';
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (!transaction) return;
  
  currentEditId = id;
  document.getElementById('modalTitle').textContent = 'Edit Transaction';
  document.getElementById('transactionId').value = id;
  document.getElementById('transactionType').value = transaction.type;
  document.getElementById('transactionAmount').value = transaction.amount;
  document.getElementById('transactionCategory').value = transaction.category;
  document.getElementById('transactionDate').value = transaction.date;
  document.getElementById('transactionNote').value = transaction.note || '';
  document.getElementById('transactionModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('transactionModal').style.display = 'none';
  currentEditId = null;
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('transactionDate').value = today;
}

function setupForm() {
  document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
      type: document.getElementById('transactionType').value,
      amount: parseFloat(document.getElementById('transactionAmount').value),
      category: document.getElementById('transactionCategory').value,
      date: document.getElementById('transactionDate').value,
      note: document.getElementById('transactionNote').value
    };
    
    try {
      if (currentEditId) {
        await apiCall(`/transactions/${currentEditId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiCall('/transactions', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      
      closeModal();
      await loadTransactions();
    } catch (error) {
      alert('Failed to save transaction');
    }
  });
}

async function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  
  try {
    await apiCall(`/transactions/${id}`, { method: 'DELETE' });
    await loadTransactions();
  } catch (error) {
    alert('Failed to delete transaction');
  }
}

function applyFilters() {
  
}

function exportCSV() {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Note'];
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      t.type,
      t.category,
      t.amount,
      `"${t.note || ''}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

async function loadReports() {
  try {
    const [monthly, predictions] = await Promise.all([
      apiCall('/reports/monthly'),
      apiCall('/reports/predict')
    ]);
    
    renderMonthlyReport(monthly);
    renderPredictions(predictions);
  } catch (error) {
    document.getElementById('monthlyReport').innerHTML = '<div style="color: #64748b;">Unable to load monthly report.</div>';
    document.getElementById('predictionsReport').innerHTML = '<div style="color: #64748b;">Unable to load predictions.</div>';
  }
}

function renderMonthlyReport(data) {
  const container = document.getElementById('monthlyReport');
  container.innerHTML = data.map(item => `
    <div style="margin-bottom: 0.5rem;">
      <strong>${item.month}</strong> - ${item.type}: ${formatCurrency(item.total)}
    </div>
  `).join('');
}

function renderPredictions(data) {
  const container = document.getElementById('predictionsReport');
  if (data.predictions) {
    container.innerHTML = `
      <div>Next Month Predicted Expense: <strong>${formatCurrency(data.predictions.next_month_expense)}</strong></div>
      <div>Trend: <strong>${data.predictions.trend}</strong></div>
    `;
  } else {
    container.innerHTML = '<div>No prediction data available</div>';
  }
}

window.onclick = function(event) {
  const modal = document.getElementById('transactionModal');
  if (event.target === modal) {
    closeModal();
  }
}
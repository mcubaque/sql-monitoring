let systemChart;
let updateInterval;
let currentTab = 'dashboard';
let isAuthenticated = false;

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');
    currentTab = tabName;
    
    if (tabName === 'dashboard' && systemChart) {
        setTimeout(() => systemChart.resize(), 100);
    }
}

async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            isAuthenticated = true;
            showDashboard();
        } else {
            alert('Invalid credentials. Default: admin / admin123');
            document.getElementById('password').value = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    isAuthenticated = false;
    
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
    }
    if (systemChart) {
        systemChart.destroy();
        systemChart = null;
    }
    
    showLoginForm();
}

function showLoginForm() {
    const headerSection = document.querySelector('.header-section');
    const allTabContents = document.querySelectorAll('.tab-content');
    const loginForm = document.getElementById('login-form');
    
    if (headerSection) headerSection.style.display = 'none';
    allTabContents.forEach(tab => tab.style.display = 'none');
    if (loginForm) loginForm.style.display = 'flex';
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    if (usernameField) {
        usernameField.value = '';
        usernameField.focus();
    }
    if (passwordField) passwordField.value = '';
}

function showDashboard() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.style.display = 'none';
    
    const headerSection = document.querySelector('.header-section');
    if (headerSection) headerSection.style.display = 'block';
    
    document.getElementById('tab-dashboard').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase() === 'dashboard') {
            btn.classList.add('active');
        }
    });
    
    currentTab = 'dashboard';
    
    if (updateInterval) clearInterval(updateInterval);
    if (systemChart) systemChart.destroy();
    
    setTimeout(() => {
        initializeCharts();
        startRealTimeUpdates();
    }, 100);
}

function initializeCharts() {
    const ctx = document.getElementById('systemChart').getContext('2d');
    systemChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU %',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.1,
                fill: true
            }, {
                label: 'Memory %',
                data: [],
                borderColor: '#38a169',
                backgroundColor: 'rgba(56, 161, 105, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Remote SQL Server Performance (Last 20 readings)'
                },
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

async function updateDashboardOverview() {
    if (!isAuthenticated) return;
    
    try {
        const response = await fetch('/api/monitoring/dashboard-overview');
        const data = await response.json();
        
        if (data.error) {
            console.error('Dashboard overview error:', data.error);
            document.getElementById('connection-status').textContent = '❌ Error';
            document.getElementById('connection-status').className = 'status-error';
            return;
        }
        
        document.getElementById('connection-status').textContent = '✅ Connected';
        document.getElementById('connection-status').className = 'status-connected';
        document.getElementById('server-name').textContent = data.server_info.name;
        document.getElementById('server-uptime').textContent = `${data.server_info.uptime_days}d ${data.server_info.uptime_hours}h`;
        document.getElementById('server-version').textContent = data.server_info.version;
        
        document.getElementById('total-sessions').textContent = data.session_stats.total_sessions;
        document.getElementById('active-sessions').textContent = data.session_stats.active_sessions;
        document.getElementById('user-databases').textContent = data.database_stats.user_databases;
        document.getElementById('long-queries').textContent = data.performance_stats.long_running_queries;
        document.getElementById('io-activity').textContent = data.performance_stats.total_io_mb + ' MB';
        
        updateAlerts(data.alerts);
        
    } catch (error) {
        console.error('Error updating dashboard overview:', error);
        document.getElementById('connection-status').textContent = '❌ Error';
        document.getElementById('connection-status').className = 'status-error';
    }
}

async function updateSystemStats() {
    if (!isAuthenticated) return;
    
    try {
        const response = await fetch('/api/monitoring/system-stats');
        const data = await response.json();
        
        if (data.error) {
            document.getElementById('cpu-percent').textContent = 'Error';
            document.getElementById('memory-percent').textContent = 'Error';
            document.getElementById('disk-percent').textContent = 'Error';
            return;
        }
        
        document.getElementById('cpu-percent').textContent = data.cpu_percent.toFixed(1) + '%';
        document.getElementById('memory-percent').textContent = data.memory_percent.toFixed(1) + '%';
        document.getElementById('disk-percent').textContent = data.disk_usage.toFixed(1) + '%';
        
        if (systemChart && currentTab === 'dashboard') {
            const now = new Date().toLocaleTimeString();
            systemChart.data.labels.push(now);
            systemChart.data.datasets[0].data.push(data.cpu_percent);
            systemChart.data.datasets[1].data.push(data.memory_percent);
            
            if (systemChart.data.labels.length > 20) {
                systemChart.data.labels.shift();
                systemChart.data.datasets[0].data.shift();
                systemChart.data.datasets[1].data.shift();
            }
            
            systemChart.update('none');
        }
    } catch (error) {
        console.error('Error updating system stats:', error);
    }
}

function updateAlerts(alerts) {
    const alertsSection = document.getElementById('alerts-section');
    const alertsContainer = document.getElementById('alerts-container');
    
    if (alerts && alerts.length > 0) {
        alertsSection.style.display = 'block';
        alertsContainer.innerHTML = '';
        
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert ${alert.level}`;
            alertDiv.innerHTML = `
                <div class="alert-message">
                    <strong>${alert.message}</strong>
                    <div class="alert-action">${alert.action}</div>
                </div>
            `;
            alertsContainer.appendChild(alertDiv);
        });
    } else {
        alertsSection.style.display = 'none';
    }
}

function startRealTimeUpdates() {
    if (!isAuthenticated) return;
    
    updateDashboardOverview();
    updateSystemStats();
    
    updateInterval = setInterval(() => {
        if (isAuthenticated && currentTab === 'dashboard') {
            updateDashboardOverview();
            updateSystemStats();
        }
    }, 5000);
}

window.onload = function() {
    const token = localStorage.getItem('token');
    if (token) {
        isAuthenticated = true;
        showDashboard();
    } else {
        isAuthenticated = false;
        showLoginForm();
    }
    
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !isAuthenticated) {
            login();
        }
    });
}

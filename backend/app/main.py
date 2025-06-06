from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

from .api import auth, monitoring

app = FastAPI(title="SQL Server Monitoring Dashboard")

app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>SQL Server Monitor</title>
        <link rel="stylesheet" href="/static/css/styles.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <div id="app">
            <div class="header-section">
                <h1>Rithm - SQL Server Monitoring Dashboard</h1>
                <div class="nav-tabs">
                    <button class="tab-btn active" onclick="showTab('dashboard')">🏠 Dashboard</button>
                    <button class="tab-btn" onclick="showTab('performance')">📊 Performance</button>
                    <button class="tab-btn" onclick="showTab('sessions')">👥 Sessions & Users</button>
                    <button class="tab-btn" onclick="showTab('security')">🔒 Security & Access</button>
                    <button class="tab-btn" onclick="showTab('maintenance')">🛠️ Maintenance</button>
                    <button class="tab-btn" onclick="showTab('realtime')">⚡ Real-Time</button>
                    <button class="logout-btn" onclick="logout()">Logout</button>
                </div>
            </div>
            
            <div id="login-form">
                <div class="login-container">
                    <h2>Login to SQL Server Monitor</h2>
                    <input type="text" id="username" placeholder="Username">
                    <input type="password" id="password" placeholder="Password">
                    <button onclick="login()">Login</button>
                    <div class="login-info">
                        <small>Default: admin / admin123</small>
                    </div>
                </div>
            </div>
            
            <!-- 🏠 Dashboard Principal (Overview) -->
            <div id="tab-dashboard" class="tab-content">
                <div class="section-card">
                    <h3>🔗 Server Status</h3>
                    <div class="status-grid">
                        <div class="status-item">
                            <label>Connection</label>
                            <div id="connection-status">Checking...</div>
                        </div>
                        <div class="status-item">
                            <label>Server</label>
                            <div id="server-name">--</div>
                        </div>
                        <div class="status-item">
                            <label>Uptime</label>
                            <div id="server-uptime">--</div>
                        </div>
                        <div class="status-item">
                            <label>Version</label>
                            <div id="server-version">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📊 System Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>CPU</h4>
                            <div class="metric-value" id="cpu-percent">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Memory</h4>
                            <div class="metric-value" id="memory-percent">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Disk</h4>
                            <div class="metric-value" id="disk-percent">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>I/O Activity</h4>
                            <div class="metric-value" id="io-activity">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🗄️ SQL Server Metrics</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Total Sessions</h4>
                            <div class="metric-value" id="total-sessions">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Active Sessions</h4>
                            <div class="metric-value" id="active-sessions">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>User Databases</h4>
                            <div class="metric-value" id="user-databases">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Long Queries</h4>
                            <div class="metric-value" id="long-queries">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card" id="alerts-section" style="display:none;">
                    <h3>⚠️ Active Alerts</h3>
                    <div id="alerts-container"></div>
                </div>
                
                <div class="section-card">
                    <h3>📈 Performance Trends</h3>
                    <div class="chart-container">
                        <canvas id="systemChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- 📊 Performance -->
            <div id="tab-performance" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>🐌 Top Slow Queries</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Loading slowest queries...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔄 Most Frequent Queries</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analyzing queries by execution volume...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>⏳ Wait Types Statistics</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>CPU Wait</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>I/O Wait</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Lock Wait</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Memory Wait</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📈 Performance Trends (24h)</h3>
                    <div class="chart-container">
                        <canvas id="performanceChart"></canvas>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📋 Missing Indexes</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Searching for index recommendations...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔧 Index Fragmentation</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analyzing index fragmentation...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 👥 Sessions & Users -->
            <div id="tab-sessions" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>🔍 Detailed Active Sessions</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Loading active sessions...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📊 User Statistics</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Unique users</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Connections per User</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Connected Applications</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Remote Hosts</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🚫 Locks and Deadlocks</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoring locks in real time...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>⚠️ Problematic Sessions</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Identifying sessions with issues...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📈 Connection History</h3>
                    <div class="chart-container">
                        <canvas id="connectionsChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- 🔒 Security & Access -->
            <div id="tab-security" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>❌ Failed Logins</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoring failed login attempts...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>👤 Users Connected per DB</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Admin Users</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Regular Users</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Service Accounts</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>SQL Auth Connections</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔐 Privileged Activity</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoring administrative operations...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🏗️ Schema Changes (DDL)</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Tracking recent structural changes...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔍 Permissions Audit</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analyzing user and role permissions...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 🛠️ Maintenance -->
            <div id="tab-maintenance" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>💾 Backups Status</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Last Full Backup</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Last Differential</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Last Log Backup</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>BDs Without Backup</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🤖 SQL Agent Jobs</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Checking status of scheduled jobs...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📁 File Space</h3>
                    <div class="chart-container">
                        <canvas id="diskSpaceChart"></canvas>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📊 Table Statistics</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analyzing table size and growth...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>✅ Integrity Checks (DBCC)</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Checking last execution of DBCC CHECKDB...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📈 Database Growth</h3>
                    <div class="chart-container">
                        <canvas id="growthChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- ⚡ Real-Time Monitoring -->
            <div id="tab-realtime" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>🔴 Live Query Activity</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoring running queries...</p>
                            <div class="realtime-indicator">
                                <span class="pulse-dot"></span>
                                <span>Updating every 2 seconds</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>⏱️ Resource Waits en Tiempo Real</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Waiting Queries</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>I/O Waits</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Lock Waits</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>CPU Waits</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔒 Lock Monitoring</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoring active locks...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>💿 I/O Statistics (Live)</h3>
                    <div class="chart-container">
                        <canvas id="ioChart"></canvas>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔗 Connection Pool Status</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Active Connections</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Idle Connections</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Sleeping Sessions</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Background Tasks</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>⚡ Performance Counters</h3>
                    <div class="chart-container">
                        <canvas id="realTimeChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        <script src="/static/js/app.js"></script>
    </body>
    </html>
    """

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
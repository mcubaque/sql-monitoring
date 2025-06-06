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
                <h1>SQL Server Monitoring Dashboard</h1>
                <div class="nav-tabs">
                    <button class="tab-btn active" onclick="showTab('dashboard')">Dashboard</button>
                    <button class="tab-btn" onclick="showTab('performance')">Performance</button>
                    <button class="tab-btn" onclick="showTab('sessions')">Sessions</button>
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
                            <h4>Remote CPU</h4>
                            <div class="metric-value" id="cpu-percent">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Remote Memory</h4>
                            <div class="metric-value" id="memory-percent">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Remote Disk</h4>
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
            
            <div id="tab-performance" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>🚀 Performance Analytics</h3>
                    <p>Performance metrics coming soon...</p>
                </div>
            </div>
            
            <div id="tab-sessions" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>👥 Sessions & Users</h3>
                    <p>Session details coming soon...</p>
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

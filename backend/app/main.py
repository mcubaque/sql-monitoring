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
            
            <!-- 📊 Performance -->
            <div id="tab-performance" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>🐌 Top Consultas Lentas</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Cargando consultas más lentas...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔄 Consultas Más Frecuentes</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analizando consultas por volumen de ejecución...</p>
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
                    <h3>📋 Índices Faltantes</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Buscando recomendaciones de índices...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔧 Fragmentación de Índices</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analizando fragmentación de índices...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 👥 Sessions & Users -->
            <div id="tab-sessions" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>🔍 Sesiones Activas Detalladas</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Cargando sesiones activas...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📊 Estadísticas de Usuarios</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Usuarios Únicos</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Conexiones por Usuario</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Aplicaciones Conectadas</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Hosts Remotos</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🚫 Bloqueos y Deadlocks</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoreando bloqueos en tiempo real...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>⚠️ Sesiones Problemáticas</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Identificando sesiones con problemas...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📈 Histórico de Conexiones</h3>
                    <div class="chart-container">
                        <canvas id="connectionsChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- 🔒 Security & Access -->
            <div id="tab-security" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>❌ Logins Fallidos</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoreando intentos de acceso fallidos...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>👤 Usuarios Conectados por BD</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Usuarios Admin</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Usuarios Regulares</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Cuentas de Servicio</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Conexiones SQL Auth</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔐 Actividad Privilegiada</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Monitoreando operaciones administrativas...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🏗️ Cambios de Esquema (DDL)</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Rastreando cambios estructurales recientes...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🔍 Auditoría de Permisos</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analizando permisos de usuarios y roles...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 🛠️ Maintenance -->
            <div id="tab-maintenance" class="tab-content" style="display:none;">
                <div class="section-card">
                    <h3>💾 Estado de Backups</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Último Full Backup</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Último Differential</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>Último Log Backup</h4>
                            <div class="metric-value">--</div>
                        </div>
                        <div class="metric-card">
                            <h4>BDs sin Backup</h4>
                            <div class="metric-value">--</div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>🤖 SQL Agent Jobs</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Verificando estado de trabajos programados...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📁 Espacio de Archivos</h3>
                    <div class="chart-container">
                        <canvas id="diskSpaceChart"></canvas>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📊 Estadísticas de Tablas</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Analizando tamaño y crecimiento de tablas...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>✅ Integrity Checks (DBCC)</h3>
                    <div class="table-container">
                        <div class="loading-placeholder">
                            <p>Verificando última ejecución de DBCC CHECKDB...</p>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>📈 Crecimiento de Bases de Datos</h3>
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
                            <p>Monitoreando consultas en ejecución...</p>
                            <div class="realtime-indicator">
                                <span class="pulse-dot"></span>
                                <span>Actualizando cada 2 segundos</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section-card">
                    <h3>⏱️ Resource Waits en Tiempo Real</h3>
                    <div class="metrics-grid">
                        <div class="metric-card">
                            <h4>Queries Esperando</h4>
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
                            <p>Monitoreando bloqueos activos...</p>
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
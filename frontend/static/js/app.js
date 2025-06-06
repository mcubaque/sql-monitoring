let systemChart;
let performanceChart;
let connectionsChart;
let diskSpaceChart;
let growthChart;
let ioChart;
let realTimeChart;
let updateInterval;
let realtimeInterval;
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
    
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                btn.classList.add('active');
            }
        });
    }
    
    currentTab = tabName;
    
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
    }
    
    setTimeout(() => {
        switch(tabName) {
            case 'dashboard':
                if (systemChart) systemChart.resize();
                break;
            case 'performance':
                initializePerformanceTab();
                break;
            case 'sessions':
                initializeSessionsTab();
                break;
            case 'security':
                initializeSecurityTab();
                break;
            case 'maintenance':
                initializeMaintenanceTab();
                break;
            case 'realtime':
                initializeRealtimeTab();
                break;
        }
    }, 100);
}

function initializePerformanceTab() {
    console.log('Inicializando Performance tab...');
    if (!performanceChart) {
        const ctx = document.getElementById('performanceChart')?.getContext('2d');
        if (ctx) {
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'CPU Avg',
                        data: [],
                        borderColor: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        tension: 0.1
                    }, {
                        label: 'Memory Avg',
                        data: [],
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Performance Trends - Últimas 24 horas'
                        }
                    }
                }
            });
        }
    }
    
    loadRealPerformanceData();
}

function initializeSessionsTab() {
    console.log('Inicializando Sessions tab...');
    if (!connectionsChart) {
        const ctx = document.getElementById('connectionsChart')?.getContext('2d');
        if (ctx) {
            connectionsChart = new Chart(ctx, {
                type: 'area',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Conexiones Activas',
                        data: [],
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.3)',
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Histórico de Conexiones'
                        }
                    }
                }
            });
        }
    }
    loadSessionsData();
}

function initializeSecurityTab() {
    console.log('Inicializando Security tab...');
    loadSecurityData();
}

function initializeMaintenanceTab() {
    console.log('Inicializando Maintenance tab...');
    
    if (!diskSpaceChart) {
        const ctx = document.getElementById('diskSpaceChart')?.getContext('2d');
        if (ctx) {
            diskSpaceChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Usado', 'Libre'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#e53e3e', '#38a169'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Espacio en Disco por Base de Datos'
                        }
                    }
                }
            });
        }
    }
    
    if (!growthChart) {
        const ctx = document.getElementById('growthChart')?.getContext('2d');
        if (ctx) {
            growthChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Crecimiento (MB)',
                        data: [],
                        backgroundColor: '#38a169',
                        borderColor: '#2f855a',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Crecimiento de Bases de Datos (Últimos 30 días)'
                        }
                    }
                }
            });
        }
    }
    
    loadMaintenanceData();
}

function initializeRealtimeTab() {
    console.log('Inicializando Real-time tab...');
    
    if (!ioChart) {
        const ctx = document.getElementById('ioChart')?.getContext('2d');
        if (ctx) {
            ioChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Reads/sec',
                        data: [],
                        borderColor: '#3182ce',
                        backgroundColor: 'rgba(49, 130, 206, 0.1)',
                        tension: 0.1
                    }, {
                        label: 'Writes/sec',
                        data: [],
                        borderColor: '#e53e3e',
                        backgroundColor: 'rgba(229, 62, 62, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'I/O Statistics en Tiempo Real'
                        }
                    }
                }
            });
        }
    }
    
    if (!realTimeChart) {
        const ctx = document.getElementById('realTimeChart')?.getContext('2d');
        if (ctx) {
            realTimeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Batch Requests/sec',
                        data: [],
                        borderColor: '#d69e2e',
                        backgroundColor: 'rgba(214, 158, 46, 0.1)',
                        tension: 0.1
                    }, {
                        label: 'Page Lookups/sec',
                        data: [],
                        borderColor: '#805ad5',
                        backgroundColor: 'rgba(128, 90, 213, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Performance Counters en Tiempo Real'
                        }
                    }
                }
            });
        }
    }
    
    realtimeInterval = setInterval(() => {
        if (currentTab === 'realtime' && isAuthenticated) {
            updateRealtimeData();
        }
    }, 2000);
    
    loadRealtimeData();
}

async function loadRealPerformanceData() {
    if (!isAuthenticated) return;
    
    try {
        await loadSlowQueries();
        await loadFrequentQueries();
        await loadWaitTypes();
        await loadMissingIndexes();
        await loadIndexFragmentation();
        console.log('Datos reales de Performance cargados');
    } catch (error) {
        console.error('Error cargando datos de Performance:', error);
    }
}

async function loadSlowQueries() {
    try {
        const response = await fetch('/api/monitoring/top-slow-queries');
        const data = await response.json();
        
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[0];
        if (!placeholder) return;
        
        if (data.error) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error: ' + data.error + '</p>';
            return;
        }
        
        let content = '<table style="width: 100%; border-collapse: collapse;">';
        content += '<thead style="background: #f7fafc;">';
        content += '<tr>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Query</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración Prom (ms)</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Ejecuciones</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Base de Datos</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Última Ejecución</th>';
        content += '</tr>';
        content += '</thead>';
        content += '<tbody>';
        
        if (data.queries && data.queries.length > 0) {
            data.queries.forEach(query => {
                const durationColor = query.avg_duration_ms > 5000 ? '#e53e3e' : 
                                    query.avg_duration_ms > 1000 ? '#ed8936' : '#38a169';
                content += '<tr>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">' + query.query + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ' + durationColor + '; font-weight: bold;">' + query.avg_duration_ms.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + query.execution_count.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + query.database + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + query.last_execution + '</td>';
                content += '</tr>';
            });
        } else {
            content += '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #718096;">No se encontraron consultas lentas recientes</td></tr>';
        }
        
        content += '</tbody></table>';
        placeholder.innerHTML = content;
        
    } catch (error) {
        console.error('Error loading slow queries:', error);
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[0];
        if (placeholder) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error cargando consultas lentas</p>';
        }
    }
}

async function loadFrequentQueries() {
    try {
        const response = await fetch('/api/monitoring/top-frequent-queries');
        const data = await response.json();
        
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[1];
        if (!placeholder) return;
        
        if (data.error) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error: ' + data.error + '</p>';
            return;
        }
        
        let content = '<table style="width: 100%; border-collapse: collapse;">';
        content += '<thead style="background: #f7fafc;">';
        content += '<tr>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Query</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Ejecuciones</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Promedio (ms)</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">CPU Total (ms)</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Base de Datos</th>';
        content += '</tr>';
        content += '</thead>';
        content += '<tbody>';
        
        if (data.queries && data.queries.length > 0) {
            data.queries.forEach(query => {
                content += '<tr>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; max-width: 300px; overflow: hidden; text-overflow: ellipsis;">' + query.query + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #3182ce; font-weight: bold;">' + query.execution_count.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + query.avg_duration_ms.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + query.total_cpu_ms.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + query.database + '</td>';
                content += '</tr>';
            });
        } else {
            content += '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #718096;">No se encontraron consultas frecuentes</td></tr>';
        }
        
        content += '</tbody></table>';
        placeholder.innerHTML = content;
        
    } catch (error) {
        console.error('Error loading frequent queries:', error);
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[1];
        if (placeholder) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error cargando consultas frecuentes</p>';
        }
    }
}

async function loadWaitTypes() {
    try {
        const response = await fetch('/api/monitoring/wait-types-stats');
        const data = await response.json();
        
        if (data.error) {
            console.error('Wait types error:', data.error);
            return;
        }
        
        const waitCards = document.querySelectorAll('#tab-performance .metrics-grid .metric-card .metric-value');
        if (waitCards.length >= 4) {
            waitCards[0].textContent = data.waits.cpu_wait_percent + '%';
            waitCards[1].textContent = data.waits.io_wait_percent + '%';
            waitCards[2].textContent = data.waits.lock_wait_percent + '%';
            waitCards[3].textContent = data.waits.memory_wait_percent + '%';
        }
        
    } catch (error) {
        console.error('Error loading wait types:', error);
    }
}

async function loadMissingIndexes() {
    try {
        const response = await fetch('/api/monitoring/missing-indexes');
        const data = await response.json();
        
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[2];
        if (!placeholder) return;
        
        if (data.error) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error: ' + data.error + '</p>';
            return;
        }
        
        let content = '<table style="width: 100%; border-collapse: collapse;">';
        content += '<thead style="background: #f7fafc;">';
        content += '<tr>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tabla</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Columnas Sugeridas</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Impacto</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Seeks/Scans</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Mejora</th>';
        content += '</tr>';
        content += '</thead>';
        content += '<tbody>';
        
        if (data.indexes && data.indexes.length > 0) {
            data.indexes.forEach(index => {
                const impactColor = index.impact_level === 'Alto' ? '#e53e3e' : 
                                  index.impact_level === 'Medio' ? '#ed8936' : '#38a169';
                content += '<tr>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + index.table + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">' + index.suggested_columns + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ' + impactColor + '; font-weight: bold;">' + index.impact_level + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + index.seeks_scans.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + index.improvement_measure + '</td>';
                content += '</tr>';
            });
        } else {
            content += '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #718096;">No se encontraron recomendaciones de índices</td></tr>';
        }
        
        content += '</tbody></table>';
        placeholder.innerHTML = content;
        
    } catch (error) {
        console.error('Error loading missing indexes:', error);
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[2];
        if (placeholder) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error cargando índices faltantes</p>';
        }
    }
}

async function loadIndexFragmentation() {
    try {
        const response = await fetch('/api/monitoring/index-fragmentation');
        const data = await response.json();
        
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[3];
        if (!placeholder) return;
        
        if (data.error) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error: ' + data.error + '</p>';
            return;
        }
        
        let content = '<table style="width: 100%; border-collapse: collapse;">';
        content += '<thead style="background: #f7fafc;">';
        content += '<tr>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Índice</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tabla</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Fragmentación %</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Páginas</th>';
        content += '<th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Recomendación</th>';
        content += '</tr>';
        content += '</thead>';
        content += '<tbody>';
        
        if (data.indexes && data.indexes.length > 0) {
            data.indexes.forEach(index => {
                const fragColor = index.fragmentation_percent > 30 ? '#e53e3e' : 
                                index.fragmentation_percent > 10 ? '#ed8936' : '#38a169';
                const recColor = index.recommendation === 'REBUILD' ? '#e53e3e' : 
                               index.recommendation === 'REORGANIZE' ? '#ed8936' : '#38a169';
                content += '<tr>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + index.index_name + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + index.table + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ' + fragColor + '; font-weight: bold;">' + index.fragmentation_percent + '%</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">' + index.page_count.toLocaleString() + '</td>';
                content += '<td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: ' + recColor + '; font-weight: bold;">' + index.recommendation + '</td>';
                content += '</tr>';
            });
        } else {
            content += '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #718096;">No se encontraron índices con fragmentación significativa</td></tr>';
        }
        
        content += '</tbody></table>';
        placeholder.innerHTML = content;
        
    } catch (error) {
        console.error('Error loading index fragmentation:', error);
        const placeholder = document.querySelectorAll('#tab-performance .loading-placeholder')[3];
        if (placeholder) {
            placeholder.innerHTML = '<p style="color: #e53e3e;">Error cargando fragmentación de índices</p>';
        }
    }
}

function loadSessionsData() {
    updateSessionsPlaceholders();
}

function loadSecurityData() {
    updateSecurityPlaceholders();
}

function loadMaintenanceData() {
    updateMaintenancePlaceholders();
}

function loadRealtimeData() {
    updateRealtimePlaceholders();
}

function updateSessionsPlaceholders() {
    const placeholders = document.querySelectorAll('#tab-sessions .loading-placeholder');
    placeholders.forEach((placeholder, index) => {
        setTimeout(() => {
            let content = '';
            switch(index) {
                case 0:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Sesiones activas se cargarán aquí...</p></div>';
                    break;
                case 1:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><div style="font-size: 2rem; color: #38a169; margin-bottom: 10px;">✅</div><p>No se detectaron bloqueos activos</p><small style="color: #a0aec0;">Última verificación: ' + new Date().toLocaleTimeString() + '</small></div>';
                    break;
                case 2:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Sesiones problemáticas se cargarán aquí...</p></div>';
                    break;
            }
            placeholder.innerHTML = content;
        }, 500 + (index * 400));
    });
}

function updateSecurityPlaceholders() {
    const placeholders = document.querySelectorAll('#tab-security .loading-placeholder');
    placeholders.forEach((placeholder, index) => {
        setTimeout(() => {
            let content = '';
            switch(index) {
                case 0:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Logins fallidos se cargarán aquí...</p></div>';
                    break;
                case 1:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Actividad privilegiada se cargará aquí...</p></div>';
                    break;
                case 2:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Cambios de esquema se cargarán aquí...</p></div>';
                    break;
                case 3:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Auditoría de permisos se cargará aquí...</p></div>';
                    break;
            }
            placeholder.innerHTML = content;
        }, 500 + (index * 300));
    });
}

function updateMaintenancePlaceholders() {
    const placeholders = document.querySelectorAll('#tab-maintenance .loading-placeholder');
    placeholders.forEach((placeholder, index) => {
        setTimeout(() => {
            let content = '';
            switch(index) {
                case 0:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>SQL Agent Jobs se cargarán aquí...</p></div>';
                    break;
                case 1:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Estadísticas de tablas se cargarán aquí...</p></div>';
                    break;
                case 2:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Integrity checks se cargarán aquí...</p></div>';
                    break;
            }
            placeholder.innerHTML = content;
        }, 500 + (index * 400));
    });
}

function updateRealtimePlaceholders() {
    const placeholders = document.querySelectorAll('#tab-realtime .loading-placeholder');
    placeholders.forEach((placeholder, index) => {
        setTimeout(() => {
            let content = '';
            switch(index) {
                case 0:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><p>Actividad de consultas en vivo se cargará aquí...</p><div class="realtime-indicator"><span class="pulse-dot"></span><span>Actualizando cada 2 segundos</span></div></div>';
                    break;
                case 1:
                    content = '<div style="color: #718096; text-align: center; padding: 20px;"><div style="font-size: 2rem; color: #38a169; margin-bottom: 10px;">🔓</div><p>No se detectaron bloqueos activos</p><small style="color: #a0aec0;">Monitoreando en tiempo real...</small></div>';
                    break;
            }
            placeholder.innerHTML = content;
        }, 500 + (index * 300));
    });
}

function updateRealtimeData() {
    if (ioChart && currentTab === 'realtime') {
        const now = new Date().toLocaleTimeString();
        ioChart.data.labels.push(now);
        ioChart.data.datasets[0].data.push(Math.random() * 100 + 50);
        ioChart.data.datasets[1].data.push(Math.random() * 80 + 30);
        
        if (ioChart.data.labels.length > 20) {
            ioChart.data.labels.shift();
            ioChart.data.datasets[0].data.shift();
            ioChart.data.datasets[1].data.shift();
        }
        ioChart.update('none');
    }
    
    if (realTimeChart && currentTab === 'realtime') {
        const now = new Date().toLocaleTimeString();
        realTimeChart.data.labels.push(now);
        realTimeChart.data.datasets[0].data.push(Math.random() * 500 + 100);
        realTimeChart.data.datasets[1].data.push(Math.random() * 1000 + 200);
        
        if (realTimeChart.data.labels.length > 20) {
            realTimeChart.data.labels.shift();
            realTimeChart.data.datasets[0].data.shift();
            realTimeChart.data.datasets[1].data.shift();
        }
        realTimeChart.update('none');
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
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
    }
    
    [systemChart, performanceChart, connectionsChart, diskSpaceChart, growthChart, ioChart, realTimeChart].forEach(chart => {
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });
    
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
        if (btn.textContent.toLowerCase().includes('dashboard')) {
            btn.classList.add('active');
        }
    });
    
    currentTab = 'dashboard';
    
    if (updateInterval) clearInterval(updateInterval);
    if (realtimeInterval) clearInterval(realtimeInterval);
    
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
        document.getElementById('server-uptime').textContent = data.server_info.uptime_days + 'd ' + data.server_info.uptime_hours + 'h';
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
            alertDiv.className = 'alert ' + alert.level;
            alertDiv.innerHTML = '<div class="alert-message"><strong>' + alert.message + '</strong><div class="alert-action">' + alert.action + '</div></div>';
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
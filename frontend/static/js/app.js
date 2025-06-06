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
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remover clase active de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');
    currentTab = tabName;
    
    // Detener intervalos anteriores
    if (realtimeInterval) {
        clearInterval(realtimeInterval);
        realtimeInterval = null;
    }
    
    // Inicializar funcionalidad específica por pestaña
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
    
    // Simular carga de datos
    loadPerformanceData();
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
    
    // Inicializar gráfico de espacio en disco
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
    
    // Inicializar gráfico de crecimiento
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
    
    // Inicializar gráfico de I/O
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
    
    // Inicializar gráfico de performance en tiempo real
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
    
    // Iniciar actualizaciones en tiempo real (cada 2 segundos)
    realtimeInterval = setInterval(() => {
        if (currentTab === 'realtime' && isAuthenticated) {
            updateRealtimeData();
        }
    }, 2000);
    
    loadRealtimeData();
}

// Funciones de carga de datos simulados
function loadPerformanceData() {
    // Actualizar placeholders con datos simulados
    updatePerformancePlaceholders();
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

function updatePerformancePlaceholders() {
    const placeholders = document.querySelectorAll('#tab-performance .loading-placeholder');
    placeholders.forEach((placeholder, index) => {
        setTimeout(() => {
            let content = '';
            switch(index) {
                case 0: // Top Consultas Lentas
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Query</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración (ms)</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Base de Datos</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">SELECT * FROM large_table WHERE...</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e; font-weight: bold;">45,230</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">app_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ProductionDB</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">UPDATE inventory SET...</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936; font-weight: bold;">12,450</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">batch_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">InventoryDB</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 1: // Consultas Más Frecuentes
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Query</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Ejecuciones</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Promedio (ms)</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">CPU Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">SELECT user_id, name FROM users WHERE...</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #3182ce; font-weight: bold;">12,543</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">85</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">1,066 ms</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">INSERT INTO logs VALUES...</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #3182ce; font-weight: bold;">8,932</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">12</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">107 ms</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 2: // Índices Faltantes
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tabla</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Columnas Sugeridas</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Impacto</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Costo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Orders</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">customer_id, order_date</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e; font-weight: bold;">Alto</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">8,542</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Products</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">category_id</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936; font-weight: bold;">Medio</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">2,156</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 3: // Fragmentación de Índices
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Índice</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tabla</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Fragmentación %</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Recomendación</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">IX_Orders_CustomerDate</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Orders</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e; font-weight: bold;">85.4%</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">REBUILD</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">IX_Products_Category</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Products</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936; font-weight: bold;">23.7%</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">REORGANIZE</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
            }
            placeholder.innerHTML = content;
        }, 500 + (index * 300));
    });
}

function updateSessionsPlaceholders() {
    const placeholders = document.querySelectorAll('#tab-sessions .loading-placeholder');
    placeholders.forEach((placeholder, index) => {
        setTimeout(() => {
            let content = '';
            switch(index) {
                case 0: // Sesiones Activas Detalladas
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">SPID</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Host</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Programa</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Estado</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">52</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">app_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">WEB-SERVER-01</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Microsoft SQL Server Management Studio</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">running</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">00:02:15</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">78</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">batch_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">APP-SERVER-02</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">MyApp.exe</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">blocked</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">00:05:42</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 1: // Bloqueos y Deadlocks
                    content = `
                        <div style="color: #718096; text-align: center; padding: 20px;">
                            <div style="font-size: 2rem; color: #38a169; margin-bottom: 10px;">✅</div>
                            <p>No se detectaron bloqueos activos</p>
                            <small style="color: #a0aec0;">Última verificación: ${new Date().toLocaleTimeString()}</small>
                        </div>
                    `;
                    break;
                case 2: // Sesiones Problemáticas
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">SPID</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tipo</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">CPU (ms)</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Problema</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">123</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Long Running</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">00:15:30</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">45,230</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Consulta sin índice</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
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
                case 0: // Logins Fallidos
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Fecha/Hora</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">IP</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Razón</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">unknown_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">192.168.1.15</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">Password incorrect</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 300000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">admin</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">10.0.0.50</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">Login disabled</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 1: // Actividad Privilegiada
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Fecha/Hora</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Operación</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Objeto</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">sa</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">CREATE DATABASE</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">TestDB</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 600000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">admin_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">GRANT SYSADMIN</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">new_user</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 2: // Cambios de Esquema
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Fecha/Hora</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Base de Datos</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Operación</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Objeto</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ProductionDB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #3182ce;">CREATE INDEX</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">IX_Orders_NewIndex</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">db_admin</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 1800000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ProductionDB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">ALTER TABLE</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Users</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">developer</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 3: // Auditoría de Permisos
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario/Rol</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tipo</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Permisos</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Base de Datos</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">sa</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">sysadmin</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ALL</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ALL</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">app_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #3182ce;">db_datareader</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">SELECT</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ProductionDB</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">batch_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">db_datawriter</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">SELECT, INSERT, UPDATE</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">InventoryDB</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
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
                case 0: // SQL Agent Jobs
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Job Name</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Estado</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Última Ejecución</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Próxima Ejecución</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Database Backup - Full</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">✅ Succeeded</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 3600000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Mañana 02:00</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">00:15:30</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Index Maintenance</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">❌ Failed</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 7200000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Domingo 01:00</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">--</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Log Backup</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">✅ Succeeded</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 900000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">En 15 min</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">00:00:45</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 1: // Estadísticas de Tablas
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tabla</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Registros</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Tamaño (MB)</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Crecimiento (7d)</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Última Actualización</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Orders</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">2,547,893</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">1,250.5</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">+45.2 MB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Hace 2 min</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Products</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">15,420</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">24.8</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #3182ce;">+1.2 MB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Hace 1 hora</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Users</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">89,342</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">156.7</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">+12.5 MB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">Hace 30 min</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
                    break;
                case 2: // Integrity Checks
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Base de Datos</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Último DBCC CHECKDB</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Estado</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Errores</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">ProductionDB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 86400000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">✅ OK</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">0</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">00:12:45</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">InventoryDB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date(Date.now() - 172800000).toLocaleString()}</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">✅ OK</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">0</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">00:05:12</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">LogsDB</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #e53e3e;">Hace 15 días</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">⚠️ Pendiente</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">--</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">--</td>
                                </tr>
                            </tbody>
                        </table>
                    `;
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
                case 0: // Live Query Activity
                    content = `
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead style="background: #f7fafc;">
                                <tr>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">SPID</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Query</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Usuario</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Duración</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">CPU</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">145</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">SELECT * FROM Orders WHERE order_date...</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">app_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #38a169;">00:00:03</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">156 ms</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><span style="background: #38a169; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">RUNNING</span></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">167</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">UPDATE Inventory SET quantity...</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">batch_user</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #ed8936;">00:00:12</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">2,245 ms</td>
                                    <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;"><span style="background: #ed8936; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">WAITING</span></td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="realtime-indicator">
                            <span class="pulse-dot"></span>
                            <span>Actualizando cada 2 segundos</span>
                        </div>
                    `;
                    break;
                case 1: // Lock Monitoring
                    content = `
                        <div style="color: #718096; text-align: center; padding: 20px;">
                            <div style="font-size: 2rem; color: #38a169; margin-bottom: 10px;">🔓</div>
                            <p>No se detectaron bloqueos activos</p>
                            <small style="color: #a0aec0;">Monitoreando en tiempo real...</small>
                        </div>
                    `;
                    break;
            }
            placeholder.innerHTML = content;
        }, 500 + (index * 300));
    });
}

function updateRealtimeData() {
    // Actualizar métricas de tiempo real
    const metrics = [
        { id: 'Queries Esperando', value: Math.floor(Math.random() * 10) },
        { id: 'I/O Waits', value: Math.floor(Math.random() * 50) },
        { id: 'Lock Waits', value: Math.floor(Math.random() * 5) },
        { id: 'CPU Waits', value: Math.floor(Math.random() * 20) },
        { id: 'Active Connections', value: 45 + Math.floor(Math.random() * 20) },
        { id: 'Idle Connections', value: 12 + Math.floor(Math.random() * 8) },
        { id: 'Sleeping Sessions', value: 8 + Math.floor(Math.random() * 5) },
        { id: 'Background Tasks', value: 3 + Math.floor(Math.random() * 3) }
    ];
    
    // Actualizar gráficos de tiempo real
    if (ioChart && currentTab === 'realtime') {
        const now = new Date().toLocaleTimeString();
        ioChart.data.labels.push(now);
        ioChart.data.datasets[0].data.push(Math.random() * 100 + 50); // Reads
        ioChart.data.datasets[1].data.push(Math.random() * 80 + 30);  // Writes
        
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
        realTimeChart.data.datasets[0].data.push(Math.random() * 500 + 100); // Batch Requests
        realTimeChart.data.datasets[1].data.push(Math.random() * 1000 + 200); // Page Lookups
        
        if (realTimeChart.data.labels.length > 20) {
            realTimeChart.data.labels.shift();
            realTimeChart.data.datasets[0].data.shift();
            realTimeChart.data.datasets[1].data.shift();
        }
        realTimeChart.update('none');
    }
}

// Funciones originales del login y dashboard
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
    
    // Destruir todos los gráficos
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
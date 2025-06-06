from fastapi import APIRouter
from typing import Dict, Any, List
import time
import pymssql
from ..core.config import settings

router = APIRouter()

def get_sql_connection():
    try:
        conn = pymssql.connect(
            server=settings.sql_server_host,
            user=settings.sql_server_user,
            password=settings.sql_server_password,
            port=settings.sql_server_port,
            timeout=10
        )
        return conn
    except Exception as e:
        print(f"SQL Server connection error: {e}")
        return None

@router.get("/system-stats")
async def get_system_stats() -> Dict[str, Any]:
    conn = get_sql_connection()
    if not conn:
        return {"timestamp": time.time(), "cpu_percent": 0, "memory_percent": 0, "disk_usage": 0, "error": "Cannot connect to SQL Server"}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) as total_schedulers,
                   SUM(current_tasks_count) as total_tasks,
                   SUM(runnable_tasks_count) as total_runnable
            FROM sys.dm_os_schedulers 
            WHERE status = 'VISIBLE ONLINE'
        """)
        cpu_result = cursor.fetchone()
        
        if cpu_result and cpu_result[0] > 0:
            total_schedulers = cpu_result[0]
            total_tasks = cpu_result[1] or 0
            total_runnable = cpu_result[2] or 0
            avg_activity = (total_tasks + total_runnable) / total_schedulers
            cpu_percent = min(avg_activity * 20, 100)
            if cpu_percent < 5:
                cpu_percent = min(15 + (total_tasks * 2), 80)
        else:
            cpu_percent = 10
        
        cursor.execute("""
            SELECT ROUND(((total_physical_memory_kb - available_physical_memory_kb) * 100.0 / total_physical_memory_kb), 1) AS memory_usage_percent
            FROM sys.dm_os_sys_memory
        """)
        memory_result = cursor.fetchone()
        memory_percent = float(memory_result[0]) if memory_result and memory_result[0] is not None else 0
        
        cursor.execute("""
            SELECT TOP 1 CAST(ROUND(((vs.total_bytes - vs.available_bytes) * 100.0 / vs.total_bytes), 1) AS DECIMAL(5,1)) AS Used_Percentage
            FROM sys.master_files AS f
            CROSS APPLY sys.dm_os_volume_stats(f.database_id, f.file_id) AS vs
            WHERE f.database_id = 2
            ORDER BY vs.total_bytes DESC
        """)
        disk_result = cursor.fetchone()
        disk_usage = float(disk_result[0]) if disk_result and disk_result[0] is not None else 0
        
        cursor.close()
        conn.close()
        
        return {
            "timestamp": time.time(),
            "cpu_percent": round(cpu_percent, 1),
            "memory_percent": round(memory_percent, 1),
            "disk_usage": round(disk_usage, 1),
            "status": "connected_remote_server"
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"timestamp": time.time(), "cpu_percent": 0, "memory_percent": 0, "disk_usage": 0, "error": f"Query failed: {str(e)}"}

@router.get("/dashboard-overview")
async def get_dashboard_overview() -> Dict[str, Any]:
    conn = get_sql_connection()
    if not conn:
        return {"error": "Cannot connect to SQL Server"}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT @@SERVERNAME as server_name, SERVERPROPERTY('ProductVersion') as version, SERVERPROPERTY('Edition') as edition,
                   DATEDIFF(day, sqlserver_start_time, GETDATE()) as uptime_days,
                   DATEPART(hour, GETDATE() - sqlserver_start_time) as uptime_hours
            FROM sys.dm_os_sys_info
        """)
        server_info = cursor.fetchone()
        
        cursor.execute("""
            SELECT COUNT(*) as total_sessions, SUM(CASE WHEN status IN ('running', 'runnable') THEN 1 ELSE 0 END) as active_sessions
            FROM sys.dm_exec_sessions WHERE is_user_process = 1
        """)
        session_info = cursor.fetchone()
        
        cursor.execute("""
            SELECT COUNT(*) as total_databases, SUM(CASE WHEN state = 0 THEN 1 ELSE 0 END) as online_databases,
                   SUM(CASE WHEN name NOT IN ('master', 'tempdb', 'model', 'msdb') THEN 1 ELSE 0 END) as user_databases
            FROM sys.databases
        """)
        db_info = cursor.fetchone()
        
        cursor.execute("""
            SELECT SUM(num_of_bytes_read + num_of_bytes_written) / 1024.0 / 1024.0 as total_io_mb
            FROM sys.dm_io_virtual_file_stats(NULL, NULL)
        """)
        io_result = cursor.fetchone()
        io_mb_total = float(io_result[0]) if io_result and io_result[0] else 0
        
        cursor.execute("SELECT COUNT(*) FROM sys.dm_exec_requests WHERE DATEDIFF(minute, start_time, GETDATE()) > 2")
        long_queries = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sys.dm_exec_requests WHERE blocking_session_id > 0")
        blocked_sessions = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()
        
        alerts = []
        if long_queries > 0:
            alerts.append({"level": "warning", "message": f"{long_queries} long running queries (>2 min)", "action": "Check Performance tab"})
        if blocked_sessions > 0:
            alerts.append({"level": "critical", "message": f"{blocked_sessions} blocked sessions detected", "action": "Check Sessions tab"})
        
        return {
            "timestamp": time.time(),
            "server_info": {
                "name": server_info[0],
                "version": server_info[1][:20] + "..." if len(server_info[1]) > 20 else server_info[1],
                "edition": server_info[2],
                "uptime_days": server_info[3],
                "uptime_hours": server_info[4]
            },
            "session_stats": {"total_sessions": session_info[0], "active_sessions": session_info[1], "blocked_sessions": blocked_sessions},
            "database_stats": {"total_databases": db_info[0], "online_databases": db_info[1], "user_databases": db_info[2]},
            "performance_stats": {"long_running_queries": long_queries, "total_io_mb": round(io_mb_total, 1), "deadlocks": 0},
            "alerts": alerts
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"error": f"Dashboard query failed: {str(e)}"}

# ===== NUEVOS ENDPOINTS PARA PERFORMANCE =====

@router.get("/top-slow-queries")
async def get_top_slow_queries() -> Dict[str, Any]:
    """Obtiene las consultas más lentas del servidor"""
    conn = get_sql_connection()
    if not conn:
        return {"error": "Cannot connect to SQL Server", "queries": []}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT TOP 10
                SUBSTRING(st.text, (qs.statement_start_offset/2)+1, 
                    ((CASE qs.statement_end_offset 
                        WHEN -1 THEN DATALENGTH(st.text)
                        ELSE qs.statement_end_offset 
                    END - qs.statement_start_offset)/2) + 1) AS query_text,
                qs.total_elapsed_time / qs.execution_count AS avg_duration_ms,
                qs.execution_count,
                qs.total_worker_time / qs.execution_count AS avg_cpu_ms,
                qs.last_execution_time,
                DB_NAME(st.dbid) AS database_name,
                qs.total_elapsed_time / 1000 AS total_duration_ms
            FROM sys.dm_exec_query_stats qs
            CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
            WHERE st.text IS NOT NULL
            ORDER BY qs.total_elapsed_time / qs.execution_count DESC
        """)
        
        queries = []
        for row in cursor.fetchall():
            query_text = row[0][:100] + "..." if len(row[0]) > 100 else row[0]
            queries.append({
                "query": query_text.strip(),
                "avg_duration_ms": round(float(row[1]) / 1000, 0) if row[1] else 0,  # Convertir a ms
                "execution_count": row[2],
                "avg_cpu_ms": round(float(row[3]) / 1000, 0) if row[3] else 0,
                "last_execution": row[4].strftime("%Y-%m-%d %H:%M:%S") if row[4] else "N/A",
                "database": row[5] if row[5] else "N/A",
                "total_duration_ms": round(float(row[6]), 0) if row[6] else 0
            })
        
        cursor.close()
        conn.close()
        
        return {
            "timestamp": time.time(),
            "queries": queries
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"error": f"Query failed: {str(e)}", "queries": []}

@router.get("/top-frequent-queries")
async def get_top_frequent_queries() -> Dict[str, Any]:
    """Obtiene las consultas más frecuentes"""
    conn = get_sql_connection()
    if not conn:
        return {"error": "Cannot connect to SQL Server", "queries": []}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT TOP 10
                SUBSTRING(st.text, (qs.statement_start_offset/2)+1, 
                    ((CASE qs.statement_end_offset 
                        WHEN -1 THEN DATALENGTH(st.text)
                        ELSE qs.statement_end_offset 
                    END - qs.statement_start_offset)/2) + 1) AS query_text,
                qs.execution_count,
                qs.total_elapsed_time / qs.execution_count AS avg_duration_ms,
                qs.total_worker_time / 1000 AS total_cpu_ms,
                DB_NAME(st.dbid) AS database_name,
                qs.last_execution_time
            FROM sys.dm_exec_query_stats qs
            CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
            WHERE st.text IS NOT NULL
            ORDER BY qs.execution_count DESC
        """)
        
        queries = []
        for row in cursor.fetchall():
            query_text = row[0][:100] + "..." if len(row[0]) > 100 else row[0]
            queries.append({
                "query": query_text.strip(),
                "execution_count": row[1],
                "avg_duration_ms": round(float(row[2]) / 1000, 0) if row[2] else 0,
                "total_cpu_ms": round(float(row[3]), 0) if row[3] else 0,
                "database": row[4] if row[4] else "N/A",
                "last_execution": row[5].strftime("%Y-%m-%d %H:%M:%S") if row[5] else "N/A"
            })
        
        cursor.close()
        conn.close()
        
        return {
            "timestamp": time.time(),
            "queries": queries
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"error": f"Query failed: {str(e)}", "queries": []}

@router.get("/wait-types-stats")
async def get_wait_types_stats() -> Dict[str, Any]:
    """Obtiene estadísticas de wait types"""
    conn = get_sql_connection()
    if not conn:
        return {"error": "Cannot connect to SQL Server", "waits": {}}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                wait_type,
                waiting_tasks_count,
                wait_time_ms,
                signal_wait_time_ms,
                wait_time_ms - signal_wait_time_ms AS resource_wait_time_ms
            FROM sys.dm_os_wait_stats
            WHERE wait_type NOT IN (
                'CLR_SEMAPHORE', 'LAZYWRITER_SLEEP', 'RESOURCE_QUEUE', 'SLEEP_TASK',
                'SLEEP_SYSTEMTASK', 'SQLTRACE_BUFFER_FLUSH', 'WAITFOR', 'LOGMGR_QUEUE',
                'CHECKPOINT_QUEUE', 'REQUEST_FOR_DEADLOCK_SEARCH', 'XE_TIMER_EVENT',
                'BROKER_TO_FLUSH', 'BROKER_TASK_STOP', 'CLR_MANUAL_EVENT',
                'CLR_AUTO_EVENT', 'DISPATCHER_QUEUE_SEMAPHORE', 'FT_IFTS_SCHEDULER_IDLE_WAIT',
                'XE_DISPATCHER_WAIT', 'XE_DISPATCHER_JOIN', 'SQLTRACE_INCREMENTAL_FLUSH_SLEEP'
            )
            AND waiting_tasks_count > 0
            ORDER BY wait_time_ms DESC
        """)
        
        waits = cursor.fetchall()
        
        # Calcular totales y categorizar
        total_wait_time = sum(row[2] for row in waits) if waits else 1
        
        cpu_waits = sum(row[2] for row in waits if 'CPU' in row[0] or 'SOS_SCHEDULER_YIELD' in row[0])
        io_waits = sum(row[2] for row in waits if any(x in row[0] for x in ['PAGEIOLATCH', 'WRITELOG', 'IO_COMPLETION', 'BACKUPTHREAD']))
        lock_waits = sum(row[2] for row in waits if any(x in row[0] for x in ['LCK_', 'LOCK_', 'DEADLOCK']))
        memory_waits = sum(row[2] for row in waits if any(x in row[0] for x in ['RESOURCE_SEMAPHORE', 'MEMORY_', 'CMEMTHREAD']))
        
        cursor.close()
        conn.close()
        
        return {
            "timestamp": time.time(),
            "waits": {
                "cpu_wait_percent": round((cpu_waits / total_wait_time) * 100, 1) if total_wait_time > 0 else 0,
                "io_wait_percent": round((io_waits / total_wait_time) * 100, 1) if total_wait_time > 0 else 0,
                "lock_wait_percent": round((lock_waits / total_wait_time) * 100, 1) if total_wait_time > 0 else 0,
                "memory_wait_percent": round((memory_waits / total_wait_time) * 100, 1) if total_wait_time > 0 else 0,
                "total_waits": len(waits)
            }
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"error": f"Query failed: {str(e)}", "waits": {}}

@router.get("/missing-indexes")
async def get_missing_indexes() -> Dict[str, Any]:
    """Obtiene recomendaciones de índices faltantes"""
    conn = get_sql_connection()
    if not conn:
        return {"error": "Cannot connect to SQL Server", "indexes": []}
    
    try:
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT TOP 10
                DB_NAME(mid.database_id) AS database_name,
                OBJECT_NAME(mid.object_id, mid.database_id) AS table_name,
                mid.equality_columns + ISNULL(', ' + mid.inequality_columns, '') AS suggested_columns,
                migs.user_seeks + migs.user_scans AS total_seeks_scans,
                CAST(migs.avg_total_user_cost * migs.avg_user_impact / 100.0 AS DECIMAL(18,2)) AS improvement_measure,
                CASE 
                    WHEN migs.avg_user_impact > 80 THEN 'Alto'
                    WHEN migs.avg_user_impact > 50 THEN 'Medio'
                    ELSE 'Bajo'
                END AS impact_level
            FROM sys.dm_db_missing_index_details mid
            INNER JOIN sys.dm_db_missing_index_groups mig ON mid.index_handle = mig.index_handle
            INNER JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
            WHERE mid.database_id > 4  -- Solo bases de datos de usuario
            ORDER BY improvement_measure DESC
        """)
        
        indexes = []
        for row in cursor.fetchall():
            indexes.append({
                "database": row[0] if row[0] else "N/A",
                "table": row[1] if row[1] else "N/A",
                "suggested_columns": row[2] if row[2] else "N/A",
                "seeks_scans": row[3] if row[3] else 0,
                "improvement_measure": float(row[4]) if row[4] else 0,
                "impact_level": row[5] if row[5] else "Bajo"
            })
        
        cursor.close()
        conn.close()
        
        return {
            "timestamp": time.time(),
            "indexes": indexes
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"error": f"Query failed: {str(e)}", "indexes": []}

@router.get("/index-fragmentation")
async def get_index_fragmentation() -> Dict[str, Any]:
    """Obtiene información de fragmentación de índices de todas las bases de datos de usuario"""
    conn = get_sql_connection()
    if not conn:
        return {"error": "Cannot connect to SQL Server", "indexes": []}
    
    try:
        cursor = conn.cursor()
        
        # Primero obtenemos todas las bases de datos de usuario (excluyendo las del sistema)
        cursor.execute("""
            SELECT name, database_id 
            FROM sys.databases 
            WHERE database_id > 4  -- Excluir master, tempdb, model, msdb
              AND state = 0        -- Solo bases de datos ONLINE
              AND is_read_only = 0 -- Solo bases de datos de lectura/escritura
            ORDER BY name
        """)
        
        user_databases = cursor.fetchall()
        all_indexes = []
        
        # Si no hay bases de datos de usuario, retornar vacío
        if not user_databases:
            cursor.close()
            conn.close()
            return {
                "timestamp": time.time(),
                "indexes": [],
                "message": "No user databases found"
            }
        
        # Recorrer cada base de datos de usuario
        for db_name, db_id in user_databases:
            try:
                # Construir y ejecutar la consulta dinámicamente para cada BD
                query = f"""
                    USE [{db_name}];
                    
                    SELECT TOP 10
                        '{db_name}' AS database_name,
                        OBJECT_NAME(ips.object_id) AS table_name,
                        i.name AS index_name,
                        ips.avg_fragmentation_in_percent,
                        ips.page_count,
                        CASE 
                            WHEN ips.avg_fragmentation_in_percent > 30 THEN 'REBUILD'
                            WHEN ips.avg_fragmentation_in_percent > 10 THEN 'REORGANIZE'
                            ELSE 'OK'
                        END AS recommendation
                    FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, 'LIMITED') ips
                    INNER JOIN sys.indexes i ON ips.object_id = i.object_id AND ips.index_id = i.index_id
                    WHERE ips.avg_fragmentation_in_percent > 5
                      AND ips.page_count > 100  -- Solo índices con suficientes páginas
                      AND i.index_id > 0  -- Excluir heaps
                      AND ips.object_id > 100  -- Excluir objetos del sistema
                    ORDER BY ips.avg_fragmentation_in_percent DESC
                """
                
                cursor.execute(query)
                db_indexes = cursor.fetchall()
                
                # Agregar los índices de esta BD al resultado total
                for row in db_indexes:
                    all_indexes.append({
                        "database": row[0] if row[0] else "N/A",
                        "table": row[1] if row[1] else "N/A",
                        "index_name": row[2] if row[2] else "N/A", 
                        "fragmentation_percent": round(float(row[3]), 1) if row[3] else 0,
                        "page_count": row[4] if row[4] else 0,
                        "recommendation": row[5] if row[5] else "OK"
                    })
                    
            except Exception as db_error:
                # Si hay error en una BD específica, continuar con las demás
                print(f"Error processing database {db_name}: {db_error}")
                continue
        
        # Ordenar todos los índices por fragmentación descendente y tomar solo los top 20
        all_indexes.sort(key=lambda x: x["fragmentation_percent"], reverse=True)
        top_indexes = all_indexes[:20]
        
        cursor.close()
        conn.close()
        
        return {
            "timestamp": time.time(),
            "indexes": top_indexes,
            "databases_processed": len(user_databases),
            "total_fragmented_indexes": len(all_indexes)
        }
        
    except Exception as e:
        if conn:
            conn.close()
        return {"error": f"Query failed: {str(e)}", "indexes": []}
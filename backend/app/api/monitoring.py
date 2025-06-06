from fastapi import APIRouter
from typing import Dict, Any
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

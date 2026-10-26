from datetime import datetime, timezone
from app.databases import get_db_connection
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="CloudPulse API",
    description="DevOps Monitoring Dashboard API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "application": "CloudPulse",
        "message": "API is running",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/metrics")
def metrics():
    with get_db_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    COUNT(DISTINCT server_name) AS servers,
                    COUNT(DISTINCT server_name)
                        FILTER (WHERE status = 'active') AS active_servers,
                    COALESCE(ROUND(AVG(cpu_usage), 2), 0) AS cpu_usage,
                    COALESCE(ROUND(AVG(memory_usage), 2), 0) AS memory_usage
                FROM monitoring_metrics
                WHERE recorded_at = (
                    SELECT MAX(recorded_at)
                    FROM monitoring_metrics AS latest
                    WHERE latest.server_name = monitoring_metrics.server_name
                )
                """
            )
            result = cursor.fetchone()

    return {
        "servers": result["servers"],
        "active_servers": result["active_servers"],
        "cpu_usage": float(result["cpu_usage"]),
        "memory_usage": float(result["memory_usage"]),
    }

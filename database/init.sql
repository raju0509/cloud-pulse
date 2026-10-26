CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id BIGSERIAL PRIMARY KEY,
    server_name VARCHAR(100) NOT NULL,
    cpu_usage NUMERIC(5, 2) NOT NULL
        CHECK (cpu_usage >= 0 AND cpu_usage <= 100),
    memory_usage NUMERIC(5, 2) NOT NULL
        CHECK (memory_usage >= 0 AND memory_usage <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_server_time
    ON monitoring_metrics (server_name, recorded_at DESC);

INSERT INTO monitoring_metrics
    (server_name, cpu_usage, memory_usage, status)
VALUES
    ('server-01', 42, 67, 'active'),
    ('server-02', 35, 58, 'active'),
    ('server-03', 61, 72, 'active'),
    ('server-04', 28, 45, 'active'),
    ('server-05', 0, 0, 'inactive');

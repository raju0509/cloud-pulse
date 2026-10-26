import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState('Checking')
  const [metrics, setMetrics] = useState(null)
  const [lastUpdated, setLastUpdated] = useState('--:--:--')

  const fetchData = async () => {
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/metrics'),
      ])

      if (!healthResponse.ok || !metricsResponse.ok) {
        throw new Error('API request failed')
      }

      const healthData = await healthResponse.json()
      const metricsData = await metricsResponse.json()

      setHealth(healthData.status || 'Healthy')
      setMetrics(metricsData)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Unable to fetch dashboard data:', error)
      setHealth('Unavailable')
    }
  }

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    {
      label: 'Total Servers',
      value: metrics?.servers ?? '--',
      unit: 'instances',
      icon: '▤',
      color: 'blue',
    },
    {
      label: 'Active Servers',
      value: metrics?.active_servers ?? '--',
      unit: 'running',
      icon: '◉',
      color: 'green',
    },
    {
      label: 'CPU Utilization',
      value: metrics?.cpu_usage != null ? `${metrics.cpu_usage}%` : '--',
      unit: 'current usage',
      icon: '◴',
      color: 'purple',
    },
    {
      label: 'Memory Usage',
      value: metrics?.memory_usage != null ? `${metrics.memory_usage}%` : '--',
      unit: 'current usage',
      icon: '▥',
      color: 'orange',
    },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">C</div>
          <div>
            <h2>CloudPulse</h2>
            <span>INFRASTRUCTURE CLOUD</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="navigation">
          <a className="nav-item active" href="#overview">
            <span>▦</span> Overview
          </a>
          <a className="nav-item" href="#infrastructure">
            <span>▤</span> Infrastructure
          </a>
          <a className="nav-item" href="#monitoring">
            <span>◴</span> Monitoring
          </a>
          <a className="nav-item" href="#activity">
            <span>⌁</span> Activity Logs
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="environment-card">
            <span className="environment-dot"></span>
            <div>
              <strong>Development</strong>
              <p>Docker environment</p>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">RJ</div>
            <div>
              <strong>Cloud Administrator</strong>
              <p>DevOps Engineer</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>Overview</strong>
          </div>
          <div className="topbar-right">
            <span className="live-indicator">
              <span className="live-dot"></span> Live monitoring
            </span>
            <div className="avatar">RJ</div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">INFRASTRUCTURE OVERVIEW</div>
            <h1>Good day, Administrator <span>👋</span></h1>
            <p>Monitor your infrastructure, performance, and service health.</p>
          </div>

          <button className="refresh-button" onClick={fetchData}>
            ↻ Refresh data
          </button>
        </section>

        <section className="status-banner">
          <div className="status-symbol">✓</div>
          <div className="status-copy">
            <strong>
              {health === 'healthy' || health === 'Healthy'
                ? 'Your monitoring API is operational'
                : health === 'Unavailable'
                  ? 'Monitoring API is unavailable'
                  : 'Checking monitoring API'}
            </strong>
            <p>
              {health === 'Unavailable'
                ? 'Check the backend container and API logs.'
                : 'CloudPulse is checking your backend health and infrastructure metrics.'}
            </p>
          </div>
          <span className={`status-badge ${health === 'Unavailable' ? 'status-error' : ''}`}>
            <span className="live-dot"></span> {health}
          </span>
        </section>

        <section className="section-heading" id="infrastructure">
          <div>
            <h2>Infrastructure metrics</h2>
            <p>Real-time data from your monitoring API</p>
          </div>
          <span className="updated-label">Updated {lastUpdated}</span>
        </section>

        <section className="metrics-grid">
          {cards.map((card) => (
            <article className="metric-card" key={card.label}>
              <div className="metric-top">
                <span className="metric-label">{card.label}</span>
                <div className={`metric-icon ${card.color}`}>{card.icon}</div>
              </div>
              <div className="metric-value">{card.value}</div>
              <div className="metric-footer">
                <span>{card.unit}</span>
                <span className="metric-live">● Live</span>
              </div>
            </article>
          ))}
        </section>

        <section className="lower-grid" id="monitoring">
          <article className="panel">
            <div className="panel-heading">
              <div>
                <h2>Resource utilization</h2>
                <p>Current system resource consumption</p>
              </div>
              <span className="panel-tag">CURRENT</span>
            </div>

            <div className="resource-row">
              <div className="resource-label">
                <span>CPU utilization</span>
                <strong>{metrics?.cpu_usage != null ? `${metrics.cpu_usage}%` : '--'}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill cpu-fill"
                  style={{ width: `${Math.min(Number(metrics?.cpu_usage) || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="resource-row">
              <div className="resource-label">
                <span>Memory utilization</span>
                <strong>{metrics?.memory_usage != null ? `${metrics.memory_usage}%` : '--'}</strong>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill memory-fill"
                  style={{ width: `${Math.min(Number(metrics?.memory_usage) || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="resource-note">
              <span>ⓘ</span>
              Resource values currently come from the backend demo metrics.
            </div>
          </article>

          <article className="panel" id="activity">
            <div className="panel-heading">
              <div>
                <h2>Service health</h2>
                <p>Application component status</p>
              </div>
              <span className="panel-tag">STATUS</span>
            </div>

            <div className="service-row">
              <div className="service-icon">UI</div>
              <div className="service-info">
                <strong>Frontend</strong>
                <span>React · Nginx</span>
              </div>
              <span className="service-status"><i></i> Running</span>
            </div>

            <div className="service-row">
              <div className="service-icon api-icon">API</div>
              <div className="service-info">
                <strong>Backend API</strong>
                <span>Python · FastAPI</span>
              </div>
              <span className={`service-status ${health === 'Unavailable' ? 'service-down' : ''}`}>
                <i></i> {health === 'Unavailable' ? 'Unavailable' : health === 'Checking' ? 'Checking' : 'Running'}
              </span>
            </div>

            <div className="service-row">
              <div className="service-icon docker-icon">DK</div>
              <div className="service-info">
                <strong>Container platform</strong>
                <span>Docker Compose</span>
              </div>
              <span className="service-status"><i></i> Running</span>
            </div>
          </article>
        </section>

        <footer className="footer">
          <span>CloudPulse <span className="footer-divider">·</span> DevOps Monitoring Platform</span>
          <span>Built with React, FastAPI & Docker</span>
        </footer>
      </main>
    </div>
  )
}

export default App

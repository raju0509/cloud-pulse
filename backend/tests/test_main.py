from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "application": "CloudPulse",
        "message": "API is running",
    }


def test_health_endpoint():
    response = client.get("/api/health")

    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


@patch("app.main.get_db_connection")
def test_metrics_endpoint(mock_get_db_connection):
    mock_connection = MagicMock()
    mock_cursor = MagicMock()

    mock_get_db_connection.return_value.__enter__.return_value = (
        mock_connection
    )
    mock_connection.cursor.return_value.__enter__.return_value = (
        mock_cursor
    )

    mock_cursor.fetchone.return_value = {
        "servers": 5,
        "active_servers": 4,
        "cpu_usage": 33.2,
        "memory_usage": 48.4,
    }

    response = client.get("/api/metrics")

    assert response.status_code == 200
    assert response.json() == {
        "servers": 5,
        "active_servers": 4,
        "cpu_usage": 33.2,
        "memory_usage": 48.4,
    }

    mock_get_db_connection.assert_called_once()

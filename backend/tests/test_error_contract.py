"""API errors always use the public error envelope."""

from fastapi.testclient import TestClient

from app.main import app


def test_validation_error_uses_error_envelope():
    client = TestClient(app)
    response = client.post(
        "/api/meal-plans/generate",
        json={"people_count": 0, "days": [], "budget": 0},
    )

    assert response.status_code == 422
    assert response.json() == {
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed.",
            "retryable": False,
        }
    }
    assert response.headers["X-Request-ID"]

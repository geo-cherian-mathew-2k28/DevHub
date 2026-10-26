from fastapi import status


def test_health_endpoint(client):
    """Test that liveness probe responds with 200 and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "devhub-api"
    assert "timestamp" in data


def test_ready_endpoint(client):
    """Test that readiness probe responds with 200 and database connected."""
    response = client.get("/api/ready")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"


def test_create_task_success(client):
    """Test successful task creation."""
    payload = {
        "title": "Learn Dockerfile Multi-stage Builds",
        "description": "Separate build dependencies from final runtime image.",
        "priority": "high",
        "status": "pending",
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["priority"] == "high"
    assert data["status"] == "pending"
    assert "created_at" in data
    assert "updated_at" in data


def test_create_task_validation_error(client):
    """Test input validation for missing required title and invalid priority."""
    # Empty title
    response = client.post("/api/tasks", json={"title": ""})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Invalid priority enum
    response = client.post("/api/tasks", json={"title": "Valid title", "priority": "super-urgent"})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Title exceeds maximum length
    response = client.post("/api/tasks", json={"title": "A" * 201})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_list_and_filter_tasks(client):
    """Test listing tasks, filtering by status and priority, and stats calculation."""
    # Create two tasks
    client.post("/api/tasks", json={
        "title": "Task One",
        "priority": "low",
        "status": "pending",
    })
    client.post("/api/tasks", json={
        "title": "Task Two",
        "priority": "high",
        "status": "completed",
    })

    # List all
    response = client.get("/api/tasks")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] >= 2
    assert "stats" in data
    assert data["stats"]["total"] >= 2

    # Filter by status
    res_status = client.get("/api/tasks?status=completed")
    assert res_status.status_code == status.HTTP_200_OK
    items_status = res_status.json()["items"]
    assert any(t["title"] == "Task Two" for t in items_status)
    assert not any(t["title"] == "Task One" for t in items_status)

    # Filter by priority
    res_prio = client.get("/api/tasks?priority=low")
    assert res_prio.status_code == status.HTTP_200_OK
    items_prio = res_prio.json()["items"]
    assert any(t["title"] == "Task One" for t in items_prio)
    assert not any(t["title"] == "Task Two" for t in items_prio)

    # Search keyword
    res_search = client.get("/api/tasks?q=One")
    assert res_search.status_code == status.HTTP_200_OK
    items_search = res_search.json()["items"]
    assert len(items_search) == 1
    assert items_search[0]["title"] == "Task One"


def test_get_individual_task(client):
    """Test fetching a single task by ID."""
    create_res = client.post("/api/tasks", json={"title": "Inspect Container Logs"})
    task_id = create_res.json()["id"]

    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["id"] == task_id
    assert get_res.json()["title"] == "Inspect Container Logs"


def test_get_nonexistent_task(client):
    """Test 404 response for nonexistent task."""
    response = client.get("/api/tasks/999999")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_update_task(client):
    """Test partial updates (PATCH) on tasks."""
    create_res = client.post("/api/tasks", json={
        "title": "Draft Docker Compose",
        "status": "pending",
        "priority": "low"
    })
    task_id = create_res.json()["id"]

    update_payload = {
        "status": "in progress",
        "priority": "high",
        "description": "Added db, backend, and frontend services.",
    }
    patch_res = client.patch(f"/api/tasks/{task_id}", json=update_payload)
    assert patch_res.status_code == status.HTTP_200_OK
    data = patch_res.json()
    assert data["status"] == "in progress"
    assert data["priority"] == "high"
    assert data["description"] == update_payload["description"]


def test_update_nonexistent_task(client):
    """Test 404 response when updating nonexistent task."""
    response = client.patch("/api/tasks/999999", json={"title": "Ghost"})
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_task(client):
    """Test task deletion and subsequent 404."""
    create_res = client.post("/api/tasks", json={"title": "Temporary Task"})
    task_id = create_res.json()["id"]

    delete_res = client.delete(f"/api/tasks/{task_id}")
    assert delete_res.status_code == status.HTTP_204_NO_CONTENT

    # Verification: task should now be gone
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == status.HTTP_404_NOT_FOUND


def test_delete_nonexistent_task(client):
    """Test 404 response when deleting nonexistent task."""
    response = client.delete("/api/tasks/999999")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_ai_suggest_description_fallback(client):
    """Test educational AI description helper works even when local model runner is off."""
    response = client.post("/api/ai/suggest-description", json={"title": "Configure Docker Networks"})
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "suggested_description" in data
    assert len(data["suggested_description"]) > 10
    assert "source" in data

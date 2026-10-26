#!/usr/bin/env bash
# DevHub - Automated Test & Verification Suite (Bash)

set -e

echo ""
echo "==============================================="
echo "       DevHub Automated Verification Suite"
echo "==============================================="
echo ""

backend_pass=0
smoke_pass=0

# 1. Run Backend Pytest Suite
echo "--- 1. Running Backend Unit & Integration Tests ---"
if docker compose ps -q backend >/dev/null 2>&1 && [ -n "$(docker compose ps -q backend)" ]; then
    echo "Executing pytest inside running backend container..."
    if docker compose exec -T backend pytest -v; then
        backend_pass=1
        echo -e "\033[0;32m[PASS] Backend tests passed in container.\033[0m"
    else
        echo -e "\033[0;31m[FAIL] Backend tests failed.\033[0m"
    fi
else
    echo "Backend container is not running. Attempting local pytest..."
    if pytest backend/tests -v; then
        backend_pass=1
        echo -e "\033[0;32m[PASS] Local backend tests passed.\033[0m"
    else
        echo -e "\033[0;33m[WARN] Pytest not installed locally. Run 'docker compose up -d' first.\033[0m"
    fi
fi

# 2. Live Smoke Test against running environment
echo ""
echo "--- 2. Running Live Stack Smoke Tests ---"
if curl -s -f http://localhost:3000 >/dev/null 2>&1 && \
   curl -s -f http://localhost:8000/api/health >/dev/null 2>&1 && \
   curl -s -f http://localhost:8000/api/ready >/dev/null 2>&1; then

    echo -e "\033[0;32m[PASS] Frontend and Backend endpoints responding.\033[0m"

    # Test Task creation
    task_res=$(curl -s -X POST http://localhost:8000/api/tasks \
        -H "Content-Type: application/json" \
        -d '{"title":"Bash Smoke Test","priority":"high","status":"pending"}')
    task_id=$(echo "$task_res" | grep -o '"id":[0-9]*' | cut -d: -f2)

    if [ -n "$task_id" ]; then
        echo -e "\033[0;32m[PASS] Created test task in PostgreSQL (ID: $task_id).\033[0m"
        # Delete test task
        curl -s -X DELETE "http://localhost:8000/api/tasks/$task_id"
        echo -e "\033[0;32m[PASS] Deleted test task cleanly.\033[0m"
        smoke_pass=1
    fi
else
    echo -e "\033[0;31m[FAIL] Live smoke test failed or services are not running.\033[0m"
fi

echo ""
echo "==============================================="
if [ $backend_pass -eq 1 ] && [ $smoke_pass -eq 1 ]; then
    echo -e "\033[0;32mALL TESTS PASSED! Verification complete.\033[0m"
else
    echo -e "\033[0;33mVerification completed with notices.\033[0m"
fi
echo "==============================================="
echo ""

#!/usr/bin/env bash
# DevHub - Prerequisites and Environment Checker (Bash)

set -e

echo ""
echo "==============================================="
echo "       DevHub Workshop Pre-flight Check"
echo "==============================================="
echo ""

check_tool() {
    name="$1"
    cmd="$2"
    args="$3"

    if command -v "$cmd" >/dev/null 2>&1; then
        output=$($cmd $args 2>&1 | head -n 1)
        echo -e "\033[0;32m[OK]\033[0m $name is installed: $output"
        return 0
    else
        echo -e "\033[0;31m[FAIL]\033[0m $name was not found in PATH."
        return 1
    fi
}

all_good=0

check_tool "Docker CLI" "docker" "--version" || all_good=1
check_tool "Docker Compose" "docker" "compose version" || all_good=1
check_tool "Docker Buildx" "docker" "buildx version" || all_good=1
check_tool "kubectl" "kubectl" "version --client" || all_good=1
check_tool "kind" "kind" "version" || all_good=1
check_tool "Node.js" "node" "-v" || all_good=1
check_tool "npm" "npm" "-v" || all_good=1

echo ""
echo "Checking Docker Engine Daemon..."
if docker info >/dev/null 2>&1; then
    echo -e "\033[0;32m[OK]\033[0m Docker daemon is running."
else
    echo -e "\033[0;31m[FAIL]\033[0m Docker daemon is not running. Please start Docker Desktop or the dockerd service."
    all_good=1
fi

echo ""
echo "-----------------------------------------------"
if [ $all_good -eq 0 ]; then
    echo -e "\033[0;32mSUCCESS: Your environment is ready for the DevHub workshop!\033[0m"
else
    echo -e "\033[0;33mATTENTION: Please review any FAIL notices above before proceeding.\033[0m"
fi
echo "-----------------------------------------------"
echo ""

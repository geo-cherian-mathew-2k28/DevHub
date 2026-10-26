-- DevHub Database Initialization Script
-- Runs automatically on container startup if data directory is empty.

CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for searching and filtering performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Seed initial educational tasks if empty
INSERT INTO tasks (title, description, priority, status)
SELECT 'Understand Docker Containers', 'Learn the difference between an image (blueprint) and a running container.', 'high', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM tasks);

INSERT INTO tasks (title, description, priority, status)
SELECT 'Master Docker Compose', 'Connect the frontend, backend, and PostgreSQL services using container networking.', 'high', 'in progress'
WHERE (SELECT COUNT(*) FROM tasks) = 1;

INSERT INTO tasks (title, description, priority, status)
SELECT 'Deploy to Kubernetes with kind', 'Create a local kind cluster, write Kubernetes manifests, and scale the backend deployment.', 'medium', 'pending'
WHERE (SELECT COUNT(*) FROM tasks) = 2;

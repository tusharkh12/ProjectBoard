-- Sample data for ProjectBoard demonstration
-- This creates a diverse set of tasks to showcase all features

INSERT INTO tasks (id, title, description, status, priority, assignee, estimated_hours, tags, version, created_at, updated_at, created_by, updated_by) VALUES
(1, 'Setup Project Infrastructure', 'Initialize the project repository, setup CI/CD pipeline, and configure development environment', 'DONE', 'HIGH', 'John Smith', 8, 'setup,infrastructure,devops', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(2, 'Design User Interface Mockups', 'Create wireframes and high-fidelity mockups for the main user interface using Figma', 'IN_PROGRESS', 'MEDIUM', 'Sarah Johnson', 12, 'design,ui,mockups', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(3, 'Implement User Authentication', 'Develop secure user authentication system with JWT tokens and role-based access control', 'BACKLOG', 'CRITICAL', 'Mike Davis', 16, 'auth,security,backend', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(4, 'Create Task Management API', 'Build RESTful API endpoints for CRUD operations on tasks with optimistic locking', 'IN_PROGRESS', 'HIGH', 'Emma Wilson', 20, 'api,backend,crud', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(5, 'Fix Critical Bug in Data Processing', 'Resolve the issue causing data corruption when processing large datasets', 'REVIEW', 'CRITICAL', 'David Lee', 4, 'bug,critical,data', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(6, 'Write Unit Tests for Services', 'Implement comprehensive unit tests for all service layer components', 'TESTING', 'MEDIUM', 'Lisa Chen', 10, 'testing,unit-tests,quality', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(7, 'Optimize Database Queries', 'Improve performance by optimizing slow database queries and adding proper indexes', 'BACKLOG', 'LOW', 'Tom Anderson', 6, 'performance,database,optimization', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(8, 'Implement Real-time Notifications', 'Add WebSocket support for real-time notifications when tasks are updated', 'IN_PROGRESS', 'MEDIUM', 'Anna Martinez', 14, 'real-time,websocket,notifications', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(9, 'Create Dashboard Analytics', 'Build interactive dashboard showing task statistics, team performance metrics', 'REVIEW', 'LOW', 'James Brown', 18, 'dashboard,analytics,charts', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(10, 'Mobile App Responsive Design', 'Ensure the application works perfectly on mobile devices and tablets', 'TESTING', 'MEDIUM', 'Rachel Green', 8, 'mobile,responsive,css', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(11, 'Security Audit and Penetration Testing', 'Conduct comprehensive security audit and fix any vulnerabilities found', 'BACKLOG', 'CRITICAL', 'Security Team', 24, 'security,audit,penetration', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(12, 'Documentation and User Manual', 'Create comprehensive documentation and user manual for the application', 'DONE', 'LOW', 'Technical Writer', 12, 'documentation,manual,help', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(13, 'Performance Load Testing', 'Conduct load testing to ensure application can handle expected user load', 'IN_PROGRESS', 'HIGH', 'QA Team', 16, 'performance,load-testing,qa', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(14, 'Implement Advanced Search', 'Add advanced search functionality with filters, sorting, and full-text search', 'REVIEW', 'MEDIUM', 'Sarah Johnson', 10, 'search,filters,frontend', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin'),

(15, 'Deploy to Production Environment', 'Deploy the application to production servers and configure monitoring', 'BACKLOG', 'HIGH', 'DevOps Team', 8, 'deployment,production,monitoring', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin', 'admin');

-- Reset the sequence for auto-increment
ALTER TABLE tasks ALTER COLUMN id RESTART WITH 16;
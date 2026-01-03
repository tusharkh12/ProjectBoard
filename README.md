# ProjectBoard

A modern task management application built with Angular 20 and Spring Boot. Features secure user authentication, complete kanban workflow with drag-and-drop, real-time updates, and conflict resolution.

## Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with login and registration
- **Task Management**: Create, edit, delete, and organize tasks
- **Sprint Board**: Drag-and-drop kanban interface with status columns
- **Dashboard**: Project overview with statistics and quick actions
- **Conflict Resolution**: Optimistic locking prevents data corruption
- **Real-time Updates**: Live status changes and progress tracking
- **Protected Routes**: Route guards ensure only authenticated users can access the application

### Frontend Pages
- **Login** (`/login`) - User authentication with JWT token management
- **Register** (`/register`) - New user registration with validation
- **Dashboard** (`/dashboard`) - Project overview with task statistics (protected)
- **Task List** (`/tasks`) - Comprehensive task management with filtering (protected)
- **Task Form** (`/tasks/new`, `/tasks/:id/edit`) - Create and edit tasks (protected)
- **Sprint Board** (`/board`) - Kanban interface with drag-and-drop (protected)

## Technology Stack

### Backend
- **Spring Boot 3.5.3** with Java 21
- **MySQL Database** with JPA for persistence
- **Spring Security** with JWT authentication
- **REST API** with comprehensive CRUD operations
- **Optimistic Locking** using @Version for conflict handling
- **Exception Handling** with global error management
- **BCrypt** password encoding for secure password storage

### Frontend
- **Angular 20** with standalone components
- **Angular Material** for UI components
- **Signals** for reactive state management
- **CDK Drag & Drop** for kanban functionality
- **Reactive Forms** with validation
- **HTTP Interceptors** for automatic JWT token injection
- **Route Guards** for protected routes

## Development Workflow

### Git Strategy
- `main` branch for production-ready code
- Feature branches: `feature/<issue-number>`
- Pull request workflow for all changes
- Issues linked to project board for tracking

### Sprint Methodology
- **Project Board**: Classic GitHub project with To Do, In Progress, Done columns
- **Issue Tracking**: Each feature implemented as separate GitHub issue
- **Feature Development**: Branch per issue with descriptive commits
- **Integration**: Regular merging to main with proper testing

### Code Organization

#### Backend Structure
```
backend/src/main/java/com/projectboard/
├── entity/          # JPA entities (Task, User)
├── repository/      # Spring Data repositories  
├── service/         # Business logic layer
├── controller/      # REST API endpoints
├── dto/            # Data transfer objects
├── exception/      # Error handling
├── config/         # Configuration (Security, CORS)
├── security/       # JWT authentication filter
└── util/           # Utilities (JWT token management)
```

#### Frontend Structure
```
frontend/src/app/
├── components/     # Reusable UI components
├── pages/         # Route-specific page components
│   ├── login/     # Login page
│   └── register/  # Registration page
├── services/      # API integration services
│   ├── auth.service.ts    # Authentication service
│   └── user.service.ts    # User management service
├── guards/        # Route guards (auth.guard.ts)
├── interceptors/  # HTTP interceptors (auth.interceptor.ts)
├── models/        # TypeScript interfaces
└── shared/        # Common utilities
```

## Getting Started

### Prerequisites
- Node.js 22+
- Java 21+
- MySQL 8.0+ (or Docker for MySQL)
- Git

### Installation
```bash
# Clone repository
git clone https://github.com/tusharkh12/ProjectBoard.git
cd ProjectBoard

# Database setup (using Docker)
cd backend
docker-compose up -d  # Starts MySQL container

# Backend setup
cd backend
# Configure database credentials in application.yml if needed
./gradlew build

# Frontend setup  
cd ../frontend
npm install
```

### Running the Application
```bash
# Start backend (http://localhost:8080)
cd backend
./gradlew bootRun

# Start frontend (http://localhost:4200)
cd frontend  
npm start
```

### Development Commands
```bash
# Backend
./gradlew test          # Run tests
./gradlew build         # Build application

# Frontend
npm test               # Unit tests
npm run build          # Production build
npm run lint           # Code linting
```

## API Endpoints

### Authentication (Public)
- `POST /api/auth/login` - User login (returns JWT token)
- `POST /api/auth/register` - Register new user

### Tasks (Protected - Requires JWT)
- `GET /api/tasks` - List all tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task by ID
- `PUT /api/tasks/{id}` - Update existing task
- `DELETE /api/tasks/{id}` - Delete task

### Statistics (Protected - Requires JWT)
- `GET /api/tasks/statistics` - Task completion metrics
- `GET /api/tasks/search` - Search tasks by criteria

**Note:** All task endpoints require authentication. Include JWT token in `Authorization: Bearer <token>` header.

## Project Management

### Issue Lifecycle
1. **Planning**: Issue created in GitHub with clear requirements
2. **Development**: Feature branch created, work begins
3. **Review**: Pull request opened with description
4. **Integration**: Code merged to main after review
5. **Deployment**: Feature available in main branch

### Definition of Done
- [ ] Feature implemented according to requirements
- [ ] Code reviewed and approved
- [ ] Tests passing (unit and integration)
- [ ] Documentation updated
- [ ] Merged to main branch

---

## Application Screenshots

### Authentication Pages

#### Login
Secure login page with form validation and error handling

![Login](frontend/docs/screenshots/user/login.png)

#### Register
User registration with email validation and password requirements

![Register](frontend/docs/screenshots/user/register.png)

### Main Application Pages

#### Dashboard
Project overview with task statistics, health metrics, and recent activity
![Dashboard](frontend/docs/screenshots/dashboard.png)

#### Task List View
Comprehensive task management with filtering, sorting, and bulk operations
![Task List](frontend/docs/screenshots/tasks-list-view.png)

#### Sprint Board (Kanban)
Drag-and-drop kanban interface with status columns and real-time updates
![Sprint Board](frontend/docs/screenshots/sprint-board.png)

### Task Management Features

#### Task Creation & Editing
Professional task editor with rich form validation and Material Design components
![Task Editor](frontend/docs/screenshots/task/task-edit-create.png)

#### Conflict Resolution System
Advanced optimistic locking with conflict detection and resolution options

**Conflict Detection**: When concurrent edits are detected, users are notified immediately
![Conflict Popup](frontend/docs/screenshots/task/conflict-popup.png)

**Merge Interface**: Intelligent merge tool for resolving conflicts between versions
![Merge Conflict](frontend/docs/screenshots/task/merge-conflict.png)

## Key Features Demonstrated

- ✅ **Secure Authentication**: JWT-based authentication with protected routes and automatic token management
- ✅ **User Management**: Registration and login with password encryption (BCrypt)
- ✅ **Professional UI/UX**: Modern Material Design with dark mode support
- ✅ **Conflict Resolution**: Optimistic locking prevents data loss in multi-user environments
- ✅ **Real-time Updates**: Live status changes and progress tracking
- ✅ **Responsive Design**: Consistent experience across all device sizes
- ✅ **Data Integrity**: Version control and conflict management for collaborative editing
- ✅ **API Security**: CORS configuration and JWT token validation

## Security Features

- **JWT Authentication**: Stateless authentication with secure token storage
- **Password Encryption**: BCrypt password hashing
- **Protected Routes**: Frontend route guards prevent unauthorized access
- **HTTP Interceptors**: Automatic JWT token injection for API requests
- **CORS Configuration**: Properly configured cross-origin resource sharing
- **Input Validation**: Both frontend and backend validation for data integrity

Built with modern web technologies for efficient task management and team collaboration.

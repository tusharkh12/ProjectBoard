# ProjectBoard Backend

Spring Boot REST API for collaborative task management with optimistic locking and conflict resolution.

## Tech Stack

- **Java 21**
- **Spring Boot 3.5.3**
- **MySQL 8.0**
- **Spring Data JPA**
- **Lombok**
- **Gradle**

## Features

- ✅ Full CRUD operations for tasks
- ✅ Optimistic locking for conflict detection
- ✅ Search and filtering
- ✅ Statistics and analytics
- ✅ Bulk operations
- ✅ CORS support for Angular frontend

## Prerequisites

- Java 21+
- MySQL 8.0+ (or Docker)
- Gradle 8.10+

## Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Start MySQL
docker-compose up -d

# Run the application
./gradlew bootRun
```

### Option 2: Using Local MySQL

1. **Start MySQL**:
   ```bash
   # macOS
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

2. **Set environment variables** (optional):
   ```bash
   export DB_USERNAME=root
   export DB_PASSWORD=your_password
   ```

3. **Run the application**:
   ```bash
   ./gradlew bootRun
   ```

The application will:
- Create the `projectboard` database automatically
- Create all tables
- Load sample data

## Configuration

### Environment Profiles

- **Default**: Development settings with debug logging
- Configuration is managed via `application.yml` (no profiles needed)

### Environment Variables

- `DB_USERNAME` - MySQL username (default: `root`)
- `DB_PASSWORD` - MySQL password (default: `password`)
- `DB_URL` - MySQL connection URL (production only)

### Application Properties

See `application.yml` for configuration:
- Database connection settings
- JPA/Hibernate configuration
- Logging levels
- CORS origins

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/page` - Get paginated tasks
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `GET /api/tasks/search` - Search tasks
- `GET /api/tasks/statistics` - Get statistics
- `PATCH /api/tasks/bulk-status` - Bulk update status

## Development

### Build
```bash
./gradlew build
```

### Run Tests
```bash
./gradlew test
```

### Run Application
```bash
./gradlew bootRun
```

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/projectboard/
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   ├── entity/         # JPA entities
│   │   │   ├── exception/      # Custom exceptions
│   │   │   ├── repository/     # Data repositories
│   │   │   └── service/        # Business logic
│   │   └── resources/
│   │       ├── application.yml # Main configuration
│   │       ├── application.yml      # Main configuration
│   │       └── data.sql         # Sample data
│   └── test/                    # Tests
├── docker-compose.yml           # MySQL container
└── build.gradle                 # Build configuration
```

## License

MIT




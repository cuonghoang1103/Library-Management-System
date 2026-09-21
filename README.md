# Library Management System

A full-stack library management system built with **Spring Boot 3.4 on Java 21** (backend) and **React + Vite + TailwindCSS** (frontend).

## Features

### Core Features
- **Book Management** - Add, update, delete, and search books with full-text search
- **Copy Management** - Track individual copies with status (On Shelf, Loaned, Returned, Lost)
- **Loan System** - Borrow, return, and renew books with configurable limits
- **User Management** - Two roles: MEMBER (borrowers) and LIBRARIAN (administrators)
- **Overdue Tracking** - Real-time overdue calculation (no background job needed)

### Security
- JWT-based authentication
- Role-based access control (RBAC)
- Stateless sessions

### Database
- PostgreSQL with Flyway migrations
- **Partial unique index** on `loans(copy_id)` WHERE `status IN ('ACTIVE', 'OVERDUE')` to prevent double-lending

## Quick Start

### Prerequisites
- Docker & Docker Compose

### Run with Docker

```bash
# Start all services (PostgreSQL, Backend API, Frontend)
docker-compose up --build

# Or run in background
docker-compose up -d
```

Access the application:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080

### Demo Accounts

| Username   | Password     | Role      |
|------------|--------------|-----------|
| librarian  | member123    | LIBRARIAN |
| john_doe   | member123    | MEMBER    |
| jane_smith | member123    | MEMBER    |

## Development

### Backend (Spring Boot)

```bash
cd backend

# Run with Maven
./mvnw spring-boot:run

# Or build JAR
./mvnw clean package -DskipTests
java -jar target/library-management-1.0.0.jar
```

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Books (Librarian: CRUD, Member: GET)
- `GET /api/books` - List books (paginated)
- `GET /api/books/search?q=query` - Full-text search
- `POST /api/books` - Create book (Librarian)
- `PUT /api/books/{id}` - Update book (Librarian)
- `DELETE /api/books/{id}` - Delete book (Librarian)
- `POST /api/books/{id}/copies` - Add copy (Librarian)

### Loans (All authenticated users)
- `GET /api/loans/my-loans` - Get my active loans
- `POST /api/loans/{id}/return` - Return a book
- `POST /api/loans/{id}/renew` - Renew a loan

### Loans (Librarian only)
- `GET /api/loans` - List all loans
- `POST /api/loans` - Create loan
- `GET /api/loans/overdue` - Get overdue loans

### Users (Librarian only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/{id}/toggle-status` - Toggle active status

## Project Structure

```
library-management/
├── docker-compose.yml          # Docker orchestration
├── backend/
│   ├── src/main/java/com/library/
│   │   ├── config/             # Security & app config
│   │   ├── controller/         # REST controllers
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── entity/             # JPA entities
│   │   ├── exception/          # Exception handling
│   │   ├── repository/         # JPA repositories
│   │   ├── security/           # JWT & auth
│   │   └── service/            # Business logic
│   ├── src/main/resources/
│   │   ├── application.yml     # App configuration
│   │   └── db/migration/       # Flyway SQL migrations
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/         # React components
    │   ├── context/            # Auth context
    │   ├── pages/              # Page components
    │   ├── services/           # API services
    │   └── App.jsx             # Router setup
    ├── Dockerfile
    └── nginx.conf              # Reverse proxy config
```

## Database Schema

See `backend/src/main/resources/db/migration/V1__Initial_Schema.sql`

## License

MIT

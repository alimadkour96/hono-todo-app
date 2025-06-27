# Task Management System (ToDo App)

A modern, secure task management API built with Hono.js, Drizzle ORM, and PostgreSQL.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Task Management**: Full CRUD operations for tasks
- **Authorization**: Users can only access their own tasks
- **Pagination & Filtering**: Advanced task listing with sorting and filtering
- **Input Validation**: Comprehensive validation using Zod
- **TypeScript**: Fully typed codebase for better development experience

## 🛠 Tech Stack

- **Backend**: Hono.js (Edge-ready framework)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Authentication**: JWT (JSON Web Token)
- **Validation**: Zod

## 📋 API Endpoints

### Authentication

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Tasks (Requires Authentication)

#### Create Task
```http
POST /tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "dueDate": "2024-01-15T10:00:00Z",
  "status": "pending"
}
```

#### Get All Tasks (with pagination & filtering)
```http
GET /tasks?page=1&limit=10&status=pending&sortBy=dueDate&sortOrder=asc
Authorization: Bearer <jwt_token>
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `status` (optional): Filter by status (pending, in-progress, completed)
- `sortBy` (optional): Sort by field (dueDate, createdAt, title)
- `sortOrder` (optional): Sort order (asc, desc)

#### Get Task by ID
```http
GET /tasks/:id
Authorization: Bearer <jwt_token>
```

#### Update Task
```http
PUT /tasks/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated task title",
  "status": "in-progress",
  "dueDate": "2024-01-20T10:00:00Z"
}
```

#### Delete Task
```http
DELETE /tasks/:id
Authorization: Bearer <jwt_token>
```

## 🗄 Database Schema

### Users Table
- `id`: UUID (Primary Key)
- `email`: Text (Unique)
- `password`: Text (Hashed)
- `createdAt`: Timestamp

### Tasks Table
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key to users.id)
- `title`: Text (Required)
- `description`: Text (Optional)
- `dueDate`: Timestamp (Optional)
- `status`: Enum (pending, in-progress, completed)
- `createdAt`: Timestamp

## 🚀 Setup & Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hono-todo-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/todo_app
JWT_SECRET=your-super-secret-jwt-key
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=todo_app
```

4. **Set up the database**
```bash
# Generate migrations
npm run generate

# Push migrations to database
npm run push
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev`: Start development server
- `npm run generate`: Generate database migrations
- `npm run push`: Push migrations to database

## 🛡 Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Authorization**: Users can only access their own resources
- **Input Validation**: Comprehensive validation using Zod
- **CORS**: Configured for cross-origin requests
- **Error Handling**: Proper error responses without exposing sensitive information

## 📝 Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ] // Validation errors (if applicable)
}
```

## 🔮 Future Enhancements

- [ ] Task reminders via email
- [ ] Calendar integration
- [ ] Task statistics dashboard
- [ ] Multi-user collaboration
- [ ] File attachments for tasks
- [ ] Task categories/tags
- [ ] Search functionality
- [ ] Bulk operations

## 📄 License

This project is licensed under the ISC License. 
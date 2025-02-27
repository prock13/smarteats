# SmartEats Application Architecture Documentation

## Overview

SmartEats is an intelligent AI-powered meal planning platform that provides personalized nutritional guidance through dynamic recipe recommendations and adaptive user experiences. This documentation explains the architecture of the application, focusing on how the frontend and backend components interact.

## Tech Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack Query (React Query) for server state, React Context for local state
- **Routing**: wouter
- **Form Handling**: react-hook-form with zod validation
- **UI Components**: Material UI (MUI) and custom shadcn components
- **Styling**: Tailwind CSS

### Backend
- **Framework**: Express.js with TypeScript
- **Authentication**: Passport.js with local strategy
- **Session Management**: express-session with PostgreSQL session store
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with zod schema validation
- **AI Integration**: OpenAI API for recipe generation

### Shared
- **Type Definitions**: Shared TypeScript types between frontend and backend
- **Schema Validation**: Zod

## Architecture Layers

### 1. Database Layer

The PostgreSQL database stores user data, recipes, meal plans, and other application data. The database schema is defined in `shared/schema.ts` using Drizzle ORM.

Key tables include:
- `users`: User profiles and authentication data
- `meals`: Basic meal information
- `recipes`: Detailed recipe information with nutritional data
- `favorites`: User-saved favorite recipes
- `meal_suggestions`: AI-generated meal suggestions based on user preferences
- `meal_plans`: User meal plans with scheduled dates and times

### 2. Data Access Layer

The `DatabaseStorage` class in `server/storage.ts` implements the `IStorage` interface, providing a clean abstraction for database operations:

- **User Operations**: Authentication and profile management
- **Recipe Operations**: CRUD operations for recipes
- **Meal Plan Operations**: Create and retrieve meal plans
- **Favorites Operations**: Manage user favorite recipes
- **Meal Suggestion Operations**: Store and retrieve AI-generated meal suggestions

This layer ensures all database interactions are performed through a consistent interface.

### 3. API Layer

The Express application in `server/index.ts` and the routes defined in `server/routes.ts` expose RESTful API endpoints that the frontend can consume:

#### Authentication Endpoints
- `POST /api/login`: User login
- `POST /api/register`: User registration
- `POST /api/logout`: User logout
- `GET /api/user`: Get current user information

#### Recipe Endpoints
- `GET /api/recipes`: List all recipes
- `GET /api/recipes/:id`: Get recipe details
- `POST /api/recipes`: Create a new recipe
- `PATCH /api/recipes/:id`: Update an existing recipe
- `DELETE /api/recipes/:id`: Delete a recipe

#### Meal Plan Endpoints
- `GET /api/meal-plans`: Get meal plans for a date range
- `POST /api/meal-plans`: Create a new meal plan
- `DELETE /api/meal-plans/:id`: Delete a meal plan

#### Favorites Endpoints
- `GET /api/favorites`: Get user's favorite recipes
- `POST /api/favorites`: Add a recipe to favorites
- `DELETE /api/favorites/:id`: Remove a recipe from favorites
- `PATCH /api/favorites/:id`: Update favorite recipe tags

#### User Profile Endpoints
- `GET /api/user/profile`: Get user profile data
- `PATCH /api/user/profile`: Update user profile
- `PATCH /api/user/password`: Update user password
- `POST /api/user/profile-picture`: Update profile picture

#### AI-Powered Endpoints
- `POST /api/meal-suggestions`: Generate meal suggestions based on macronutrient targets
- `POST /api/pantry-suggestions`: Generate recipe suggestions based on available ingredients
- `POST /api/chat`: Chat with AI for recipe advice
- `POST /api/analyze-food`: Analyze food from camera input

### 4. Service Layer

Several services handle business logic:

- **Authentication Service**: `server/auth.ts` handles user authentication using Passport.js
- **OpenAI Service**: `server/openai.ts` integrates with OpenAI for generating recipes and meal suggestions
- **File Upload Service**: Handles profile picture and food image uploads

### 5. Frontend Components Layer

The React frontend is organized into:

- **Pages**: Main application views (`client/src/pages/`)
- **Components**: Reusable UI components (`client/src/components/`)
- **Hooks**: Custom React hooks for state management and functionality (`client/src/hooks/`)
- **Lib**: Utility functions and shared code (`client/src/lib/`)

### 6. Frontend State Management Layer

- **Server State**: TanStack Query manages API data fetching, caching, and synchronization
- **Authentication State**: React Context provides global access to user authentication state
- **Theme State**: React Context manages application theming
- **Form State**: react-hook-form handles form state and validation

## Data Flow

### 1. Frontend to Backend Communication

The frontend communicates with the backend through the `apiRequest` function in `client/src/lib/queryClient.ts`, which:
- Constructs API URLs
- Sets appropriate headers
- Handles authentication through cookies
- Manages response errors

TanStack Query orchestrates data fetching with:
- Automatic caching
- Background refetching
- Loading and error states
- Optimistic updates

### 2. Authentication Flow

1. User submits credentials via login form
2. Frontend sends credentials to `/api/login` endpoint
3. Backend verifies credentials using Passport.js
4. On success, a session is created and stored in PostgreSQL
5. Session cookie is sent to client
6. TanStack Query updates global auth state via React Context
7. Protected routes become accessible

### 3. Data Fetching Flow

For example, when loading recipes:

1. Component calls `useQuery` with key `['/api/recipes']`
2. TanStack Query checks cache for existing data
3. If cache miss or stale, it fetches from API
4. Loading state is provided to component
5. Data is returned and cached
6. Component renders data

### 4. Data Mutation Flow

For example, when creating a recipe:

1. Component calls `useMutation` with mutation function
2. User submits form data
3. Frontend validates data with Zod schema
4. Data is sent to API endpoint
5. Backend validates data again
6. Data is stored in database
7. Response is returned to frontend
8. TanStack Query invalidates relevant queries
9. UI updates with new data

### 5. AI Integration Flow

For meal suggestions:

1. User submits nutritional targets and preferences
2. Frontend sends request to backend
3. Backend checks for cached suggestions
4. If none, it calls OpenAI API via the `generateMealSuggestions` function
5. AI generates personalized meal suggestions
6. Suggestions are cached and returned to frontend
7. Frontend displays suggestions

## Security Measures

1. **Authentication**: Passport.js with secure password hashing
2. **Sessions**: HTTP-only cookies with secure flags in production
3. **CSRF Protection**: SameSite cookie policy
4. **Input Validation**: Zod schema validation on both client and server
5. **File Upload Security**: Size limits and type validation
6. **Error Handling**: Sanitized error messages for client

## Development Workflow

1. Define schema in `shared/schema.ts`
2. Update `IStorage` interface in `server/storage.ts` 
3. Implement storage methods in `DatabaseStorage` class
4. Add API endpoints in `server/routes.ts`
5. Create frontend components and pages
6. Set up queries and mutations with TanStack Query
7. Test and refine the UI/UX

## Deployment

The application is configured to run in both development and production environments:

- **Development**: Vite middleware for hot module replacement
- **Production**: Static file serving with caching and compression

## Conclusion

SmartEats follows a modern, layered architecture that separates concerns while maintaining type safety through shared schemas. The application leverages React and Express with TypeScript to create a robust, maintainable codebase with clear communication patterns between frontend and backend.

The AI integration adds a unique capability, allowing the application to provide personalized meal recommendations based on user preferences and nutritional targets. This is seamlessly integrated into the user experience through the consistent API layer.
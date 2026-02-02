# ParPass API Test Suite

This document describes the comprehensive unit test suite for the ParPass API.

## Test Framework

- **Jest**: JavaScript testing framework
- **Supertest**: HTTP assertion library for testing Express applications
- **Database Mocking**: Using Jest's mocking capabilities to mock the database layer

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The test suite covers all major API endpoints with the following test cases:

### 1. GET /api/courses (4 tests)
- ✅ Returns all active courses without tier filter
- ✅ Returns only core tier courses when `tier=core` filter is applied
- ✅ Returns only premium tier courses when `tier=premium` filter is applied
- ✅ Handles database errors gracefully

### 2. GET /api/members/code/:code (3 tests)
- ✅ Returns member details for a valid ParPass code
- ✅ Returns 404 for an invalid code
- ✅ Handles database errors

### 3. POST /api/check-in - Successful Scenarios (3 tests)
- ✅ Successfully checks in an active member within monthly limit to an accessible course
- ✅ Successfully checks in a premium member to a premium course
- ✅ Successfully checks in a core member to a core course

### 4. POST /api/check-in - Failure Scenarios (7 tests)
- ✅ Prevents check-in for inactive members
- ✅ Prevents check-in for suspended members
- ✅ Prevents check-in when monthly limit is reached
- ✅ Prevents check-in when monthly limit is exceeded
- ✅ Prevents core members from accessing premium courses
- ✅ Returns 404 for non-existent member
- ✅ Returns 404 for non-existent course

### 5. Favorites Endpoints (9 tests)

#### GET /api/members/:id/favorites (3 tests)
- ✅ Retrieves all favorites for a member
- ✅ Returns empty array when member has no favorites
- ✅ Handles database errors

#### POST /api/members/:id/favorites (3 tests)
- ✅ Successfully adds a new favorite course
- ✅ Handles duplicate favorites gracefully
- ✅ Handles database errors

#### DELETE /api/members/:id/favorites/:courseId (3 tests)
- ✅ Successfully removes a favorite course
- ✅ Returns success even if favorite does not exist
- ✅ Handles database errors

## Test Structure

All tests follow a consistent structure:
1. **Arrange**: Set up mock data and database responses
2. **Act**: Make HTTP request to the endpoint
3. **Assert**: Verify the response status, body, and database interactions

## Key Testing Patterns

### Database Mocking
The database module (`db.js`) is mocked using Jest's `jest.mock()` function. This allows us to control database responses without requiring an actual database connection.

```javascript
jest.mock('./db');

// Mock a successful query
db.query.mockResolvedValue({ rows: [mockData] });

// Mock a database error
db.query.mockRejectedValue(new Error('Database error'));
```

### Sequential Mock Responses
For endpoints that make multiple database queries (like check-in), we chain mock responses:

```javascript
db.query
  .mockResolvedValueOnce({ rows: [mockMember] })   // First query
  .mockResolvedValueOnce({ rows: [{ count: '3' }] }) // Second query
  .mockResolvedValueOnce({ rows: [mockCourse] })    // Third query
  .mockResolvedValueOnce({ rows: [mockCheckIn] });  // Fourth query
```

### HTTP Assertions
Using Supertest for clean, readable HTTP assertions:

```javascript
const response = await request(app)
  .post('/api/check-in')
  .send({ member_id: '123', course_id: '456' });

expect(response.status).toBe(201);
expect(response.body).toHaveProperty('check_in');
```

## Coverage Report

Current test coverage (as of latest run):
- **Statements**: ~80%
- **Branches**: ~84%
- **Functions**: ~55%
- **Lines**: ~80%

Uncovered areas primarily include:
- Server startup code (`index.js:227-228`)
- Health check endpoint (`index.js:15`)
- Some less common error paths

## Adding New Tests

When adding new endpoints or features:

1. Create a new `describe` block for the endpoint
2. Add tests for successful scenarios
3. Add tests for all possible error conditions
4. Add tests for edge cases
5. Verify database interactions using `expect(db.query).toHaveBeenCalledWith(...)`

## Best Practices

- **Isolation**: Each test is isolated with `afterEach(() => jest.clearAllMocks())`
- **Completeness**: Test both success and failure paths
- **Realistic Data**: Use realistic mock data that matches the database schema
- **Descriptive Names**: Test names clearly describe what is being tested
- **Error Handling**: Always test error scenarios to ensure proper error responses

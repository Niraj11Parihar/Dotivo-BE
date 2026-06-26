# Dotivo API: Feature & Integration Guide

This guide describes the available backend features, endpoints, and data structures to assist the frontend team in building the UI and integrating the API.

---

## 🔐 Base Configuration

- **Base URL**: `http://localhost:3000` (or as configured in `.env`)
- **Interactive Documentation**: `http://localhost:3000/api/docs` (Swagger)
- **Authentication**: JWT Bearer Token. Include `Authorization: Bearer <token>` in the header for all protected routes.

---

## 1. Authentication & Identity

### **Register Account**
- **URL**: `POST /auth/register`
- **Description**: Creates a new user account.
- **Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **FE Integration**: Redirect to Onboarding or Dashboard upon success. Store the `access_token` in SecureStore/LocalStorage.

### **Login**
- **URL**: `POST /auth/login`
- **Description**: Authenticates existing users.
- **Payload**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response**: Returns `access_token` and `user` object.

### **Get Current Profile**
- **URL**: `GET /users/me`
- **Auth Required**: Yes
- **Description**: Retrieves the authenticated user's profile details (plan type, timezone, onboarding status).

---

## 2. Goal Management (Templates)

Goal templates define the persistent habits or targets.

### **Create Goal Template**
- **URL**: `POST /goals`
- **Auth Required**: Yes
- **Description**: Defines a new goal (e.g., "Drink Water", "Code 2 Hours").
- **Payload Snippet**:
  ```json
  {
    "title": "Drink Water",
    "category": "Health",
    "targetCount": 8,
    "isDailyMinimum": true,
    "color": "#4A90E2",
    "icon": "water-drop"
  }
  ```

### **List All Active Goals**
- **URL**: `GET /goals`
- **Auth Required**: Yes
- **Description**: Fetches all goals that are not archived. Use this for the "Manage Goals" screen.

### **Update/Archive Goal**
- **URLs**: `PATCH /goals/:id` (Update), `DELETE /goals/:id` (Archive)
- **Description**: Standard CRUD operations for goal maintenance.

---

## 3. Daily Planning & Tracking (The "Feed")

The backend automatically generates a daily plan snapshot for any date requested.

### **Get Daily Plan**
- **URL**: `GET /daily-plan?date=YYYY-MM-DD`
- **Description**: Fetches the status of all goals for a specific date. If no plan exists for that date, one is generated automatically based on active templates.
- **UI Interaction**: This is the primary endpoint for the **Home Dashboard**. Render a card for each goal in `goals[]`.

### **Log a Completion**
- **URL**: `POST /completions`
- **Description**: Increments the progress for a specific goal on a specific day.
- **Payload**:
  ```json
  {
    "goalTemplateId": "65f123...",
    "date": "2024-04-08",
    "completedCount": 1,
    "source": "app",
    "note": "Optional comment"
  }
  ```
- **UI Interaction**: Trigger this when the user taps a "Plus" button or a checkbox. It returns the updated `DailyPlan` object to update the UI instantly.

---

## 4. Analytics & Progress

### **History Overview**
- **URL**: `GET /history?range=30`
- **Description**: Fetches a summary of daily performance over the last X days.
- **Data Points**: Returns `status` (green, partial, grey) and `completionScore` (0-100).
- **FE Integration**: Perfect for rendering "Contribution-style" dots or progress charts on the Profile/Stats tab.

---

## 🎨 UI/UX Integration Tips

1. **Validation Handling**: The backend uses Joi. If a request is invalid, you will receive a `400 BadRequest` with a message detail. Show these as toast notifications to the user.
2. **Local Optimistic Updates**: When logging a completion, you can increment the count locally in your React Native state before the API responds for a snappy feel.
3. **Empty States**: If `GET /goals` returns an empty array, show a "Create your first goal" CTA.
4. **Color coding**: Use the `color` property from the goal object to style your progress bars and icons dynamically.

---

**Dotivo Backend API v1.0** — Built with Premium Architecture.

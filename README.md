# Login Link with Email

This project is a simple backend service for generating login links. It is built with FastAPI and Python.

## Features

*   Generates a fake JWT token for valid email domains.
*   CORS enabled for local development with a React frontend.

## Technologies Used

*   [FastAPI](https://fastapi.tiangolo.com/)
*   [Python](https://www.python.org/)

## Getting Started

### Prerequisites

*   Python 3.12 or later
*   pip

### Installation

1.  Clone the repository:
    ```bash
    git clone https://your-repository-url.com/
    ```
2.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
3.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Running the application

1.  Navigate to the `backend` directory.
2.  Run the following command to start the server:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

## API Endpoints

### `POST /auth/login`

This endpoint is used to request a login link.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

*   **200 OK:** If the email is valid, the server will respond with a fake JWT token.
    ```json
    {
      "status": "ok",
      "email": "user@example.com",
      "token": "fake-jwt"
    }
    ```
*   **401 Unauthorized:** If the email is not from an allowed domain, the server will respond with an error message.
    ```json
    {
      "detail": "Invalid credentials"
    }
    ```

## Project Structure

*   `backend/main.py`: This is the main application file. It contains the FastAPI application and the login logic.

## How it works

The `login` function in `main.py` is responsible for handling login requests. It checks if the email address in the request payload ends with one of the allowed domains (`@example.com`, `@ssfglobal.org`, or `srisiddhanta.org`).

If the email is valid, the server returns a JSON response with a status of "ok", the user's email, and a fake JWT token.

If the email is not valid, the server returns a 401 Unauthorized error with the detail message "Invalid credentials".

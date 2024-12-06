# Voting App

## Overview

The Voting App is a real-time web application that enables users to create topics for voting and express their opinions by voting. Built using React for the frontend and Node.js with Redis for the backend, the app provides an intuitive interface for users to engage in discussions and vote on various topics.

## Features

- **Create Voting Topics**: Users can create new topics with descriptions.
- **Vote on Topics**: Users can express their agreement or disagreement with a topic.
- **View Results**: Users can see how many votes each topic has received.

## Screenshots

1. **Create Topic Page**
   ![Screenshot 2024-10-22 132302](https://github.com/user-attachments/assets/5aeecd85-b30b-4cff-b810-a5605aab19ec)
   ![Screenshot 2024-10-22 132333](https://github.com/user-attachments/assets/84c09e88-9f2d-4e8d-81f0-e87f4f42941c)

3. **Vote Page**
   ![Screenshot 2024-10-22 132410](https://github.com/user-attachments/assets/2d42b96d-471a-4e2e-8af4-d297eea35060)

5. **Results Page**
   ![Screenshot 2024-10-22 132422](https://github.com/user-attachments/assets/fee410a4-a7f5-426e-95ff-8e70be80138f)

## Technologies Used

### Frontend

- React
- React Router
- Axios
- Framer Motion
- Tailwind CSS

### Backend

- Node.js
- Express.js
- Redis
- OpenTelemetry (for tracing, metrics, and logs)

## Installation

### Prerequisites

- Node.js (latest version recommended)
- Redis server
- Docker (optional, for running Redis via Docker)

### Installing Redis

#### For Windows

1. **Download Redis**:
    - Go to the Redis for Windows GitHub page.
    - Download the latest `.msi` installer.

2. **Install Redis**:
    - Run the installer and follow the setup instructions.

3. **Start Redis**:
    - Open the command prompt and navigate to the Redis installation directory.
    - Run the command:
      ```bash
      redis-server
      ```

#### For Ubuntu

1. **Update package index**:
    ```bash
    sudo apt update
    ```

2. **Install Redis**:
    ```bash
    sudo apt install redis-server
    ```

3. **Start Redis server**:
    ```bash
    sudo service redis-server start
    ```

4. **Test Redis**:
    ```bash
    redis-cli ping
    ```
    You should receive a response of `PONG`.

#### For macOS

1. **Install Homebrew (if not already installed)**:
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```

2. **Install Redis**:
    ```bash
    brew install redis
    ```

3. **Start Redis**:
    ```bash
    brew services start redis
    ```

4. **Test Redis**:
    ```bash
    redis-cli ping
    ```
    You should receive a response of `PONG`.

### Backend Setup

1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/voting-app.git
    cd voting-app/backend
    ```

2. **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3. **Start the backend server**:
    ```bash
    node server.js
    ```

### Frontend Setup

1. **Navigate to the frontend directory**:
    ```bash
    cd ../frontend
    ```

2. **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3. **Start the frontend server**:
    ```bash
    npm start
    ```

## API Endpoints

- **POST /api/topics**: Creates a new topic.
- **GET /api/topics/:topic/vote**: Retrieves topic details for voting.
- **POST /api/topics/:topic/vote**: Submits a vote.
- **GET /api/topics/:topic/results**: Retrieves voting results.

## Database Structure

- **Topics**: Stored in Redis as hash fields. Each topic includes a description.
- **Votes**: Stored as JSON strings in Redis, tracking user votes for each topic.

## Node Dependencies

### Frontend

- **react**: For building the user interface.
- **react-router-dom**: For routing between pages.
- **axios**: For making HTTP requests.
- **framer-motion**: For animations.
- **tailwindcss**: For styling.

### Backend

- **express**: For server setup.
- **body-parser**: For parsing request bodies.
- **cors**: For enabling CORS.
- **redis**: For connecting to the Redis database.
- **@opentelemetry/api**: For OpenTelemetry API integration.
- **@opentelemetry/sdk-node**: For configuring OpenTelemetry SDK.
- **@opentelemetry/exporter-trace-otlp-http**: For exporting trace data to an OTLP collector.
- **@opentelemetry/exporter-metrics-otlp-http**: For exporting metrics data to an OTLP collector.
- **@opentelemetry/auto-instrumentations-node**: For automatically instrumenting Node.js applications.

## Contributing

Contributions are welcome! If you'd like to report a bug or suggest a feature, please open an issue on the GitHub repository.

## License

This project is licensed under the MIT License.

## Acknowledgments

Special thanks to the communities and libraries that made this project possible.
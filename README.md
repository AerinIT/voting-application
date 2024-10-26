# Voting App
## Overview
  The Voting App is a real-time web application that allows users to create topics for voting and express their opinions. Built using React for the frontend and Node.js with Redis for the backend, the app provides an intuitive interface for users to engage in discussions and vote on various topics.

## Features
  Create Voting Topics: Users can create a new topic with a description.
  Vote on Topics: Users can express their agreement or disagreement with a topic.
  View Results: Users can see how many votes each topic received.
  
## Screenshots
  1. **Create Topic Page**:

  2. **Vote Page**:

  3. **Results Page**:

## Technologies Used
   1. **Frontend**:

      React
      React Router
      Axios
      Framer Motion
      Tailwind CSS
      
  2. **Backend**:

      Node.js
      Express.js
      Redis
     
  **Installation**  
     ### Prerequisites
          Node.js (latest version recommended)
          Redis server
          
  **Installing Redis**:
      ### For Windows
      1. Download Redis:
    
Go to the Redis for Windows GitHub page.
Download the latest .msi installer.
         
  2. Install Redis:
      
      Run the installer and follow the setup instructions.
         
  3. Start Redis:
    
     Open the command prompt and navigate to the Redis installation directory.
     Run the command:
     ```bash
            redis-server
            
### For Ubuntu
1. Update package index:
     ```bash
            sudo apt update
2. Install Redis:
     ```bash
                sudo apt install redis-server
     
3. Start Redis server:
      ```bash
      sudo service redis-server start
         
4. Test Redis: You can test if Redis is working by running:
      ```bash
      redis-cli ping
         
You should receive a response of PONG.

 ### For macOS
1. Install Homebrew (if not already installed): Open a terminal and run:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
       
2. Install Redis:
   ```bash
   brew install redis
     
3. Start Redis:
   ```bash
   brew services start redis
     
4. Test Redis: Run:
   ```bash
   redis-cli ping
     
You should receive a response of PONG.

  **Backend Setup**
  
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/voting-app.git
   cd voting-app/backend

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install

3. Start the backend server:
   ```bash
        node server.js
        Frontend Setup

4.  Navigate to the frontend directory:
    ```bash
        cd ../frontend

5. Install dependencies:
    ```bash
        npm install
        # or
        yarn install

6. Start the frontend server:
   ```bash
        npm start


**API Endpoints**:

  POST /api/topics: Creates a new topic.
  
  GET /api/topics/vote: Retrieves topic details for voting.
  
  POST /api/topics/vote: Submits a vote.
  
  GET /api/topics/results: Retrieves voting results.

**Database Structure**:
  Topics: Stored in Redis as hash fields. Each topic includes a description.
  Votes: Stored as JSON strings in Redis, tracking user votes for each topic.

 **Node Dependencies**:
    1. Frontend
        react: For building the user interface.
        react-router-dom: For routing between pages.
        axios: For making HTTP requests.
        framer-motion: For animations.
        tailwindcss: For styling.
        
2. Backend
        express: For server setup.
        body-parser: For parsing request bodies.
        cors: For enabling CORS.
        redis: For connecting to the Redis database.
        
  **Contributing**:
      Contributions are welcome! If you'd like to report a bug or suggest a feature, please open an issue on the GitHub repository.

  **License**:
      This project is licensed under the MIT License.

  **Acknowledgments**:
      Special thanks to the communities and libraries that made this project possible.

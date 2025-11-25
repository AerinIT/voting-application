@echo off
echo Testing different access methods...
echo.

echo 1. Rebuilding containers...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo.
echo 2. Waiting for services to start...
timeout /t 15 /nobreak > nul

echo.
echo 3. Testing access methods:
echo.

echo Testing nginx proxy (port 80):
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost || echo "Port 80 not accessible"

echo.
echo Testing direct client (port 3001):
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:3001 || echo "Port 3001 not accessible"

echo.
echo Testing direct server (port 5000):
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5000/api/health || echo "Port 5000 not accessible"

echo.
echo 4. Container status:
docker-compose ps

echo.
echo 5. To check logs if there are issues:
echo docker-compose logs -f voting-app-client
echo docker-compose logs -f voting-app-server
echo docker-compose logs -f nginx

echo.
echo 6. Access URLs:
echo - Main app: http://your-ip
echo - Direct client: http://your-ip:3001
echo - Health check: http://your-ip/health or http://your-ip:3001/health

pause
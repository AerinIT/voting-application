// src/components/HealthCheck.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const HealthCheck = () => {
    const [status, setStatus] = useState({
        client: 'checking...',
        server: 'checking...',
        currentUrl: window.location.href,
        apiUrl: API_URL,
        port: window.location.port,
        hostname: window.location.hostname,
        protocol: window.location.protocol
    });

    useEffect(() => {
        // Check client status
        setStatus(prev => ({ ...prev, client: 'running' }));

        // Check server status
        const checkServer = async () => {
            try {
                console.log('Checking server health at:', `${API_URL}/health`);
                const response = await axios.get(`${API_URL}/health`);
                setStatus(prev => ({ 
                    ...prev, 
                    server: `running (${response.data.status})`,
                    serverResponse: response.data
                }));
            } catch (error) {
                console.error('Server health check failed:', error);
                setStatus(prev => ({ 
                    ...prev, 
                    server: `error: ${error.message}`,
                    serverError: error.response?.data || error.message
                }));
            }
        };

        checkServer();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Health Check & Debug Info</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="mb-4">
                    <strong>Client Status:</strong> <span className="text-green-600">{status.client}</span>
                </div>
                <div className="mb-4">
                    <strong>Server Status:</strong> 
                    <span className={status.server.includes('error') ? 'text-red-600' : 'text-green-600'}>
                        {status.server}
                    </span>
                </div>
                <div className="mb-4">
                    <strong>Current URL:</strong> {status.currentUrl}
                </div>
                <div className="mb-4">
                    <strong>API URL:</strong> {status.apiUrl}
                </div>
                <div className="mb-4">
                    <strong>Host:</strong> {status.hostname}
                </div>
                <div className="mb-4">
                    <strong>Port:</strong> {status.port || '80 (default)'}
                </div>
                <div className="mb-4">
                    <strong>Protocol:</strong> {status.protocol}
                </div>
                
                {status.serverResponse && (
                    <div className="mb-4">
                        <strong>Server Response:</strong>
                        <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                            {JSON.stringify(status.serverResponse, null, 2)}
                        </pre>
                    </div>
                )}
                
                {status.serverError && (
                    <div className="mb-4">
                        <strong>Server Error:</strong>
                        <pre className="bg-red-100 p-2 rounded mt-2 text-sm text-red-800">
                            {JSON.stringify(status.serverError, null, 2)}
                        </pre>
                    </div>
                )}
                
                <div className="mt-6 p-4 bg-blue-50 rounded">
                    <h3 className="font-bold mb-2">Access Methods:</h3>
                    <ul className="text-sm">
                        <li>• <strong>Via Nginx (Port 80):</strong> http://{status.hostname} - Uses relative API paths</li>
                        <li>• <strong>Direct Client (Port 3001):</strong> http://{status.hostname}:3001 - Uses direct server connection</li>
                        <li>• <strong>Direct Server (Port 5000):</strong> http://{status.hostname}:5000/api - API endpoints only</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HealthCheck;
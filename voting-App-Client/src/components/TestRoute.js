// src/components/TestRoute.js
import React from 'react';
import { useParams } from 'react-router-dom';

const TestRoute = () => {
    const { topic } = useParams();
    
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test Route</h1>
            <p>Topic ID from URL: {topic}</p>
            <p>Current URL: {window.location.href}</p>
            <p>Current pathname: {window.location.pathname}</p>
        </div>
    );
};

export default TestRoute;
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import CreateTopic from './components/CreateTopic';
import Vote from './components/Vote';
import Results from './components/Results';
import {API_URL} from './config';

console.log('Config:', API_URL);




const App = () => {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100">
                <Routes>
                    <Route path="/" element={<CreateTopic />} />
                    <Route path="/vote/:topic" element={<Vote />} />
                    <Route path="/results/:topic" element={<Results />} />
                </Routes>
            </div>
        </Router>
    );
};

export default App;

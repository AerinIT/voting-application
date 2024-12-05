// src/components/Vote.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Importing Framer Motion

const Vote = () => {
    const { topic } = useParams();
    const [description, setDescription] = useState('');
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(''); // State for error messages
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopic = async () => {
            const response = await axios.get(`http://localhost:5000/api/topics/${topic}/vote`);
            setDescription(response.data.description);
        };
        fetchTopic();
    }, [topic]);

    const submitVote = async (vote) => {
        // Validate the name field
        if (!name.trim()) {
            setError('Please enter your name.'); // Set error message
            return; // Exit the function if validation fails
        }
        setError(''); // Clear previous error if name is valid

        try {
            await axios.post(`http://localhost:5000/api/topics/${topic}/vote`, { vote, name });
            setMessage('Vote counted!');
            setTimeout(() => {
                navigate(`/results/${topic}`);
            }, 1000);
        } catch (error) {
            setMessage('Error counting vote');
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Vote on Topic</h1>
            <div className="bg-white p-6 rounded-lg shadow-md mb-4">
                <p><strong>Topic:</strong> {topic}</p>
                <p><strong>Description:</strong> {description}</p>
            </div>
            <input
                type="text"
                className={`border rounded-lg p-2 mb-4 w-full ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            {error && <p className="text-red-500 mb-4">{error}</p>} {/* Display error message */}
            <div>
                <button onClick={() => submitVote('agree')} className="bg-green-500 text-white rounded-lg p-2 mr-2">Agree</button>
                <button onClick={() => submitVote('not_agree')} className="bg-red-500 text-white rounded-lg p-2">Not Agree</button>
            </div>
            {message && (
                <motion.p className="mt-4 text-green-600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default Vote;

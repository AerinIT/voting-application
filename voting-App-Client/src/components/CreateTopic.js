// src/components/CreateTopic.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Importing Framer Motion
import { API_URL } from '../config';

const CreateTopic = () => {
    const [topic, setTopic] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState('');
    const [votingUrl, setVotingUrl] = useState('');
    const navigate = useNavigate();

    console.log('Current location:', window.location.href);
    console.log('API URL being used:', API_URL);
    console.log('Environment REACT_APP_URL:', process.env.REACT_APP_URL);


    const createTopic = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/topics`, { topic, description });
            console.log('Server response:', response.data);
            console.log('Generated voting URL:', response.data.votingUrl);
            setVotingUrl(response.data.votingUrl);
            setMessage('Topic created! Copy the voting link below.');
        } catch (error) {
            console.error('Error creating topic:', error);
            setMessage('Error creating topic');
        }
    };

    const copyToClipboard = () => {
        console.log('Attempting to copy URL:', votingUrl);
        console.log('Clipboard API available:', !!navigator.clipboard);
        console.log('Current protocol:', window.location.protocol);
        console.log('Is secure context:', window.isSecureContext);
        
        // Check if clipboard API is available and we're in a secure context
        const hasClipboardAPI = navigator.clipboard && typeof navigator.clipboard.writeText === 'function';
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        
        if (hasClipboardAPI && isSecure) {
            console.log('Using modern clipboard API');
            navigator.clipboard.writeText(votingUrl)
                .then(() => {
                    console.log('Clipboard API copy successful');
                    alert('Link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Clipboard API failed:', err);
                    fallbackCopyTextToClipboard(votingUrl);
                });
        } else {
            console.log('Using fallback copy method - Reason:', !hasClipboardAPI ? 'No clipboard API' : 'Not secure context');
            // Fallback for HTTP contexts or older browsers
            fallbackCopyTextToClipboard(votingUrl);
        }
    };

    const fallbackCopyTextToClipboard = (text) => {
        console.log('Fallback copy method called with text:', text);
        
        // Create a temporary textarea element
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Style the textarea to be invisible and avoid scrolling
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        
        try {
            textArea.focus();
            textArea.select();
            textArea.setSelectionRange(0, 99999); // For mobile devices

            const successful = document.execCommand('copy');
            console.log('execCommand copy result:', successful);
            
            if (successful) {
                alert('Link copied to clipboard!');
            } else {
                console.error('execCommand copy failed');
                // Show the URL in a prompt so user can copy manually
                prompt('Copy this link manually:', text);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            // Show the URL in a prompt so user can copy manually
            prompt('Copy this link manually:', text);
        } finally {
            // Always remove the textarea
            document.body.removeChild(textArea);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Create Voting Topic</h1>
            <form onSubmit={createTopic} className="bg-white p-6 rounded-lg shadow-md">
                <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-2 mb-4 w-full"
                    placeholder="Topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                />
                <textarea
                    className="border border-gray-300 rounded-lg p-2 mb-4 w-full"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <button type="submit" className="bg-blue-500 text-white rounded-lg p-2">Create Topic</button>
            </form>
            {message && (
                <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <p className="text-green-600">{message}</p>
                    {votingUrl && (
                        <div className="mt-2">
                            <p className="text-gray-700 mb-2">Voting Link:</p>
                            <div className="bg-gray-100 p-2 rounded border mb-2">
                                <input
                                    type="text"
                                    value={votingUrl}
                                    readOnly
                                    className="w-full bg-transparent border-none outline-none text-blue-600 cursor-pointer"
                                    onClick={(e) => e.target.select()}
                                />
                            </div>
                            <div className="flex gap-2 mb-2">
                                <button
                                    className="bg-green-500 text-white rounded-lg p-2 hover:bg-green-600"
                                    onClick={copyToClipboard}
                                >
                                    Copy Link
                                </button>
                                <button
                                    className="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600"
                                    onClick={() => window.open(votingUrl, '_blank')}
                                >
                                    Open Link
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                💡 Tip: You can also click on the link above to select it and copy manually (Ctrl+C)
                            </p>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default CreateTopic;

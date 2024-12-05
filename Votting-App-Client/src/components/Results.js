// src/components/Results.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const Results = () => {
    const { topic } = useParams();
    const [results, setResults] = useState({ topic: '', votes: { agree: [], notAgree: [] } });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/topics/${topic}/results`);
                setResults(response.data); // Update state with fetched data
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [topic]);

    const { votes } = results;

    if (loading) {
        return <div className="text-center">Loading...</div>;
    }

    const winner =
        votes.agree.length > votes.notAgree.length
            ? 'Favorable'
            : votes.agree.length === votes.notAgree.length
            ? 'Tie'
            : 'Not Favorable';

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-4 text-center">
                    Results for {results.topic}
                </h1>
                <h2 className="text-lg font-semibold mb-4 text-center">
                    Overall Result:{' '}
                    <span
                        className={`font-bold ${
                            winner === 'Favorable'
                                ? 'text-green-600'
                                : winner === 'Tie'
                                ? 'text-gray-600'
                                : 'text-red-600'
                        }`}
                    >
                        {winner}
                    </span>
                </h2>

                <table className="min-w-full bg-white border border-gray-200 mt-4">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="py-3 px-4 text-left text-gray-600">Favorable Votes</th>
                            <th className="py-3 px-4 text-left text-gray-600">Unfavorable Votes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Math.max(votes.agree.length, votes.notAgree.length) > 0 ? (
                            [...Array(Math.max(votes.agree.length, votes.notAgree.length))].map((_, index) => (
                                <tr key={index} className="hover:bg-gray-100 transition duration-150">
                                    <td className="py-3 px-4 border-b border-gray-200">
                                        {votes.agree[index] ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                {votes.agree[index]}
                                            </motion.div>
                                        ) : (
                                            <span>No Vote</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 border-b border-gray-200">
                                        {votes.notAgree[index] ? (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                {votes.notAgree[index]}
                                            </motion.div>
                                        ) : (
                                            <span>No Vote</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={2} className="py-3 px-4 text-center">
                                    No votes recorded
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-200">
                        <tr>
                            <td className="py-3 px-4 font-bold text-right">Total Favorable Votes:</td>
                            <td className="py-3 px-4 font-bold">{votes.agree.length}</td>
                        </tr>
                        <tr>
                            <td className="py-3 px-4 font-bold text-right">Total Unfavorable Votes:</td>
                            <td className="py-3 px-4 font-bold">{votes.notAgree.length}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default Results;

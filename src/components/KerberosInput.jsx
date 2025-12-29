import React, { useState } from 'react';
import './KerberosInput.css';

export default function KerberosInput({ setKerberos }) {
    const [input, setInput] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            setKerberos(input.trim());
        }
    };

    return (
        <div className="kerberos-input-container">
            <form onSubmit={handleSubmit} className="kerberos-form">
                <h2>Enter your Kerberos ID</h2>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., cs1234567"
                    className="kerberos-input"
                />
                <button type="submit" className="kerberos-submit">Go</button>
            </form>
        </div>
    );
}

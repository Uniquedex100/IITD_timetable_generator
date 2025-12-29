import React from 'react'
import './Footer.css'

export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <div className="footer" style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '0.9rem' }}>
            <p>&copy; {year} IIT Delhi Timetable Generator</p>
            <p>Credits: Prashant Tiwari (mt6240685@iitd.ac.in)</p>
        </div>
    )
}

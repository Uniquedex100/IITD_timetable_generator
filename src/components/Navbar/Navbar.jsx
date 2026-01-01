import React from 'react'
import './Navbar.css'
import { Link } from 'react-router-dom'

export default function Navbar() {
    return (
        <nav>
            <div className="navbar-logo">
                <h1>
                    <Link to="/" style={{ color: '#ff6363ff', textDecoration: 'none' }}>
                        Class<span style={{ color: '#6366f1' }}>Grid</span>
                    </Link>
                </h1>
            </div>
            {/* Removed DevClub branding */}
        </nav>
    )
}

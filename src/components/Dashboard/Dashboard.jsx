import React from 'react'
import './Dashboard.css'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard(props) {

    const setProgress = props.setProgress;
    const kerberos = props.kerberos; // Get kerberos from props
    const navigate = useNavigate();

    const [name, setName] = React.useState();
    const [freeLh, setFreeLh] = React.useState(null);
    const [liveCourse, setLiveCourse] = React.useState(null);
    const [notifs, setNotifs] = React.useState(null);

    const [error, setError] = React.useState(null);

    React.useEffect(() => {
        if (!kerberos) return;

        axios.get(`http://localhost:8000/api/live/`, {
            headers: {
                'X-Kerberos': kerberos,
            }
        })
            .then(res => {
                setName(res.data.name);
                setFreeLh(res.data.free_lh);
                setLiveCourse(res.data.live_course);
                setNotifs(res.data.notifs);
                setProgress(100);
            })
            .catch(err => {
                console.error(err);
                setError("User not found. Please try 'cs1234567' (test user) or seed your own data.");
            })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kerberos])

    const logout = () => {
        window.location.reload(); // Simple reload to clear state for now
    }

    if (error) {
        return (
            <div className="m-dashboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <h2>Error: {error}</h2>
                <button onClick={logout} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>Go Back</button>
            </div>
        )
    }

    return (
        <div className="m-dashboard">
            <div className="live-course">
                <div className="live-course-heading">
                    <div className="live-course-heading-dot"><div className="live-course-heading-dot-inner"></div></div>
                    <h2>Live Now</h2>
                </div>
                <div className="live-course-body">
                    {liveCourse ? (
                        <>
                            <h3>{liveCourse.courseCode}</h3>
                            <p>{liveCourse.courseType}</p>
                            <p className="live-course-body-room">{liveCourse.room}</p>
                        </>
                    ) : (
                        <>
                            <h3>No live courses right now</h3>
                            <p>Check back later</p>
                        </>
                    )}
                </div>
                <div className="live-course-footer">
                    <button onClick={() => navigate('/timetable')}>View Full Semester Timetable</button>
                    <p>Report any discrepancies <Link to="https://forms.gle/zadVEANZhCYS6gkv5" target='_blank'>here</Link></p>
                    <span>You are currently logged in as {name}. <span onClick={logout}>Logout</span></span>
                </div>
            </div>
            <div className="new-container">
                <div className="live-free-lh">
                    <p className="live-free-lh-heading">The following rooms are currently free in the Lecture Hall Complex</p>
                    {freeLh ?
                        <div className="live-free-lh-rooms">
                            {freeLh.map((room, index) => {
                                return (
                                    <div key={index} className="live-free-lh-room">
                                        <p>{room}</p>
                                    </div>
                                )
                            })}
                        </div>
                        : <p className='live-free-lh-unavail'>This service is only available between 8:00 AM and 7:00 PM IST, and on working days!</p>}
                </div>
                <div className="live-free-lh">
                    <p className="live-free-lh-heading">Notifications</p>
                    {notifs ?
                        <ul className="notifs">
                            {notifs.map((room, index) => {
                                return <li key={index} dangerouslySetInnerHTML={{ __html: room }} />
                            })}
                        </ul>
                        : <p className='live-free-lh-unavail'>No notifications found!</p>}
                </div>
            </div>
        </div>
    )
}

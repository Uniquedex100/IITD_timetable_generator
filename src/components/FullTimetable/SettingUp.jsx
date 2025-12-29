import React from 'react'
import axios from 'axios';
import './FullTimetable.css'


export default function SettingUp(props) {

    const setNavigation = props.setNavigation;
    const setProgress = props.setProgress;
    const setName = props.setName;
    const setTimetable = props.setTimetable;

    const kerberos = props.kerberos;

    // const { instance, accounts } = useMsal();

    React.useEffect(() => {
        if (!kerberos) return;

        axios.get(`http://localhost:8000/api/timetable/`, {
            headers: {
                'X-Kerberos': kerberos,
            }
        })
            .then(res => {
                setName(res.data.name);
                setTimetable(res.data.courses);
                setProgress(100);
                setNavigation(1);
            })
            .catch(err => {
                console.log(err);
            })

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kerberos])

    return (
        <section className='pre-dashboard'>
            <div className="fetching-courses">
                <h1>Please wait while we set up your timetable</h1>
                <div className="loading-balls">
                    <div className="loading-ball"></div>
                    <div className="loading-ball"></div>
                    <div className="loading-ball"></div>
                </div>
            </div>
        </section>
    )
}

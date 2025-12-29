import React from 'react'
import { Navigate } from 'react-router-dom';
import Timetable from '../components/FullTimetable/Timetable';
import SettingUp from '../components/FullTimetable/SettingUp';



export default function FullTimetable(props) {

    const setTitle = props.setTitle;
    const setProgress = props.setProgress;

    React.useEffect(() => {
        setTitle("My Timetable | ClassGrid by DevClub IIT Delhi")
        setProgress(25);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [navigation, setNavigation] = React.useState(0);
    const [name, setName] = React.useState();
    const [timetable, setTimetable] = React.useState({});

    return (
        <>
            {navigation === 0 ? <SettingUp setName={setName} setTimetable={setTimetable} setNavigation={setNavigation} setProgress={setProgress} kerberos={props.kerberos} /> : null}
            {navigation === 1 ? <Timetable name={name} timetable={timetable} setNavigation={setNavigation} kerberos={props.kerberos} /> : null}
        </>
    )
}

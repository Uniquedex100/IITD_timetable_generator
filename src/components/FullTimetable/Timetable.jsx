import React from 'react'
import './FullTimetable.css'
import EditTiming from './EditTiming';
import axios from 'axios';
import TimetableGrid from '../Timetable/TimetableGrid';



export default function Timetable(props) {

    const name = props.name;
    const timetable = props.timetable;
    const [timetableData, setTimetableData] = React.useState({});
    const [newCourseCode, setNewCourseCode] = React.useState("");
    const [expandedCourse, setExpandedCourse] = React.useState(null);

    const toggleExpand = (courseCode) => {
        if (expandedCourse === courseCode) {
            setExpandedCourse(null);
        } else {
            setExpandedCourse(courseCode);
        }
    };

    const [displayGrid, setDisplayGrid] = React.useState(false);

    const kerberos = props.kerberos; // Get kerberos from props

    const refreshData = () => {
        props.setNavigation(0); // Go back to Setup to refetch
    };

    const addCourse = () => {
        if (!newCourseCode) return;
        axios.post("http://localhost:8000/api/courses/add", { courseCode: newCourseCode }, {
            headers: { 'X-Kerberos': kerberos }
        })
            .then(res => {
                alert(res.data.message);
                setNewCourseCode("");
                refreshData();
            })
            .catch(err => {
                console.error(err);
                alert(err.response?.data?.detail || "Error adding course");
            });
    };

    const removeCourse = (courseCode) => {
        if (!window.confirm(`Are you sure you want to remove ${courseCode}?`)) return;
        axios.post("http://localhost:8000/api/courses/remove", { courseCode: courseCode }, {
            headers: { 'X-Kerberos': kerberos }
        })
            .then(res => {
                refreshData();
            })
            .catch(err => {
                console.error(err);
                alert("Error removing course");
            });
    };

    const syncLDAP = () => {
        axios.post("http://localhost:8000/api/courses/sync", {}, {
            headers: { 'X-Kerberos': kerberos }
        })
            .then(res => {
                alert(res.data.message);
                refreshData();
            })
            .catch(err => {
                console.error(err);
                alert("Error syncing LDAP");
            });
    };

    React.useEffect(() => {
        const newData = {};
        for (let i = 0; i < timetable.length; i++) {
            newData[timetable[i].courseCode] = {
                lecture: null,
                tutorial: null,
                lab: null,
            }
            if (timetable[i].lecture) {
                newData[timetable[i].courseCode].lecture = [];
                for (let j = 0; j < timetable[i].lectureTiming.length; j++) {
                    if (timetable[i].lectureTiming[j].start) {
                        newData[timetable[i].courseCode].lecture.push({
                            day: timetable[i].lectureTiming[j].day,
                            start: timetable[i].lectureTiming[j].start,
                            end: timetable[i].lectureTiming[j].end,
                            room: timetable[i].lectureRoom,
                        });
                    }
                }
            }
            if (timetable[i].tutorial) {
                newData[timetable[i].courseCode].tutorial = [];
                for (let j = 0; j < timetable[i].tutorialTiming.length; j++) {
                    if (timetable[i].tutorialTiming[j].start) {
                        newData[timetable[i].courseCode].tutorial.push({
                            day: timetable[i].tutorialTiming[j].day,
                            start: timetable[i].tutorialTiming[j].start,
                            end: timetable[i].tutorialTiming[j].end,
                            room: timetable[i].tutorialRoom,
                        });
                    }
                }
            }
            if (timetable[i].lab) {
                // Labs might not have parsed timings in this version, or handled differently
                // But structure requires the key exists
            }
        }
        setTimetableData(newData);
        setDisplayGrid(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timetable])

    function generateCalendar() {

        axios.post("http://localhost:8000/api/calendar/", timetableData, {
            headers: {
                'X-Kerberos': kerberos, // Use the kerberos prop
            }
        })
            .then(res => {
                let element = document.createElement('a');
                element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(res.data));
                element.setAttribute('download', 'Timetable.ics');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            })
            .catch(err => {
                console.log(err);
            })
    }

    const signout = () => {
        window.location.reload();
    }

    return (
        <section className="dashboard">
            <h1>{name}'s Timetable</h1>
            <p className="logout">Not you? <span onClick={signout}>Sign out</span></p>
            <div className="timetable-container">
                {displayGrid ? <TimetableGrid timetable={timetable} timetableData={timetableData} /> : null}
                <div className="timetable-items">
                    <div className="timetable-header">
                        <h2>Your courses</h2>
                        <button className="btn-primary btn-small" onClick={syncLDAP}>
                            Sync LDAP
                        </button>
                    </div>

                    <div className="add-course-container">
                        <input
                            type="text"
                            className="input-course"
                            placeholder="Course Code"
                            value={newCourseCode}
                            onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                        />
                        <button onClick={addCourse} className="btn-primary">
                            + Add
                        </button>
                    </div>

                    {timetable.map((course, index) => {
                        const isExpanded = expandedCourse === course.courseCode;

                        return (
                            <div className={`timetable-item ${isExpanded ? 'expanded' : ''}`} key={index}>
                                <div className="course-header">
                                    <h3>{course.courseCode}</h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div
                                            className="timetable-edit-btn"
                                            onClick={() => toggleExpand(course.courseCode)}
                                            style={{ position: 'static', marginRight: '0' }}
                                        >
                                            {isExpanded ? 'Done' : 'Edit'}
                                        </div>
                                        <span
                                            onClick={() => removeCourse(course.courseCode)}
                                            className="remove-btn"
                                            title="Remove Course"
                                        >
                                            &times;
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="course-details">
                                        {course.lecture ? <p>
                                            Lectures: {course.lectureTiming.map((time, idx) => (
                                                <React.Fragment key={idx}>
                                                    {time.start ? <span>{time.day} {time.start.slice(0, 2)}:{time.start.slice(2, 4)} - {time.end.slice(0, 2)}:{time.end.slice(2, 4)}{idx < course.lectureTiming.length - 1 ? ", " : ""}</span> : null}
                                                </React.Fragment>
                                            ))}
                                        </p> : null}

                                        {course.tutorial ? <p>
                                            Tutorial: <span>
                                                {timetableData[course.courseCode]?.tutorial ?
                                                    timetableData[course.courseCode].tutorial.map((time, idx) => (
                                                        `${time.day} ${time.start.slice(0, 2)}:${time.start.slice(2, 4)} - ${time.end.slice(0, 2)}:${time.end.slice(2, 4)}`
                                                    ))
                                                    : "Not Selected"
                                                }
                                            </span>
                                        </p> : null}

                                        {course.lab ? <p>
                                            Lab: <span>
                                                {timetableData[course.courseCode]?.lab ?
                                                    timetableData[course.courseCode].lab.map((time, idx) => (
                                                        `${time.day} ${time.start.slice(0, 2)}:${time.start.slice(2, 4)} - ${time.end.slice(0, 2)}:${time.end.slice(2, 4)}`
                                                    ))
                                                    : "Not Selected"
                                                }
                                            </span>
                                        </p> : null}

                                        {(course.tutorial || course.lab || course.lectureEditable) && (
                                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                                <EditTiming
                                                    div_id={`edit-${course.courseCode}`}
                                                    data={course}
                                                    timetableData={timetableData}
                                                    setTimetableData={setTimetableData}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            <button className="download-timetable-btn btn-primary" onClick={generateCalendar}>
                Download Timetable
            </button>
        </section>
    )
}

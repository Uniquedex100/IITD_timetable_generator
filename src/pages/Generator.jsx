import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import '../components/FullTimetable/FullTimetable.css'; // Will overwrite specific styles in Generator styles
import coursesData from '../courses.json';
import TimetableGrid from '../components/Timetable/TimetableGrid';
import EditTiming from '../components/FullTimetable/EditTiming';

export default function Generator() {
    const [allCourses, setAllCourses] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [timetableData, setTimetableData] = useState({});
    const [expandedCourse, setExpandedCourse] = useState(null);
    const timetableRef = useRef(null);

    useEffect(() => {
        setAllCourses(coursesData);
    }, []);

    // Helper to parse timing string from JSON
    const parseTimingStr = (timingStr) => {
        if (!timingStr) return [];
        const timings = timingStr.split(',');
        return timings.map(t => {
            const dayCode = t[0];
            const start = t.slice(1, 5);
            const end = t.slice(5, 9);

            const days = { '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday', '4': 'Thursday', '5': 'Friday' };
            return {
                day: days[dayCode],
                start: start,
                end: end
            };
        });
    };

    const addCourse = (courseCode) => {
        // Prevent adding if already selected
        if (selectedCourses.find(c => c.courseCode === courseCode)) return;

        const course = allCourses.find(c => c.courseCode === courseCode);
        if (course) {
            setTimetableData(prev => ({
                ...prev,
                [courseCode]: {
                    lecture: parseTimingStr(course.slot.lectureTiming),
                    tutorial: null,
                    lab: null
                }
            }));

            const gridCourse = {
                courseCode: course.courseCode,
                lecture: !!course.slot.lectureTiming,
                tutorial: course.creditStructure.split('-')[1] !== "0.0",
                lab: course.creditStructure.split('-')[2] !== "0.0",
                lectureTiming: parseTimingStr(course.slot.lectureTiming),
                tutorialTiming: parseTimingStr(course.slot.tutorialTiming),
                labTiming: parseTimingStr(course.slot.labTiming),
                creditStructure: course.creditStructure,
                lectureHall: course.lectureHall // Add lectureHall
            };

            setSelectedCourses([...selectedCourses, gridCourse]);
            setSearchQuery("");
        }
    };

    const removeCourse = (courseCode) => {
        setSelectedCourses(selectedCourses.filter(c => c.courseCode !== courseCode));
        const newData = { ...timetableData };
        delete newData[courseCode];
        setTimetableData(newData);
    };

    const toggleExpand = (courseCode) => {
        setExpandedCourse(expandedCourse === courseCode ? null : courseCode);
    };

    // Generate ICS
    const generateICS = () => {
        let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//IITD Timetable//EN\n";

        selectedCourses.forEach(course => {
            const data = timetableData[course.courseCode];
            if (!data) return;

            const events = [];
            if (data.lecture) events.push(...data.lecture);
            if (data.tutorial) events.push(...data.tutorial);
            if (data.lab) events.push(...data.lab);

            events.forEach(event => {
                const startH = event.start.slice(0, 2);
                const startM = event.start.slice(2, 4);
                const endH = event.end.slice(0, 2);
                const endM = event.end.slice(2, 4);

                icsContent += "BEGIN:VEVENT\n";
                icsContent += `SUMMARY:${course.courseCode} ${course.lectureHall ? `(${course.lectureHall})` : ''}\n`;
                icsContent += `RRULE:FREQ=WEEKLY;BYDAY=${event.day.slice(0, 2).toUpperCase()}\n`;
                icsContent += `DTSTART;TZID=Asia/Kolkata:20250106T${startH}${startM}00\n`;
                icsContent += `DTEND;TZID=Asia/Kolkata:20250106T${endH}${endM}00\n`;
                if (course.lectureHall) {
                    icsContent += `LOCATION:${course.lectureHall}\n`;
                }
                icsContent += "END:VEVENT\n";
            });
        });

        icsContent += "END:VCALENDAR";

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent));
        element.setAttribute('download', 'timetable.ics');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleDownloadImage = async () => {
        if (!timetableRef.current) return;

        try {
            const canvas = await html2canvas(timetableRef.current, {
                scale: 2, // Better resolution
                backgroundColor: '#ffffff', // Ensure white background
                logging: false,
                useCORS: true
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = "iitd-timetable.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Error downloading image:", err);
            alert("Failed to download image.");
        }
    };



    const filteredCourses = searchQuery
        ? allCourses.filter(c => c.courseCode.includes(searchQuery.toUpperCase())).slice(0, 10)
        : [];

    return (
        <section style={{ paddingTop: '100px', paddingBottom: '60px', minHeight: '100vh', maxWidth: '1440px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>

            {/* Header / Hero */}
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px',
                    marginBottom: '15px'
                }}>
                    IIT Delhi Timetable
                </h1>
                <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    Design your perfect semester. Search courses, manage conflicts, and export to calendar.
                </p>
            </div>

            {/* Search Bar */}
            <div style={{ maxWidth: '700px', margin: '0 auto 60px auto', position: 'relative' }}>
                <div style={{
                    position: 'relative',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    borderRadius: '20px'
                }}>
                    <input
                        type="text"
                        placeholder="Search for courses (e.g., COL106, ELL201)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '20px 30px',
                            fontSize: '1.1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '20px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                {searchQuery && (
                    <div style={{
                        position: 'absolute', top: '115%', left: 0, right: 0,
                        background: 'white',
                        borderRadius: '16px',
                        maxHeight: '350px', overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        zIndex: 50,
                        border: '1px solid #f1f5f9'
                    }}>
                        {filteredCourses.map(c => (
                            <div
                                key={c.courseCode}
                                onClick={() => addCourse(c.courseCode)}
                                style={{
                                    padding: '16px 24px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f8fafc',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                                <div>
                                    <strong style={{ color: '#1e293b', fontSize: '1.05rem' }}>{c.courseCode}</strong>
                                    {c.lectureHall && (
                                        <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                                            📍 {c.lectureHall}
                                        </span>
                                    )}
                                </div>
                                <span style={{
                                    color: '#6366f1',
                                    background: '#e0e7ff',
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: '500'
                                }}>
                                    {c.creditStructure}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '30px', alignItems: 'start' }} className="responsive-grid">

                {/* Left: Timetable Grid - REMOVED WHITE BOX STYLING */}
                <div style={{ minWidth: '0' }} ref={timetableRef}>
                    <TimetableGrid timetable={selectedCourses} timetableData={timetableData} />
                </div>

                {/* Right: Selected Courses List */}
                <div style={{ minWidth: '0' }}>
                    <div style={{ marginBottom: '25px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px'
                        }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                                Selected Courses
                                <span style={{
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    marginLeft: '10px',
                                    verticalAlign: 'middle'
                                }}>{selectedCourses.length}</span>
                            </h2>
                        </div>

                        {selectedCourses.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button
                                    onClick={generateICS}
                                    style={{
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                                        transition: 'transform 0.2s',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%'
                                    }}
                                >
                                    Export Calendar
                                </button>

                                <button
                                    onClick={handleDownloadImage}
                                    style={{
                                        background: 'white',
                                        color: '#6366f1',
                                        border: '1px solid #e2e8f0',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        justifyContent: 'center',
                                        width: '100%',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#f8fafc';
                                        e.target.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'white';
                                        e.target.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    Save Image
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {selectedCourses.length === 0 && (
                            <div style={{
                                padding: '60px 20px',
                                textAlign: 'center',
                                background: 'white',
                                borderRadius: '20px',
                                border: '2px dashed #e2e8f0',
                                color: '#94a3b8'
                            }}>
                                <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Your schedule is empty.</p>
                                <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>Search for a course to get started.</p>
                            </div>
                        )}

                        {selectedCourses.map((course) => {
                            const isExpanded = expandedCourse === course.courseCode;

                            return (
                                <div key={course.courseCode} style={{
                                    background: 'white',
                                    borderRadius: '16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #f1f5f9',
                                    overflow: 'hidden',
                                    transition: 'box-shadow 0.2s'
                                }}>
                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{course.courseCode}</h3>
                                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
                                                    {course.creditStructure} Credits
                                                </p>
                                                {course.lectureHall && (
                                                    <p style={{ color: '#6366f1', fontSize: '0.85rem', marginTop: '4px', fontWeight: '500' }}>
                                                        📍 {course.lectureHall}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => toggleExpand(course.courseCode)}
                                                    style={{
                                                        background: isExpanded ? '#f1f5f9' : 'transparent',
                                                        border: '1px solid #e2e8f0',
                                                        color: isExpanded ? '#333' : '#64748b',
                                                        padding: '8px 16px',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '500'
                                                    }}
                                                >
                                                    {isExpanded ? 'Close' : 'Configure'}
                                                </button>
                                                <button
                                                    onClick={() => removeCourse(course.courseCode)}
                                                    style={{
                                                        background: '#fee2e2',
                                                        border: 'none',
                                                        color: '#ef4444',
                                                        width: '36px',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Remove"
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                                                <EditTiming
                                                    div_id={`edit-${course.courseCode}`}
                                                    data={course}
                                                    timetableData={timetableData}
                                                    setTimetableData={setTimetableData}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Media query using style tag since we are in one file for speed */}
            <style>{`
                @media (max-width: 900px) {
                    .responsive-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </section>
    );
}

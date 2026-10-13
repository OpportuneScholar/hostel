import { useCallback, useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Students', icon: UsersRound },
  { label: 'Rooms', icon: Building2 },
];

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export default function App() {
  const [page, setPage] = useState('Overview');
  const [dashboard, setDashboard] = useState({ totalStudents: 0, totalRooms: 0, occupiedRooms: 0, availableRooms: 0 });
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [studentForm, setStudentForm] = useState({ name: '', studentId: '', course: '', roomNumber: '' });
  const [roomForm, setRoomForm] = useState({ roomNumber: '', capacity: '2' });
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const notify = (text, isError = false) => {
    setMessage(text);
    setError(isError);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overview, studentRows, roomRows] = await Promise.all([
        request('/dashboard'),
        request('/students'),
        request('/rooms'),
      ]);
      setDashboard(overview);
      setStudents(studentRows);
      setRooms(roomRows);
      setConnected(true);
    } catch (cause) {
      setConnected(false);
      notify(`${cause.message}. Check that the backend is running and MongoDB is configured.`, true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const searchTerm = search.trim().toLowerCase();
  const filteredStudents = searchTerm
    ? students.filter((student) => [student.name, student.studentId, student.course, student.roomNumber].some((value) => value.toLowerCase().includes(searchTerm)))
    : students;
  const filteredRooms = searchTerm ? rooms.filter((room) => room.roomNumber.toLowerCase().includes(searchTerm)) : rooms;

  async function addStudent(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await request('/students', { method: 'POST', body: JSON.stringify(studentForm) });
      setStudentForm({ name: '', studentId: '', course: '', roomNumber: '' });
      notify('Student added successfully');
      await load();
    } catch (cause) {
      notify(cause.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function addRoom(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await request('/rooms', {
        method: 'POST',
        body: JSON.stringify({ ...roomForm, capacity: Number(roomForm.capacity) }),
      });
      setRoomForm({ roomNumber: '', capacity: '2' });
      notify('Room added successfully');
      await load();
    } catch (cause) {
      notify(cause.message, true);
    } finally {
      setSaving(false);
    }
  }

  async function removeStudent(id) {
    if (!window.confirm('Delete this student record?')) return;
    try {
      await request(`/students/${id}`, { method: 'DELETE' });
      notify('Student record deleted');
      await load();
    } catch (cause) {
      notify(cause.message, true);
    }
  }

  async function removeRoom(id) {
    if (!window.confirm('Delete this room?')) return;
    try {
      await request(`/rooms/${id}`, { method: 'DELETE' });
      notify('Room deleted');
      await load();
    } catch (cause) {
      notify(cause.message, true);
    }
  }

  const totalBeds = rooms.reduce((total, room) => total + room.capacity, 0);
  const occupancy = totalBeds ? Math.min(100, Math.round((students.length / totalBeds) * 100)) : 0;
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" onClick={() => setPage('Overview')} aria-label="StayWise overview">
          <span className="brand-mark"><BedDouble size={20} strokeWidth={2.2} /></span>
          <span className="brand-copy">staywise<span>RESIDENCE OFFICE</span></span>
        </a>
        <p className="sidebar-label">MANAGEMENT</p>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${page === label ? 'active' : ''}`}
              key={label}
              type="button"
              onClick={() => { setPage(label); setSearch(''); }}
              aria-current={page === label ? 'page' : undefined}
              title={label}
            >
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {label === 'Students' && students.length > 0 && <span className="nav-count">{students.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <ShieldCheck size={16} />
          <span>Residence operations<br /><b>Admin workspace</b></span>
        </div>
        <div className="profile">
          <span className="profile-avatar">A</span>
          <span className="profile-copy"><b>Administrator</b><small>Hostel manager</small></span>
          <ChevronDown size={15} />
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>StayWise</span><span className="crumb-slash">/</span><b>{page}</b></div>
          <div className="topbar-actions">
            <span className={`connection ${connected ? 'online' : loading ? 'connecting' : 'offline'}`}>
              <i />{connected ? 'System online' : loading ? 'Connecting' : 'Offline'}
            </span>
            <button className="icon-button refresh-button" onClick={load} type="button" aria-label="Refresh data" title="Refresh data">
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
            <span className="top-avatar">A</span>
          </div>
        </header>

        {message && (
          <div className={`notice ${error ? 'bad' : ''}`} role="status">
            {error ? <CircleAlert size={17} /> : <Check size={17} />}
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')} aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        )}

        {page === 'Overview' && (
          <>
            <section className="page-heading overview-heading">
              <div><span className="section-kicker">{today}</span><h1>Residence overview</h1><p>A clear view of your hostel, all in one place.</p></div>
              <button className="secondary-button" type="button" onClick={() => setPage('Students')}><Plus size={16} /> Add a student</button>
            </section>
            <section className="metric-grid" aria-label="Hostel statistics">
              <Metric label="Registered students" value={dashboard.totalStudents} detail="Active student records" icon={UsersRound} tone="green" />
              <Metric label="Total rooms" value={dashboard.totalRooms} detail={`${totalBeds} beds in residence`} icon={Building2} tone="blue" />
              <Metric label="Rooms in use" value={dashboard.occupiedRooms} detail="At least one resident" icon={BedDouble} tone="amber" />
              <Metric label="Rooms with space" value={dashboard.availableRooms} detail="Beds still available" icon={ArrowDownRight} tone="rose" />
            </section>

            <section className="overview-grid">
              <div className="occupancy-panel">
                <div className="section-title-row"><div><span className="section-kicker">CAPACITY</span><h2>Bed occupancy</h2></div><span className="live-tag"><i /> LIVE</span></div>
                <div className="occupancy-main"><strong>{occupancy}<span>%</span></strong><span className="occupancy-caption">of all beds currently assigned</span></div>
                <div className="occupancy-track"><span style={{ width: `${occupancy}%` }} /></div>
                <div className="occupancy-legend"><span><i className="legend-used" />{students.length} occupied</span><span><i className="legend-free" />{Math.max(0, totalBeds - students.length)} available</span></div>
                <div className="occupancy-footer"><span>Residence capacity</span><b>{students.length} <small>/ {totalBeds} beds</small></b></div>
              </div>
              <div className="room-summary">
                <div className="section-title-row"><div><span className="section-kicker">ROOMS</span><h2>Room availability</h2></div><button className="link-button" type="button" onClick={() => setPage('Rooms')}>All rooms <ArrowRight size={14} /></button></div>
                {rooms.length === 0 ? <EmptyState text="Add your first room to start tracking availability." /> : (
                  <div className="room-list">
                    {rooms.slice(0, 4).map((room) => <RoomRow key={room._id} room={room} />)}
                  </div>
                )}
              </div>
            </section>

            <section className="data-section recent-section">
              <div className="section-title-row"><div><span className="section-kicker">DIRECTORY</span><h2>Recently added students</h2><p className="section-description">The latest residents added to the system.</p></div><button className="link-button" type="button" onClick={() => setPage('Students')}>View directory <ArrowRight size={14} /></button></div>
              <StudentTable students={students.slice(0, 5)} onDelete={removeStudent} />
            </section>
          </>
        )}

        {page === 'Students' && (
          <>
            <section className="page-heading"><div><span className="section-kicker">RESIDENT DIRECTORY</span><h1>Students</h1><p>Manage resident details and room assignments.</p></div><span className="record-count">{students.length} records</span></section>
            <section className="form-section">
              <div className="form-heading"><div><span className="section-kicker">NEW RESIDENT</span><h2>Add a student</h2></div><span className="form-icon"><UsersRound size={18} /></span></div>
              <form className="student-form" onSubmit={addStudent}>
                <Field label="Full name" value={studentForm.name} placeholder="e.g. Amaan Khan" onChange={(value) => setStudentForm({ ...studentForm, name: value })} />
                <Field label="Student ID" value={studentForm.studentId} placeholder="e.g. STU-24018" onChange={(value) => setStudentForm({ ...studentForm, studentId: value })} />
                <Field label="Course or programme" value={studentForm.course} placeholder="e.g. B.Tech Computer Science" onChange={(value) => setStudentForm({ ...studentForm, course: value })} />
                <label className="field"><span>Assign a room</span><select required value={studentForm.roomNumber} onChange={(event) => setStudentForm({ ...studentForm, roomNumber: event.target.value })}><option value="">Choose available room</option>{rooms.filter((room) => room.occupied < room.capacity).map((room) => <option key={room._id} value={room.roomNumber}>{room.roomNumber} · {room.capacity - room.occupied} bed(s) free</option>)}</select></label>
                <button className="primary-button" type="submit" disabled={saving || rooms.every((room) => room.occupied >= room.capacity)}><Plus size={16} />{saving ? 'Adding student…' : 'Add student'}</button>
              </form>
              {rooms.length === 0 && <p className="form-hint">Add a room before assigning a student. <button type="button" onClick={() => setPage('Rooms')}>Go to rooms <ArrowRight size={13} /></button></p>}
              {rooms.length > 0 && rooms.every((room) => room.occupied >= room.capacity) && <p className="form-hint">Every room is at capacity. Add a room before assigning another student.</p>}
            </section>
            <section className="data-section directory-section">
              <div className="section-title-row directory-heading"><div><span className="section-kicker">ALL RESIDENTS</span><h2>Student directory</h2><p className="section-description">{filteredStudents.length} of {students.length} student records</p></div><SearchBox value={search} onChange={setSearch} placeholder="Search students" />
              </div>
              <StudentTable students={filteredStudents} onDelete={removeStudent} query={search} />
            </section>
          </>
        )}

        {page === 'Rooms' && (
          <>
            <section className="page-heading"><div><span className="section-kicker">ROOM INVENTORY</span><h1>Rooms</h1><p>Track room capacity and resident assignments.</p></div><span className="record-count">{rooms.length} rooms</span></section>
            <section className="form-section room-form-section">
              <div className="form-heading"><div><span className="section-kicker">INVENTORY</span><h2>Add a room</h2></div><span className="form-icon"><Building2 size={18} /></span></div>
              <form className="room-form" onSubmit={addRoom}>
                <Field label="Room number" value={roomForm.roomNumber} placeholder="e.g. North 204" onChange={(value) => setRoomForm({ ...roomForm, roomNumber: value })} />
                <label className="field"><span>Bed capacity</span><select value={roomForm.capacity} onChange={(event) => setRoomForm({ ...roomForm, capacity: event.target.value })}><option value="1">1 bed</option><option value="2">2 beds</option><option value="3">3 beds</option><option value="4">4 beds</option><option value="5">5 beds</option><option value="6">6 beds</option></select></label>
                <button className="primary-button" type="submit" disabled={saving}><Plus size={16} />{saving ? 'Adding room…' : 'Add room'}</button>
              </form>
            </section>
            <section className="data-section room-directory">
              <div className="section-title-row directory-heading"><div><span className="section-kicker">ROOM INVENTORY</span><h2>All rooms</h2><p className="section-description">{filteredRooms.length} of {rooms.length} rooms</p></div><SearchBox value={search} onChange={setSearch} placeholder="Search room number" /></div>
              {filteredRooms.length === 0 ? <EmptyState text={search ? 'No rooms match that search.' : 'No rooms yet. Add a room to get started.'} /> : <div className="room-grid">{filteredRooms.map((room) => <RoomCard key={room._id} room={room} onDelete={removeRoom} />)}</div>}
            </section>
          </>
        )}

        {loading && <div className="loading-line"><span /> Updating residence data</div>}
        <footer className="footer"><span>STAYWISE <i>·</i> RESIDENCE MANAGEMENT</span><span>Records are synced with your database</span></footer>
      </main>
    </div>
  );
}

function Metric({ label, value, detail, icon: Icon, tone }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><i className={`metric-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></i></div><strong>{value}</strong><small>{detail}</small></article>;
}

function Field({ label, value, placeholder, onChange }) {
  return <label className="field"><span>{label}</span><input required value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SearchBox({ value, onChange, placeholder }) {
  return <label className="search-box"><Search size={16} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><SlidersHorizontal size={15} className="search-filter-icon" /></label>;
}

function StudentTable({ students, onDelete, query = '' }) {
  if (students.length === 0) return <EmptyState text={query ? 'No students match your search.' : 'No student records yet. Add a student to get started.'} />;
  return (
    <div className="table-scroll"><table className="student-table"><thead><tr><th>STUDENT</th><th>STUDENT ID</th><th>COURSE</th><th>ROOM</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
      {students.map((student) => <tr key={student._id}><td><div className="student-cell"><span className="student-avatar">{student.name.slice(0, 1).toUpperCase()}</span><b>{student.name}</b></div></td><td className="muted-cell">{student.studentId}</td><td>{student.course}</td><td><span className="room-label">{student.roomNumber}</span></td><td className="action-cell"><button className="delete-button" type="button" onClick={() => onDelete(student._id)} aria-label={`Delete ${student.name}`} title="Delete student"><Trash2 size={15} /></button></td></tr>)}
    </tbody></table></div>
  );
}

function RoomRow({ room }) {
  const remaining = Math.max(0, room.capacity - room.occupied);
  return <div className="room-row"><span className="room-symbol"><BedDouble size={16} /></span><span className="room-row-name"><b>{room.roomNumber}</b><small>{room.occupied} of {room.capacity} beds occupied</small></span><span className={`room-state ${remaining ? 'available' : 'full'}`}>{remaining ? `${remaining} free` : 'Full'}</span></div>;
}

function RoomCard({ room, onDelete }) {
  const remaining = Math.max(0, room.capacity - room.occupied);
  const percent = room.capacity ? Math.min(100, (room.occupied / room.capacity) * 100) : 0;
  return <article className="room-card"><div className="room-card-top"><span className="room-symbol large"><BedDouble size={18} /></span><span className={`room-state ${remaining ? 'available' : 'full'}`}>{remaining ? 'Available' : 'Full'}</span></div><h3>Room {room.roomNumber}</h3><p className="room-card-subtitle">{room.capacity} {room.capacity === 1 ? 'bed' : 'beds'} total</p><div className="room-meter-label"><span>Occupancy</span><b>{room.occupied}<small> / {room.capacity}</small></b></div><div className="room-meter"><span style={{ width: `${percent}%` }} /></div><div className="room-card-bottom"><span>{remaining ? `${remaining} ${remaining === 1 ? 'bed' : 'beds'} available` : 'At capacity'}</span><button className="delete-button" type="button" onClick={() => onDelete(room._id)} aria-label={`Delete room ${room.roomNumber}`} title="Delete room"><Trash2 size={15} /></button></div></article>;
}

function EmptyState({ text }) {
  return <div className="empty-state"><span><BedDouble size={18} /></span><p>{text}</p></div>;
}

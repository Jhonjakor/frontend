import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import BookingDetails from './pages/BookingDetails';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/movies/:id" element={<MovieDetails />} />
            <Route path="/sessions/:id" element={<SeatSelection />} />
            <Route path="/bookings/:id" element={<BookingDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  );
}

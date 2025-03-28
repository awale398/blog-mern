import { Outlet, Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { UserContext } from './UserContext';
import ThemeToggle from './components/ThemeToggle';
import axios from 'axios';

export default function Layout() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const username = userInfo?.username;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function logout() {
    axios.post('http://localhost:5000/logout');
    setUserInfo(null);
    setIsMenuOpen(false);
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.classList.toggle('menu-open');
  };

  return (
    <div className="layout">
      <header>
        <div className="header-content">
          <Link to="/" className="logo">
            AwalBlog
          </Link>
          <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <nav className={isMenuOpen ? 'active' : ''}>
            {username && (
              <>
                <Link to="/create" onClick={() => setIsMenuOpen(false)}>Create new post</Link>
                <a onClick={logout}>Logout ({username})</a>
              </>
            )}
            {!username && (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
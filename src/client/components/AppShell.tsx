import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/images', label: 'Imágenes', icon: '▦' },
  { to: '/upload', label: 'Cargar', icon: '＋' },
  { to: '/dashboard', label: 'Dashboard', icon: '⌁' },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink aria-label="Ir a imágenes" className="brand" to="/images">
          <span aria-hidden="true" className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>VISOR</strong>
            <small>Portal de anotación</small>
          </span>
        </NavLink>

        <nav aria-label="Navegación principal" className="main-nav">
          {navItems.map((item) => (
            <NavLink
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              key={item.to}
              to={item.to}
            >
              <span aria-hidden="true" className="nav-icon">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div aria-label="Usuario de demostración" className="user-chip">
          <span className="user-avatar">AN</span>
          <span className="user-copy">
            <strong>Anotador</strong>
            <small>Sesión demo</small>
          </span>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

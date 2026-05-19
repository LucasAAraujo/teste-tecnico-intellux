import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import s from './AppShell.module.scss';

type Props = {
  children: ReactNode;
  title?: string;
};

export function AppShell({ children, title }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <span className={s.logo}>Intellux Drive</span>
        <nav className={s.nav}>
          <span className={s.userName}>{user?.name}</span>
          <button onClick={handleLogout} className={s.logoutBtn}>
            Sair
          </button>
        </nav>
      </header>
      <main className={s.main}>
        {title && <h1 className={s.pageTitle}>{title}</h1>}
        {children}
      </main>
    </div>
  );
}

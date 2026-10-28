import { useEffect } from 'react';
import { Masthead } from './components/Masthead';
import { Home } from './components/Home';
import { PageRoute } from './components/PageRoute';
import { useRoute } from './lib/router';

export default function App() {
  const { path } = useRoute();
  const isHome = path === '/';

  /* cambia pagina: niente classi di stato lasciate dal scroll della homepage */
  useEffect(() => {
    if (!isHome) {
      document.body.classList.remove('is-editorial', 'is-scrolled-in', 'is-locked');
    }
  }, [isHome, path]);

  return (
    <>
      <Masthead />
      {isHome ? <Home /> : <PageRoute />}
    </>
  );
}

import React, { useEffect, useState } from 'react';
import MissionControl from './MissionControl.jsx';
import USStack from './USStack.jsx';

function readRoute() {
  const h = window.location.hash.replace(/^#/, '') || '/';
  return h === '/us' ? '/us' : '/';
}

export default function App() {
  const [route, setRouteState] = useState(readRoute());

  useEffect(() => {
    const onHash = () => setRouteState(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const setRoute = (r) => {
    const target = r === '/us' ? '#/us' : '#/';
    if (window.location.hash !== target) {
      window.location.hash = target;
    }
    setRouteState(r);
  };

  if (route === '/us') {
    return <USStack route={route} setRoute={setRoute} />;
  }
  return <MissionControl route={route} setRoute={setRoute} />;
}

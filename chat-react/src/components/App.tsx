import React from 'react';
import AppletView from './AppletView';

export default function App() {
  return (
    <div>
      <AppletView src="/applets/helloworld.applet" state={{ name: 'Rupert' }} />
    </div>
  );
}

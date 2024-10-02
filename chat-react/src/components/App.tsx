import React, { useState } from 'react';
import AppletView from './AppletView';

export default function App() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setQueries([...queries, { input: inputValue, responses: [] }]);
      setInputValue('');
    }
  }

  return (
    <div>
      <ul>
        {queries.map((q) => (
          <li>{q.input}</li>
        ))}
      </ul>
      <input
        className=""
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// <div className="applet-frame">
//   <AppletView src="/applets/map.applet" state={{ name: 'Rupert' }} />
// </div>;

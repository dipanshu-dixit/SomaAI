import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://localhost:5000/')
      .then((res) => res.text())
      .then((data) => setMessage(data))
      .catch((err) => setMessage('Error connecting to backend'));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial', fontSize: '1.5rem' }}>
      <h1>Symptom.ai</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
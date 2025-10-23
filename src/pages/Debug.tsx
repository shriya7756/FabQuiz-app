import { useEffect, useState } from 'react';

const Debug = () => {
  const [info, setInfo] = useState<any>({});
  const [apiTest, setApiTest] = useState<string>('Testing...');

  useEffect(() => {
    // Collect diagnostic info
    const diagnostics = {
      userAgent: navigator.userAgent,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      port: window.location.port,
      origin: window.location.origin,
      href: window.location.href,
      envVars: {
        VITE_API_URL: import.meta.env?.VITE_API_URL || 'not set',
        VITE_PUBLIC_ORIGIN: import.meta.env?.VITE_PUBLIC_ORIGIN || 'not set',
      },
      apiUrl: `${import.meta.env?.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`}`,
    };
    setInfo(diagnostics);

    // Test API connection
    const testApi = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`;
        const response = await fetch(`${apiUrl.replace('/api', '')}/health`);
        const data = await response.json();
        setApiTest(`✅ Backend OK: ${JSON.stringify(data)}`);
      } catch (error: any) {
        setApiTest(`❌ Backend Error: ${error.message}`);
      }
    };
    testApi();
  }, []);

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'monospace',
      fontSize: '12px',
      background: '#0a0a0a',
      color: '#00ff00',
      minHeight: '100vh',
      wordBreak: 'break-all',
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>🔍 FabQuiz Debug Info</h1>
      
      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>API Test</h2>
        <p>{apiTest}</p>
      </div>

      <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px' }}>
        <h2 style={{ color: '#00ff00', marginBottom: '10px' }}>Diagnostics</h2>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(info, null, 2)}</pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#00ff00', textDecoration: 'underline' }}>← Back to Home</a>
      </div>
    </div>
  );
};

export default Debug;

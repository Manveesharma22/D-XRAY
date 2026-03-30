/**
 * DX-Ray API & WebSocket Configuration
 * 
 * Dynamically detects the environment to provide the correct 
 * base URLs for API calls and WebSocket connections.
 */

const getEnvConfig = () => {
    const { hostname, protocol, port } = window.location;

    // Development (Vite dev server usually runs on 5173, Backend on 3001)
    const isDev = hostname === 'localhost' && port === '5173';

    const backendHost = isDev ? 'localhost:3001' : hostname + (port ? `:${port}` : '');
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    const httpProtocol = protocol === 'https:' ? 'https:' : 'http:';

    return {
        isDev,
        BACKEND_URL: `${httpProtocol}//${backendHost}`,
        WS_URL: `${wsProtocol}//${backendHost}`,
        API_BASE: `${httpProtocol}//${backendHost}/api`
    };
};

export const config = getEnvConfig();
export default config;

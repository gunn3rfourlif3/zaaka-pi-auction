/**
 * Dynamic server URL detection for cross-origin compatibility
 * Handles localhost, ngrok, and production environments
 */

export function getServerBaseUrl(req?: any): string {
    // For server-side usage with request object
    if (req && req.headers) {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost:5500';
        return `${protocol}://${host}`;
    }
    
    // For client-side usage - detect from current location
    if (typeof window !== 'undefined') {
        const { protocol, hostname, port } = window.location;
        const basePort = port ? `:${port}` : '';
        return `${protocol}//${hostname}${basePort}`;
    }
    
    // Fallback for other environments
    return 'http://localhost:5500';
}

export function getApiBaseUrl(req?: any): string {
    const baseUrl = getServerBaseUrl(req);
    return baseUrl;
}

export function getWebSocketUrl(req?: any): string {
    const baseUrl = getServerBaseUrl(req);
    // Convert HTTP to WS protocol
    return baseUrl.replace(/^http/, 'ws');
}
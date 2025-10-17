'use client';

import React, { useState, useEffect } from 'react';
import { bearerApi, getCurrentUser } from '@/lib/api/bearer-api';

export default function BearerAuthTestPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Load user info on page load
    loadUserInfo();
  }, []);

  const addResult = (test: string, result: any, success: boolean = true) => {
    setResults(prev => [...prev, {
      test,
      result,
      success,
      timestamp: new Date().toISOString()
    }]);
  };

  const loadUserInfo = async () => {
    try {
      const user = await getCurrentUser();
      setUserInfo(user);
      addResult('Get Current User', user);
    } catch (error: any) {
      addResult('Get Current User', { error: error.message }, false);
    }
  };

  const testBearerAuth = async () => {
    setLoading(true);
    try {
      // Test 1: Debug session with Bearer token
      const debugResult = await bearerApi.get('/api/v2/debug/session');
      addResult('Debug Session (Bearer)', debugResult);

      // Test 2: Bearer-only test endpoint
      const bearerTestResult = await bearerApi.get('/api/v2/bearer-test');
      addResult('Bearer Test Endpoint', bearerTestResult);

      // Test 3: POST test
      const postResult = await bearerApi.post('/api/v2/bearer-test', {
        message: 'Hello from Bearer auth!',
        timestamp: new Date().toISOString()
      });
      addResult('Bearer POST Test', postResult);

    } catch (error: any) {
      addResult('Bearer Auth Test', { error: error.message }, false);
    }
    setLoading(false);
  };

  const testCookieAuth = async () => {
    setLoading(true);
    try {
      // Test the old cookie-based approach
      const response = await fetch('/api/v2/debug/session', {
        credentials: 'include',
        mode: 'cors'
      });
      const result = await response.json();
      addResult('Cookie Auth Test', result, response.ok);
    } catch (error: any) {
      addResult('Cookie Auth Test', { error: error.message }, false);
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔐 HERA Bearer Authentication Test</h1>
        
        {/* User Info */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current User Session</h2>
          {userInfo ? (
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-yellow-400">Loading user info...</p>
          )}
        </div>

        {/* Test Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <button
              onClick={testBearerAuth}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Bearer Auth (Track B)'}
            </button>
            
            <button
              onClick={testCookieAuth}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Cookie Auth (Track A)'}
            </button>
            
            <button
              onClick={clearResults}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Clear Results
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Test Results</h2>
          {results.length === 0 ? (
            <p className="text-gray-400">No tests run yet. Click a test button above.</p>
          ) : (
            results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-900 border border-green-600' 
                    : 'bg-red-900 border border-red-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">
                    {result.success ? '✅' : '❌'} {result.test}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">🎯 Success Criteria</h3>
          <ul className="space-y-1 text-sm">
            <li>✅ Current User Session shows valid token</li>
            <li>✅ Bearer Auth tests return authenticated user data</li>
            <li>✅ Debug Session shows <code>bearer.authenticated: true</code></li>
            <li>⚠️ Cookie Auth may fail (expected in production)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
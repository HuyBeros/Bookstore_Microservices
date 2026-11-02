import React, { useState } from 'react';
import { Button, Card, Input } from '../../components/ui';
import axiosClient from '../../api/axiosClient';
import { ENDPOINTS, BASE_URL } from '../../api/endpoints';

const APITestPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (name, endpoint) => {
    try {
      setLoading(true);
      const result = await axiosClient.get(endpoint);
      setResults(prev => [...prev, {
        name,
        status: 'SUCCESS ✅',
        endpoint,
        data: JSON.stringify(result).substring(0, 200),
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } catch (error) {
      setResults(prev => [...prev, {
        name,
        status: `ERROR ❌ (${error.status || 'Unknown'})`,
        endpoint,
        message: error.message,
        timestamp: new Date().toLocaleTimeString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    setLoading(true);
    
    // Test various endpoints
    const endpoints = [
      ['GET /books', ENDPOINTS.BOOKS.LIST],
      ['GET /categories', ENDPOINTS.CATEGORIES.LIST],
      ['GET /authors', ENDPOINTS.AUTHORS.LIST],
      ['GET /publishers', ENDPOINTS.PUBLISHERS.LIST],
    ];

    for (const [name, endpoint] of endpoints) {
      await testEndpoint(name, endpoint);
      await new Promise(r => setTimeout(r, 500)); // Delay between requests
    }

    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">API Test Page</h1>
        <p className="text-gray-600">Base URL: <code className="bg-gray-100 px-2 py-1 rounded">{BASE_URL}</code></p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Test Endpoints</h2>
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runAllTests}
            variant="primary"
            loading={loading}
          >
            Run All Tests
          </Button>
          <Button 
            onClick={() => setResults([])}
            variant="ghost"
          >
            Clear Results
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Results ({results.length})</h2>
        {results.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No test results yet. Click "Run All Tests" to start.
          </Card>
        ) : (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <Card key={idx} className={`p-4 ${result.status.includes('ERROR') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-700">{result.name}</p>
                    <code className="text-xs text-gray-600 break-all">{result.endpoint}</code>
                  </div>
                  <div>
                    <p className="font-semibold">{result.status}</p>
                    <p className="text-xs text-gray-600">{result.timestamp}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-700 break-all">
                      {result.data || result.message}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default APITestPage;

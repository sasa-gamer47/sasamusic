"use client";

import React, { useState, ComponentType } from 'react';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent = (props: P) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (password === 'BrawlStars3.0') {
        setIsAuthenticated(true);
      } else {
        alert('Incorrect password');
      }
    };

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-900">
          <form onSubmit={handlePasswordSubmit} className="bg-slate-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-white text-2xl mb-4">Enter Password</h2>
            <input
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-slate-700"
            />
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-4">
              Submit
            </button>
          </form>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthComponent;
};

export default withAuth;

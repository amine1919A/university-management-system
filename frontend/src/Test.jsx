import React from 'react';

function Test() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          Test Tailwind CSS
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Carte 1
            </h2>
            <p className="text-gray-600">
              Test des styles Tailwind CSS
            </p>
            <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              Bouton
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Carte 2
            </h2>
            <p className="text-gray-600">
              Classes utilitaires Tailwind
            </p>
            <button className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              Succès
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Carte 3
            </h2>
            <p className="text-gray-600">
              Design responsive
            </p>
            <button className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Danger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Test;
import React from 'react';
import { AlertCircle } from 'lucide-react';

const Error = ({ message = 'Une erreur est survenue', onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
      <p className="text-lg font-medium text-gray-800 mb-2">{message}</p>
      <p className="text-gray-600 text-center mb-6">
        Veuillez réessayer ou contacter le support si le problème persiste.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary px-6 py-2"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export default Error;
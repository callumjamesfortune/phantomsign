// NotificationModal.tsx
import React from 'react';
import { BellIcon } from '@heroicons/react/outline';

interface NotificationModalProps {
  onEnable: () => void;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ onEnable, onClose }) => {
  return (
    <div className="fixed z-[2000] inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-lg text-center">
        <h2 className="text-lg font-bold mb-4">Enable Notifications</h2>
        <p className="mb-4">Do you want to enable notifications?</p>
        <div className="flex justify-center">
          <button
            className="bg-gray-200 text-gray-600 py-2 px-4 rounded-md mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 text-white py-2 px-4 rounded-md flex items-center justify-center"
            onClick={onEnable}
          >
            <BellIcon className="w-5 h-5 mr-2" />
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

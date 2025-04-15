"use client"
import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function DeleteConfirmationDialog({ isOpen, onConfirm, onCancel }) {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  if (!isBrowser) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onCancel}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      {/* Dialog container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-red-600 flex items-center gap-2"
            >
              <ExclamationTriangleIcon className="h-6 w-6" />
              Delete Post
            </Dialog.Title>
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-150"
            >
              Delete Post
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
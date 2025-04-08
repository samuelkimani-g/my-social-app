"use client"

import { useAuth } from "../contexts/AuthContext.jsx"

export default function Dashboard() {
  const { currentUser } = useAuth()

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">User Dashboard</h2>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-700">Welcome back, {currentUser?.displayName || currentUser?.email}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Account Information</h3>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Email:</span> {currentUser?.email}
            </p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Account created:</span>{" "}
              {currentUser?.metadata?.creationTime
                ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                : "N/A"}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Last sign in:</span>{" "}
              {currentUser?.metadata?.lastSignInTime
                ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()
                : "N/A"}
            </p>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                View Activity
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Update Settings
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Account created</p>
                <p className="text-sm text-gray-500">
                  {currentUser?.metadata?.creationTime
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Last login</p>
                <p className="text-sm text-gray-500">
                  {currentUser?.metadata?.lastSignInTime
                    ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

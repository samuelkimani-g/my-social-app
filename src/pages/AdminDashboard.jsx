"use client"

import { useAuth } from "../contexts/AuthContext.jsx"
import { ShieldCheck } from "lucide-react"

export default function AdminDashboard() {
  const { currentUser } = useAuth()

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <ShieldCheck className="mr-2 h-6 w-6 text-purple-600" />
          Admin Dashboard
        </h2>

        <div className="bg-purple-50 p-4 rounded-lg mb-6 border border-purple-200">
          <p className="text-purple-700 flex items-center">
            <ShieldCheck className="mr-2 h-5 w-5" />
            Welcome, Admin {currentUser?.displayName || currentUser?.email}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Users</h3>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Total registered users</p>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Active</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-500 mt-1">Active users today</p>
          </div>

          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">New</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500 mt-1">New users this week</p>
          </div>
        </div>

        <div className="bg-white p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800">Recent Users</h3>
            <button className="text-sm text-purple-600 hover:text-purple-500">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Joined
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colSpan="4">
                    No users found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

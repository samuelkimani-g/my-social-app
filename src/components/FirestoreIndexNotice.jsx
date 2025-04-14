"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"

export default function FirestoreIndexNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-yellow-700">
            <strong>Important:</strong> Some features may not work correctly until Firestore indexes are created. If
            you're seeing errors about missing indexes, please follow the links in the console to create them.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="ml-auto flex-shrink-0 text-yellow-500 hover:text-yellow-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

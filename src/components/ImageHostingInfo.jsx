import { Info } from "lucide-react"

export default function ImageHostingInfo() {
  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded relative mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Info className="h-5 w-5 text-blue-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm">
            <strong>Image Hosting Notice:</strong> Images are uploaded to a third-party hosting service. Please do not
            upload sensitive or private images.
          </p>
        </div>
      </div>
    </div>
  )
}

import { Eye, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function ComplaintCard({ complaint }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-gray-900 rounded-xl shadow border border-gray-800 mb-4">

      {/* Top Section */}
      <div className="p-5 flex justify-between items-start gap-4">
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {complaint.title}
          </h3>

          <p className="text-gray-400 mt-2 text-sm">
            {complaint.description}
          </p>

          <div className="flex gap-2 mt-3 flex-wrap">
            <span className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-400">
              {complaint.status}
            </span>

            <span className="px-3 py-1 text-xs rounded-full bg-orange-500/10 text-orange-400">
              {complaint.priority}
            </span>

            <span className="px-3 py-1 text-xs rounded-full bg-gray-800 text-gray-300">
              {complaint.category}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {complaint.date}
          </p>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition"
        >
          <Eye className="w-4 h-4" />
          {open ? "Hide" : "View"}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

      </div>

      {/* Expanded Section */}
      {open && (
        <div className="border-t border-gray-800 p-5 space-y-4">

          {/* Student */}
          <div>
            <p className="text-gray-400 text-sm">Student</p>
            <p className="text-white">
              {complaint.studentName || "N/A"} ({complaint.studentEmail || "N/A"})
            </p>
          </div>

          {/* Admin Comment */}
          <div>
            <p className="text-gray-400 text-sm mb-1">Admin Comment</p>

            {complaint.adminComment ? (
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded text-cyan-300">
                {complaint.adminComment}
              </div>
            ) : (
              <p className="text-gray-500">No comment yet</p>
            )}
          </div>

          {/* Attachments */}
          <div>
            <p className="text-gray-400 text-sm mb-2">Attachments</p>

            {complaint.files?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {complaint.files.map((file, i) => (
                  <img
                    key={i}
                    src={`http://localhost:5000/${file}`}
                    className="rounded-lg border border-gray-700"
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No attachments</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default ComplaintCard;
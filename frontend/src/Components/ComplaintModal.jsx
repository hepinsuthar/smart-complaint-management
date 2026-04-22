function ComplaintModal({ complaint, onClose }) {
  if (!complaint) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">

        <h2 className="text-xl font-bold mb-4">Complaint Detail</h2>

        <div className="flex gap-2 mb-4">
          <span className="bg-gray-200 px-3 py-1 rounded text-sm">
            {complaint.displayId}
          </span>

          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm">
            {complaint.status}
          </span>

          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded text-sm">
            {complaint.priority}
          </span>
        </div>

        <h3 className="text-lg font-semibold">
          {complaint.title}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Category: {complaint.category}
        </p>

        <p className="text-gray-700 mt-3">
          {complaint.description}
        </p>

        {/* Student */}
        <div className="mt-5 text-sm">
          <p className="text-gray-500">Student</p>
          <p className="font-medium">
            {complaint.studentName || "N/A"} ({complaint.studentEmail || "N/A"})
          </p>
        </div>

        {/* Date */}
        <div className="mt-4 text-sm">
          <p className="text-gray-500">Created</p>
          <p>{complaint.date}</p>
        </div>

        {/* Attachments */}
        <div className="mt-6">
          <p className="font-medium mb-2">Attachments</p>

          {complaint.files?.length > 0 ? (
            complaint.files.map((file, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-100 p-3 rounded mb-2">
                <img
                  src={`http://localhost:5000/${file}`}
                  className="w-16 h-16 object-cover rounded"
                />

                <a
                  href={`http://localhost:5000/${file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600"
                >
                  Open
                </a>
              </div>
            ))
          ) : (
            <p className="text-gray-400">No attachments</p>
          )}
        </div>

        {/* Admin Comment */}
        <div className="mt-6">
          <p className="font-medium mb-2">Admin Comment</p>

          {complaint.adminComment ? (
            <div className="bg-blue-50 p-3 rounded">
              {complaint.adminComment}
            </div>
          ) : (
            <p className="text-gray-400">No comment</p>
          )}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-gray-800 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default ComplaintModal;
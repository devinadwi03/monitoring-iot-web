import React, { useState, useEffect } from "react";

export default function EditDescriptionImagesModal({ isOpen, onClose, onSave, initialText = "" }) {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Edit Description</h2>

        <div className="mb-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            onClick={() => onSave(text)}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export default function ConfirmModal({
  title = "Konfirmasi Aksi",
  message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmText = "Ya",
  cancelText = "Batal",
  onConfirm,
  onClose,
  isOpen, // ← kalau dikirim dari luar, modal dikontrol manual
  triggerButton,
  confirmColor = "bg-red-500 hover:bg-red-600",
}) {
  const [showModal, setShowModal] = useState(false);
  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : showModal;
  const setOpen = isControlled ? onClose : setShowModal;

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
  };

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setOpen]);

  return (
    <>
      {/* Trigger opsional (hanya digunakan kalau internal) */}
      {!isControlled && triggerButton?.({ onClick: () => setShowModal(true) })}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-lg animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
            <p className="text-sm text-gray-600 mb-6">{message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-black hover:bg-gray-100 transition"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg text-white transition ${confirmColor}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

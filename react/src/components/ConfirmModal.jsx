import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  title = "Konfirmasi Aksi",
  message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmText = "Ya",
  cancelText = "Batal",
  onConfirm,
  onClose,
  isOpen,
  triggerButton,
  confirmColor = "bg-red-500 hover:bg-red-600",
}) {
  const [internalOpen, setInternalOpen] = useState(false);

  const controlled = typeof isOpen === "boolean";
  const open = controlled ? isOpen : internalOpen;

  // ✔ buat stable function
  const setOpen = useCallback(
    (val) => {
      if (controlled) {
        onClose?.(val);
      } else {
        setInternalOpen(val);
      }
    },
    [controlled, onClose] // dependensi stabil
  );

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
  };

  // Tutup dengan ESC
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, setOpen]);

  // Modal UI (dipisah agar mudah di-porting ke portal)
  const modalUI = open ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => setOpen(false)} // klik area gelap → tutup
    >
      <div
        className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-lg animate-fadeIn"
        onClick={(e) => e.stopPropagation()} // supaya klik konten modal tidak menutup modal
      >
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
  ) : null;

  return (
    <>
      {/* Trigger hanya muncul jika tidak controlled */}
      {!controlled && triggerButton?.({ onClick: () => setInternalOpen(true) })}

      {/* Gunakan portal agar modal bebas dari table & layout parent */}
      {createPortal(modalUI, document.body)}
    </>
  );
}

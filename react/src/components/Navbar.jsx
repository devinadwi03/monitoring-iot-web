import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import ConfirmModal from "./ConfirmModal";

export default function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-white/20 text-white px-3 py-1 rounded-full transition-all"
      : "hover:bg-white/10 px-3 py-1 rounded-full transition-all";

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="font-extrabold text-xl tracking-wide">Monitoring IoT</h1>

        {/* Tombol hamburger (mobile) */}
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>

        {/* Menu Desktop */}
        <div className="hidden md:flex gap-6 items-center">
          <Link to="/" className={isActive("/")}>
            Dashboard
          </Link>
          {user?.role === "admin" && (
            <Link to="/add-device" className={isActive("/add-device")}>
              Tambah Device
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              to="/admin/device-types"
              className={isActive("/admin/device-types")}
            >
              Device Types
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin/users" className={isActive("/admin/users")}>
              Manajemen User
            </Link>
          )}
          <Link to="/profile" className={isActive("/profile")}>
            Profil
          </Link>

          {/* Logout pakai ConfirmModal */}
          <ConfirmModal
            title="Konfirmasi Logout"
            message="Apakah Anda yakin ingin logout?"
            confirmText="Ya, Logout"
            confirmColor="bg-red-500 hover:bg-red-600"
            onConfirm={onLogout}
            triggerButton={({ onClick }) => (
              <button
                onClick={onClick}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg shadow-sm transition-all duration-200"
              >
                Logout
              </button>
            )}
          />
        </div>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div className="md:hidden mt-2 flex flex-col gap-2 bg-blue-600 rounded-lg p-4">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className={isActive("/")}
          >
            Dashboard
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/add-device"
              onClick={() => setMenuOpen(false)}
              className={isActive("/add-device")}
            >
              Tambah Device
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              to="/admin/device-types"
              onClick={() => setMenuOpen(false)}
              className={isActive("/admin/device-types")}
            >
              Device Types
            </Link>
          )}

          {user?.role === "admin" && (
            <Link
              to="/admin/users"
              onClick={() => setMenuOpen(false)}
              className={isActive("/admin/users")}
            >
              User Management
            </Link>
          )}
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className={isActive("/profile")}
          >
            Profil
          </Link>

          {/* Logout pakai ConfirmModal di mobile */}
          <ConfirmModal
            title="Konfirmasi Logout"
            message="Apakah Anda yakin ingin logout?"
            confirmText="Ya, Logout"
            confirmColor="bg-red-500 hover:bg-red-600"
            onConfirm={onLogout}
            triggerButton={({ onClick }) => (
              <button
                onClick={onClick}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow"
              >
                Logout
              </button>
            )}
          />
        </div>
      )}
    </nav>
  );
}

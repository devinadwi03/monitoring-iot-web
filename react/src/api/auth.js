import api from "./axios"; 

export const login = async (email, password) => {
  const res = await api.post("/login", { email, password });
  const { user, token } = res.data;
  localStorage.setItem("token", token);
  return user; // biar bisa dipakai di App.jsx
};

export const loginWithOtp = async (email, password) => {
  // csrf harus ke /sanctum/csrf-cookie tanpa /api
  const res = await api.post("/login-otp", { email, password });
  return res.data; // { message: 'OTP dikirim...' } and cookie otp_id set
};

export const verifyOtp = async (otp, rememberMe) => {
  // cookie otp_id akan dikirim otomatis oleh browser (withCredentials: true)
  const res = await api.post("/verify-otp", { otp, rememberMe: rememberMe});
  return res.data; // { message, user, token }
};

export const resendOtp = async (email) => {
  // cookie otp_id akan dikirim otomatis oleh browser (withCredentials: true)
  const res = await api.post("/resend-otp", { email });
  return res.data; // { message, user, token }
};

export const getMe = async () => {
  const res = await api.get("/me");
  return res.data;
};

export const logout = async () => {
  await api.post("/logout");
};

export const register = async ({ name, email, password, confirmPassword, role }) => {
  const res = await api.post("/register", { 
    name, 
    email, 
    password, 
    password_confirmation: confirmPassword, 
    role 
  });
  localStorage.setItem("token", res.data.token);
  return res.data.user;
};

// forgot password: kirim link reset ke email
export const forgotPassword = async (email) => {
  const res = await api.post("/forgot-password", { email });
  return res.data;
};

// reset password: dipakai di halaman ResetPassword.jsx
export const resetPassword = async (email, token, password, confirmPassword) => {
  const res = await api.post("/reset-password", {
    email,
    token,
    password,
    password_confirmation: confirmPassword, // penting buat Laravel confirmed
  });
  return res.data;
};

export function validatePassword(password) {
  const rules = [
    {
      test: /.{8,}/,
      message: "Minimal 8 karakter",
    },
    {
      test: /[a-z]/,
      message: "Harus ada huruf kecil",
    },
    {
      test: /[A-Z]/,
      message: "Harus ada huruf besar",
    },
    {
      test: /[0-9]/,
      message: "Harus ada angka",
    },
    {
      test: /[^A-Za-z0-9]/,
      message: "Harus ada simbol (!@#$, dll)",
    },
  ];

  const errors = rules
    .filter((rule) => !rule.test.test(password))
    .map((rule) => rule.message);

  return {
    valid: errors.length === 0,
    errors,
  };
}
const normalizeCnic = (cnic) => String(cnic || "").replace(/\D/g, "");

const isValidCnic = (cnic) => /^\d{13}$/.test(normalizeCnic(cnic));

export { normalizeCnic, isValidCnic };

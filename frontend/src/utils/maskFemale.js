export const maskMobile = (mobile, role, gender) => {
  if (role === "admin") return mobile;
  if (gender !== "أنثى") return mobile;
  if (!mobile) return mobile;
  if (mobile.length === 11) {
    return "********" + mobile.slice(0, 3);
  }
  return "********" + mobile.slice(0, 3);
};

export const maskAddress = (address, role, gender) => {
  if (role === "admin") return address;
  if (gender !== "أنثى") return address;
  if (!address) return "—";
  return "عنوان مخفي";
};

export const maskAge = (age, role, gender) => {
  if (role === "admin") return age;
  if (gender !== "أنثى") return age;
  if (!age) return "—";
  return "عمر مخفي";
};

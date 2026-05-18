// components/ImageWithAuth.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const apiUrl = import.meta.env.VITE_API_URL;
const IMAGE_PASSWORD = import.meta.env.VITE_IMAGE_PASSWORD;
const baseUrl = apiUrl.replace(/\/api$/, "");

const ImageWithAuth = ({ customer, className, fallbackIcon: FallbackIcon }) => {
  const { role } = useAuth(); // from your AuthContext
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  // Hide image for female customers if user is NOT admin
  const shouldHideImage = () => {
    if (!customer) return false;
    const isFemale = customer.gender === "أنثى";
    const isNotAdmin = role !== "admin";
    return isFemale && isNotAdmin;
  };

  useEffect(() => {
    if (!customer?.image) {
      setError(true);
      return;
    }
    if (shouldHideImage()) {
      setError(true);
      return;
    }
    const fullUrl = `${baseUrl}${customer.image}`;
    const fetchImage = async () => {
      try {
        const response = await axios.get(fullUrl, {
          headers: { Authorization: `Bearer ${IMAGE_PASSWORD}` },
          responseType: "blob",
        });
        const url = URL.createObjectURL(response.data);
        setImageUrl(url);
      } catch (err) {
        console.error("Failed to load image", customer.image, err);
        setError(true);
      }
    };
    fetchImage();
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [customer?.image, customer?.gender, role]);

  if (error || !customer?.image || shouldHideImage()) {
    if (FallbackIcon) return <FallbackIcon className={className} />;
    return <div className={className} />;
  }
  if (!imageUrl)
    return <div className={`${className} animate-pulse bg-gray-200`} />;
  return <img src={imageUrl} alt={customer?.name} className={className} />;
};

export default ImageWithAuth;

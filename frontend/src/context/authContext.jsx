import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    loading: true,
    isAuthenticated: false,
    user: null,
    role: null,
  });

  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${apiUrl}/isAuthed`, {
        withCredentials: true,
      });
      const { isAuthenticated, decoded } = res.data;

      if (isAuthenticated && decoded) {
        setAuth({
          loading: false,
          isAuthenticated: true,
          user: { username: decoded.username, id: decoded.id },
          role: decoded.role,
        });
      } else {
        setAuth({
          loading: false,
          isAuthenticated: false,
          user: null,
          role: null,
        });
      }
    } catch (err) {
      setAuth({
        loading: false,
        isAuthenticated: false,
        user: null,
        role: null,
      });
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (userData) => {
    localStorage.setItem("username", userData.name);

    setAuth({
      loading: false,
      isAuthenticated: true,
      user: { username: userData.name, id: userData.id },
      role: userData.role,
    });
  };

  const logout = () => {
    localStorage.removeItem("username");
    setAuth({
      loading: false,
      isAuthenticated: false,
      user: null,
      role: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{ ...auth, login, logout, refetch: fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

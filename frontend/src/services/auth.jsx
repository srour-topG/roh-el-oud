import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

async function register(data) {
  try {
    const response = await axios.post(`${apiUrl}/auth/register`, data);

    return response;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}

async function login(data) {
  try {
    const response = await axios.post(`${apiUrl}/auth/login`, data, {
      withCredentials: true,
    });
    localStorage.setItem("username", response.data.userInfo.name);
    // console.log(response);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}

async function updateUser(data) {
  try {
    const response = await axios.patch(`${apiUrl}/userUpdate`, data, {
      withCredentials: true,
    });
    return response;
  } catch (error) {
    console.error("Register error:", error);
    throw error;
  }
}
export { register, login, updateUser };

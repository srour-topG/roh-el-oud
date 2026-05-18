import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

async function expenses(data) {
	try {
		const response = await axios.post(`${apiUrl}/expenses`, data);
		return response; 
	} catch (error) {
		console.error('Register error:', error);
		throw error; 
	}
}

export { expenses };

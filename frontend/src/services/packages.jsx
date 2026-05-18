import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

async function addpackage(data) {
	try {
		const response = await axios.post(`${apiUrl}/packages`, data);
		return response; 
	} catch (error) {
		console.error('Register error:', error);
		throw error; 
	}
}


async function editPackage(data) {
	try {
		const response = await axios.patch(`${apiUrl}/packages`, data);
		return response; 
	} catch (error) {
		console.error('Register error:', error);
		throw error; 
	}
}
export { addpackage, editPackage };

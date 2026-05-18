function DateNow() {
	const timestamp = Date.now();
	const date = new Date(timestamp);

	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
	const year = String(date.getFullYear())

	const formatted = `${year}-${month}-${day}`;

	return formatted
}


export {DateNow}
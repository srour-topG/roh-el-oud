function DateNow(days = 0) {
	const date = new Date();
	date.setDate(date.getDate() + days); // Add or subtract days

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function DateNowHour(days = 0) {
	const now = new Date();
	now.setDate(now.getDate() + days);

	// Get local values
	const year = now.getFullYear();
	const month = now.getMonth(); // 0-based
	const day = now.getDate();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	// Build date directly using local parts
	const localDate = new Date();
	localDate.setFullYear(year);
	localDate.setMonth(month);
	localDate.setDate(day);
	localDate.setHours(hours);
	localDate.setMinutes(minutes);
	localDate.setSeconds(seconds);
	localDate.setMilliseconds(0);

	return localDate;
}

export { DateNowHour, DateNow };

export function formatDate(date: Date): string {
	return date.toLocaleDateString();
	return date.toLocaleDateString('en', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function formatDateTime(date: Date): string {
	return date.toLocaleDateString();
	return date.toLocaleDateString('en', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	});
}

export function formatTime(date: Date): string {
	return date.toLocaleTimeString();
	return date.toLocaleTimeString('en', {
		hour: 'numeric',
		minute: 'numeric'
	});
}

export function toTimeAgo(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(weeks / 4);
	const years = Math.floor(months / 12);

	if (years > 0) {
		return `${years} year${years === 1 ? '' : 's'} ago`;
	} else if (months > 0) {
		return `${months} month${months === 1 ? '' : 's'} ago`;
	} else if (weeks > 0) {
		return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
	} else if (days > 0) {
		return `${days} day${days === 1 ? '' : 's'} ago`;
	} else if (hours > 0) {
		return `${hours} hour${hours === 1 ? '' : 's'} ago`;
	} else if (minutes > 0) {
		return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
	} else {
		return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
	}
}

export function formatDateToInput(date: Date | null): string {
	if (!date) {
		return '';
	}
	const time = date.getTime();
	const offset = date.getTimezoneOffset() * 60000;
	return new Date(time - offset).toISOString().slice(0, 16);
}

export function formatDateFromInput(date: string): Date {
	const input = new Date(`${date}:00.000Z`);
	const offset = input.getTimezoneOffset() * 60000;
	return new Date(input.getTime() + offset);
}

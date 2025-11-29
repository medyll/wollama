import type { DbChat } from '$types/_old/db';
import { startOfDay, endOfDay, isThisWeek, format } from 'date-fns';

type Group<T = any> = {
	code:   string;
	name:   string;
	order:  number;
	items:  T[];
	period: { start: Date; end: Date };
};

type GroupList<T = any> = Record<string, Group<T>>;

export class ChatDataGrouper<T = DbChat> {
	data:         T[];
	fieldName:    keyof T;

	currentYear:  number;
	currentMonth: number;

	constructor(data: T[], opt: { fieldName: keyof T } = { fieldName: 'createdAt' }) {
		this.data = data;
		this.fieldName = opt.fieldName;
		const now = new Date();
		this.currentMonth = now.getMonth();
		this.currentYear = now.getFullYear();
	}

	// get the title of the week group
	getWeekGroupTitle(weeks: number) {
		if (weeks === 0) {
			return 'ui.this_week';
		} else if (weeks === 1) {
			return 'ui:last_week';
		} else {
			return `ui:${weeks}_weeks_ago`;
		}
	}

	// groups by days for the current week only
	groupByDays() {
		const groups: GroupList = {};

		this.data.forEach((item) => {
			const itemDate = new Date(item[this.fieldName]);

			if (isThisWeek(itemDate)) {
				const day = itemDate.getDate();

				// if group does not exist, create it
				if (!groups[`D${day}`]) {
					const startDate = new Date(itemDate);
					startDate.setHours(0, 0, 0, 0);
					const endDate = new Date(itemDate);
					endDate.setHours(23, 59, 59, 999);

					groups[`D${day}`] = {
						code:   `D${day}`,
						items:  [],
						name:   itemDate.toLocaleString('default', { weekday: 'long' }),
						order:  day,
						period: { end: endDate, start: startDate }
					};
				}
				// store item in the dedicated group
				groups[`D${day}`].items.push(item);
			}
		});

		return groups;
	}
	// group weeks on a maximum 4 weeks period, for the current month only
	groupByWeek() {
		const now = new Date();

		const groups: GroupList = {};

		this.data.forEach((item) => {
			const itemDate = new Date(item[this.fieldName]);
			const itemMonth = itemDate.getMonth();
			const itemYear = itemDate.getFullYear();

			if (itemMonth === this.currentMonth && itemYear === this.currentYear) {
				const weeks = Math.floor((now - itemDate) / (7 * 24 * 60 * 60 * 1000));

				// if group does not exist, create it
				if (!groups[`W${weeks}`]) {
					const startDate = new Date(now);
					startDate.setDate(now.getDate() - weeks * 7);
					const endDate = new Date(itemDate);
					endDate.setDate(itemDate.getDate() + 6);

					groups[`W${weeks}`] = {
						code:   `W${weeks}`,
						items:  [],
						name:   this.getWeekGroupTitle(weeks),
						order:  weeks,
						period: { end: endDate, start: startDate }
					};
				}
				// store item in the dedicated group
				groups[`W${weeks}`].items.push(item);
			}
		});

		return groups;
	}

	// group months on a 12 months period
	groupByMonth(period: number = 12): GroupList {
		const groups: GroupList = {};

		const now = new Date();
		const twelveMonthsAgo = new Date(now);
		twelveMonthsAgo.setMonth(now.getMonth() - 12);

		this.data.forEach((item) => {
			const itemDate = new Date(item[this.fieldName]);
			const itemYear = itemDate.getFullYear();
			const itemMonth = itemDate.getMonth();

			// if the item is within the period time, store it
			if (itemDate < twelveMonthsAgo) {
				// if group does not exist, create it
				if (!groups[`M${itemMonth}`]) {
					const startDate = new Date(itemYear, itemMonth - 1, 1);
					const endDate = new Date(itemYear, itemMonth, 0);
					groups[`M${itemMonth}`] = {
						code:   `M${itemMonth}`,
						items:  [],
						name:   startDate.toLocaleString('default', { month: 'long' }),
						order:  itemMonth,
						period: { end: endDate, start: startDate }
					};
				}
				// store item in the dedicated group
				groups[`M${itemMonth}`].items.push(item);
			}
		});

		return groups;
	}

	// group years on a 12 months period
	groupByYear(gap: number = 12) {
		const now = new Date();
		const xMonthsAgo = new Date(now);
		xMonthsAgo.setMonth(now.getMonth() - gap);

		const groups: Group<T>[] = [];

		this.data.forEach((item) => {
			const itemDate = new Date(item[this.fieldName]);
			const itemYear = itemDate.getFullYear();

			// if the item is older than 12 months, store it
			if (itemDate > xMonthsAgo) {
			}
		});

		return groups;
	}
}

// Exemple d'utilisation
const chatData: DbChat[] = [
	// Insérez ici vos éléments ChatDataType
];

const options = { fieldName: 'createdAt' };
const chatGrouper = new ChatDataGrouper(chatData, options);

/* console.log('Groupes par jour :');
console.log(chatGrouper.groupByDays());

console.log('Groupes par semaine :');
console.log(chatGrouper.groupByWeek());

console.log('Groupes par mois :');
console.log(chatGrouper.groupByMonth());

console.log('Groupes par année :');
console.log(chatGrouper.groupByYear()); */

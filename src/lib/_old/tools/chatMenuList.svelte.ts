import type { DbChat } from '$types/db';
import { addWeeks, differenceInMonths, differenceInWeeks, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

type GroupItem = {
	code:   string;
	name:   string;
	order:  number;
	items:  DbChat[];
	period: { start: Date; end: Date };
};

const groups: {
	last7Days:  DbChat[];
	last30Days: DbChat[];
	byMonth:    Record<string, DbChat[]>;
	byYear:     Record<string, DbChat[]>;
} = {
	byMonth:    {},
	byYear:     {},
	last30Days: [],
	last7Days:  []
};

/*`months${idx}ago`, `months ${idx} ago`
 `weeks${idx}ago`, `weeks ${idx} ago`
 ui.thisWeek
 ui.lastWeek
 ui.lastMonth
 */
export function getPeriodGroup(datedate: string | Date) {
	const date = new Date(datedate);
	const now = new Date();
	const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
	const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
	const startOfLastWeek = startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
	const endOfLastWeek = endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
	const startOfLastMonth = startOfMonth(addWeeks(now, -4));
	const endOfLastMonth = endOfMonth(addWeeks(now, -4));

	if (date >= startOfCurrentWeek && date <= endOfCurrentWeek) {
		return 'this week';
	} else if (date >= startOfLastWeek && date <= endOfLastWeek) {
		return 'last week';
	} else if (date >= startOfLastMonth && date <= endOfLastMonth) {
		return 'last month';
	} else {
		return 'two months ago or more';
	}
}

export function getDatePeriod(date: Date) {
	const now = new Date();
	const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
	const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
	const startOfLastWeek = startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
	const endOfLastWeek = endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });

	if (date >= startOfCurrentWeek && date <= endOfCurrentWeek) {
		return { title: 'cette semaine', code: 'ui.thisWeek' };
	} else if (date >= startOfLastWeek && date <= endOfLastWeek) {
		return { title: 'la semaine dernière', code: 'ui.lastWeek' };
	} else {
		const weeksAgo = differenceInWeeks(now, date);
		const monthsAgo = differenceInMonths(now, date);

		if (weeksAgo > 0 && weeksAgo < 4) {
			return {
				title: `il y a ${weeksAgo} semaines`,
				code:  `ui.weeks${weeksAgo}ago`
			};
		} else if (monthsAgo > 0) {
			return {
				title: `il y a ${monthsAgo} mois`,
				code:  `ui.months${monthsAgo}ago`
			};
		}
	}

	return { title: 'date invalide', code: 'ui.invalidDate' };
}

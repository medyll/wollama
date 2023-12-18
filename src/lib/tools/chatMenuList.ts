import type {  ChatType,   } from '$types/db';
import { derived, get } from 'svelte/store';
import { addWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'; 
import { guessChatTitle } from './chatUtils';
import { dbQuery } from '$lib/db/dbQuery';
import { liveQuery } from 'dexie';
import { ui } from '$lib/stores/ui';

export class Utils {
	static resolveDotPath(
		object: Record<string, any>,
		path: string,
		defaultValue?: any
	): any | undefined {
		return path.split('.').reduce((r, s) => (r ? r[s] : defaultValue), object) ?? undefined;
	}
}

type GroupItem = {
	code: string;
	name: string;
	order: number;
	items: ChatType[];
	period: { start: Date; end: Date };
};

function sortList(list: ChatType[]): ChatType[] {
	return list.sort(
		(a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
	);
}

const groups: {
	last7Days: ChatType[];
	last30Days: ChatType[];
	byMonth: Record<string, ChatType[]>;
	byYear: Record<string, ChatType[]>;
} = {
	last7Days: [],
	last30Days: [],
	byMonth: {},
	byYear: {}
};

function getStartAndEndOfWeek(date: Date, firstDayOfWeek: any = 1): { start: Date; end: Date } {
	const start = startOfWeek(date, { weekStartsOn: firstDayOfWeek });
	const end = endOfWeek(date, { weekStartsOn: firstDayOfWeek });
	start.setHours(0, 0, 0, 0);
	end.setHours(23, 59, 59, 999);

	return { start, end };
}



export function getTimeTitle(inputText: string) {
	const match = inputText.match(/(weeks|months)(\d+)/);

	if (match) {
		const timeUnit = match[1];
		const timeValue = parseInt(match[2]);

		if (timeUnit === 'weeks') {
			if (timeValue === 0) {
				return 'ui.thisWeek';
			} else if (timeValue === 1) {
				return 'ui.lastWeek';
			} else {
				return `il y a ${timeValue} semaines`;
			}
		} else if (timeUnit === 'months') {
			if (timeValue === 0) {
				return 'ce mois-ci';
			} else if (timeValue === 1) {
				return 'mois dernier';
			} else {
				return `il y a ${timeValue} mois`;
			}
		}
	}

	return 'Format invalide';
}

function groupChatMessages(
	sortedList: ChatType[],
	args = { weekGroupSize: 3, monthGroupSize: 5 }
) {
	const firstDayOfWee = 1;
	const now = new Date();
	const finalGroupList: GroupItem[] = [];

	const xWeeksAgo = endOfWeek(addWeeks(now, -3));
	const weekPeriod = getStartAndEndOfWeek(new Date(), 1);

	const lastXWeeks = [...Array(args.weekGroupSize)].map((a, i) => {
		const date = new Date(weekPeriod.start.getTime());
		date.setDate(date.getDate() - 7 * i);
		const start = startOfWeek(date, { weekStartsOn: firstDayOfWee }).getTime();
		const end = endOfWeek(date, { weekStartsOn: firstDayOfWee }).getTime();

		return { start, end };
	});

	const lastXMonths = [...Array(12)].map((a, i) => {
		i++;
		const date = new Date(xWeeksAgo);
		date.setMonth(date.getMonth() - i);
		const start = startOfMonth(date).getTime();
		const end = endOfMonth(date).getTime();
		return { start, end };
	});

	// loop weeks
	lastXWeeks.forEach((week, idx) => {
		const group = createGroupItem(`weeks${idx}ago`, `weeks ${idx} ago`, week, idx);
		// loop chats
		for (const item of sortedList) {
			if (
				new Date(item.dateCreation).getTime() >= week.start &&
				new Date(item.dateCreation).getTime() <= week.end
			) {
				if (!groups.byMonth[idx]) groups.byMonth[idx] = [];
				group.items.push(item);
			}
		}
		if (group.items.length > 0) finalGroupList.push(group);
	});

	// loop months
	lastXMonths.forEach((month, idx) => {
		const group = createGroupItem(`months${idx}ago`, `months ${idx} ago`, month, idx);
		// loop chats
		for (const item of sortedList) {
			if (
				new Date(item.dateCreation).getTime() >= month.start &&
				new Date(item.dateCreation).getTime() <= month.end
			) {
				if (!groups.byMonth[idx]) groups.byMonth[idx] = [];
				group.items.push(item);
			}
		}
		if (group.items.length) finalGroupList.push(group);
	});

	return finalGroupList;

	function createGroupItem(
		code: string,
		name: string,
		period: { start: string; end: string },
		order?: number
	) {
		return {
			code,
			name,
			order,
			period,
			items: []
		};
	}
}
 

const chatList = liveQuery(()=>dbQuery.getChats())
export const testStore = derived([ui, chatList], ([$ui, $chatList]) => {
	const regex = new RegExp($ui.searchString, 'i');
	const list = ($chatList ?? []).filter((x) => regex.test(x?.title));
	
	return groupChatMessages(sortList(list ?? []));
});

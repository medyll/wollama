import { chatter, type ChatDataType, type ChatListType } from '$lib/stores/chatter';
import { derived } from 'svelte/store';
import { addWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

type GroupItem = {
	code: string;
	name: string;
	order: number;
	items: ChatDataType[];
	period: { start: Date; end: Date };
};

function sortList(list: ChatListType): ChatDataType[] {
	return Object.values(list).sort(
		(a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
	);
}

const groups: {
	last7Days: ChatDataType[];
	last30Days: ChatDataType[];
	byMonth: Record<string, ChatDataType[]>;
	byYear: Record<string, ChatDataType[]>;
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

function groupChatMessages(
	sortedList: ChatDataType[],
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
// derived from chatList
export const messageByGroupDate = derived(chatter, ($chatter) => {
	return groupChatMessages(sortList($chatter));
});

import type { DbChat } from "$types/db";
import {
  addWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInWeeks,
  differenceInMonths,
} from "date-fns";

type GroupItem = {
  code: string;
  name: string;
  order: number;
  items: DbChat[];
  period: { start: Date; end: Date };
};

function sortList(list: DbChat[]): DbChat[] {
  return list.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

const groups: {
  last7Days: DbChat[];
  last30Days: DbChat[];
  byMonth: Record<string, DbChat[]>;
  byYear: Record<string, DbChat[]>;
} = {
  byMonth: {},
  byYear: {},
  last30Days: [],
  last7Days: [],
};

function getStartAndEndOfWeek(
  date: Date,
  firstDayOfWeek: any = 1
): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: firstDayOfWeek });
  const end = endOfWeek(date, { weekStartsOn: firstDayOfWeek });
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { end, start };
}

export function getDatePeriod(date: Date) {
  const now = new Date();
  const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });
  const startOfLastWeek = startOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });
  const endOfLastWeek = endOfWeek(addWeeks(now, -1), { weekStartsOn: 1 });

  if (date >= startOfCurrentWeek && date <= endOfCurrentWeek) {
    return { title: "cette semaine", code: "ui.thisWeek" };
  } else if (date >= startOfLastWeek && date <= endOfLastWeek) {
    return { title: "la semaine dernière", code: "ui.lastWeek" };
  } else {
    const weeksAgo = differenceInWeeks(now, date);
    const monthsAgo = differenceInMonths(now, date);

    if (weeksAgo > 0 && weeksAgo < 4) {
      return {
        title: `il y a ${weeksAgo} semaines`,
        code: `ui.weeks${weeksAgo}ago`,
      };
    } else if (monthsAgo > 0) {
      return {
        title: `il y a ${monthsAgo} mois`,
        code: `ui.months${monthsAgo}ago`,
      };
    }
  }

  return { title: "date invalide", code: "ui.invalidDate" };
}

export function getTimeTitle(inputText: string) {
  if (!inputText) return "Format invalide";
  const match = inputText.match(/(weeks|months)(\d+)/);

  if (match) {
    const timeUnit = match[1];
    const timeValue = parseInt(match[2]);

    if (timeUnit === "weeks") {
      if (timeValue === 0) {
        return "ui.thisWeek";
      } else if (timeValue === 1) {
        return "ui.lastWeek";
      } else {
        return `il y a ${timeValue} semaines`;
      }
    } else if (timeUnit === "months") {
      if (timeValue === 0) {
        return "ce mois-ci";
      } else if (timeValue === 1) {
        return "mois dernier";
      } else {
        return `il y a ${timeValue} mois`;
      }
    }
  }

  return "Format invalide";
}

export function groupChatMessages(
  sortedList: DbChat[],
  args = { monthGroupSize: 5, weekGroupSize: 3 }
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

    return { end, start };
  });

  const lastXMonths = [...Array(12)].map((a, i) => {
    i++;
    const date = new Date(xWeeksAgo);
    date.setMonth(date.getMonth() - i);
    const start = startOfMonth(date).getTime();
    const end = endOfMonth(date).getTime();
    return { end, start };
  });

  // loop weeks
  lastXWeeks.forEach((week, idx) => {
    const group = createGroupItem(
      `weeks${idx}ago`,
      `weeks ${idx} ago`,
      week,
      idx
    );
    // loop chats
    for (const item of sortedList) {
      if (
        new Date(item.created_at).getTime() >= week.start &&
        new Date(item.created_at).getTime() <= week.end
      ) {
        if (!groups.byMonth[idx]) groups.byMonth[idx] = [];
        group.items.push(item);
      }
    }
    if (group.items.length > 0) finalGroupList.push(group);
  });

  // loop months
  lastXMonths.forEach((month, idx) => {
    const group = createGroupItem(
      `months${idx}ago`,
      `months ${idx} ago`,
      month,
      idx
    );
    // loop chats
    for (const item of sortedList) {
      if (
        new Date(item.created_at).getTime() >= month.start &&
        new Date(item.created_at).getTime() <= month.end
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
      items: [],
      name,
      order,
      period,
    };
  }
}

export const groupMessages = (list: any[]) => {
  return groupChatMessages(list ?? []); // sortList(list ?? [])
};

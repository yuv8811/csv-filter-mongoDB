import { safeParseDate } from "../../../shared/utils/helpers";

export const getRelevantEvent = (item) => {
  // Ensure event is treated as string to prevent UI crashes on .split/.toLowerCase
  const events = item.additionalInfo?.length
    ? [...item.additionalInfo]
    : item.event
      ? [{ event: String(item.event), date: item.date }]
      : [];

  if (events.length === 0) return { event: "Unknown", date: null };

  // Sort chronologically (Oldest -> Newest)
  events.sort((a, b) => {
    const dateA = safeParseDate(a.date);
    const dateB = safeParseDate(b.date);
    return dateA - dateB;
  });

  const lastEvent = events[events.length - 1];
  // Return raw event name strictly as string
  const evName = lastEvent.event ? String(lastEvent.event) : "Unknown";

  return {
    event: evName,
    date: lastEvent.date,
    originalEvent: lastEvent,
  };
};

export const countBillableMonths = (start, end) => {
  if (!start || !end || start > end) return 0;
  const startUTC = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const endUTC = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((endUTC - startUTC) / msPerDay);
  return Math.floor(diffDays / 30);
};

export const calculateTotalSpent = (additionalInfo) => {
  if (!additionalInfo || additionalInfo.length === 0)
    return { amount: 0, months: 0 };
  let totalAmount = 0;
  let totalMonths = 0;
  let activePrice = 0;
  let startDate = null;
  const stopEvents = [
    "subscription charge canceled",
    "frozen",
    "store closed",
    "uninstalled",
    "declined",
  ];

  additionalInfo.forEach((ev) => {
    const eventName = ev.event?.toLowerCase();
    const bDate = safeParseDate(ev.billingDate);
    const eDate = safeParseDate(ev.date);

    if (eventName.includes("subscription charge activated")) {
      const priceMatch = ev.details?.match(/\$(\d+(\.\d+)?)/);
      if (priceMatch) {
        if (!bDate) return;
        if (startDate && activePrice > 0) {
          const periodMonths = countBillableMonths(startDate, bDate);
          totalAmount += periodMonths * activePrice;
          totalMonths += periodMonths;
        }
        activePrice = parseFloat(priceMatch[1]);
        startDate = bDate;
      }
    } else if (stopEvents.some((stop) => eventName?.includes(stop))) {
      if (startDate && activePrice > 0) {
        const effectiveEndDate = bDate || eDate || new Date();
        const periodMonths = countBillableMonths(startDate, effectiveEndDate);
        totalAmount += periodMonths * activePrice;
        totalMonths += periodMonths;
        startDate = null;
        activePrice = 0;
      }
    }
  });

  if (startDate && activePrice > 0) {
    const periodMonths = countBillableMonths(startDate, new Date());
    totalAmount += periodMonths * activePrice;
    totalMonths += periodMonths;
  }
  return { amount: totalAmount, months: totalMonths };
};

export const determinePlanDetails = (additionalInfo) => {
  if (!additionalInfo || additionalInfo.length === 0)
    return { price: 0, name: "", status: "Inactive" };
  let activePrice = 0;
  let activeName = "";
  let status = "Inactive";
  const stopEvents = [
    "subscription charge canceled",
    "frozen",
    "store closed",
    "uninstalled",
    "declined",
  ];

  additionalInfo.forEach((ev) => {
    const eventName = ev.event?.toLowerCase() || "";
    if (eventName.includes("subscription charge activated")) {
      const priceMatch = ev.details?.match(/\$(\d+(\.\d+)?)/);
      if (priceMatch) {
        activePrice = parseFloat(priceMatch[1]);
        let name = ev.details.replace(/\$(\d+(\.\d+)?)/, "");
        name = name.replace(/(App\s*)?Subscription\s*ID:?\s*\d+/gi, "");
        name = name.replace(/\s*-\s*USD/gi, "").replace(/\s+USD/gi, "");
        name = name.replace(/Name:/gi, "");
        name = name.replace(/[|:.-]+\s*$/g, "").replace(/^[|:.-]+\s*/g, "");
        activeName = name.trim();
        status = "Active";
      }
    } else if (stopEvents.some((stop) => eventName.includes(stop))) {
      activePrice = 0;
      activeName = "";
      status = "Inactive";
    }
  });
  return { price: activePrice, name: activeName, status };
};

export const getDisplayDate = (ev) => {
  if (!ev || !ev.date) return "";
  const dateObj = safeParseDate(ev.date);
  if (!dateObj) return "";
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

export const processShopData = (data, filters) => {
  if (!data) return [];

  return data
    .filter((item) => {
      const lastEvent = getRelevantEvent(item);
      const matchesDomain =
        !filters.shopDomain ||
        item.shopDomain
          ?.toLowerCase()
          .includes(filters.shopDomain.toLowerCase());
      const matchesStatus = (() => {
        const filterValues = Array.isArray(filters.eventStatus)
          ? filters.eventStatus
          : [filters.eventStatus];

        // Remove empty values (e.g. initial empty string or "All Statuses")
        const activeFilters = filterValues.filter((v) => v);

        if (activeFilters.length === 0) return true;

        const eventName = (lastEvent.event || "").toLowerCase();

        return activeFilters.some((filterVal) => {
          // Handle Grouped Filters (Distinct Keys to avoid collision with raw events)
          if (filterVal === "Active") {
            // Matches 'Installed' Group logic
            return (
              eventName === "installed" ||
              eventName.includes("store") ||
              (eventName.includes("subscription") &&
                !eventName.includes("canceled"))
            );
          }
          if (filterVal === "Inactive") {
            // Matches 'Uninstalled' Group logic
            return (
              eventName === "uninstalled" || eventName.includes("canceled")
            );
          }

          // Specific Event Matches (e.g. from Dropdown)
          return eventName === filterVal.toLowerCase();
        });
      })();

      const planDetails = determinePlanDetails(item.additionalInfo);
      const matchesPlan =
        !filters.planName || planDetails.name === filters.planName;

      return matchesDomain && matchesStatus && matchesPlan;
    })
    .map((item) => {
      const { amount, months } = calculateTotalSpent(item.additionalInfo);
      const planDetails = determinePlanDetails(item.additionalInfo);
      const events = item.additionalInfo || [];
      const displayEvent = getRelevantEvent(item);

      return {
        ...item,
        totalSpent: amount,
        activeMonths: months,
        planPrice: planDetails.price,
        planName: planDetails.name,
        planStatus: planDetails.status,
        firstEventDate: getDisplayDate(events[0]),
        firstEventDateRaw: events[0]?.date,
        lastEventDate: getDisplayDate(displayEvent),
        lastEventDateRaw: displayEvent?.date,
        currentEvent: displayEvent?.event || "",
      };
    })
    .sort((a, b) => {
      const getSafeTimestamp = (dateStr) => {
        const date = safeParseDate(dateStr);
        return date ? date.getTime() : 0;
      };

      if (filters.firstEventSort) {
        const timeA = getSafeTimestamp(a.firstEventDateRaw || a.firstEventDate);
        const timeB = getSafeTimestamp(b.firstEventDateRaw || b.firstEventDate);
        if (timeA !== timeB)
          return filters.firstEventSort === "asc"
            ? timeA - timeB
            : timeB - timeA;
      }
      if (filters.lastEventSort) {
        const timeA = getSafeTimestamp(a.lastEventDateRaw || a.lastEventDate);
        const timeB = getSafeTimestamp(b.lastEventDateRaw || b.lastEventDate);
        if (timeA !== timeB)
          return filters.lastEventSort === "asc"
            ? timeA - timeB
            : timeB - timeA;
      }
      if (filters.planPriceSort) {
        const valA = a.planPrice || 0;
        const valB = b.planPrice || 0;
        if (valA !== valB)
          return filters.planPriceSort === "asc" ? valA - valB : valB - valA;
      }
      return (a._id || "").localeCompare(b._id || "");
    });
};

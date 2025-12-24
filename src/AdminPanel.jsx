import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import RepositoryExplorer from "./components/RepositoryExplorer";
import ExportEngine from "./components/ExportEngine";
import Upload from "./components/Upload";
import DetailModal from "./components/DetailModal";

export default function AdminPanel() {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState("view");
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        shopDomain: "",
        eventStatus: "",
        firstEventSort: "",
        lastEventSort: "",
        totalSpentSort: ""
    });
    const [exportFilters, setExportFilters] = useState({
        shopDomain: "",
        eventStatus: [],
        firstEventSort: "",
        lastEventSort: "",
        totalSpentSort: ""
    });
    const [selectedItem, setSelectedItem] = useState(null);

    const itemsPerPage = 50;
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const res = await fetch("http://localhost:3000/");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
            setData([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const safeParseDate = (d) => {
        if (!d) return null;
        let parsed = new Date(d);
        if (!isNaN(parsed.getTime())) return parsed;

        const parts = d.split(/[-/]/);
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                parsed = new Date(parts[2], parts[1] - 1, parts[0]);
                if (!isNaN(parsed.getTime())) return parsed;
            }
            if (parts[0].length === 4) {
                parsed = new Date(parts[0], parts[1] - 1, parts[2]);
                if (!isNaN(parsed.getTime())) return parsed;
            }
        }
        return null;
    };

    const countBillableMonths = (start, end) => {
        if (!start || !end || start > end) return 0;

        const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
        const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());

        const msPerDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.floor((endUTC - startUTC) / msPerDay);

        return Math.floor(diffDays / 30);
    };

    const calculateTotalSpent = (additionalInfo) => {
        if (!additionalInfo || additionalInfo.length === 0) return { amount: 0, months: 0 };

        let totalAmount = 0;
        let totalMonths = 0;
        let activePrice = 0;
        let startDate = null;

        const stopEvents = ["subscription charge canceled", "frozen", "store closed", "uninstalled", "declined"];

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
            } else if (stopEvents.some(stop => eventName?.includes(stop))) {
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

    const sortedAndFilteredData = useMemo(() => {
        if (!data) return [];
        const activeFilters = activeTab === "view" ? filters : exportFilters;

        let result = data.filter(item => {
            const events = item.additionalInfo?.length
                ? item.additionalInfo
                : [{ event: item.event, date: item.date }];
            const lastEvent = events[events.length - 1];

            const matchesDomain =
                !activeFilters.shopDomain ||
                item.shopDomain?.toLowerCase().includes(activeFilters.shopDomain.toLowerCase());

            const matchesStatus = Array.isArray(activeFilters.eventStatus)
                ? (activeFilters.eventStatus.length === 0 || activeFilters.eventStatus.includes(lastEvent.event))
                : (!activeFilters.eventStatus || lastEvent.event?.toLowerCase() === activeFilters.eventStatus.toLowerCase());

            return matchesDomain && matchesStatus;
        }).map(item => {
            const { amount, months } = calculateTotalSpent(item.additionalInfo);
            const events = item.additionalInfo || [];

            const getDisplayDate = (ev) => {
                if (!ev) return "";
                if (ev.event?.toLowerCase().includes("activate") && ev.billingDate) {
                    return ev.billingDate;
                }
                return ev.date || "";
            };

            return {
                ...item,
                totalSpent: amount,
                activeMonths: months,
                firstEventDate: getDisplayDate(events[0]),
                lastEventDate: getDisplayDate(events[events.length - 1]),
                currentEvent: events[events.length - 1]?.event || ""
            };
        });

        const safeParseDate = (d) => {
            if (!d) return 0;
            let parsed = new Date(d);
            if (!isNaN(parsed.getTime())) return parsed.getTime();

            const parts = d.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[2].length === 4) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
            }
            return 0;
        };

        if (activeFilters.firstEventSort) {
            result.sort((a, b) => {
                const dateA = safeParseDate(a.firstEventDate);
                const dateB = safeParseDate(b.firstEventDate);
                return activeFilters.firstEventSort === "asc" ? dateA - dateB : dateB - dateA;
            });
        }

        if (activeFilters.lastEventSort) {
            result.sort((a, b) => {
                const dateA = safeParseDate(a.lastEventDate);
                const dateB = safeParseDate(b.lastEventDate);
                return activeFilters.lastEventSort === "asc" ? dateA - dateB : dateB - dateA;
            });
        }

        if (activeFilters.totalSpentSort) {
            result.sort((a, b) => {
                return activeFilters.totalSpentSort === "asc"
                    ? a.totalSpent - b.totalSpent
                    : b.totalSpent - a.totalSpent;
            });
        }
        return result;
    }, [data, filters, exportFilters, activeTab]);

    const currentDataSlice = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredData, currentPage]);

    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredData.length / itemsPerPage));

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            ...(name === "firstEventSort" && value ? { lastEventSort: "", totalSpentSort: "" } : {}),
            ...(name === "lastEventSort" && value ? { firstEventSort: "", totalSpentSort: "" } : {}),
            ...(name === "totalSpentSort" && value ? { firstEventSort: "", lastEventSort: "" } : {})
        }));
        setCurrentPage(1);
    };

    const handleExportFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            setExportFilters(prev => {
                const currentStatuses = prev.eventStatus;
                if (checked) {
                    return { ...prev, eventStatus: [...currentStatuses, value] };
                } else {
                    return { ...prev, eventStatus: currentStatuses.filter(s => s !== value) };
                }
            });
        } else {
            setExportFilters(prev => ({
                ...prev,
                [name]: value,
                ...(name === "firstEventSort" && value ? { lastEventSort: "", totalSpentSort: "" } : {}),
                ...(name === "lastEventSort" && value ? { firstEventSort: "", totalSpentSort: "" } : {}),
                ...(name === "totalSpentSort" && value ? { firstEventSort: "", lastEventSort: "" } : {})
            }));
        }
    };

    const handleExportStatusBulk = (shouldSelectAll) => {
        setExportFilters(prev => ({
            ...prev,
            eventStatus: shouldSelectAll ? statuses : []
        }));
    };

    const resetFilters = () => {
        const defaultFilters = {
            shopDomain: "",
            eventStatus: activeTab === "export" ? [] : "",
            firstEventSort: "",
            lastEventSort: "",
            totalSpentSort: ""
        };
        if (activeTab === "view") setFilters(defaultFilters);
        else setExportFilters(defaultFilters);
        setCurrentPage(1);
    };

    const statuses = useMemo(() => {
        if (!data) return [];
        const set = new Set();
        data.forEach(item => {
            const events = item.additionalInfo?.length
                ? item.additionalInfo
                : [{ event: item.event }];
            set.add(events[events.length - 1]?.event);
        });
        return [...set].filter(Boolean).sort();
    }, [data]);

    const exportToCSV = () => {
        const headers = ["Shop Domain", "Shop Name", "Shop Country", "Shop Email", "Latest Status", "First Event Date", "Last Event Date", "Total Spent", "Active Months"];
        const csvRows = [
            headers.join(","),
            ...sortedAndFilteredData.map(item => {
                const events = item.additionalInfo?.length ? item.additionalInfo : [{ event: item.event, date: item.date }];
                const lastEvent = events[events.length - 1];
                return [
                    item.shopDomain,
                    item.shopName,
                    item.shopCountry,
                    item.shopEmail,
                    lastEvent.event,
                    item.date,
                    lastEvent.date,
                    item.totalSpent.toFixed(2),
                    item.activeMonths
                ].map(val => `"${(val || "").toString().replace(/"/g, '""')}"`).join(",");
            })
        ];

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `filtered_shops_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (data === null) {
        return (
            <div className="loading-container">
                <div className="loader" />
                <p>Initialising Admin Control Panel...</p>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onExit={() => navigate("/")}
            />

            <main className="admin-main">
                {activeTab === "view" && (
                    <RepositoryExplorer
                        data={currentDataSlice}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        statuses={statuses}
                        resetFilters={resetFilters}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        handlePageChange={setCurrentPage}
                        onViewDetail={setSelectedItem}
                        originalDataCount={sortedAndFilteredData.length}
                    />
                )}
                {activeTab === "import" && (
                    <Upload onSuccess={() => {
                        fetchData();
                        setActiveTab("view");
                    }} />
                )}
                {activeTab === "export" && (
                    <ExportEngine
                        filters={exportFilters}
                        handleFilterChange={handleExportFilterChange}
                        handleStatusBulk={handleExportStatusBulk}
                        statuses={statuses}
                        resetFilters={resetFilters}
                        recordCount={sortedAndFilteredData.length}
                        onExport={exportToCSV}
                    />
                )}
            </main>

            <DetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}

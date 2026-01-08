import { useEffect, useState, useMemo } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import RepositoryExplorer from "./components/RepositoryExplorer";
import ExportEngine from "./components/ExportEngine";
import Upload from "./components/Upload";
import DetailModal from "./components/DetailModal";
import MetafieldSearch from "./components/MetafieldSearch";
import Analytics from "./components/Analytics";
import Login from "./components/login";
import SessionData from "./components/session_data";
import StoreVisit from "./components/storeVisit";

import { safeParseDate } from "./utils/helpers";

const getRelevantEvent = (item) => {
    const events = item.additionalInfo?.length
        ? item.additionalInfo
        : [{ event: item.event, date: item.date }];

    const allowed = ['uninstalled', 'installed', 'store closed', 'store reopen'];

    for (let i = events.length - 1; i >= 0; i--) {
        const evName = events[i].event?.toLowerCase().trim();
        if (allowed.includes(evName)) {
            return events[i];
        }
    }
    return events[events.length - 1];
};

export default function AdminPanel() {
    const location = useLocation();
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const auth = localStorage.getItem("isAuthenticated") === "true";
        const timestamp = localStorage.getItem("loginTimestamp");
        const userId = localStorage.getItem("userId");
        const twelveHours = 12 * 60 * 60 * 1000;

        if (auth && timestamp && userId) {
            const now = new Date().getTime();
            if (now - parseInt(timestamp, 10) < twelveHours) {
                return true;
            }
        }
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("loginTimestamp");
        localStorage.removeItem("userId");
        return false;
    });

    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("loginTimestamp");
        localStorage.removeItem("userId");
        setIsAuthenticated(false);
    };

    useEffect(() => {
        if (!isAuthenticated) return;

        const checkAuth = async () => {
            const timestamp = localStorage.getItem("loginTimestamp");
            const userId = localStorage.getItem("userId");
            const twelveHours = 12 * 60 * 60 * 1000;
            const now = new Date().getTime();

            if (!timestamp || (now - parseInt(timestamp, 10) > twelveHours)) {
                handleLogout();
                return;
            }

            if (userId) {
                try {
                    const res = await fetch("http://localhost:3000/verify-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId })
                    });
                    const result = await res.json();
                    if (!result.valid) {
                        handleLogout();
                    }
                } catch (err) {
                    console.error("Auth check failed", err);
                }
            } else {
                handleLogout();
            }
        };

        checkAuth();
        checkAuth();
        const interval = setInterval(checkAuth, 5000);
        return () => clearInterval(interval);
    }, [isAuthenticated, location.pathname]);

    const [currentPage, setCurrentPage] = useState(1);

    const handleLoginSuccess = (user) => {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("loginTimestamp", new Date().getTime().toString());
        if (user && user._id) {
            localStorage.setItem("userId", user._id);
        }
        setIsAuthenticated(true);
    };
    const [filters, setFilters] = useState({
        shopDomain: "",
        eventStatus: "",
        firstEventSort: "",
        lastEventSort: "",
        planPriceSort: ""
    });
    const [exportFilters, setExportFilters] = useState({
        shopDomain: "",
        eventStatus: [],
        firstEventSort: "",
        lastEventSort: "",
        planPriceSort: ""
    });
    const [selectedItem, setSelectedItem] = useState(null);

    const itemsPerPage = 50;

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
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);



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

    const determinePlanDetails = (additionalInfo) => {
        if (!additionalInfo || additionalInfo.length === 0) return { price: 0, name: '', status: 'Inactive' };

        let activePrice = 0;
        let activeName = '';
        let status = 'Inactive';
        const stopEvents = ["subscription charge canceled", "frozen", "store closed", "uninstalled", "declined"];

        additionalInfo.forEach(ev => {
            const eventName = ev.event?.toLowerCase() || "";
            if (eventName.includes("subscription charge activated")) {
                const priceMatch = ev.details?.match(/\$(\d+(\.\d+)?)/);
                if (priceMatch) {
                    activePrice = parseFloat(priceMatch[1]);
                    let name = ev.details.replace(/\$(\d+(\.\d+)?)/, '');
                    name = name.replace(/(App\s*)?Subscription\s*ID:?\s*\d+/gi, '');
                    name = name.replace(/\s*-\s*USD/gi, '').replace(/\s+USD/gi, '');
                    name = name.replace(/Name:/gi, '');
                    name = name.replace(/[|:.-]+\s*$/g, '').replace(/^[|:.-]+\s*/g, '');
                    activeName = name.trim();
                    status = 'Active';
                }
            } else if (stopEvents.some(stop => eventName.includes(stop))) {
                activePrice = 0;
                activeName = '';
                status = 'Inactive';
            }
        });
        return { price: activePrice, name: activeName, status };
    };

    const sortedAndFilteredData = useMemo(() => {
        if (!data) return [];
        const isExport = location.pathname.includes("export");
        const activeFilters = isExport ? exportFilters : filters;

        let result = data.filter(item => {
            const lastEvent = getRelevantEvent(item);

            const matchesDomain =
                !activeFilters.shopDomain ||
                item.shopDomain?.toLowerCase().includes(activeFilters.shopDomain.toLowerCase());

            const matchesStatus = Array.isArray(activeFilters.eventStatus)
                ? (activeFilters.eventStatus.length === 0 || activeFilters.eventStatus.includes(lastEvent.event))
                : (!activeFilters.eventStatus || lastEvent.event?.toLowerCase() === activeFilters.eventStatus.toLowerCase());

            return matchesDomain && matchesStatus;
        }).map(item => {
            const { amount, months } = calculateTotalSpent(item.additionalInfo);
            const planDetails = determinePlanDetails(item.additionalInfo);
            const events = item.additionalInfo || [];

            const getDisplayDate = (ev) => {
                if (!ev || !ev.date) return "";
                const dateObj = safeParseDate(ev.date);
                if (!dateObj) return "";
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                return `${day}-${month}-${year}`;
            };

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
                currentEvent: displayEvent?.event || ""
            };
        });



        const compareValues = (a, b, sortDir) => {
            if (a === b) return 0;
            if (a === null || a === undefined) return 1;
            if (b === null || b === undefined) return -1;

            if (sortDir === 'asc') return a < b ? -1 : 1;
            return a > b ? -1 : 1;
        };

        const getSafeTimestamp = (dateStr) => {
            const date = safeParseDate(dateStr);
            return date ? date.getTime() : 0;
        };

        if (activeFilters.firstEventSort) {
            result.sort((a, b) => {
                const timeA = getSafeTimestamp(a.firstEventDateRaw || a.firstEventDate);
                const timeB = getSafeTimestamp(b.firstEventDateRaw || b.firstEventDate);

                if (timeA !== timeB) {
                    return activeFilters.firstEventSort === 'asc' ? timeA - timeB : timeB - timeA;
                }
                return (a._id || '').localeCompare(b._id || '');
            });
        }

        if (activeFilters.lastEventSort) {
            result.sort((a, b) => {
                const timeA = getSafeTimestamp(a.lastEventDateRaw || a.lastEventDate);
                const timeB = getSafeTimestamp(b.lastEventDateRaw || b.lastEventDate);

                if (timeA !== timeB) {
                    return activeFilters.lastEventSort === 'asc' ? timeA - timeB : timeB - timeA;
                }
                return (a._id || '').localeCompare(b._id || '');
            });
        }

        if (activeFilters.planPriceSort) {
            result.sort((a, b) => {
                const valA = a.planPrice || 0;
                const valB = b.planPrice || 0;

                if (valA !== valB) {
                    return activeFilters.planPriceSort === 'asc' ? valA - valB : valB - valA;
                }
                return (a._id || '').localeCompare(b._id || '');
            });
        }

        return result;
    }, [data, filters, exportFilters, location.pathname]);

    const currentDataSlice = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredData, currentPage]);

    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredData.length / itemsPerPage));

    const totalAmount = useMemo(() => {
        return sortedAndFilteredData.reduce((acc, item) => acc + (item.totalSpent || 0), 0);
    }, [sortedAndFilteredData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            ...(name === "firstEventSort" && value ? { lastEventSort: "", planPriceSort: "" } : {}),
            ...(name === "lastEventSort" && value ? { firstEventSort: "", planPriceSort: "" } : {}),
            ...(name === "planPriceSort" && value ? { firstEventSort: "", lastEventSort: "" } : {})
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
                ...(name === "firstEventSort" && value ? { lastEventSort: "", planPriceSort: "" } : {}),
                ...(name === "lastEventSort" && value ? { firstEventSort: "", planPriceSort: "" } : {}),
                ...(name === "planPriceSort" && value ? { firstEventSort: "", lastEventSort: "" } : {})
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
        const isExport = location.pathname.includes("export");
        const defaultFilters = {
            shopDomain: "",
            eventStatus: isExport ? [] : "",
            firstEventSort: "",
            lastEventSort: "",
            planPriceSort: ""
        };
        if (!isExport) setFilters(defaultFilters);
        else setExportFilters(defaultFilters);
        setCurrentPage(1);
    };

    const statuses = useMemo(() => {
        if (!data) return [];
        const set = new Set();
        data.forEach(item => {
            set.add(getRelevantEvent(item)?.event);
        });
        return [...set].filter(Boolean).sort();
    }, [data]);

    const exportToCSV = () => {
        const headers = ["Shop Domain", "Shop Name", "Shop Country", "Shop Email", "Latest Status", "First Event Date", "Last Event Date", "Total Spent", "Active Months"];
        const csvRows = [
            headers.join(","),
            ...sortedAndFilteredData.map(item => {
                return [
                    item.shopDomain,
                    item.shopName,
                    item.shopCountry,
                    item.shopEmail,
                    item.currentEvent,
                    item.firstEventDate,
                    item.lastEventDate,
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





    if (!isAuthenticated) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

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
                onLogout={handleLogout}
            />

            <main className="admin-main">
                <Routes>
                    <Route path="/" element={
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


                            totalAmount={totalAmount}
                        />
                    } />
                    <Route path="/import" element={
                        <Upload onSuccess={() => {
                            fetchData();
                            navigate("/");
                        }} />
                    } />
                    <Route path="/export" element={
                        <ExportEngine
                            filters={exportFilters}
                            handleFilterChange={handleExportFilterChange}
                            handleStatusBulk={handleExportStatusBulk}
                            statuses={statuses}
                            resetFilters={resetFilters}
                            recordCount={sortedAndFilteredData.length}
                            onExport={exportToCSV}
                        />
                    } />
                    <Route path="/analytics" element={<Analytics data={data} />} />
                    <Route path="/metafields" element={<MetafieldSearch />} />
                    <Route path="/session-data" element={<SessionData />} />
                    <Route path="/store-visits" element={<StoreVisit />} />
                </Routes>
            </main>

            <DetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />

        </div>
    );
}

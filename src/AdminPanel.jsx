import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./components/sidebar";
import RepositoryExplorer from "./components/RepositoryExplorer";
import ExportEngine from "./components/ExportEngine";
import Upload from "./components/Upload";
import DetailModal from "./components/DetailModal";

export default function AdminPanel() {
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState("view"); // "view", "import", or "export"
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        shopDomain: "",
        eventStatus: "",
        firstEventSort: "",
        lastEventSort: ""
    });
    const [exportFilters, setExportFilters] = useState({
        shopDomain: "",
        eventStatus: [], // Array for multiple selection
        firstEventSort: "",
        lastEventSort: ""
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const filterRef = useRef(null);

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

    useEffect(() => {
        function handleClickOutside(event) {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        });

        const parseDate = (d) => {
            const parsed = new Date(d);
            return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
        };

        if (activeFilters.firstEventSort) {
            result.sort((a, b) => {
                const dateA = parseDate(a.date);
                const dateB = parseDate(b.date);
                return activeFilters.firstEventSort === "asc" ? dateA - dateB : dateB - dateA;
            });
        }

        if (activeFilters.lastEventSort) {
            result.sort((a, b) => {
                const lastA = parseDate(a.additionalInfo?.length
                    ? a.additionalInfo[a.additionalInfo.length - 1].date
                    : a.date);
                const lastB = parseDate(b.additionalInfo?.length
                    ? b.additionalInfo[b.additionalInfo.length - 1].date
                    : b.date);
                return activeFilters.lastEventSort === "asc" ? lastA - lastB : lastB - lastA;
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
            ...(name === "firstEventSort" && value ? { lastEventSort: "" } : {}),
            ...(name === "lastEventSort" && value ? { firstEventSort: "" } : {})
        }));
        setCurrentPage(1);
    };

    const handleExportFilterChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "eventStatus") {
            setExportFilters(prev => {
                const currentStatus = prev.eventStatus || [];
                const newStatus = checked
                    ? [...currentStatus, value]
                    : currentStatus.filter(s => s !== value);
                return { ...prev, eventStatus: newStatus };
            });
        } else {
            setExportFilters(prev => ({
                ...prev,
                [name]: value,
                ...(name === "firstEventSort" && value ? { lastEventSort: "" } : {}),
                ...(name === "lastEventSort" && value ? { firstEventSort: "" } : {})
            }));
        }
    };

    const handleExportStatusBulk = (action) => {
        setExportFilters(prev => ({
            ...prev,
            eventStatus: action === "all" ? [...statuses] : []
        }));
    };

    const resetFilters = () => {
        if (activeTab === "view") {
            setFilters({
                shopDomain: "",
                eventStatus: "",
                firstEventSort: "",
                lastEventSort: ""
            });
            setCurrentPage(1);
        } else {
            setExportFilters({
                shopDomain: "",
                eventStatus: [],
                firstEventSort: "",
                lastEventSort: ""
            });
        }
    };

    const exportToCSV = () => {
        const headers = ["Shop Domain", "Shop Name", "Shop Country", "Shop Email", "Latest Status", "First Event Date", "Last Event Date"];
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
                    lastEvent.date
                ].map(val => `"${(val || "").toString().replace(/"/g, '""')}"`).join(",");
            })
        ];
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
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
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        filterRef={filterRef}
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

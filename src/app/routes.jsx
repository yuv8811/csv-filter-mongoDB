import { useState, useMemo } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../shared/components/Sidebar/Sidebar";
import RepositoryExplorer from "../modules/dashboard/components/RepositoryExplorer";
import ExportEngine from "../modules/export/components/ExportEngine";
import Upload from "../modules/import/components/Upload";
import DetailModal from "../modules/dashboard/components/DetailModal";
import MetafieldSearch from "../modules/metafields/components/MetafieldSearch";
import Analytics from "../modules/analytics/pages/Analytics";
import Login from "../modules/auth/pages/Login";
import SessionData from "../modules/sessions/pages/Sessions";
import StoreVisit from "../modules/storeVisits/pages/StoreVisits";
import StoreData from "../modules/storeData/pages/storeData";

import { safeParseDate } from "../shared/utils/helpers";
import authService from "../modules/auth/services/auth.service";
import dataService from "../shared/services/data.service";
import useFetch from "../shared/hooks/useFetch";
import usePagination from "../shared/hooks/usePagination";
import useFilters from "../shared/hooks/useFilters";
import useAuth from "../modules/auth/hooks/useAuth";
import { processShopData, getRelevantEvent } from "../modules/dashboard/utils/dataProcessor";

export default function AdminPanel() {
    const location = useLocation();
    const navigate = useNavigate();

    // Auth Hook
    const { isAuthenticated, userRole, loginSuccess, logout } = useAuth();

    // Data Fetching Hook
    const { data: rawData, loading, execute: refetchData } = useFetch(
        dataService.getAllRecords,
        isAuthenticated // Fetch immediately if authenticated
    );

    // Filter Hooks
    const {
        filters,
        updateFilter: updateMainFilter,
        updateFilters: updateMainFilters,
        resetFilters: resetMainFilters
    } = useFilters({
        shopDomain: "",
        eventStatus: [],
        firstEventSort: "",
        lastEventSort: "",
        planPriceSort: ""
    }, true);

    const {
        filters: exportFilters,
        updateFilter: updateExportFilter,
        updateFilters: updateExportFilters,
        resetFilters: resetExportFilters
    } = useFilters({
        shopDomain: "",
        eventStatus: [],
        firstEventSort: "",
        lastEventSort: "",
        planPriceSort: ""
    });

    const [selectedItem, setSelectedItem] = useState(null);

    // Process Data
    const processedData = useMemo(() => {
        const isExport = location.pathname.includes("export");
        const activeFilters = isExport ? exportFilters : filters;
        return processShopData(rawData || [], activeFilters);
    }, [rawData, filters, exportFilters, location.pathname]);

    // Pagination Hook
    const {
        currentData: currentDataSlice,
        currentPage,
        totalPages,
        setCurrentPage
    } = usePagination(processedData, 50);

    // Derived State
    const totalAmount = useMemo(() => {
        return processedData.reduce((acc, item) => acc + (item.totalSpent || 0), 0);
    }, [processedData]);

    const statuses = useMemo(() => {
        if (!rawData) return [];
        const set = new Set();
        rawData.forEach(item => {
            set.add(getRelevantEvent(item)?.event);
        });
        return [...set].filter(Boolean).sort();
    }, [rawData]);

    // Handlers
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Handle Mutually Exclusive Sorts
        const isSort = name.toLowerCase().includes('sort');
        const updates = { [name]: value };

        if (isSort && value) {
            ["firstEventSort", "lastEventSort", "planPriceSort"].forEach(key => {
                if (key !== name) updates[key] = "";
            });
        }

        updateMainFilters(updates);
        setCurrentPage(1);
    };

    const handleExportFilterChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            const current = exportFilters.eventStatus || [];
            const updated = checked
                ? [...current, value]
                : current.filter(s => s !== value);
            updateExportFilter("eventStatus", updated);
        } else {
            // Handle Mutually Exclusive Sorts for Export
            const isSort = name.toLowerCase().includes('sort');
            const updates = { [name]: value };

            if (isSort && value) {
                ["firstEventSort", "lastEventSort", "planPriceSort"].forEach(key => {
                    if (key !== name) updates[key] = "";
                });
            }
            updateExportFilters(updates);
        }
    };

    const handleExportStatusBulk = (shouldSelectAll) => {
        updateExportFilter("eventStatus", shouldSelectAll ? statuses : []);
    };

    const resetFilters = () => {
        const isExport = location.pathname.includes("export");
        if (!isExport) resetMainFilters();
        else resetExportFilters();
        setCurrentPage(1);
    };

    const exportToCSV = () => {
        const headers = ["Shop Domain", "Shop Name", "Shop Country", "Shop Email", "Latest Status", "First Event Date", "Last Event Date", "Total Spent", "Active Months"];
        const csvRows = [
            headers.join(","),
            ...processedData.map(item => {
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
        return <Login onLoginSuccess={loginSuccess} />;
    }

    if (loading && !rawData) {
        return (
            <div className="loading-container">
                <div className="loader" />
                <p>Initialising Admin Control Panel...</p>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar onLogout={logout} userRole={userRole} />

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
                            originalDataCount={processedData.length}
                            totalAmount={totalAmount}
                            userRole={userRole}
                        />
                    } />
                    <Route path="/import" element={
                        <Upload onSuccess={() => {
                            refetchData();
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
                            recordCount={processedData.length}
                            onExport={exportToCSV}
                        />
                    } />
                    <Route path="/analytics" element={<Analytics data={rawData} updateMainFilter={updateMainFilter} />} />
                    <Route path="/metafields" element={<MetafieldSearch />} />
                    <Route path="/session-data" element={<SessionData />} />
                    <Route path="/store-visits" element={<StoreVisit />} />
                    <Route path="/store-data/:storeName" element={<StoreData />} />
                </Routes>
            </main>

            <DetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </div>
    );
}

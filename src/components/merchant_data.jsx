import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const MerchantData = () => {
    const [rawData, setRawData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                const res = await fetch(`${API_URL}/merchant-data`, {
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(`Request failed (${res.status})`);
                }

                const json = await res.json();
                setRawData(Array.isArray(json) ? json : []);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Merchant fetch failed:", err);
                    setError(err.message);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, []);
    const merchants = useMemo(() => {
        return rawData.map((item) => {
            let customerPortalCount = null;

            if (Array.isArray(item.analytics)) {
                const portalAnalytics = item.analytics.find(
                    (a) => a?.events?.customer_portal
                );

                customerPortalCount =
                    portalAnalytics?.events?.customer_portal?.count ?? null;
            } else {
                console.warn(
                    "Invalid analytics structure for:",
                    item.storeName
                );
            }

            return {
                id: item._id,
                storeName: item.storeName || "N/A",
                customerPortalCount,
            };
        });
    }, [rawData]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader" />
                <p>Loading Merchant Data...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="repository-container">
            <div className="data-header">
                <h1>Merchant Data Analytics</h1>
                <p>
                    Total Records: <strong>{merchants.length}</strong>
                </p>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Store Name</th>
                            <th>Customer Views</th>
                        </tr>
                    </thead>
                    <tbody>
                        {merchants.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="empty-state-cell">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            merchants.map((m) => (
                                <tr key={m.id}>
                                    <td className="font-semibold">
                                        {m.storeName}
                                    </td>
                                    <td
                                        className="font-mono-muted"
                                        style={{ fontWeight: "bold" }}
                                    >
                                        {m.customerPortalCount ?? "—"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MerchantData;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../../styles/App.css";
import "../../../styles/sidepanel.css";
import "../../../styles/storeVisits.css";
import storeVisitService from "../services/storeVisits.service";
import { normalizeDomain } from "../../../shared/utils/helpers";

const StoreVisit = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const json = await storeVisitService.getStoreVisits(controller.signal);
                setData(Array.isArray(json) ? json : []);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Store visit fetch failed:", err);
                    setError(err.message || "Something went wrong");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        fetchData();
        return () => controller.abort();
    }, []);

    const onViewDetail = (item) => {
        navigate(`/store-data/${encodeURIComponent(item.shopDomain)}`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader" />
                <p>Loading Analytics...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="repository-container">
            <div style={{ marginBottom: "1rem" }}>
                <h1>Analytics</h1>
                <p>
                    Total Stores: <strong>{data.length}</strong>
                </p>
            </div>

            <div className="table-responsive-elite">
                <table className="custom-table">
                    <thead>
						<tr>
							<th style={{ textAlign: "left" }}>Shop Domain</th>
							<th style={{ textAlign: "center" }}>Customer Visits</th>
							<th style={{ textAlign: "center" }}>Actions</th>
						</tr>
					</thead>

					<tbody>
						{data.length === 0 ? (
							<tr>
								<td colSpan="3" className="empty-state-cell">
									No records found
								</td>
							</tr>
						) : (
							data.map((item) => (
								<tr key={item.shopDomain}>
									<td className="font-semibold" style={{ textAlign: "left" }}>
										<div className="domain-wrapper">
											<a className="store-domain-link" href={`https://${normalizeDomain(item.shopDomain)}`} target="_blank" rel="noopener noreferrer">
												{normalizeDomain(item.shopDomain)}
											</a>
										</div>
									</td>
									<td className="font-mono-muted font-bold" style={{ textAlign: "center" }}>
										{item.totalCount ?? 0}
									</td>
									<td style={{ textAlign: "center" }}>
										<button type="button" className="filter-icon-button" style={{ margin: "0 auto" }} onClick={() => onViewDetail(item)}>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
												<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
												<circle cx="12" cy="12" r="3" />
											</svg>
										</button>
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

export default StoreVisit;

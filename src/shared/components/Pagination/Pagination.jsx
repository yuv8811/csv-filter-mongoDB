const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
    return (
        <div className="pagination">
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                Previous
            </button>
            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{currentPage} <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>/ {totalPages}</span></span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
            </button>
        </div>
    );
};

export default Pagination;

import {Pagination} from "react-bootstrap";

export default function PaginationButtons({ pageSize, pageNumber, totalItems, onPageChange }) {
    const totalPages = Math.ceil(totalItems / pageSize);
    const activePage = Number(pageNumber);
    const pages = [];

    const handleFirstPageClick = () => {
        onPageChange(1);
    }

    const handleLastPageClick = () => {
        onPageChange(totalPages);
    }

    const handlePageClick = (page) => {
        onPageChange(page);
    }

    let startPage = activePage - 2;
    if (startPage < 1) {
        startPage = 1;
    }
    let endPage = startPage + 4;
    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = endPage - 4;
        if (startPage < 1) {
            startPage = 1;
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <>
            {totalPages > 1 && (
                <Pagination className="mt-3">
                    <Pagination.First onClick={handleFirstPageClick} />
                    <Pagination.Prev onClick={() => handlePageClick(activePage - 1)} />
                    {pages.map(page => (
                        <Pagination.Item
                            key={page}
                            active={page === activePage}
                            onClick={() => handlePageClick(page)}
                        >
                            {page}
                        </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageClick(activePage + 1)} />
                    <Pagination.Last onClick={handleLastPageClick} />
                </Pagination>
            )}
        </>
    );
}

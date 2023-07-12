import {useEffect, useState} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {DOMAIN_API_URL} from "../../api";
import {Col} from "react-bootstrap";
import PaginationButtons from "../pagination/PaginationButtons";
import {useNavigate} from "react-router-dom";
import moment from "moment/moment";
import JoinRequestViewModal from "../modals/travel/request/JoinRequestViewModal";

export default function Requests({show, location}) {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequest, setShowRequest] = useState(false);

    const [pageSize] = useState(9);
    const [pageNumber, setPageNumber] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();

    const maxTextSize = 75;

    const fetchRequests = async (params) => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            let response;

            if (params.toString().length === 0) {
                response = await axios.get(`${DOMAIN_API_URL}/join-requests/user`, config);
            } else {
                response = await axios.get(`${DOMAIN_API_URL}/join-requests/user?${params.toString()}`, config);
            }

            const updatedRequests = await Promise.all(response.data.map(async (request) => {
                let updatedRequest;
                let requestTravelCreatorAvatar;
                let requestSenderAvatar;
                let requestTravelPhoto;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${request.travel.creator.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    requestTravelCreatorAvatar = URL.createObjectURL(blob);
                } catch (error) {
                    if (error && error.response.status === 404) {
                        requestTravelCreatorAvatar = "/img/default-user.png";
                    }
                }

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${request.sender.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    requestSenderAvatar = URL.createObjectURL(blob);
                } catch (error) {
                    if (error && error.response.status === 404) {
                        requestSenderAvatar = "/img/default-user.png";
                    }
                }

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/travel/${request.travel.id}/main`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    requestTravelPhoto = URL.createObjectURL(blob);
                } catch (error) {
                    if (error && error.response.status === 404) {
                        requestTravelPhoto = "/img/default-travel.png";
                    }
                }

                updatedRequest = {
                    ...request,
                    sender: {
                        ...request.sender,
                        avatar: requestSenderAvatar
                    },
                    travel: {
                        ...request.travel,
                        photo: requestTravelPhoto,
                        creator: {
                            ...request.travel.creator,
                            avatar: requestTravelCreatorAvatar
                        }
                    }
                }

                return updatedRequest;
            }));

            console.log(updatedRequests);
            setRequests(updatedRequests);
        } catch (error) {
            console.error(error);
        }
    };

    const handleQueryParams = (params) => {
        if (params.toString().length !== 0) {
            const paramPage = params.get('page');

            if (paramPage) {
                if (paramPage < 1) {
                    setPageNumber(1);
                } else {
                    setPageNumber(paramPage);
                }
            }
        }
    };

    useEffect(() => {
        handleUpdateRequests();
    }, []);

    const handleUpdateRequests = () => {
        const searchParams = new URLSearchParams(location.search);
        fetchRequests(searchParams);
        handleQueryParams(searchParams);
    };

    const handleFetchRequests = () => {
        handleUpdateRequests();
        if (showRequest) handleRequestClose();
    }

    const showText = (request) => {
        if (request.text) {
            return request.text.length > maxTextSize ? `${request.text.slice(0, maxTextSize)}...` : request.text;
        }
    };

    const showStatus = (request) => {
        const status = request.status;

        if (status === "APPROVED") {
            return (
                <div className="div-success text-uppercase">
                    Approved
                </div>
            );
        } else if (status === "PENDING") {
            return (
                <div className="div-primary text-uppercase">
                    Pending
                </div>
            );
        } else if (status === "REJECTED") {
            return (
                <div className="div-danger text-uppercase">
                    Rejected
                </div>
            );
        }
    };

    const showCreateDate = (request) => {
        const now = moment();
        const date = moment(request.createTime);

        if (now.isSame(date, 'day')) {
            return date.format('HH:mm');
        } else {
            return date.format('DD.MM.YYYY');
        }
    }

    const handleRequestShow = (request) => {
        setSelectedRequest(request);
        setShowRequest(true);
    };

    const handleDeleteRequest = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.delete(`${DOMAIN_API_URL}/join-requests/${selectedRequest.id}`, config)
            .then(() => handleFetchRequests())
            .catch(error => console.error(error));
    };

    const handleRequestClose = () => {
        setSelectedRequest(null);
        setShowRequest(false);
    };

    const handlePageChange = (page) => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set('page', page);
        navigate(`${location.pathname}?${queryParams.toString()}`);
    };

    return (
        <>
            {show && (
                <>
                    <div className="d-flex flex-column justify-content-center mb-3">
                        {requests.map(request =>
                            <div
                                className={`d-flex justify-content-between align-items-center border rounded-3 mb-2 invite-item`}
                                onClick={() => handleRequestShow(request)}
                            >
                                <div className="d-flex align-items-center me-auto h-100">
                                    <div className="d-flex align-items-center border-end h-100 px-3 py-2"
                                         style={{color: '#000', textDecoration: 'none', fontWeight: '600'}}>
                                        <div className="d-flex align-items-center">
                                            <p className="mb-0 me-2" style={{fontWeight: 400}}>To:</p>
                                            <div
                                                className="rounded-circle me-2"
                                                style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    background: "#ddd",
                                                    backgroundImage: `url(${request.travel.creator.avatar})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }}
                                            />
                                            {request.travel.creator.firstName}{request.travel.creator.isAdmin && ' (A)'}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center border-end h-100 px-3 py-2"
                                         style={{fontWeight: 600}}>
                                        Travel:
                                        <div className="ms-1 mb-0" style={{color: '#0d6efd', fontWeight: 500}}>
                                            {request.travel.name}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center px-3 py-2" style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        {showText(request)}
                                    </div>
                                </div>
                                <div className="d-flex align-items-center h-100">
                                    <div className="d-flex align-items-center border-start h-100 px-3 py-2">
                                        {showStatus(request)}
                                    </div>
                                    <div className="d-flex align-items-center border-start h-100 px-3 py-2"
                                         style={{fontWeight: 500}}>
                                        {showCreateDate(request)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <Col className="d-flex justify-content-center" sm={12}>
                        <PaginationButtons
                            pageSize={pageSize}
                            pageNumber={pageNumber}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}/>
                    </Col>
                    {selectedRequest && showRequest &&
                        <JoinRequestViewModal show={showRequest} request={selectedRequest}
                                              showRequestStatus={showStatus}
                                              deleteRequest={handleDeleteRequest}
                                              onHide={handleRequestClose}/>}
                </>
            )}
        </>
    );
}

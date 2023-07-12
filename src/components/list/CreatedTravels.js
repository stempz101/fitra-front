import {useEffect, useRef, useState} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {DOMAIN_API_URL} from "../../api";
import {Link, useNavigate} from "react-router-dom";
import moment from "moment";
import {Badge, Button, Col, Image} from "react-bootstrap";
import TravelGalleryModal from "../modals/travel/TravelGalleryModal";
import PaginationButtons from "../pagination/PaginationButtons";
import EditTravelModal from "../modals/travel/EditTravelModal";
import TravelEventsModal from "../modals/travel/TravelEventsModal";
import DeleteTravelModal from "../modals/travel/DeleteTravelModal";
import ManageTravelModal from "../modals/travel/ManageTravelModal";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";

export default function CreatedTravels({show, currentUser, location}) {
    const [travels, setTravels] = useState([]);
    const [joinRequestsCounts, setJoinRequestsCounts] = useState({});
    const [travelsSubscribes, setTravelsSubscribes] = useState({});
    const [stompClient, setStompClient] = useState(null);

    const stompClientRef = useRef(null);

    const [selectedTravel, setSelectedTravel] = useState(null);
    const [selectedUnreadRequestsCount, setSelectedUnreadRequestsCount] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [showEditTravel, setShowEditTravel] = useState(false);
    const [showDeleteTravel, setShowDeleteTravel] = useState(false);
    const [showManageTravel, setShowManageTravel] = useState(false);

    const [pageSize] = useState(9);
    const [pageNumber, setPageNumber] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();

    const fetchTravels = async (params) => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            let response;

            if (params.toString().length === 0) {
                response = await axios.get(`${DOMAIN_API_URL}/travels/user/created`, config);
            } else {
                response = await axios.get(`${DOMAIN_API_URL}/travels/user/created?${params.toString()}`, config);
            }

            const updatedTravels = await Promise.all(response.data.items.map(async (travel) => {
                let updatedTravel = travel;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/travel/${travel.id}/main`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    updatedTravel = {...updatedTravel, photo: URL.createObjectURL(blob)};
                } catch (error) {
                    if (error && error.response.status === 404) {
                        updatedTravel = {...updatedTravel, photo: "/img/default-travel.jpg"};
                    }
                }

                return updatedTravel;
            }));

            setTotalItems(response.data.totalItems);
            setTravels(updatedTravels);
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
        handleFetchTravels();

        return () => {
            setTravels([]);
        };
    }, [location.search]);

    useEffect(() => {
        const token = Cookies.get("AUTH_TOKEN");
        const socket = new SockJS('http://localhost:8081/travel-socket');
        const stompClient = Stomp.over(socket);
        stompClient.connect({Authorization: `Bearer ${token}`}, () => {
            travels.forEach(travel => {
                const subscribe = stompClient.subscribe(`/unread-topic/travel/${travel.id}/requests`, response => {
                    const body = JSON.parse(response.body);
                    setJoinRequestsCounts(prevState => ({
                        ...prevState,
                        [travel.id]: body.requestsCount
                    }));
                });
                setTravelsSubscribes(prevState => ({
                    ...prevState,
                    [travel.id]: subscribe
                }));
                stompClient.send(`/app/travel/${travel.id}/requests`, {},
                    JSON.stringify({requestsCount: 0}));
            });
        });

        return () => {
            stompClient.disconnect();
        };
    }, [travels]);

    const showRoute = (travel) => {
        return travel.route
            .sort((r1, r2) => r1.position - r2.position)
            .map((route, index) => {
                if (index === 0) {
                    if (route.city) {
                        return <Link className="route-item" to={`/?cityId=${route.cityId}`}>{route.city}</Link>;
                    } else {
                        return (
                            <Link className="route-item" to={`/?countryId=${route.countryId}`}>{route.country}</Link>
                        );
                    }
                } else {
                    if (route.city) {
                        return (
                            <>
                                <span style={{fontWeight: "600"}}> > </span>
                                <Link className="route-item" to={`/?cityId=${route.cityId}`}>{route.city}</Link>
                            </>
                        );
                    } else {
                        return (
                            <>
                                <span style={{fontWeight: "600"}}> > </span>
                                <Link className="route-item"
                                      to={`/?countryId=${route.countryId}`}>{route.country}</Link>
                            </>
                        );
                    }
                }
            });
    };

    const showDuration = (travel) => {
        const start = moment(travel.startDate);
        const end = moment(travel.endDate);

        const duration = moment.duration(end.diff(start));

        const years = duration.years();
        const months = duration.months();
        const weeks = duration.weeks();
        const days = duration.days();

        if (years > 0) {
            return `${years} ${years > 1 ? 'years' : 'year'}`;
        } else if (months > 0) {
            return `${months} ${months > 1 ? 'months' : 'month'}`;
        } else if (weeks > 0) {
            return `${weeks} ${weeks > 1 ? 'weeks' : 'week'}`;
        } else {
            return `${days} ${days > 1 ? 'days' : 'day'}`;
        }
    };

    const showStatus = (travel) => {
        const startDate = moment(travel.startDate);
        const endDate = moment(travel.endDate);
        const currentDate = moment(new Date());

        if (currentDate.isBefore(startDate)) {
            return (
                <div className="mb-3 me-auto div-success text-uppercase">
                    Active
                </div>
            );
        } else if (currentDate.isBetween(startDate, endDate)) {
            return (
                <div className="mb-3 me-auto div-primary text-uppercase">
                    Going
                </div>
            );
        } else if (currentDate.isAfter(endDate)) {
            return (
                <div className="mb-3 me-auto div-muted text-uppercase">
                    Completed
                </div>
            );
        }
    };

    const handleGalleryShow = (travel) => {
        setSelectedTravel(travel);
        setShowGallery(true);
    };

    const handleSetMainPhoto = (travelId, selectedImageUrl) => {
        const updatedTravels = travels.map(travel => {
            if (travel.id === travelId) {
                return {...travel, photo: selectedImageUrl};
            }
        });
        setTravels(updatedTravels);
    };

    const handleUpdateMainPhoto = async (travelId) => {
        const updatedTravels = travels.map(async (travel) => {
            if (travel.id === travelId) {
                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/travel/${travel.id}/main`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    return {...travel, photo: URL.createObjectURL(blob)};
                } catch (error) {
                    console.error(error);
                }
            }
        });
        const resolvedTravels = await Promise.all(updatedTravels);
        setTravels(resolvedTravels);
    };

    const handleGalleryClose = () => {
        setSelectedTravel(null);
        setShowGallery(false);
    };

    const handleTravelEventsShow = (travel) => {
        setSelectedTravel(travel);
        setShowEvents(true);
    }

    const handleTravelEventsClose = () => {
        setSelectedTravel(null);
        setShowEvents(false);
    };

    const handleEditTravelShow = (travel) => {
        setSelectedTravel(travel);
        setShowEditTravel(true);
    };

    const handleEditTravelClose = () => {
        setSelectedTravel(null);
        setShowEditTravel(false);
    };

    const handleDeleteTravelShow = (travel) => {
        setSelectedTravel({id: travel.id, subscribe: travelsSubscribes[travel.id]});
        setShowDeleteTravel(true);
    }

    const handleFetchTravels = () => {
        const searchParams = new URLSearchParams(location.search);
        fetchTravels(searchParams);
        handleQueryParams(searchParams);
        if (showDeleteTravel) handleDeleteTravelClose();
    }

    const handleDeleteTravelClose = () => {
        setSelectedTravel(null);
        setShowDeleteTravel(false);
    }

    const handleManageTravelShow = (travel) => {
        setSelectedTravel(travel);
        setShowManageTravel(true);
    }

    const handleManageTravelClose = () => {
        setSelectedTravel(null);
        setShowManageTravel(false);
    }

    const handlePageChange = (page) => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set('page', page);
        navigate(`${location.pathname}?${queryParams.toString()}`);
    };

    return (
        <>
            {show && (
                <>
                    <div className="d-flex flex-column justify-content-center">
                        {travels.map(travel => (
                            <div className="d-flex border rounded-3 shadow-sm overflow-hidden mb-3">
                                <div className="col-2">
                                    <Link to={`/${travel.id}`}>
                                        {/*<img src={travel.photo} alt="travel" className="card-img-top travel-img"/>*/}
                                        <div className="travel-div-img"
                                             style={{backgroundImage: `url(${travel.photo})`}}></div>
                                    </Link>
                                </div>
                                <div className="col-10 ps-3 p-2">
                                    <div className="d-flex align-items-center">
                                        <div className="me-2" style={{fontSize: "15px"}}>
                                            {showRoute(travel)}
                                        </div>
                                        <div className="text-muted">{showDuration(travel)}</div>
                                    </div>
                                    <div>
                                        <Link className="travel-name-link" to={`/${travel.id}`}>
                                            {travel.name}
                                        </Link>
                                    </div>
                                    <div className="travel-dates d-flex align-items-center py-2 mb-2">
                                        <svg className="me-2" fill="#707070" width="20px" height="20px"
                                             viewBox="0 0 400 400">
                                            <path
                                                d="M32.874 24.721 C 15.680 30.740,11.766 40.377,11.738 76.758 L 11.719 101.563 200.040 101.563 L 388.360 101.563 388.126 75.977 L 387.891 50.391 385.610 45.740 C 377.327 28.844,364.728 23.461,333.436 23.447 L 312.575 23.438 312.342 43.164 C 312.079 65.446,312.025 65.658,305.808 68.739 C 300.831 71.205,295.228 69.721,291.797 65.028 C 290.348 63.047,290.217 61.450,290.001 43.164 L 289.769 23.438 195.275 23.438 L 100.781 23.438 100.781 42.276 C 100.781 60.197,100.698 61.263,99.075 64.151 C 95.765 70.040,89.125 71.629,83.181 67.955 C 78.479 65.049,78.125 63.249,78.125 42.265 L 78.125 23.438 57.227 23.475 C 40.446 23.505,35.648 23.750,32.874 24.721 M11.728 237.305 C 11.736 327.929,11.933 349.560,12.782 352.734 C 15.405 362.539,21.153 369.723,29.564 373.707 L 34.766 376.172 195.282 376.375 C 340.449 376.558,356.213 376.458,360.126 375.328 C 373.496 371.468,384.314 361.778,388.229 350.155 C 389.831 345.400,389.844 344.480,389.844 235.572 L 389.844 125.781 200.781 125.781 L 11.719 125.781 11.728 237.305 M120.597 170.608 C 126.288 172.986,126.563 174.004,126.563 192.722 C 126.563 217.661,127.025 217.186,102.734 217.173 C 78.465 217.160,79.297 218.006,79.297 193.359 C 79.297 168.998,78.652 169.646,102.955 169.575 C 114.074 169.543,118.694 169.813,120.597 170.608 M213.502 170.595 C 219.122 172.974,219.141 173.051,219.141 193.814 L 219.141 212.464 216.974 214.631 L 214.808 216.797 196.139 216.797 L 177.470 216.797 175.440 214.891 C 172.181 211.829,171.727 208.757,172.007 191.657 C 172.374 169.248,171.944 169.646,195.924 169.575 C 206.968 169.543,211.658 169.815,213.502 170.595 M308.339 170.820 C 313.456 173.248,313.672 174.143,313.672 192.933 C 313.672 218.496,314.935 217.180,290.391 217.185 C 265.427 217.189,266.406 218.172,266.406 193.113 C 266.406 169.099,265.893 169.610,290.116 169.562 C 302.951 169.537,306.091 169.753,308.339 170.820 M121.901 276.966 C 126.309 279.246,126.672 281.086,126.409 299.847 C 126.074 323.806,126.874 323.047,101.953 323.047 C 78.274 323.047,78.622 323.434,79.044 297.610 C 79.410 275.233,78.778 275.810,102.968 275.793 C 116.331 275.784,120.060 276.015,121.901 276.966 M214.869 276.966 C 219.160 279.185,219.532 281.004,219.528 299.766 C 219.524 324.412,220.279 323.714,194.098 323.299 C 171.577 322.941,171.989 323.386,171.919 299.389 C 171.849 275.396,171.465 275.781,195.457 275.781 C 209.232 275.781,213.025 276.013,214.869 276.966 M308.518 276.769 C 313.394 279.275,313.672 280.507,313.672 299.609 C 313.672 323.971,314.317 323.322,290.014 323.393 C 266.021 323.464,266.406 323.848,266.406 299.856 C 266.406 274.844,265.423 275.853,289.844 275.824 C 301.675 275.810,307.196 276.090,308.518 276.769"
                                                fill-rule="evenodd"/>
                                        </svg>
                                        {moment(travel.startDate).format("DD.MM.YYYY")}
                                        {' - '}
                                        {moment(travel.endDate).format("DD.MM.YYYY")}
                                    </div>
                                    <div className="d-flex">
                                        {showStatus(travel)}
                                        <div className="d-flex justify-content-end align-items-end w-100">
                                            <Button as={Link} to={`/${travel.id}`}
                                                    className="btn-link-action d-flex align-items-center text-uppercase"
                                                    variant="button">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="#999" className="bi bi-eye me-1" viewBox="0 0 16 16">
                                                    <path
                                                        d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                                    <path
                                                        d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                                </svg>
                                                View
                                            </Button>
                                            <Button className="btn-link-action d-flex align-items-center text-uppercase"
                                                    variant="button" onClick={() => handleGalleryShow(travel)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="#999" className="bi bi-image me-1" viewBox="0 0 16 16">
                                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                                                    <path
                                                        d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                                                </svg>
                                                Gallery
                                            </Button>
                                            <Button className="btn-link-action d-flex align-items-center text-uppercase"
                                                    variant="button" onClick={() => handleTravelEventsShow(travel)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="#999" className="bi bi-calendar4-event me-1"
                                                     viewBox="0 0 16 16">
                                                    <path
                                                        d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1H2zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5z"/>
                                                    <path
                                                        d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                                                </svg>
                                                Events
                                            </Button>
                                            <Button className="btn-link-action d-flex align-items-center text-uppercase"
                                                    variant="button" onClick={() => handleEditTravelShow(travel)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="#999" className="bi bi-pencil me-1" viewBox="0 0 16 16">
                                                    <path
                                                        d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                                </svg>
                                                Edit
                                            </Button>
                                            <Button className="btn-link-action d-flex align-items-center text-uppercase"
                                                    variant="button" onClick={() => handleDeleteTravelShow(travel)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="#999" className="bi bi-trash me-1" viewBox="0 0 16 16">
                                                    <path
                                                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                                    <path
                                                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                                                </svg>
                                                Delete
                                            </Button>
                                            <Button className="btn-link-action d-flex align-items-center text-uppercase"
                                                    variant="button" onClick={() => handleManageTravelShow(travel)}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                     fill="#999" className="bi bi-people me-1" viewBox="0 0 16 16">
                                                    <path
                                                        d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
                                                </svg>
                                                Manage
                                                {joinRequestsCounts[travel.id] > 0 &&
                                                    <Badge className="ms-1" bg="danger" pill>
                                                        {joinRequestsCounts[travel.id]}
                                                    </Badge>}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Col className="d-flex justify-content-center" sm={12}>
                        <PaginationButtons
                            pageSize={pageSize}
                            pageNumber={pageNumber}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}/>
                    </Col>
                    {selectedTravel && showGallery &&
                        <TravelGalleryModal show={showGallery} travelId={selectedTravel.id}
                                            setMainPhoto={handleSetMainPhoto}
                                            updateMainPhoto={handleUpdateMainPhoto} onHide={handleGalleryClose}/>}
                    {selectedTravel && showEvents &&
                        <TravelEventsModal show={showEvents} travelId={selectedTravel.id}
                                           startDate={selectedTravel.startDate} endDate={selectedTravel.endDate}
                                           onHide={handleTravelEventsClose}/>}
                    {selectedTravel && showEditTravel &&
                        <EditTravelModal show={showEditTravel} travel={selectedTravel} onHide={handleEditTravelClose}/>}
                    {selectedTravel && showDeleteTravel &&
                        <DeleteTravelModal show={showDeleteTravel} travel={selectedTravel}
                                           fetchTravels={handleFetchTravels}
                                           onHide={handleDeleteTravelClose}/>}
                    {selectedTravel && showManageTravel &&
                        <ManageTravelModal show={showManageTravel} travel={selectedTravel}
                                           unreadJoinRequestsCount={joinRequestsCounts[selectedTravel.id]}
                                           onHide={handleManageTravelClose}/>}
                </>
            )}
        </>
    );
}

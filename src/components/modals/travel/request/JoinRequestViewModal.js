import {Button, ButtonGroup, Form, Modal} from "react-bootstrap";
import {Link} from "react-router-dom";
import moment from "moment/moment";

export default function JoinRequestViewModal({show, request, showRequestStatus, deleteRequest, onHide}) {

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

    const showTravelStatus = (travel) => {
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

    const handleDeleteRequestClick = () => {
        deleteRequest();
        onHide();
    };

    return (
        <>
            <Modal show={show} animation={false} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Join Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="d-flex align-items-center mb-2">
                        <Form.Label className="me-2 mb-0">Sender:</Form.Label>
                        <Link to="#" className="d-flex align-items-center"
                              style={{
                                  color: "#000",
                                  textDecoration: "none"
                              }}>
                            <div
                                className="rounded-circle me-2"
                                style={{
                                    width: "35px",
                                    height: "35px",
                                    background: "#ddd",
                                    backgroundImage: `url(${request.sender.avatar})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }}
                            />
                            <p className="mb-0 me-2">{request.sender.name}</p>
                        </Link>
                    </Form.Group>
                    <div className="d-flex justify-content-between mb-2">
                        <Form.Group className="d-flex align-items-center">
                            <Form.Label className="me-2 mb-0">Receiver:</Form.Label>
                            <Link to="#" className="d-flex align-items-center"
                                  style={{
                                      color: "#000",
                                      textDecoration: "none"
                                  }}>
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
                                <p className="mb-0 me-2">{request.travel.creator.name}</p>
                            </Link>
                        </Form.Group>
                        <Link to="#chat"
                              className="btn btn-primary btn-ask d-flex align-items-center"> {/* TODO: to='/user/chat/..' */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                 fill="currentColor" className="bi bi-chat-dots me-1" viewBox="0 0 16 16">
                                <path
                                    d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                                <path
                                    d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a10.722 10.722 0 0 1-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 0 0 .693-.125zm.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 0 0 .398-2z"/>
                            </svg>
                            Chat
                        </Link>
                    </div>
                    <Form.Group className="d-flex align-items-center">
                        <Form.Label className="me-2 mb-auto">Travel:</Form.Label>
                        <div className="d-flex border rounded-3 shadow-sm overflow-hidden mb-3 w-100">
                            <div className="col-5">
                                <Link to={`/${request.travel.id}`}>
                                    <div className="travel-div-img"
                                         style={{backgroundImage: `url(${request.travel.photo})`}}></div>
                                </Link>
                            </div>
                            <div className="col-7 ps-3 p-2">
                                <div className="d-flex align-items-center">
                                    <div className="me-2" style={{fontSize: "15px"}}>
                                        {showRoute(request.travel)}
                                    </div>
                                </div>
                                <div>
                                    <Link className="travel-name-link" to={`/${request.travel.id}`}>
                                        {request.travel.name}
                                    </Link>
                                </div>
                                <div className="travel-dates d-flex align-items-center py-2 mb-2">
                                    <svg className="me-2" fill="#707070" width="20px" height="20px"
                                         viewBox="0 0 400 400">
                                        <path
                                            d="M32.874 24.721 C 15.680 30.740,11.766 40.377,11.738 76.758 L 11.719 101.563 200.040 101.563 L 388.360 101.563 388.126 75.977 L 387.891 50.391 385.610 45.740 C 377.327 28.844,364.728 23.461,333.436 23.447 L 312.575 23.438 312.342 43.164 C 312.079 65.446,312.025 65.658,305.808 68.739 C 300.831 71.205,295.228 69.721,291.797 65.028 C 290.348 63.047,290.217 61.450,290.001 43.164 L 289.769 23.438 195.275 23.438 L 100.781 23.438 100.781 42.276 C 100.781 60.197,100.698 61.263,99.075 64.151 C 95.765 70.040,89.125 71.629,83.181 67.955 C 78.479 65.049,78.125 63.249,78.125 42.265 L 78.125 23.438 57.227 23.475 C 40.446 23.505,35.648 23.750,32.874 24.721 M11.728 237.305 C 11.736 327.929,11.933 349.560,12.782 352.734 C 15.405 362.539,21.153 369.723,29.564 373.707 L 34.766 376.172 195.282 376.375 C 340.449 376.558,356.213 376.458,360.126 375.328 C 373.496 371.468,384.314 361.778,388.229 350.155 C 389.831 345.400,389.844 344.480,389.844 235.572 L 389.844 125.781 200.781 125.781 L 11.719 125.781 11.728 237.305 M120.597 170.608 C 126.288 172.986,126.563 174.004,126.563 192.722 C 126.563 217.661,127.025 217.186,102.734 217.173 C 78.465 217.160,79.297 218.006,79.297 193.359 C 79.297 168.998,78.652 169.646,102.955 169.575 C 114.074 169.543,118.694 169.813,120.597 170.608 M213.502 170.595 C 219.122 172.974,219.141 173.051,219.141 193.814 L 219.141 212.464 216.974 214.631 L 214.808 216.797 196.139 216.797 L 177.470 216.797 175.440 214.891 C 172.181 211.829,171.727 208.757,172.007 191.657 C 172.374 169.248,171.944 169.646,195.924 169.575 C 206.968 169.543,211.658 169.815,213.502 170.595 M308.339 170.820 C 313.456 173.248,313.672 174.143,313.672 192.933 C 313.672 218.496,314.935 217.180,290.391 217.185 C 265.427 217.189,266.406 218.172,266.406 193.113 C 266.406 169.099,265.893 169.610,290.116 169.562 C 302.951 169.537,306.091 169.753,308.339 170.820 M121.901 276.966 C 126.309 279.246,126.672 281.086,126.409 299.847 C 126.074 323.806,126.874 323.047,101.953 323.047 C 78.274 323.047,78.622 323.434,79.044 297.610 C 79.410 275.233,78.778 275.810,102.968 275.793 C 116.331 275.784,120.060 276.015,121.901 276.966 M214.869 276.966 C 219.160 279.185,219.532 281.004,219.528 299.766 C 219.524 324.412,220.279 323.714,194.098 323.299 C 171.577 322.941,171.989 323.386,171.919 299.389 C 171.849 275.396,171.465 275.781,195.457 275.781 C 209.232 275.781,213.025 276.013,214.869 276.966 M308.518 276.769 C 313.394 279.275,313.672 280.507,313.672 299.609 C 313.672 323.971,314.317 323.322,290.014 323.393 C 266.021 323.464,266.406 323.848,266.406 299.856 C 266.406 274.844,265.423 275.853,289.844 275.824 C 301.675 275.810,307.196 276.090,308.518 276.769"
                                            fill-rule="evenodd"/>
                                    </svg>
                                    {moment(request.travel.startDate).format("DD.MM.YYYY")}
                                    {' - '}
                                    {moment(request.travel.endDate).format("DD.MM.YYYY")}
                                </div>
                                <div className="d-flex">
                                    {showTravelStatus(request.travel)}
                                    <div className="d-flex justify-content-end align-items-end w-100">
                                        <Button as={Link} to={`/${request.travel.id}`}
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Form.Group>
                    <Form.Group className="d-flex align-items-center mb-2">
                        <Form.Label className="me-2 mb-auto">Status:</Form.Label>
                        {showRequestStatus(request)}
                    </Form.Group>
                    {request.text &&
                        <Form.Group className="d-flex align-items-center mb-2">
                            <Form.Label className="me-2 mb-auto">Text:</Form.Label>
                            <div>{request.text}</div>
                        </Form.Group>}
                    {request.status === "APPROVED" || request.status === "REJECTED" ? (
                        <Button className="w-100 travel-btn-danger" onClick={handleDeleteRequestClick}>Delete</Button>
                    ) : (
                        <Button className="w-100 travel-btn-danger" onClick={handleDeleteRequestClick}>Cancel</Button>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

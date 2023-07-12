import {Link, useParams} from "react-router-dom";
import {Button, Col, Container, Row} from "react-bootstrap";
import {useEffect, useState} from "react";
import axios from "axios";
import {DOMAIN_API_URL} from "../api";
import "../css/travel.css";
import moment from "moment";
import "moment/locale/uk";
import {Carousel} from "react-responsive-carousel";
import JoinRequestModal from "../components/modals/travel/JoinRequestModal";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import i18n from "../i18n";

export default function Travel({currentUser, isAuthorized, setShowLogIn}) {
    const {id} = useParams();

    const [travel, setTravel] = useState(null);
    const [images, setImages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [rating, setRating] = useState(0);

    const [isTruncated, setIsTruncated] = useState(true);

    const [showJoinRequest, setShowJoinRequest] = useState(false);

    const maxDescrLength = 1000;
    const maxAboutLength = 500;

    const fetchTravel = async () => {
        try {
            let travelResponse = await axios.get(`${DOMAIN_API_URL}/travels/${id}`);

            try {
                const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${travelResponse.data.creator.id}/avatar`, {responseType: 'arraybuffer'});
                const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                travelResponse.data.creator = {
                    ...travelResponse.data.creator,
                    avatar: URL.createObjectURL(blob)
                };
            } catch (error) {
                if (error && error.response.status === 404) {
                    travelResponse.data.creator = {
                        ...travelResponse.data.creator,
                        avatar: "/img/default-user.png"
                    };
                }
            }

            await axios.get(`${DOMAIN_API_URL}/users/${travelResponse.data.creator.id}/rating`)
                .then(response => setRating(response.data.rating))
                .catch(error => console.error(error));

            if (travelResponse.data.events) {
                travelResponse.data.events = travelResponse.data.events.map(event => ({
                    title: event.name,
                    start: event.startTime,
                    end: event.endTime
                }));
            }

            console.log(travelResponse.data);
            setTravel(travelResponse.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchPhotos = async () => {
        try {
            let response = await axios.get(`${DOMAIN_API_URL}/images/travel/${id}`);

            const updatedImages = await Promise.all(response.data.map(async (image) => {
                const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/travel/${id}/name/${image}`, {responseType: 'arraybuffer'});
                const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                return URL.createObjectURL(blob);
            }));

            setImages(updatedImages);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchParticipants = async () => {
        try {
            let participantsResponse = await axios.get(`${DOMAIN_API_URL}/travels/${id}/users`);

            const modifiedParticipants = await Promise.all(participantsResponse.data.map(async (participant) => {
                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${participant.user.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    participant.user = {
                        ...participant.user,
                        avatar: URL.createObjectURL(blob)
                    };
                } catch (error) {
                    if (error && error.response.status === 404) {
                        participant.user = {
                            ...participant.user,
                            avatar: "/img/default-user.png"
                        };
                    }
                }
                return participant;
            }));

            setParticipants(modifiedParticipants);
        } catch (error) {
            console.error(error);
        }
    }

    const fetchRating = async () => {
        await axios.get(`${DOMAIN_API_URL}/users/${id}/rating`)
            .then(response => setRating(response.data.rating))
            .catch(error => console.error(error));
    };

    useEffect(() => {
        fetchTravel();
        fetchPhotos();
        fetchParticipants();
    }, [])

    const showTypeSvg = () => {
        switch (travel.type.id) {
            case 1:
                return (
                    <img className="me-1" src="/svg/sea.svg" alt="sea" style={{width: "25px", height: "25px"}}/>
                );
            case 2:
                return (
                    <img className="me-1" src="/svg/tour.svg" alt="tour" style={{width: "25px", height: "25px"}}/>
                );
            case 3:
                return (
                    <img className="me-1" src="/svg/cruise.svg" alt="cruise" style={{width: "25px", height: "25px"}}/>
                );
            case 4:
                return (
                    <img className="me-1" src="/svg/hiking.svg" alt="hiking" style={{width: "25px", height: "25px"}}/>
                );
            case 5:
                return (
                    <img className="me-1" src="/svg/sport.svg" alt="sport" style={{width: "25px", height: "25px"}}/>
                );
            case 6:
                return (
                    <img className="me-1" src="/svg/winter.svg" alt="winter" style={{width: "25px", height: "25px"}}/>
                );
            default:
                return;
        }
    }

    const showRoute = () => {
        return travel.route
            .sort((r1, r2) => r1.position - r2.position)
            .map((route, index) => {
                if (index === 0) {
                    if (route.city) {
                        return <Link className="h3" to={`/?cityId=${route.cityId}`}>{route.city}</Link>;
                    } else {
                        return (
                            <Link className="h3" to={`/?countryId=${route.countryId}`}>{route.country}</Link>
                        );
                    }
                } else {
                    if (route.city) {
                        return (
                            <>
                                <span className="h3"> > </span>
                                <Link className="h3" to={`/?cityId=${route.cityId}`}>{route.city}</Link>
                            </>
                        );
                    } else {
                        return (
                            <>
                                <span className="h3"> > </span>
                                <Link className="h3" to={`/?countryId=${route.countryId}`}>{route.country}</Link>
                            </>
                        );
                    }
                }
            });
    };

    const showDuration = () => {
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

    const showDescription = () => {
        if (isTruncated) {
            const truncatedText = travel.description.slice(0, maxDescrLength);
            const lastIndexWord = truncatedText.lastIndexOf(" ");
            return travel.description.slice(0, lastIndexWord);
        } else {
            return travel.description;
        }
    };

    const toggleDescription = () => setIsTruncated(!isTruncated);

    const showCreatorAge = () => {
        const today = moment();
        const birthday = moment(travel.creator.birthday);
        const age = today.diff(birthday, 'years')
        return `${age} y.o.`;
    };

    const showCreatorCountryCity = () => {
        if (travel.creator.cityDto) {
            return `${travel.creator.country.title}, ${travel.creator.cityDto.title}`
        }
        return `${travel.creator.country.title}`;
    };

    const showCreatorAbout = () => {
        const truncatedText = travel.creator.about.slice(0, maxAboutLength);
        const lastIndexWord = truncatedText.lastIndexOf(" ");
        return travel.creator.about.slice(0, lastIndexWord);
    };

    const showJoinRequestButton = () => {
        const spots = travel.limit - (participants.length - 1);
        if (spots > 0) {
            if (isAuthorized) {
                if (participants.find(participant => participant.user.id === currentUser.id)) {
                    return (
                        <>
                            <div className="p-3 border-top">
                                <Button className="btn-join-request rounded-3 w-100 py-3 disabled" variant="primary"
                                        onClick={() => setShowJoinRequest(true)}>Send join request</Button>
                            </div>
                            {showLeftSpots()}
                        </>
                    );
                }
                return (
                    <>
                        <div className="p-3 border-top">
                            <Button className="btn-join-request rounded-3 w-100 py-3" variant="primary"
                                    onClick={() => setShowJoinRequest(true)}>Send join request</Button>
                        </div>
                        {showLeftSpots()}
                    </>
                );
            }
            return (
                <>
                    <div className="p-3 border-top">
                        <Button className="btn-join-request rounded-3 w-100 py-3" variant="primary"
                                onClick={() => setShowLogIn(true)}>Send join request</Button>
                    </div>
                    {showLeftSpots()}
                </>
            );
        }
        return (
            <>
                <div className="p-3 border-top">
                    <Button className="btn-join-request rounded-3 w-100 py-3" variant="primary"
                            onClick={() => setShowLogIn(true)} disabled>Send join request</Button>
                </div>
            </>
        );
    };

    const showLeftSpots = () => {
        const spots = travel.limit - (participants.length - 1);
        if (spots > 0) {
            return (
                <div className="text-center" style={{fontWeight: "600"}}>
                    <p>{spots} spots left</p>
                </div>
            );
        }
    };

    const handleJoinRequestClose = () => setShowJoinRequest(false);

    return (
        <>
            <Container className="travel-main mt-3">
                <Row>
                    {travel === null ? (
                        <Col className="my-5" sm={12}>
                            <h4 className="text-muted text-center">We're sorry, but the travel you're looking for could
                                not be found.<br/>Please check that you have the correct URL and try again.</h4>
                        </Col>
                    ) : (
                        <>
                            <div className="col-8">
                                <div className="travel-name mb-4">
                                    <h1>{travel.name}</h1>
                                </div>
                                <div className="travel-created-by d-flex align-items-center mb-4">
                                    <p className="mb-0 me-1">Created by</p>
                                    <Link className="me-2"
                                          to={`#${travel.creator.id}`}> {/* TODO: to='/user/id123122' */}
                                        <div className="travel-creator d-flex align-items-center">
                                            <div
                                                className="rounded-circle me-1 user-avatar"
                                                style={{
                                                    width: "45px",
                                                    height: "45px",
                                                    backgroundImage: `url(${travel.creator.avatar})`
                                                }}
                                            />
                                            {travel.creator.firstName}
                                        </div>
                                    </Link>
                                    {travel.creator.id !== currentUser?.id &&
                                        <Link to={`/messages/user/${travel.creator.id}`}
                                              className="btn btn-primary btn-ask d-flex align-items-center"> {/* TODO: to='/user/chat/..' */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                 fill="currentColor" className="bi bi-chat-dots me-1" viewBox="0 0 16 16">
                                                <path
                                                    d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                                                <path
                                                    d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a10.722 10.722 0 0 1-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 0 0 .693-.125zm.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 0 0 .398-2z"/>
                                            </svg>
                                            Ask a question
                                        </Link>}
                                </div>
                                <div className="travel-route mb-4">
                                    {showRoute()}
                                </div>
                                <div className="travel-type d-flex align-items-center mb-5">
                                    {/*{showTypeSvg()}{' '}*/}
                                    <Link className="h5 mb-0"
                                          to={`/?typeId=${travel.type.id}`}>{travel.type.name}</Link>
                                </div>
                                <div className="travel-short-info d-flex mb-5">
                                    <div className="d-flex align-items-center me-4">
                                        <svg className="me-2" fill="#448EF6" width="20px" height="20px"
                                             viewBox="0 0 1920 1920">
                                            <path
                                                d="M1377.882 1344 903.53 988.235v-592.94h112.942v536.47l429.176 321.77-67.765 90.465ZM960 0C430.645 0 0 430.645 0 960c0 529.242 430.645 960 960 960 529.242 0 960-430.758 960-960 0-529.355-430.758-960-960-960Z"
                                                fill-rule="evenodd"/>
                                        </svg>
                                        <span>{showDuration()}</span>
                                    </div>
                                    {travel.events && travel.events.length !== 0 && (
                                        <div className="d-flex align-items-center me-4">
                                            <svg className="me-2" fill="#448EF6" width="20px" height="20px"
                                                 viewBox="0 0 400 400">
                                                <path
                                                    d="M32.874 24.721 C 15.680 30.740,11.766 40.377,11.738 76.758 L 11.719 101.563 200.040 101.563 L 388.360 101.563 388.126 75.977 L 387.891 50.391 385.610 45.740 C 377.327 28.844,364.728 23.461,333.436 23.447 L 312.575 23.438 312.342 43.164 C 312.079 65.446,312.025 65.658,305.808 68.739 C 300.831 71.205,295.228 69.721,291.797 65.028 C 290.348 63.047,290.217 61.450,290.001 43.164 L 289.769 23.438 195.275 23.438 L 100.781 23.438 100.781 42.276 C 100.781 60.197,100.698 61.263,99.075 64.151 C 95.765 70.040,89.125 71.629,83.181 67.955 C 78.479 65.049,78.125 63.249,78.125 42.265 L 78.125 23.438 57.227 23.475 C 40.446 23.505,35.648 23.750,32.874 24.721 M11.728 237.305 C 11.736 327.929,11.933 349.560,12.782 352.734 C 15.405 362.539,21.153 369.723,29.564 373.707 L 34.766 376.172 195.282 376.375 C 340.449 376.558,356.213 376.458,360.126 375.328 C 373.496 371.468,384.314 361.778,388.229 350.155 C 389.831 345.400,389.844 344.480,389.844 235.572 L 389.844 125.781 200.781 125.781 L 11.719 125.781 11.728 237.305 M120.597 170.608 C 126.288 172.986,126.563 174.004,126.563 192.722 C 126.563 217.661,127.025 217.186,102.734 217.173 C 78.465 217.160,79.297 218.006,79.297 193.359 C 79.297 168.998,78.652 169.646,102.955 169.575 C 114.074 169.543,118.694 169.813,120.597 170.608 M213.502 170.595 C 219.122 172.974,219.141 173.051,219.141 193.814 L 219.141 212.464 216.974 214.631 L 214.808 216.797 196.139 216.797 L 177.470 216.797 175.440 214.891 C 172.181 211.829,171.727 208.757,172.007 191.657 C 172.374 169.248,171.944 169.646,195.924 169.575 C 206.968 169.543,211.658 169.815,213.502 170.595 M308.339 170.820 C 313.456 173.248,313.672 174.143,313.672 192.933 C 313.672 218.496,314.935 217.180,290.391 217.185 C 265.427 217.189,266.406 218.172,266.406 193.113 C 266.406 169.099,265.893 169.610,290.116 169.562 C 302.951 169.537,306.091 169.753,308.339 170.820 M121.901 276.966 C 126.309 279.246,126.672 281.086,126.409 299.847 C 126.074 323.806,126.874 323.047,101.953 323.047 C 78.274 323.047,78.622 323.434,79.044 297.610 C 79.410 275.233,78.778 275.810,102.968 275.793 C 116.331 275.784,120.060 276.015,121.901 276.966 M214.869 276.966 C 219.160 279.185,219.532 281.004,219.528 299.766 C 219.524 324.412,220.279 323.714,194.098 323.299 C 171.577 322.941,171.989 323.386,171.919 299.389 C 171.849 275.396,171.465 275.781,195.457 275.781 C 209.232 275.781,213.025 276.013,214.869 276.966 M308.518 276.769 C 313.394 279.275,313.672 280.507,313.672 299.609 C 313.672 323.971,314.317 323.322,290.014 323.393 C 266.021 323.464,266.406 323.848,266.406 299.856 C 266.406 274.844,265.423 275.853,289.844 275.824 C 301.675 275.810,307.196 276.090,308.518 276.769"
                                                    fill-rule="evenodd"/>
                                            </svg>
                                            <span>{travel.events.length} events</span>
                                        </div>
                                    )}
                                    <div className="d-flex align-items-center me-4">
                                        <svg className="me-2" fill="#448EF6" width="20px" height="20px"
                                             viewBox="0 0 400 400">
                                            <path
                                                d="M183.594 0.532 C 153.000 5.528,129.203 21.443,113.448 47.444 C 109.092 54.632,105.142 64.590,102.982 73.828 C 88.688 134.961,134.683 192.989,197.415 192.966 C 263.850 192.941,310.032 127.601,288.522 64.063 C 274.278 21.986,227.108 -6.574,183.594 0.532 M110.156 193.467 C 66.268 199.875,41.332 234.870,33.969 300.391 C 28.693 347.338,38.042 375.673,63.672 390.416 C 81.160 400.475,75.231 400.074,202.776 399.812 L 312.109 399.586 318.750 397.543 C 359.941 384.868,373.483 352.673,364.052 289.844 C 354.871 228.679,327.455 195.609,283.951 193.225 C 273.339 192.644,273.232 192.685,255.007 204.355 C 215.213 229.836,183.289 229.787,144.051 204.184 C 126.809 192.934,122.701 191.635,110.156 193.467"
                                                fill-rule="evenodd"/>
                                        </svg>
                                        <span>{travel.limit} mates</span>
                                    </div>
                                    <div className="d-flex align-items-center me-4">
                                        <svg className="me-2" fill="#448EF6" width="20px" height="20px"
                                             viewBox="0 0 400 400">
                                            <path
                                                d="M174.609 1.194 C 11.016 22.509,-58.409 221.685,56.608 339.734 C 162.584 448.504,347.795 403.651,391.657 258.594 C 433.672 119.641,318.036 -17.494,174.609 1.194 M270.661 121.780 C 309.884 132.342,321.571 173.265,291.245 193.859 L 286.599 197.014 292.323 200.374 C 324.446 219.226,319.537 260.226,283.437 274.590 C 260.186 283.842,227.944 282.247,207.909 270.855 C 178.481 254.122,177.536 215.534,206.185 200.479 C 212.700 197.055,212.686 197.097,208.329 194.345 C 178.713 175.635,187.638 134.890,223.932 123.112 C 236.369 119.075,258.296 118.451,270.661 121.780 M163.281 199.609 L 163.281 278.125 142.188 278.125 L 121.094 278.125 121.094 219.531 C 121.094 169.094,120.937 160.938,119.970 160.938 C 119.353 160.938,113.500 162.175,106.965 163.687 C 100.430 165.200,94.918 166.273,94.718 166.072 C 94.141 165.496,86.669 134.165,87.023 133.810 C 87.198 133.636,96.956 130.740,108.709 127.377 L 130.078 121.260 146.680 121.177 L 163.281 121.094 163.281 199.609 M242.224 151.696 C 235.190 153.715,229.680 160.853,229.695 167.927 C 229.744 190.701,267.476 191.886,268.624 169.150 C 269.300 155.768,256.810 147.510,242.224 151.696 M240.234 214.374 C 215.515 222.192,226.067 251.863,252.503 248.872 C 281.382 245.605,278.441 213.077,249.290 213.334 C 246.028 213.362,241.953 213.831,240.234 214.374"
                                                fill-rule="evenodd"/>
                                        </svg>
                                        <span>
                                            {travel.ageFrom === travel.ageTo ? `${travel.ageFrom} y.o.` : `${travel.ageFrom}-${travel.ageTo} y.o.`}
                                        </span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <svg className="me-1" fill="#448EF6" width="20px" height="20px"
                                             viewBox="0 0 400 400">
                                            <path
                                                d="M180.059 1.091 C 175.977 2.869,175.536 4.915,175.051 24.295 C 174.501 46.285,175.400 44.663,160.547 50.468 C 117.210 67.404,96.541 96.739,98.670 138.291 C 100.613 176.220,122.550 198.568,181.743 222.921 C 221.611 239.323,231.638 247.830,231.640 265.251 C 231.643 298.294,180.559 306.081,127.291 281.157 C 110.098 273.112,109.644 273.433,102.348 298.828 C 93.746 328.769,93.844 330.120,105.078 336.314 C 116.030 342.352,132.428 347.461,152.734 351.163 C 171.943 354.664,170.535 352.840,171.137 375.000 C 171.832 400.593,171.205 399.993,197.266 399.996 C 224.002 399.998,223.390 400.556,223.478 376.115 C 223.566 351.891,224.171 350.640,238.012 346.084 C 305.622 323.823,326.125 246.449,277.344 197.654 C 264.881 185.188,254.347 179.187,217.088 163.327 C 180.182 147.617,170.342 139.544,170.320 124.958 C 170.280 98.025,216.203 91.174,261.668 111.329 C 276.649 117.970,276.984 117.636,285.975 87.047 C 290.973 70.042,291.491 65.883,289.101 61.963 C 286.150 57.123,267.379 49.918,248.438 46.355 C 225.621 42.063,226.604 43.125,225.841 21.954 C 225.026 -0.616,225.879 0.095,199.609 0.075 C 187.079 0.065,181.782 0.340,180.059 1.091"
                                                fill-rule="evenodd"/>
                                        </svg>
                                        <span>{travel.budget}+ budget</span>
                                    </div>
                                </div>
                                <div className="travel-description mb-3">
                                    <div>
                                        {showDescription()}
                                    </div>
                                    {travel.description.length > maxDescrLength && (
                                        <Button className="travel-btn-read w-100 mt-2" onClick={toggleDescription}
                                                variant="primary">
                                            {isTruncated ? `READ MORE` : `READ LESS`}
                                        </Button>
                                    )}
                                </div>
                                <div className="travel-slider mb-4">
                                    <Carousel showThumbs={false} autoPlay={true} infiniteLoop={true}>
                                        {images.map(image => (
                                            <div style={{
                                                position: "relative",
                                                width: "100%",
                                                height: "400px",
                                                overflow: "hidden",
                                                backgroundColor: "#f5f5f5"
                                            }}>
                                                <img className="carousel-image" src={image} alt="travel"
                                                     style={{
                                                         position: "absolute",
                                                         top: "0",
                                                         left: "0",
                                                         width: "100%",
                                                         height: "100%",
                                                         objectFit: "contain",
                                                         objectPosition: "center"
                                                     }}/>
                                            </div>
                                        ))}
                                    </Carousel>
                                </div>
                                <div className="travel-creator-about mb-4">
                                    <h5 style={{fontWeight: "700"}}>ABOUT THE CREATOR</h5>
                                    <div className="border rounded">
                                        <div className="d-flex justify-content-between p-4">
                                            <div className="d-flex align-items-center">
                                                <div className="travel-creator d-flex align-items-center">
                                                    <Link
                                                        to={`#${travel.creator.id}`}> {/* TODO: to='/user/id123122' */}
                                                        <div
                                                            className="rounded-circle me-3 user-avatar"
                                                            style={{
                                                                width: "80px",
                                                                height: "80px",
                                                                backgroundImage: `url(${travel.creator.avatar})`
                                                            }}
                                                        />
                                                    </Link>
                                                    <div className="me-3">
                                                        <Link
                                                            to={`#${travel.creator.id}`}> {/* TODO: to='/user/id123122' */}
                                                            {travel.creator.firstName}
                                                        </Link>
                                                        <p className="mb-0">{showCreatorAge()}</p>
                                                        <p className="mb-0">{showCreatorCountryCity()}</p>
                                                    </div>
                                                </div>
                                                <div
                                                    className="d-flex align-items-center rounded-5 px-3 py-1 travel-user-star">
                                                    <svg width="20px" height="20px" viewBox="0 0 64 64">
                                                        <path fill="#fff" d="M63.893,24.277c-0.238-0.711-0.854-1.229-1.595-1.343l-19.674-3.006L33.809,1.15
                                                        C33.479,0.448,32.773,0,31.998,0s-1.48,0.448-1.811,1.15l-8.815,18.778L1.698,22.935c-0.741,0.113-1.356,0.632-1.595,1.343
                                                        c-0.238,0.71-0.059,1.494,0.465,2.031l14.294,14.657L11.484,61.67c-0.124,0.756,0.195,1.517,0.822,1.957
                                                        c0.344,0.243,0.747,0.366,1.151,0.366c0.332,0,0.666-0.084,0.968-0.25l17.572-9.719l17.572,9.719c0.302,0.166,0.636,0.25,0.968,0.25
                                                        c0.404,0,0.808-0.123,1.151-0.366c0.627-0.44,0.946-1.201,0.822-1.957l-3.378-20.704l14.294-14.657
                                                        C63.951,25.771,64.131,24.987,63.893,24.277z"
                                                              fill-rule="evenodd"/>
                                                    </svg>
                                                    <span className="ms-1"
                                                          style={{fontSize: "20px", fontWeight: "600"}}>{rating}</span>
                                                </div>
                                            </div>
                                            {travel.creator.id !== currentUser?.id &&
                                                <div className="d-flex align-items-center">
                                                    <Link to="#chat"
                                                          className="btn btn-primary btn-ask d-flex align-items-center"> {/* TODO: to='/user/chat/..' */}
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                             fill="currentColor" className="bi bi-chat-dots me-1"
                                                             viewBox="0 0 16 16">
                                                            <path
                                                                d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                                                            <path
                                                                d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9.06 9.06 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.437 10.437 0 0 1-.524 2.318l-.003.011a10.722 10.722 0 0 1-.244.637c-.079.186.074.394.273.362a21.673 21.673 0 0 0 .693-.125zm.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6c0 3.193-3.004 6-7 6a8.06 8.06 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a10.97 10.97 0 0 0 .398-2z"/>
                                                        </svg>
                                                        Ask a question
                                                    </Link>
                                                </div>}
                                        </div>
                                        {travel.creator.about && (
                                            <div className="about p-4 border-top">
                                                {showCreatorAbout()}
                                                {travel.creator.about.length > maxAboutLength && (
                                                    <>
                                                        {' '}
                                                        <Link
                                                            to={`#${travel.creator.id}`}> {/* TODO: to='/user/id123122' */}More</Link>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="travel-mates mb-4">
                                    <h5 style={{fontWeight: "700"}}>CURRENT MATES</h5>
                                    <div className="border rounded py-4 px-4">
                                        <div className="d-flex scrollable-x"
                                             style={{overflowX: "auto", scrollbarWidth: "none"}}>
                                            {participants
                                                .sort((p1, p2) => p2.user.isCreator - p1.user.isCreator)
                                                .map(participant => (
                                                    <>
                                                        <Link
                                                            to={`#${participant.user.id}`}> {/* TODO: to='/user/id123122' */}
                                                            <div className="d-flex flex-column align-items-center mx-3">
                                                                <div
                                                                    className="rounded-circle user-avatar mb-1"
                                                                    style={{
                                                                        width: "60px",
                                                                        height: "60px",
                                                                        backgroundImage: `url(${participant.user.avatar})`
                                                                    }}
                                                                />
                                                                <p className="mb-0 text-black"
                                                                   style={{fontWeight: "600"}}>{participant.user.firstName}</p>
                                                                {participant.isCreator ? (
                                                                    <p className="mb-0" style={{
                                                                        color: "#50a845",
                                                                        fontSize: "10px",
                                                                        fontWeight: "600"
                                                                    }}>CREATOR</p>
                                                                ) : (
                                                                    <p className="mb-0" style={{
                                                                        color: "#448EF6",
                                                                        fontSize: "10px",
                                                                        fontWeight: "600"
                                                                    }}>MATE</p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                                {travel.events && travel.events.length > 0 && (
                                    <div className="travel-events mb-3">
                                        <h5 className="mb-3" style={{fontWeight: "700"}}>CURRENT EVENTS</h5>
                                        <FullCalendar
                                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                                            initialView="dayGridMonth"
                                            headerToolbar={{
                                                left: "prev,next today",
                                                center: "title",
                                                right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
                                            }}
                                            height="500px"
                                            events={travel.events}
                                            locale={i18n.language}
                                            initialDate={travel.events[0].start}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="col-4"
                                 style={{height: "400px", borderColor: "#000", position: 'sticky', top: "20px"}}>
                                <div className="border rounded-4">
                                    <div className="travel-dates d-flex align-items-center p-3">
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
                                    {showJoinRequestButton()}
                                </div>
                            </div>
                        </>
                    )}
                </Row>
            </Container>
            <JoinRequestModal travelId={id} show={showJoinRequest} onHide={handleJoinRequestClose}
                              isAuthorized={isAuthorized} currentUser={currentUser}/>
        </>
    );
}

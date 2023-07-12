import {Link, useParams} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import axios from "axios";
import {DOMAIN_API_URL} from "../api";
import {Alert, Button, Col, Container, Form, Row} from "react-bootstrap";
import "../css/mate.css";
import "../css/star-rating.css";
import moment from "moment/moment";
import {Carousel} from "react-responsive-carousel";
import Cookies from "js-cookie";
import UserGalleryModal from "../components/modals/user/UserGalleryModal";
import UserEditModal from "../components/modals/user/UserEditModal";

export default function Mate({currentUser, isAuthorized, setShowLogIn}) {
    const {id} = useParams();

    const [user, setUser] = useState(null);
    const [rating, setRating] = useState(0);
    const [images, setImages] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);

    const [isTruncated, setIsTruncated] = useState(true);

    const [comment, setComment] = useState('');
    const [selectedRating, setSelectedRating] = useState(0);
    const [hover, setHover] = useState(0);

    const [errorMessage, setErrorMessage] = useState('');

    const [showUserEdit, setShowUserEdit] = useState(false);
    const [showGalleryEdit, setShowGalleryEdit] = useState(false);

    const maxAboutLength = 500;

    const fetchUser = async () => {
        try {
            let userResponse = await axios.get(`${DOMAIN_API_URL}/users/${id}`);

            try {
                const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${id}/avatar`, {responseType: 'arraybuffer'});
                const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                userResponse.data = {...userResponse.data, avatar: URL.createObjectURL(blob)};
            } catch (error) {
                if (error && error.response.status === 404) {
                    userResponse.data = {...userResponse.data, avatar: "/img/default-user.png"};
                }
            }

            setUser(userResponse.data);
        } catch (error) {
            console.error(error);
        }
    }

    const fetchRating = async () => {
        await axios.get(`${DOMAIN_API_URL}/users/${id}/rating`)
            .then(response => setRating(response.data.rating))
            .catch(error => console.error(error));
    };

    const fetchPhotos = async () => {
        try {
            let response = await axios.get(`${DOMAIN_API_URL}/images/user/${id}`);

            const updatedImages = await Promise.all(response.data.map(async (image) => {
                const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${id}/name/${image}`, {responseType: 'arraybuffer'});
                const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                return URL.createObjectURL(blob);
            }));

            setImages(updatedImages);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFeedbacks = async () => {
        try {
            let feedbackResponse = await axios.get(`${DOMAIN_API_URL}/users/${id}/comments`);

            const updatedFeedbacks = await Promise.all(feedbackResponse.data.map(async (feedback) => {
                let updatedFeedback = feedback;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${feedback.user.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    updatedFeedback = {
                        ...updatedFeedback,
                        user: {
                            ...updatedFeedback.user,
                            avatar: URL.createObjectURL(blob)
                        }
                    };
                } catch (error) {
                    if (error && error.response.status === 404) {
                        updatedFeedback = {
                            ...updatedFeedback,
                            user: {
                                ...updatedFeedback.user,
                                avatar: "/img/default-user.png"
                            }
                        };
                    }
                }

                return updatedFeedback;
            }));

            setFeedbacks(updatedFeedbacks);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchRating();
        fetchPhotos();
        fetchFeedbacks();
    }, []);

    const showCreatorAge = () => {
        const today = moment();
        const birthday = moment(user.birthday);
        const age = today.diff(birthday, 'years')
        return `${age} y.o.`;
    };

    const showCreatorCountryCity = () => {
        if (user.city) {
            return `${user.country.title}, ${user.city.title}`
        }
        return `${user.country.title}`;
    };

    const showDescription = () => {
        if (isTruncated) {
            const truncatedText = user.about.slice(0, maxAboutLength);
            const lastIndexWord = truncatedText.lastIndexOf(" ");
            return user.about.slice(0, lastIndexWord);
        } else {
            return user.about;
        }
    };

    const handleSetAvatar = (selectedImageUrl) => {
        const updatedUser = {
            ...user,
            avatar: selectedImageUrl
        };
        setUser(updatedUser);
    };

    const handleUpdateAvatar = async () => {
        let updatedUser;
        try {
            const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${user.id}/avatar`, {responseType: 'arraybuffer'});
            const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
            updatedUser = {...user, avatar: URL.createObjectURL(blob)};
        } catch (error) {
            if (error && error.response.status === 404) {
                updatedUser = {...user, avatar: "/img/default-user.png"};
            }
        }
        setUser(updatedUser);
    };

    const handlePostClick = async () => {
        if (selectedRating > 0 && comment.trim()) {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

            await axios.post(`${DOMAIN_API_URL}/users/${user.id}/comments`,
                {rating: selectedRating, text: comment}, config)
                .then(async () => {
                    fetchFeedbacks();
                    fetchRating();
                })
                .catch(error => {
                    if (error.response && error.response.status === 409) {
                        setErrorMessage("Your feedback for the current user is already exists");
                        setTimeout(() => {
                            setErrorMessage('');
                        }, 10000);
                    }
                    console.error(error)
                });

            setSelectedRating(0);
            setHover(0);
            setComment('');
        } else {
            if (selectedRating <= 0) {
                setErrorMessage("Choose the appropriate rating before posting the feedback")
                setTimeout(() => {
                    setErrorMessage('');
                }, 10000);
            } else if (comment.trim() === '') {
                setErrorMessage("Write a feedback before posting it");
                setTimeout(() => {
                    setErrorMessage('');
                }, 10000);
            }
        }
    };

    return (
        <>
            <Container className="mt-3">
                {user === null ? (
                    <Col className="my-5" sm={12}>
                        <h4 className="text-muted text-center">We're sorry, but the travel you're looking for could
                            not be found.<br/>Please check that you have the correct URL and try again.</h4>
                    </Col>
                ) : (
                    <>
                        <Row className="border-1 rounded-3 mate mb-5">
                            <div className="d-flex justify-content-between p-4 mb-4">
                                <div className="d-flex align-items-center">
                                    <div className="travel-creator d-flex align-items-center">
                                        <div
                                            className="rounded-circle me-3 user-avatar"
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                backgroundImage: `url(${user.avatar})`
                                            }}
                                        />
                                        <div className="me-3">
                                            <p className="mb-0"
                                               style={{fontWeight: 500, fontSize: '20px'}}>{user.name}</p>
                                            <p className="mb-0" style={{fontSize: '16px'}}>{showCreatorAge()}</p>
                                            <p className="mb-0"
                                               style={{fontSize: '16px'}}>{showCreatorCountryCity()}</p>
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
                                {user.id !== currentUser?.id ? (
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
                                            Chat
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center">
                                        <Button className="travel-btn-primary text-uppercase px-4"
                                                onClick={() => setShowUserEdit(true)}>Edit</Button>
                                    </div>
                                )}
                            </div>
                            {user.about &&
                                <div className="user-about mb-3 px-4">
                                    <div>
                                        <h5 style={{fontWeight: "700"}}>ABOUT</h5>
                                        {showDescription()}
                                    </div>
                                    {user.about.length > maxAboutLength && (
                                        <Button className="travel-btn-read w-100 mt-2"
                                                onClick={() => setIsTruncated(!isTruncated)}
                                                variant="primary">
                                            {isTruncated ? `READ MORE` : `READ LESS`}
                                        </Button>
                                    )}
                                </div>
                            }
                            {images.length > 0 &&
                                <div className="travel-slider mb-4 px-4">
                                    {user.id !== currentUser?.id ? (
                                        <h5 className="mb-3" style={{fontWeight: "700"}}>GALLERY</h5>
                                    ) : (
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center">
                                                <h5 className="mb-0" style={{fontWeight: "700"}}>GALLERY</h5>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <Button className="travel-btn-primary text-uppercase px-4"
                                                        onClick={() => setShowGalleryEdit(true)}>Edit</Button>
                                            </div>
                                        </div>
                                    )}
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
                            }
                            <div className="user-feedbacks px-4">
                                <h5 className="mb-3" style={{fontWeight: "700"}}>FEEDBACKS</h5>
                                {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                                <div>
                                    <div className="d-flex align-items-center">
                                        {[...Array(5)].map((star, index) => {
                                            index += 1;
                                            return (
                                                <button
                                                    style={{
                                                        backgroundColor: "transparent",
                                                        border: "none",
                                                        outline: "none",
                                                        cursor: "pointer"
                                                    }}
                                                    type="button"
                                                    key={index}
                                                    className="d-flex align-items-center ps-0 pe-1"
                                                    onClick={() => setSelectedRating(index)}
                                                    onMouseEnter={() => setHover(index)}
                                                    onMouseLeave={() => setHover(selectedRating)}
                                                >
                                                    <svg width="16px" height="16px" viewBox="0 0 64 64">
                                                        <path
                                                            fill={index <= (hover || selectedRating) ? "#FFA800" : "#ccc"}
                                                            d="M63.893,24.277c-0.238-0.711-0.854-1.229-1.595-1.343l-19.674-3.006L33.809,1.15
                                                                    C33.479,0.448,32.773,0,31.998,0s-1.48,0.448-1.811,1.15l-8.815,18.778L1.698,22.935c-0.741,0.113-1.356,0.632-1.595,1.343
                                                                    c-0.238,0.71-0.059,1.494,0.465,2.031l14.294,14.657L11.484,61.67c-0.124,0.756,0.195,1.517,0.822,1.957
                                                                    c0.344,0.243,0.747,0.366,1.151,0.366c0.332,0,0.666-0.084,0.968-0.25l17.572-9.719l17.572,9.719c0.302,0.166,0.636,0.25,0.968,0.25
                                                                    c0.404,0,0.808-0.123,1.151-0.366c0.627-0.44,0.946-1.201,0.822-1.957l-3.378-20.704l14.294-14.657
                                                                    C63.951,25.771,64.131,24.987,63.893,24.277z"
                                                            fill-rule="evenodd"/>
                                                    </svg>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <Form.Control value={comment} className="mt-2" as="textarea"
                                                  placeholder="Description..." rows={3}
                                                  onChange={(event) => setComment(event.target.value)}/>
                                    <Button className="travel-btn-primary w-100 mt-2"
                                            onClick={handlePostClick}>Post</Button>
                                </div>
                                <div className="mt-3">
                                    {feedbacks.map(feedback =>
                                        <div className="d-flex flex-column mb-3">
                                            <div className="travel-creator d-flex align-items-center">
                                                <div
                                                    className="rounded-circle me-2 user-avatar"
                                                    style={{
                                                        width: "50px",
                                                        height: "50px",
                                                        backgroundImage: `url(${feedback.user.avatar})`
                                                    }}
                                                />
                                                <div>
                                                    <p className="mb-0" style={{
                                                        fontWeight: 500,
                                                        fontSize: '16px'
                                                    }}>{feedback.user.name}</p>
                                                </div>
                                            </div>
                                            <div className="ms-1 d-flex mt-1 align-items-center">
                                                <div className="d-flex align-items-center me-2">
                                                    {[...Array(5)].map((star, index) => {
                                                        index += 1;
                                                        return (
                                                            <button
                                                                style={{
                                                                    backgroundColor: "transparent",
                                                                    border: "none",
                                                                    outline: "none",
                                                                    cursor: "pointer"
                                                                }}
                                                                type="button"
                                                                key={index}
                                                                className="d-flex align-items-center ps-0 pe-1"
                                                            >
                                                                <svg width="16px" height="16px" viewBox="0 0 64 64">
                                                                    <path
                                                                        fill={index <= feedback.rating ? "#FFA800" : "#ccc"}
                                                                        d="M63.893,24.277c-0.238-0.711-0.854-1.229-1.595-1.343l-19.674-3.006L33.809,1.15
                                                                    C33.479,0.448,32.773,0,31.998,0s-1.48,0.448-1.811,1.15l-8.815,18.778L1.698,22.935c-0.741,0.113-1.356,0.632-1.595,1.343
                                                                    c-0.238,0.71-0.059,1.494,0.465,2.031l14.294,14.657L11.484,61.67c-0.124,0.756,0.195,1.517,0.822,1.957
                                                                    c0.344,0.243,0.747,0.366,1.151,0.366c0.332,0,0.666-0.084,0.968-0.25l17.572-9.719l17.572,9.719c0.302,0.166,0.636,0.25,0.968,0.25
                                                                    c0.404,0,0.808-0.123,1.151-0.366c0.627-0.44,0.946-1.201,0.822-1.957l-3.378-20.704l14.294-14.657
                                                                    C63.951,25.771,64.131,24.987,63.893,24.277z"
                                                                        fill-rule="evenodd"/>
                                                                </svg>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{fontWeight: 500, color: '#999'}}>
                                                    {moment(feedback.createDate).format('DD.MM.YYYY')}
                                                </div>
                                            </div>
                                            <div className="ms-1 mt-2">
                                                {feedback.text}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Row>
                    </>
                )}
            </Container>
            {user && showGalleryEdit &&
                <UserGalleryModal show={showGalleryEdit} userId={user.id}
                                  setMainPhoto={handleSetAvatar}
                                  updateMainPhoto={handleUpdateAvatar}
                                  fetchPhotos={fetchPhotos}
                                  onHide={() => setShowGalleryEdit(false)}/>
            }
            {user && showUserEdit &&
                <UserEditModal show={showUserEdit} user={user}
                               onHide={() => setShowUserEdit(false)}/>
            }
        </>
    );
}

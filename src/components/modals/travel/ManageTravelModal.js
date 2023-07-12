import {Alert, Badge, Button, ButtonGroup, Form, Modal} from "react-bootstrap";
import Select from "react-select";
import {useEffect, useRef, useState} from "react";
import {debounce} from "lodash";
import axios from "axios";
import Cookies from "js-cookie";
import {DOMAIN_API_URL} from "../../../api";
import moment from "moment/moment";
import {Link} from "react-router-dom";
import InvitationManageModal from "./invitation/InvitationManageModal";
import JoinRequestManageModal from "./request/JoinRequestManageModal";

export default function ManageTravelModal({show, travel, unreadJoinRequestsCount, onHide}) {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [inviteText, setInviteText] = useState('');
    const [invites, setInvites] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [selectedInvite, setSelectedInvite] = useState(null);
    const [showInvite, setShowInvite] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRequest, setShowRequest] = useState(false);

    const [participants, setParticipants] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const fetchUsersToInvite = async (search) => {
        try {
            setIsLoading(true);

            let response = await axios.get(`${DOMAIN_API_URL}/travels/${travel.id}/invite?search=${search}`);

            const updatedUsers = await Promise.all(response.data.map(async (user) => {
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

                return updatedUser;
            }));

            setUsers(updatedUsers);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    const fetchInvites = async () => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

            let response = await axios.get(`${DOMAIN_API_URL}/invitations/travel/${travel.id}`, config);

            const updatedInvites = await Promise.all(response.data.map(async (invite) => {
                let updatedInvite;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${invite.receiver.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    updatedInvite = {...invite, receiver: {...invite.receiver, avatar: URL.createObjectURL(blob)}};
                } catch (error) {
                    if (error && error.response.status === 404) {
                        updatedInvite = {...invite, receiver: {...invite.receiver, avatar: "/img/default-user.png"}};
                    }
                }

                return updatedInvite;
            }));

            setInvites(updatedInvites);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRequests = async () => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

            let response = await axios.get(`${DOMAIN_API_URL}/join-requests/travel/${travel.id}`, config);

            const updatedRequests = await Promise.all(response.data.map(async (request) => {
                let updatedRequest;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${request.sender.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    updatedRequest = {...request, sender: {...request.sender, avatar: URL.createObjectURL(blob)}};
                } catch (error) {
                    if (error && error.response.status === 404) {
                        updatedRequest = {...request, receiver: {...request.sender, avatar: "/img/default-user.png"}};
                    }
                }

                return updatedRequest;
            }));

            setJoinRequests(updatedRequests);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchParticipants = async () => {
        try {
            let participantsResponse = await axios.get(`${DOMAIN_API_URL}/travels/${travel.id}/users`);

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
    };

    useEffect(() => {
        fetchUsersToInvite('');
        fetchInvites();
        fetchRequests();
        fetchParticipants();
    }, [])

    const handleUserChange = (selectedOption) => {
        setSelectedUser(selectedOption);
    };

    const handleUserInputChange = debounce(async (value) => fetchUsersToInvite(value), 500);

    const formatOptionLabel = ({avatar, name, isAdmin}) => (
        <div className="d-flex align-items-center">
            <div
                className="rounded-circle me-2"
                style={{
                    width: "35px",
                    height: "35px",
                    background: "#ddd",
                    backgroundImage: `url(${avatar})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />
            {name}{isAdmin && ' (A)'}
        </div>
    );

    const handleInviteTextChange = (event) => {
        setInviteText(event.target.value);
    }

    const handleUserInviteClick = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.post(`${DOMAIN_API_URL}/invitations/travel/${travel.id}/user/${selectedUser.id}`, {text: inviteText}, config)
            .then(async () => {
                await fetchInvites();
                setSelectedUser(null);
                setInviteText('');
                setSuccessMessage('Invitation is created successfully!');
                setTimeout(() => {
                    setSuccessMessage('');
                }, 5000);
            })
            .catch(error => {
                console.error(error)
                if (error.response) {
                    if (error.response.status === 400) {
                        setErrorMessage('400');
                        setTimeout(() => {
                            setErrorMessage('');
                        }, 5000);
                    } else if (error.response.status === 403) {
                        setErrorMessage('403');
                        setTimeout(() => {
                            setErrorMessage('');
                        }, 5000);
                    }
                }
            });
    }

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

    const showIsNew = (request) => {
        if (!request.viewed) {
            return (
                <div className="ms-1 div-new text-uppercase">
                    New
                </div>
            );
        }
    };

    const handleInvitationShowClick = (invite) => {
        setSelectedInvite(invite);
        setShowInvite(true);
    };

    const handleInvitationShowClose = () => {
        setSelectedInvite(null);
        setShowInvite(false);
    }

    const handleDeleteInvitation = async (invite) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        await axios.delete(`${DOMAIN_API_URL}/invitations/${invite.id}`, config)
            .then(async () => await fetchInvites())
            .catch(error => console.error(error));
    };

    const handleRequestShowClick = (request) => {
        setSelectedRequest(request);
        setShowRequest(true);
    };

    const handleRequestShowClose = () => {
        setSelectedRequest(null);
        setShowRequest(false);
    };

    const handleApproveRequestClick = async (request) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.post(`${DOMAIN_API_URL}/join-requests/${request.id}/approve`, {}, config)
            .then(async () => await fetchRequests())
            .catch(error => console.error(error));
    };

    const handleRejectRequestClick = async (request) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.post(`${DOMAIN_API_URL}/join-requests/${request.id}/reject`, {}, config)
            .then(async () => await fetchRequests())
            .catch(error => console.error(error));
    };

    const handleDeleteRequestClick = async (request) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.delete(`${DOMAIN_API_URL}/join-requests/${request.id}`, config)
            .then(async () => await fetchRequests())
            .catch(error => console.error(error));
    };

    const handleRemoveUserClick = async (user) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.delete(`${DOMAIN_API_URL}/travels/${travel.id}/users/${user.id}`, config)
            .then(async () => await fetchParticipants())
            .catch(error => console.error(error));
    };

    const handleManageClose = () => {
        onHide();
    }

    return (
        <>
            <Modal show={show} size="lg" animation={false} onHide={handleManageClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Travel Manage</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                        {successMessage && <Alert variant="success">{successMessage}</Alert>}
                        <Form.Group className="mb-2">
                            <Form.Label>Invite</Form.Label>
                            <Select
                                value={selectedUser}
                                onChange={handleUserChange}
                                onInputChange={handleUserInputChange}
                                isLoading={isLoading}
                                options={users.map((user) => ({
                                    id: user.id,
                                    name: user.name,
                                    firstName: user.firstName,
                                    avatar: user.avatar,
                                    isAdmin: user.isAdmin
                                }))}
                                getOptionValue={option => option.id}
                                getOptionLabel={option => option.name}
                                noOptionsMessage={() => isLoading ? "Loading users..." : "No users"}
                                placeholder="John Doe"
                                formatOptionLabel={formatOptionLabel}
                                isClearable
                            />
                            <Form.Control value={inviteText} className="mt-2" as="textarea"
                                          placeholder="Invite text..." rows={3}
                                          onChange={handleInviteTextChange}/>
                            {selectedUser &&
                                <Button className="travel-btn-primary w-100 mt-2"
                                        onClick={handleUserInviteClick}>Invite</Button>}
                        </Form.Group>
                    </Form>
                    <div className="d-flex border rounded-3 mb-2">
                        <div className="col-6">
                            <div className="p-2">
                                <Form.Label>Invitations</Form.Label>
                                <div className="border rounded-3" style={{height: "150px", overflow: "auto"}}>
                                    {invites.map(invite => (
                                        <div className="d-flex justify-content-between align-items-center p-2">
                                            <div className="d-flex align-items-center">
                                                <Link to="#" className="d-flex align-items-center"
                                                      style={{
                                                          color: "#000",
                                                          textDecoration: "none",
                                                          fontWeight: "600"
                                                      }}>
                                                    <div
                                                        className="rounded-circle me-2"
                                                        style={{
                                                            width: "35px",
                                                            height: "35px",
                                                            background: "#ddd",
                                                            backgroundImage: `url(${invite.receiver.avatar})`,
                                                            backgroundSize: "cover",
                                                            backgroundPosition: "center",
                                                        }}
                                                    />
                                                    <p className="mb-0 me-2">{invite.receiver.firstName}</p>
                                                </Link>
                                                {showStatus(invite)}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <Button className="d-flex align-items-center p-1" variant="button"
                                                        onClick={() => handleInvitationShowClick(invite)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                         fill="#448EF6" className="bi bi-eye" viewBox="0 0 16 16">
                                                        <path
                                                            d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                                        <path
                                                            d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                                    </svg>
                                                </Button>
                                                <Button className="d-flex align-items-center p-1" variant="button"
                                                        onClick={() => handleDeleteInvitation(invite)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                         fill="#ec2f2f" className="bi bi-trash3"
                                                         viewBox="0 0 16 16">
                                                        <path
                                                            d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                                                    </svg>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-2">
                                <Form.Label>
                                    Join Requests
                                    {unreadJoinRequestsCount > 0 &&
                                        <Badge className="ms-1" bg="danger" pill>
                                            {unreadJoinRequestsCount}
                                        </Badge>}
                                </Form.Label>
                                <div className="border rounded-3" style={{height: "150px", overflow: "auto"}}>
                                    {joinRequests.map(request => (
                                        <div className="d-flex justify-content-between align-items-center p-2">
                                            <div className="d-flex align-items-center">
                                                <Link to="#" className="d-flex align-items-center"
                                                      style={{
                                                          color: "#000",
                                                          textDecoration: "none",
                                                          fontWeight: "600"
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
                                                    <p className="mb-0 me-2">{request.sender.firstName}</p>
                                                </Link>
                                                {showStatus(request)}
                                                {showIsNew(request)}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                <Button className="d-flex align-items-center p-1" variant="button"
                                                        onClick={() => handleRequestShowClick(request)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                         fill="#448EF6" className="bi bi-eye" viewBox="0 0 16 16">
                                                        <path
                                                            d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                                        <path
                                                            d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                                                    </svg>
                                                </Button>
                                                {request.status === "APPROVED" || request.status === "REJECTED" ? (
                                                    <Button className="d-flex align-items-center p-1" variant="button"
                                                            onClick={() => handleDeleteRequestClick(request)}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                                             fill="#ec2f2f" className="bi bi-trash3"
                                                             viewBox="0 0 16 16">
                                                            <path
                                                                d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1h-.995a.59.59 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"/>
                                                        </svg>
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button className="d-flex align-items-center p-1"
                                                                variant="button"
                                                                onClick={() => handleApproveRequestClick(request)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                 height="16"
                                                                 fill="#1fc44b" className="bi bi-check2"
                                                                 viewBox="0 0 16 16">
                                                                <path
                                                                    d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                                            </svg>
                                                        </Button>
                                                        <Button className="d-flex align-items-center p-1"
                                                                variant="button"
                                                                onClick={() => handleRejectRequestClick(request)}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16"
                                                                 height="16"
                                                                 fill="#ec2f2f" className="bi bi-x-lg"
                                                                 viewBox="0 0 16 16">
                                                                <path
                                                                    d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                                                            </svg>
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Form.Group className="mb-2">
                        <Form.Label>Current Mates</Form.Label>
                        <div className="border rounded-3" style={{height: "150px", overflow: "auto"}}>
                            {participants
                                .sort((p1, p2) => p2.user.isCreator - p1.user.isCreator)
                                .map(participant => (
                                    <>
                                        <div className="d-flex justify-content-between align-items-center px-2 py-1">
                                            <div className="d-flex align-items-center">
                                                <Link className="d-flex align-items-center text-decoration-none me-2"
                                                      to={`#${participant.user.id}`}> {/* TODO: to='/user/id123122' */}

                                                    <div
                                                        className="rounded-circle user-avatar me-2"
                                                        style={{
                                                            width: "40px",
                                                            height: "40px",
                                                            backgroundImage: `url(${participant.user.avatar})`
                                                        }}
                                                    />
                                                    <p className="mb-0 text-black"
                                                       style={{fontWeight: "600"}}>{participant.user.name}</p>
                                                </Link>
                                                {participant.isCreator &&
                                                    <div className="rounded-5" style={{
                                                        color: '#fff',
                                                        fontWeight: 500,
                                                        backgroundColor: '#50a845',
                                                        padding: '0px 7px'
                                                    }}>
                                                        C
                                                    </div>}
                                                {!participant.isCreator &&
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
                                                    </Link>}
                                            </div>
                                            <ButtonGroup>
                                                <Button as={Link} to="#" className="travel-btn-primary">View</Button>
                                                {!participant.isCreator &&
                                                    <Button className="travel-btn-danger"
                                                            onClick={() => handleRemoveUserClick(participant.user)}>Remove</Button>
                                                }
                                            </ButtonGroup>
                                        </div>
                                    </>
                                ))}
                        </div>
                    </Form.Group>
                </Modal.Body>
                {selectedInvite && showInvite &&
                    <InvitationManageModal show={showInvite} invite={selectedInvite} showStatus={showStatus}
                                           deleteInvite={() => handleDeleteInvitation(selectedInvite)}
                                           onHide={handleInvitationShowClose}/>}
                {selectedRequest && showRequest &&
                    <JoinRequestManageModal show={showRequest} request={selectedRequest} showStatus={showStatus}
                                            fetchRequests={fetchRequests}
                                            onHide={handleRequestShowClose}/>}
            </Modal>
        </>
    );
}

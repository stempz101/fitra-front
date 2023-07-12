import {Badge, Button, ButtonGroup, Container, Row} from "react-bootstrap";
import '../css/my-travels.css';
import {useEffect, useState} from "react";
import CreateTravelModal from "../components/modals/travel/CreateTravelModal";
import ParticipatingTravels from "../components/list/ParticipatingTravels";
import {Link, useLocation} from "react-router-dom";
import Invitations from "../components/list/Invitations";
import CreatedTravels from "../components/list/CreatedTravels";
import Requests from "../components/list/Requests";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";

export default function MyTravels({
                                      isAuthorized,
                                      currentUser,
                                      participating,
                                      invitations,
                                      created,
                                      requests,
                                      unreadInvitesCount,
                                      unreadRequestsCount
                                  }) {
    const [showCreateTravel, setShowCreateTravel] = useState(false);
    const [showParticipatingTravels, setShowParticipatingTravels] = useState(participating);
    const [showInvitations, setShowInvitations] = useState(invitations);
    const [showCreatedTravels, setShowCreatedTravels] = useState(created);
    const [showRequests, setShowRequests] = useState(requests);

    const location = useLocation();

    const handleShowParticipatingTravels = () => {
        setShowParticipatingTravels(true);
        setShowInvitations(false);
        setShowCreatedTravels(false);
        setShowRequests(false);
    };

    const handleShowInvitations = () => {
        setShowParticipatingTravels(false);
        setShowInvitations(true);
        setShowCreatedTravels(false);
        setShowRequests(false);
    };

    const handleShowCreatedTravels = () => {
        setShowParticipatingTravels(false);
        setShowInvitations(false);
        setShowCreatedTravels(true);
        setShowRequests(false);
    };

    const handleShowRequests = () => {
        setShowParticipatingTravels(false);
        setShowInvitations(false);
        setShowCreatedTravels(false);
        setShowRequests(true);
    };

    return (
        <>
            {isAuthorized && (
                <>
                    <Container className="mt-3">
                        <Row>
                            <div className="d-flex justify-content-between mb-3">
                                <div>
                                    <h2 style={{fontWeight: "600"}}>My Travels</h2>
                                </div>
                                <div>
                                    <Button onClick={() => setShowCreateTravel(true)}
                                            className="btn btn-create text-black mx-3 d-flex align-items-center justify-content-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"
                                             fill="currentColor"
                                             className="bi bi-plus" viewBox="0 0 16 16">
                                            <path
                                                d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                        </svg>
                                        Create Travel
                                    </Button>
                                </div>
                            </div>
                            <div className="mb-3">
                                <ButtonGroup className="w-100">
                                    <Button as={Link} className="btn-group-item" to="/my-travels/participating"
                                            onClick={handleShowParticipatingTravels}
                                            active={showParticipatingTravels}>Participating</Button>
                                    <Button as={Link} className="btn-group-item" to="/my-travels/invitations"
                                            onClick={handleShowInvitations}
                                            active={showInvitations}>
                                        Invitations
                                        {unreadInvitesCount > 0 &&
                                            <Badge className="ms-2" bg="danger" pill>
                                                {unreadInvitesCount}
                                            </Badge>
                                        }
                                    </Button>
                                    <Button as={Link} className="btn-group-item" to="/my-travels/created"
                                            onClick={handleShowCreatedTravels}
                                            active={showCreatedTravels}>
                                        Created
                                        {unreadRequestsCount > 0 &&
                                            <Badge className="ms-2" bg="danger" pill>
                                                {unreadRequestsCount}
                                            </Badge>
                                        }
                                    </Button>
                                    <Button as={Link} className="btn-group-item" to="/my-travels/requests"
                                            onClick={handleShowRequests}
                                            active={showRequests}>Requests</Button>
                                </ButtonGroup>
                            </div>
                            {showParticipatingTravels ? (
                                <ParticipatingTravels show={showParticipatingTravels} currentUser={currentUser}
                                                      location={location}/>
                            ) : showInvitations ? (
                                <Invitations show={showInvitations} location={location}/>
                            ) : showCreatedTravels ? (
                                <CreatedTravels show={showCreatedTravels} location={location}/>
                            ) : showRequests ? (
                                <Requests show={showRequests} location={location}/>
                            ) : (<></>)}
                        </Row>
                    </Container>
                    <CreateTravelModal show={showCreateTravel} onHide={() => setShowCreateTravel(false)}
                                       isAuthorized={isAuthorized}/>
                </>
            )}
        </>
    );
}

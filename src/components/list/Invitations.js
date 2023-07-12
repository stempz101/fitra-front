import {useEffect, useState} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {DOMAIN_API_URL} from "../../api";
import {Link, useNavigate} from "react-router-dom";
import {Button, ButtonGroup, Col} from "react-bootstrap";
import PaginationButtons from "../pagination/PaginationButtons";
import InvitationViewModal from "../modals/travel/invitation/InvitationViewModal";
import moment from "moment";
import "../../css/invitation.css";

export default function Invitations({show, location}) {
    const [invites, setInvites] = useState([]);
    const [selectedInvite, setSelectedInvite] = useState(null);
    const [showInvite, setShowInvite] = useState(false);

    const [pageSize] = useState(9);
    const [pageNumber, setPageNumber] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();

    const maxTextSize = 75;

    const fetchInvites = async (params) => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            let response;

            if (params.toString().length === 0) {
                response = await axios.get(`${DOMAIN_API_URL}/invitations/user`, config);
            } else {
                response = await axios.get(`${DOMAIN_API_URL}/invitations/user?${params.toString()}`, config);
            }

            const updatedInvites = await Promise.all(response.data.map(async (invite) => {
                let updatedInvite;
                let inviteCreatorAvatar;
                let inviteReceiverAvatar;
                let inviteTravelPhoto;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${invite.travel.creator.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    inviteCreatorAvatar = URL.createObjectURL(blob);
                } catch (error) {
                    if (error && error.response.status === 404) {
                        inviteCreatorAvatar = "/img/default-user.png";
                    }
                }

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${invite.receiver.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    inviteReceiverAvatar = URL.createObjectURL(blob);
                } catch (error) {
                    if (error && error.response.status === 404) {
                        inviteReceiverAvatar = "/img/default-user.png";
                    }
                }

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/travel/${invite.travel.id}/main`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    inviteTravelPhoto = URL.createObjectURL(blob);
                } catch (error) {
                    if (error && error.response.status === 404) {
                        inviteTravelPhoto = "/img/default-travel.png";
                    }
                }

                updatedInvite = {
                    ...invite,
                    receiver: {
                        ...invite.receiver,
                        avatar: inviteReceiverAvatar
                    },
                    travel: {
                        ...invite.travel,
                        photo: inviteTravelPhoto,
                        creator: {
                            ...invite.travel.creator,
                            avatar: inviteCreatorAvatar
                        }
                    }
                }

                return updatedInvite;
            }));

            console.log(updatedInvites);
            setInvites(updatedInvites);
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
        handleUpdateInvitations();
    }, [location.search]);

    const showText = (invite) => {
        if (invite.text) {
            return invite.text.length > maxTextSize ? `${invite.text.slice(0, maxTextSize)}...` : invite.text;
        }
    };

    const showStatus = (invite) => {
        const status = invite.status;

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

    const showCreateDate = (invite) => {
        const now = moment();
        const date = moment(invite.createTime);

        if (now.isSame(date, 'day')) {
            return date.format('HH:mm');
        } else {
            return date.format('DD.MM.YYYY');
        }
    }

    const handleInvitationShow = (invite) => {
        setSelectedInvite(invite);
        setShowInvite(true);
    };

    const handleFetchInvites = () => {
        handleUpdateInvitations();
        if (showInvite) handleInvitationClose();
    }

    const handleUpdateInvitations = () => {
        const searchParams = new URLSearchParams(location.search);
        fetchInvites(searchParams);
        handleQueryParams(searchParams);
    }

    const handleInvitationClose = () => {
        setSelectedInvite(null);
        setShowInvite(false);
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
                        {invites.map(invite =>
                            <div
                                className={`d-flex justify-content-between align-items-center border rounded-3 mb-2 ${invite.viewed ? 'invite-item' : 'invite-item-new'}`}
                                onClick={() => handleInvitationShow(invite)}
                            >
                                <div className="d-flex align-items-center me-auto h-100">
                                    <div className="d-flex align-items-center border-end h-100 px-3 py-2"
                                         style={{color: '#000', textDecoration: 'none', fontWeight: '600'}}>
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="rounded-circle me-2"
                                                style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    background: "#ddd",
                                                    backgroundImage: `url(${invite.travel.creator.avatar})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }}
                                            />
                                            {invite.travel.creator.firstName}{invite.travel.creator.isAdmin && ' (A)'}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center border-end h-100 px-3 py-2"
                                         style={{fontWeight: 600}}>
                                        Travel:
                                        <div className="ms-1 mb-0" style={{color: '#0d6efd', fontWeight: 500}}>
                                            {invite.travel.name}
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center px-3 py-2" style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        {showText(invite)}
                                    </div>
                                </div>
                                <div className="d-flex align-items-center h-100">
                                    <div className="d-flex align-items-center border-start h-100 px-3 py-2">
                                        {showStatus(invite)}
                                    </div>
                                    <div className="d-flex align-items-center border-start h-100 px-3 py-2"
                                         style={{fontWeight: 500}}>
                                        {showCreateDate(invite)}
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
                    {selectedInvite && showInvite &&
                        <InvitationViewModal show={showInvite} invite={selectedInvite} showInviteStatus={showStatus}
                                             fetchInvites={handleFetchInvites}
                                             updateInvitations={handleUpdateInvitations}
                                             onHide={handleInvitationClose}/>}
                </>
            )}
        </>
    );
}

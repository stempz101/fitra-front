import {Button, ButtonGroup, Form, Modal} from "react-bootstrap";
import {Link} from "react-router-dom";
import moment from "moment";

export default function InvitationManageModal({show, invite, showStatus, deleteInvite, onHide}) {

    const handleDeleteInvite = () => {
        deleteInvite();
        onHide();
    };

    return (
        <>
            {show &&
                <>
                    <div className="modal-backdrop show" style={{zIndex: 1060}}></div>
                    <Modal show={show} animation={false} onHide={onHide} style={{zIndex: 1065}}>
                        <Modal.Header closeButton>
                            <Modal.Title>Invitation</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
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
                                                backgroundImage: `url(${invite.receiver.avatar})`,
                                                backgroundSize: "cover",
                                                backgroundPosition: "center",
                                            }}
                                        />
                                        <p className="mb-0 me-2">{invite.receiver.name}</p>
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
                            <Form.Group className="d-flex align-items-center mb-2">
                                <Form.Label className="me-2 mb-0">Status:</Form.Label>
                                {showStatus(invite)}
                            </Form.Group>
                            {invite.text &&
                                <Form.Group className="d-flex align-items-center mb-2">
                                    <Form.Label className="me-2 mb-0">Text:</Form.Label>
                                    <p className="mb-0">{invite.text}</p>
                                </Form.Group>
                            }
                            <Form.Group className="d-flex align-items-center mb-2">
                                <Form.Label className="me-2 mb-0">Created at:</Form.Label>
                                <p className="mb-0">{moment(invite.createTime).format("DD.MM.YYYY, HH:mm")}</p>
                            </Form.Group>
                            {invite.status === "APPROVED" || invite.status === "REJECTED" ? (
                                <Button className="w-100 travel-btn-danger" onClick={handleDeleteInvite}>Delete</Button>
                            ) : (
                                <Button className="w-100 travel-btn-danger" onClick={handleDeleteInvite}>Cancel</Button>
                            )}
                        </Modal.Body>
                    </Modal>
                </>
            }
        </>
    );
}

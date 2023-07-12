import {Alert, Button, ButtonGroup, Modal} from "react-bootstrap";
import {useEffect, useState} from "react";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import Cookies from "js-cookie";

export default function LeaveTravelModal({travel, currentUser, fetchTravels, show, onHide}) {
    const [showModal, setShowModal] = useState(show);
    const [isCreator, setIsCreator] = useState(false);

    useEffect(() => {
        if (travel.creatorId === currentUser.id) {
            setIsCreator(true);
        }
    }, [travel])

    const handleLeaveTravel = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        await axios.delete(`${DOMAIN_API_URL}/travels/${travel.id}/leave`, config)
            .then(response => fetchTravels())
            .catch(error => console.error(error));
    };

    const handleModalClose = () => {
        setShowModal(false);
        setIsCreator(false);
        onHide();
    };

    return (
        <Modal show={showModal} onHide={handleModalClose} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Leave travel</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure you want to leave this travel?</p>
                {isCreator &&
                    <Alert className="mt-3" variant="warning">
                        <b>You are the creator of this travel.</b> Leaving it will delete the travel for all participants.
                    </Alert>
                }
                <ButtonGroup className="d-flex w-100">
                    <Button className="col-6 travel-btn-danger" variant="danger" onClick={handleLeaveTravel}>
                        Leave Travel
                    </Button>
                    <Button className="col-6 travel-btn-cancel" variant="secondary" onClick={handleModalClose}>
                        Cancel
                    </Button>
                </ButtonGroup>
            </Modal.Body>
        </Modal>
    );
}

import {Alert, Button, ButtonGroup, Modal} from "react-bootstrap";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import Cookies from "js-cookie";

export default function DeleteTravelModal({show, travel, fetchTravels, onHide}) {

    const handleDeleteTravelClick = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.delete(`${DOMAIN_API_URL}/travels/${travel.id}`, config)
            .then(() => {
                travel.subscribe.unsubscribe();
                fetchTravels();
            })
            .catch(error => console.error(error));
    };

    return (
        <>
            <Modal show={show} animation={false} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Travel Delete</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert className="" variant="warning">
                        Deleting this travel will permanently delete all its associated data including its route, main
                        information, participants, and events. This action cannot be undone. <b>Are you sure you want to
                        proceed with the deletion?</b>
                    </Alert>
                    <ButtonGroup className="d-flex w-100">
                        <Button className="col-6 travel-btn-danger" variant="danger" onClick={handleDeleteTravelClick}>
                            Yes
                        </Button>
                        <Button className="col-6 travel-btn-cancel" variant="secondary" onClick={onHide}>
                            Cancel
                        </Button>
                    </ButtonGroup>
                </Modal.Body>
            </Modal>
        </>
    );
}

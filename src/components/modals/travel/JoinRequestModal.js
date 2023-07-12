import {Button, Form, Modal} from "react-bootstrap";
import {useState} from "react";
import Cookies from "js-cookie";
import {DOMAIN_API_URL} from "../../../api";
import axios from "axios";

export default function JoinRequestModal({show, travelId, onHide}) {
    const [requestText, setRequestText] = useState("");

    const handleRequestTextChange = (event) => {
        setRequestText(event.target.value);
    };

    const handleSendRequestClick = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        await axios.post(`${DOMAIN_API_URL}/join-requests/travel/${travelId}`, {text: requestText}, config)
            .then(() => onHide())
            .catch(error => console.error(error));
    }

    return (
        <>
            <Modal show={show} animation={false} onHide={onHide}>
                <Modal.Header>
                    <Modal.Title>Join Request</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2">
                        <Form.Label>
                            Write a message
                        </Form.Label>
                        <Form.Control value={requestText} className="mt-2" as="textarea" name="description"
                                      placeholder="Request text..." rows={5}
                                      onChange={handleRequestTextChange}/>
                        <Button className="travel-btn-primary w-100 mt-2"
                                onClick={handleSendRequestClick}>Send request</Button>
                    </Form.Group>
                </Modal.Body>
            </Modal>
        </>
    );
}

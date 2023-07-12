import {Alert, Button, Form, Modal} from "react-bootstrap";
import {useState} from "react";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import Cookies from "js-cookie";

export default function EmailEditModal({show, email, onHide}) {
    const [newEmail, setNewEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const updateClick = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        await axios.put(`${DOMAIN_API_URL}/users/email`, {email: newEmail}, config)
            .then(() => {
                setSuccessMessage("Confirmation link is sent to the new email. Confirm new email to change it!");
                setTimeout(() => setSuccessMessage(''), 5000);
            })
            .catch((error) => {
                if (error.response) {
                    if (error.response.status === 400) {
                        setErrorMessage('The specified email is already in use');
                    } else if (error.response.status === 409) {
                        setErrorMessage('Please confirm the previous update request by email before submitting a new one. Or wait a while to create a new one.');
                    }
                    setTimeout(() => setErrorMessage(''), 5000);
                }
            });
    };

    const handleInputChange = (event) => {
        setNewEmail(event.target.value);
    }

    const modalClose = () => {
        setNewEmail('');
        setSuccessMessage('');
        setErrorMessage('');
        onHide();
    };

    return (
        <>
            {show &&
                <>
                    <div className="modal-backdrop show" style={{zIndex: 1060}}></div>
                    <Modal show={show} animation={false} onHide={modalClose} style={{zIndex: 1065}}>
                        <Modal.Header closeButton>
                            <Modal.Title>Email Edit</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {successMessage && <Alert variant="success">{successMessage}</Alert>}
                            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                            <Form.Group className="mb-2">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    value={newEmail ? newEmail : email}
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                            {!newEmail || newEmail === email ? (
                                <Button className="travel-btn-primary w-100" onClick={updateClick} disabled>Update</Button>
                            ) : (
                                <Button className="travel-btn-primary w-100" onClick={updateClick}>Update</Button>
                            )}
                        </Modal.Body>
                    </Modal>
                </>
            }
        </>
    );
}

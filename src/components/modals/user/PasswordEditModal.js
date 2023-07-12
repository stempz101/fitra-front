import {Alert, Button, Form, Modal} from "react-bootstrap";
import {useState} from "react";
import Cookies from "js-cookie";
import {DOMAIN_API_URL} from "../../../api";
import axios from "axios";

export default function PasswordEditModal({show, onHide}) {
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    const updateClick = async () => {
        if (currentPassword === "" ||
            newPassword === "" ||
            repeatPassword === "") {
            setErrorMessage("Please enter all fields.");
            setTimeout(() => {
                setErrorMessage('');
            }, 5000);
            return;
        } else if (newPassword !== repeatPassword) {
            setErrorMessage("Please repeat your new password.");
            setTimeout(() => {
                setErrorMessage('');
            }, 5000);
            return;
        }

        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        const data = {
            currentPassword: currentPassword,
            newPassword: newPassword,
            repeatPassword: repeatPassword
        };

        console.log(data);
        await axios.put(`${DOMAIN_API_URL}/users/password`, data, config)
            .then(() => {
                setSuccessMessage("Password is updated successfully!");
                setTimeout(() => setSuccessMessage(''), 5000);
            })
            .catch(error => {
                if (error.response) {
                    if (error.response.status === 400) {
                        setErrorMessage('The new password you entered is incorrect. Please make sure your password meets the following requirements:\n' +
                            '\n' +
                            '- At least 8 characters long\n' +
                            '- Contains at least one letter (uppercase or lowercase)\n' +
                            '- Contains at least one digit (0-9)\n' +
                            'Please double-check your password and try again.');
                    } else if (error.response.status === 401) {
                        setErrorMessage('Current password is wrong. Please enter again your password correctly.');
                    } else if (error.response.status === 409) {
                        setErrorMessage('New password was previously used. Please enter new password.')
                    }
                    setTimeout(() => setErrorMessage(''), 5000);
                }
            });

        setCurrentPassword('');
        setNewPassword('');
        setRepeatPassword('');
    };

    const modalClose = () => {
        setSuccessMessage('');
        onHide();
    };

    return (
        <>
            {show &&
                <>
                    <div className="modal-backdrop show" style={{zIndex: 1060}}></div>
                    <Modal show={show} animation={false} onHide={modalClose} style={{zIndex: 1065}}>
                        <Modal.Header closeButton>
                            <Modal.Title>Password Edit</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {successMessage && <Alert variant="success">{successMessage}</Alert>}
                            {errorMessage && <Alert variant="danger">
                                {errorMessage.split('\n').map((line, index) => (
                                        <p className="mb-0" key={index}>{line}</p>
                                    ))}
                            </Alert>}
                            <Form.Group className="mb-2">
                                <Form.Label>Current Password</Form.Label>
                                <Form.Control
                                    value={currentPassword}
                                    type="password"
                                    name="password"
                                    placeholder="Current Password"
                                    onChange={(event) => setCurrentPassword(event.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>New Password</Form.Label>
                                <Form.Control
                                    value={newPassword}
                                    type="password"
                                    name="password"
                                    placeholder="New Password"
                                    onChange={(event) => setNewPassword(event.target.value)}
                                />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Confirm Password</Form.Label>
                                <Form.Control
                                    value={repeatPassword}
                                    type="password"
                                    name="password"
                                    placeholder="Confirm Password"
                                    onChange={(event) => setRepeatPassword(event.target.value)}
                                />
                            </Form.Group>
                            <Button className="travel-btn-primary w-100" onClick={updateClick}>Update</Button>
                        </Modal.Body>
                    </Modal>
                </>
            }
        </>
    );
}

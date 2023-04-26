import axios from "axios";
import { useEffect, useState } from "react";
import { Alert, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import { DOMAIN_API_URL } from "../../api";
import Cookies from "js-cookie";

export default function EmailAlertModal(props) {
    const [showSuccessResend, setShowSuccessResend] = useState(false);

    useEffect(() => {
        if (showSuccessResend) {
            const timeout = setTimeout(() => setShowSuccessResend(false), 10000);
            return () => clearTimeout(timeout);
        }
    }, [showSuccessResend]);

    const handleResend = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        await axios.post(`${DOMAIN_API_URL}/users/resend-confirm-registration`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(() => setShowSuccessResend(true))
            .catch(error => console.error(error));
    };

    return (
        <>
            {!props.isEnabled && (
                <Modal {...props} animation={false}>
                    <Modal.Header>
                        <Modal.Title>Confirm email</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Alert variant="warning">
                            <b>Confirm email.</b>{' '}
                            A link to confirm sign up is sent to your email account. Please also check your spam folder.
                        </Alert>
                        <label>
                            Link still not arrived?{' '}
                            <Link to="#" onClick={handleResend}>Resend</Link>
                        </label>
                        {showSuccessResend && <Alert  className="mt-3" variant="success">A confirmation link is sent. Check your email for confirmation.</Alert>}
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
}

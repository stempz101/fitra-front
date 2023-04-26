import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useState } from "react";
import axios from "axios";
import { USERS_AUTHENTICATE_API_URL } from "../../api";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";

export default function LogInModal(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (email === "" || password === "") {
      setErrorMessage("Please enter a valid email and password.");
      return;
    }

    await axios
      .post(USERS_AUTHENTICATE_API_URL, { email, password })
      .then((res) => {
        console.log(res.data);
        const options = { path: "/", sameSite: "lax" };
        if (rememberMe) {
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
          console.log(expires);
          Cookies.set("AUTH_TOKEN", res.data.token, { expires, ...options });
        } else {
          Cookies.set("AUTH_TOKEN", res.data.token, options);
        }
        setIsAuthorized(true);
        window.location.reload();
      })
      .catch((e) => {
        console.log(e);
        if (
          e.response &&
          (e.response.status === 403 || e.response.status === 401)
        ) {
          setErrorMessage("Please enter a valid email and password.");
        } else {
          setErrorMessage("An error occurred. Please try again later.");
        }
      });
  };

  const handleClose = () => {
    setErrorMessage("");
    props.onHide();
  };

  const handleShowResetModal = () => {
    handleClose();
    props.showResetModal();
  }

  const handleShowSignUpModal = () => {
    handleClose();
    props.showSignUpModal();
  }

  return (
    <>
      {!isAuthorized && (
        <Modal {...props} onHide={handleClose} animation={false}>
          <Modal.Header closeButton>
            <Modal.Title>Log in</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleFormSubmit}>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              <Form.Group className="mb-2" controlId={"fromBasicEmail"}>
                <Form.Label>Email Address</Form.Label>
                <Form.Control
                  type={"email"}
                  placeholder={"Enter email"}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-2" controlId={"fromBasicPassword"}>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type={"password"}
                  placeholder={"Enter password"}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-2" controlId={"fromBasicCheckbox"}>
                <Form.Check
                  type={"checkbox"}
                  label={"Remember me"}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              </Form.Group>
              <Button className="w-100 mb-2" variant="primary" type="submit">
                Login
              </Button>
              <Form.Label>
                Forgot your password?{' '}
                <Link to="#" onClick={handleShowResetModal}>Reset</Link>
              </Form.Label>
              <br/>
              <Form.Label>
                Not registered yet?{' '}
                <Link to="#" onClick={handleShowSignUpModal}>Sign up</Link>
              </Form.Label>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

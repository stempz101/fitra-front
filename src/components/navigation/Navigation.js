import {
    Badge,
    Button,
    ButtonGroup,
    Container,
    Nav,
    Navbar,
    NavDropdown,
} from "react-bootstrap";
import {Link} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import LocaleContext from "../../LocaleContext";
import i18n from "../../i18n";
import {useTranslation} from "react-i18next";
import LogInModal from "../modals/LogInModal";
import "../../css/navigation.css";
import SignUpModal from "../modals/SignUpModal";
import ResetModal from "../modals/ResetModal";
import axios from "axios";
import {DOMAIN_API_URL} from "../../api";
import EmailAlertModal from "../modals/EmailAlertModal";
import {Stomp} from '@stomp/stompjs';
import Cookies from "js-cookie";
import SockJS from 'sockjs-client';
import TypeModal from "../modals/type/TypeModal";

export default function Navigation(props) {
    const {locale} = useContext(LocaleContext);
    const {t} = useTranslation();
    const [showSignUp, setShowSignUp] = useState(false);
    const [showReset, setReset] = useState(false);
    const [showEmailConfirmationAlert, setShowEmailConfirmationAlert] = useState(false);
    const [showTypes, setShowTypes] = useState(false);

    const [avatarUrl, setAvatarUrl] = useState("/img/default-user.png");

    const handleLogInClose = () => props.setShowLogIn(false);
    const handleSignUpClose = () => setShowSignUp(false);
    const handleResetClose = () => setReset(false);

    useEffect(() => {
        if (props.currentUser) {
            const fetchAvatar = async () => {
                await axios.get(`${DOMAIN_API_URL}/images/user/${props.currentUser.id}/avatar`, {responseType: 'arraybuffer'})
                    .then((response) => {
                        const blob = new Blob([response.data], {type: 'image/jpeg'});
                        const url = URL.createObjectURL(blob);
                        setAvatarUrl(url);
                    })
                    .catch((error) => console.error(error));
            };
            fetchAvatar();
            // fetchInvitationsCount();
        }
    }, [props.currentUser])

    useEffect(() => {
        if (props.currentUser && !props.currentUser.isEnabled) {
            setShowEmailConfirmationAlert(true);
        }
    }, [props.currentUser?.isEnabled]);

    function changeLocale(l) {
        if (locale !== l) {
            i18n.changeLanguage(l);
        }
    }

    return (
        <>
            <Navbar
                style={{backgroundColor: "#448EF6"}}
                collapseOnSelect
                expand="lg"
            >
                <Container>
                    <Navbar.Brand>
                        <Link className="h3 brand" to="/">
                            Fitra
                        </Link>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="responsive-navbar-nav"/>
                    <Navbar.Collapse id="responsive-navbar-nav">
                        <div className="me-auto"></div>
                        <Nav className="align-items-center">
                            <Nav.Link>
                                <Link className="navi-item" to="/#browse">
                                    {t("travels")}
                                </Link>
                            </Nav.Link>
                            <Nav.Link>
                                <Link className="navi-item" to="/mates">
                                    Mates
                                </Link>
                            </Nav.Link>
                            {props.currentUser && (
                                <Nav.Link>
                                    <Link className="navi-item" to="/messages">
                                        Messages
                                        {props.unreadMessagesCount > 0 &&
                                            <>
                                                {' '}<Badge bg="danger" pill>{props.unreadMessagesCount}</Badge>
                                            </>
                                        }
                                    </Link>
                                </Nav.Link>
                            )}
                            <Nav.Link>
                                <Link className="navi-item" to="/about">
                                    About Us
                                </Link>
                            </Nav.Link>
                            {props.isAuthorized ? (
                                <NavDropdown
                                    title={
                                        <div className="d-flex align-items-center">
                                            <div
                                                className="rounded-circle me-2"
                                                style={{
                                                    width: "35px",
                                                    height: "35px",
                                                    background: "#ddd",
                                                    backgroundImage: `url(${avatarUrl})`,
                                                    backgroundSize: "cover",
                                                    backgroundPosition: "center",
                                                }}
                                            />
                                            {props.currentUser.name}{''}
                                            {props.notificationsSum > 0 &&
                                                <Badge bg="danger" style={{
                                                    fontSize: "5px", position: 'relative',
                                                    top: '-5px',
                                                    left: '1px',
                                                }} pill>&nbsp;</Badge>
                                            }
                                        </div>
                                    }
                                    id="basic-nav-dropdown"
                                >
                                    <NavDropdown.Item href="#action/3.1">
                                        Profile
                                    </NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to="/my-travels">
                                        My Travels
                                        {props.notificationsSum > 0 &&
                                            <Badge className="ms-1" bg="danger" pill>
                                                {props.notificationsSum}
                                            </Badge>
                                        }
                                    </NavDropdown.Item>
                                    {props.currentUser?.isAdmin &&
                                        <NavDropdown.Item onClick={() => setShowTypes(true)}>
                                            Types
                                        </NavDropdown.Item>
                                    }
                                    <NavDropdown.Item onClick={props.logOut}>Log out</NavDropdown.Item>
                                </NavDropdown>
                            ) : (
                                <ButtonGroup className="ms-lg-2">
                                    <Button
                                        className="btn-log-in"
                                        onClick={() => props.setShowLogIn(true)}
                                    >
                                        Log in
                                    </Button>
                                    <Button
                                        className="btn-sign-up"
                                        onClick={() => setShowSignUp(true)}
                                    >
                                        Sign up
                                    </Button>
                                </ButtonGroup>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <LogInModal
                show={props.showLogIn}
                onHide={handleLogInClose}
                showSignUpModal={() => setShowSignUp(true)}
                showResetModal={() => setReset(true)}
            />
            <SignUpModal
                show={showSignUp}
                onHide={handleSignUpClose}
                showLogInModal={() => props.setShowLogIn(true)}
            />
            <ResetModal
                show={showReset}
                onHide={handleResetClose}
                showLogInModal={() => props.setShowLogIn(true)}
                showSignUpModal={() => setShowSignUp(true)}
            />
            <EmailAlertModal
                show={showEmailConfirmationAlert}
                isEnabled={props.currentUser ? props.currentUser.isEnabled : true}
            />
            <TypeModal show={showTypes} onHide={() => setShowTypes(false)} />
        </>
    );
}

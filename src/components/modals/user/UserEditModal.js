import {Alert, Button, Form, Modal} from "react-bootstrap";
import {useEffect, useRef, useState} from "react";
import ReactDatePicker from "react-datepicker";
import Select from "react-select";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import moment from "moment";
import {debounce} from "lodash";
import Cookies from "js-cookie";
import PasswordEditModal from "./PasswordEditModal";
import EmailEditModal from "./EmailEditModal";

export default function UserEditModal({show, user, onHide}) {
    const [editUser, setEditUser] = useState(null);
    const [selectedBirthday, setSelectedBirthday] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState('');
    const errorMessageRef = useRef(null);

    const [showEmailEdit, setShowEmailEdit] = useState(false);
    const [showPasswordEdit, setShowPasswordEdit] = useState(false);

    useEffect(() => {
        mapUser();
        fetchCountries();
    }, [])

    const mapUser = () => {
        let editableUser = {
            firstName: user.firstName,
            lastName: user.lastName,
            birthday: user.birthday,
            countryId: user.country.id,
            cityId: user.city.id,
            about: user.about
        };

        setSelectedBirthday(new Date(user.birthday));
        setSelectedCountry({value: user.country.id, label: user.country.title});
        if (user.city) {
            setSelectedCity({value: user.city.id, label: user.city.title});
        }

        setEditUser(editableUser);
    };

    const fetchCountries = async () => {
        await axios
            .get(`${DOMAIN_API_URL}/countries`)
            .then(response => setCountries(response.data))
            .catch(error => console.error(error));
    };

    const handleInputChange = (event) => {
        const {name, value} = event.target;

        setEditUser({...editUser, [name]: value});
    };

    const handleBirthdayChange = (date) => {
        setSelectedBirthday(date);
        setEditUser({...editUser, birthday: moment(date).format("YYYY-MM-DD")});
    };

    const handleCountryChange = async (selectedOption) => {
        setIsLoading(true);
        setSelectedCountry(selectedOption);
        setEditUser({...editUser, countryId: selectedOption.value});
        setSelectedCity(null);
        await axios.get(`${DOMAIN_API_URL}/countries/${selectedOption.value}/cities`)
            .then(response => {
                setCities(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error(error);
                setIsLoading(false);
            });
    };

    const handleCityChange = (selectedOption) => {
        setSelectedCity(selectedOption);
        setEditUser({...editUser, cityId: selectedOption.value});
    };

    const handleCityInputChange = debounce((value) => {
        setIsLoading(true);
        axios.get(`${DOMAIN_API_URL}/countries/${selectedCountry.value}/cities?search=${value}`)
            .then(response => {
                setCities(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error(error);
                setIsLoading(false);
            });
    }, 500);

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        if (editUser.firstName === "" ||
            editUser.lastName === "" ||
            editUser.birthday === null ||
            editUser.countryId <= 0) {
            setErrorMessage("Please enter required fields.");
            setTimeout(() => {
                errorMessageRef.current.scrollIntoView({behavior: "smooth", block: "center"});
            }, 200);
            return;
        }

        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        await axios.put(`${DOMAIN_API_URL}/users/info`, editUser, config)
            .then(response => {
                window.location.reload();
            })
            .catch(error => console.error(error));
    };

    return (
        <>
            <Modal show={show} animation={false} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        {errorMessage && <Alert variant="danger" ref={errorMessageRef}>{errorMessage}</Alert>}
                        <Form.Group className="row mb-2">
                            <Form.Group className="col-6">
                                <Form.Label>First name</Form.Label>
                                <Form.Control
                                    value={editUser?.firstName}
                                    type="text"
                                    name="firstName"
                                    placeholder="First name"
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                            <Form.Group className="col-6">
                                <Form.Label>Last name</Form.Label>
                                <Form.Control
                                    value={editUser?.lastName}
                                    type="text"
                                    name="lastName"
                                    placeholder="Last name"
                                    onChange={handleInputChange}
                                />
                            </Form.Group>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Birthday</Form.Label>
                            <ReactDatePicker
                                className="form-control"
                                selected={selectedBirthday}
                                onChange={handleBirthdayChange}
                                dateFormat="dd.MM.yyyy"
                                maxDate={new Date()}
                                minDate={new Date().setFullYear(
                                    new Date().getFullYear() - 100
                                )}
                                showMonthDropdown
                                showYearDropdown
                                yearDropdownItemNumber={100}
                                scrollableYearDropdown
                                placeholderText="dd.MM.yyyy"
                            />
                        </Form.Group>
                        <Form.Group className="row mb-2">
                            <Form.Group className="col-6">
                                <Form.Label>Country</Form.Label>
                                <Select
                                    value={selectedCountry}
                                    onChange={handleCountryChange}
                                    options={countries.map((country) => ({
                                        value: country.id,
                                        label: country.title,
                                    }))}
                                    placeholder="Country"
                                />
                            </Form.Group>
                            <Form.Group className="col-6">
                                <Form.Label>City</Form.Label>
                                <Select
                                    value={selectedCity}
                                    onChange={handleCityChange}
                                    onInputChange={handleCityInputChange}
                                    isLoading={isLoading}
                                    options={cities.map((city) => ({
                                        value: city.id,
                                        label: city.title,
                                    }))}
                                    noOptionsMessage={() =>
                                        isLoading ? "Loading cities..." : "No cities"
                                    }
                                    placeholder="City"
                                    isDisabled={!selectedCountry}
                                />
                            </Form.Group>
                            <Form.Group className="col-6"></Form.Group>
                        </Form.Group>
                        <Form.Group className="row mb-2">
                            <Form.Group className="col-6">
                                <Form.Label>Email</Form.Label>
                                <Button className="w-100 mb-2" variant="primary"
                                        onClick={() => setShowEmailEdit(true)}>
                                    Change email
                                </Button>
                            </Form.Group>
                            <Form.Group className="col-6">
                                <Form.Label>Password</Form.Label>
                                <Button className="w-100 mb-2" variant="primary"
                                        onClick={() => setShowPasswordEdit(true)}>
                                    Change password
                                </Button>
                            </Form.Group>
                            <Form.Group className="col-6"></Form.Group>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Write about yourself</Form.Label>
                            <Form.Control value={editUser?.about} as="textarea" name="about" placeholder="Write here..."
                                          onChange={handleInputChange}
                                          rows={5}/>
                        </Form.Group>
                        <Button className="w-100 mb-2" variant="primary" type="submit">
                            Update
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
            <EmailEditModal show={showEmailEdit} email={user.email} onHide={() => setShowEmailEdit(false)}/>
            <PasswordEditModal show={showPasswordEdit} onHide={() => setShowPasswordEdit(false)}/>
        </>
    );
}

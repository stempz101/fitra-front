import {Button, Col, Container, Form, Row} from "react-bootstrap";
import Select from "react-select";
import ReactDatePicker from "react-datepicker";
import {useEffect, useState} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import axios from "axios";
import {DOMAIN_API_URL} from "../api";
import moment from "moment/moment";
import {debounce} from "lodash";
import Cookies from "js-cookie";

export default function Mates({isAuthorize, currentUser}) {
    const [users, setUsers] = useState([]);
    const [name, setName] = useState('');
    const [country, setCountry] = useState(null);
    const [city, setCity] = useState(null);

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [pageSize] = useState(15);
    const [pageNumber, setPageNumber] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        fetchCountries();
        fetchCities();
        fetchUsers(searchParams);
        handleQueryParams(searchParams);
    }, [location.search]);

    const fetchUsers = async (params) => {
        try {
            let response;

            if (params.toString().length === 0) {
                response = await axios.get(`${DOMAIN_API_URL}/users`);
            } else {
                response = await axios.get(`${DOMAIN_API_URL}/users?${params.toString()}`);
            }

            const updatedUsers = await Promise.all(response.data.items.map(async (user) => {
                let updatedUser = user;

                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${user.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    updatedUser = {...updatedUser, avatar: URL.createObjectURL(blob)};
                } catch (error) {
                    if (error && error.response.status === 404) {
                        updatedUser = {...updatedUser, avatar: "/img/default-user.png"};
                    }
                }

                return updatedUser;
            }));

            setTotalItems(response.data.totalItems);
            setUsers(updatedUsers);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCountries = async () => {
        await axios.get(`${DOMAIN_API_URL}/countries`)
            .then(response => setCountries(response.data))
            .catch(error => console.error(error));
    };

    const fetchCountry = async (countryId) => {
        await axios.get(`${DOMAIN_API_URL}/countries/${countryId}`)
            .then(response => setCountry({value: response.data.id, label: response.data.title}))
            .catch(error => console.error(error));
        await axios.get(`${DOMAIN_API_URL}/countries/${countryId}/cities`)
            .then((response) => {
                setCities(response.data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
            });
    };

    const fetchCities = async () => {
        await axios.get(`${DOMAIN_API_URL}/countries/cities`)
            .then(response => setCities(response.data))
            .catch(error => console.error(error));
    };

    const fetchCity = async (cityId) => {
        await axios.get(`${DOMAIN_API_URL}/countries/cities/${cityId}`)
            .then(response => {
                setCity({
                    value: response.data.id,
                    label: response.data.title,
                    countryId: response.data.countryId
                });
            })
            .catch(error => console.error(error));
    };

    const handleQueryParams = (params) => {
        if (params.toString().length !== 0) {
            const paramName = params.get('name');
            const paramCountryId = params.get('countryId');
            const paramCityId = params.get('cityId');
            const paramPage = params.get('page');

            if (paramName) {
                setName(paramName);
            }
            if (paramCountryId) {
                fetchCountry(paramCountryId);
            }
            if (paramCityId) {
                fetchCity(paramCityId);
            }
            if (paramPage) {
                if (paramPage < 1) {
                    setPageNumber(1);
                } else {
                    setPageNumber(paramPage);
                }
            }
        }
    };

    const handleNameChange = (event) => setName(event.target.value);

    const handleCountryChange = async (selectedOption) => {
        setIsLoading(true);
        setCountry(selectedOption);
        if (city !== null) {
            setCity(null);
        }
        await axios.get(`${DOMAIN_API_URL}/countries/${selectedOption.value}/cities`)
            .then((response) => {
                setCities(response.data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setIsLoading(false);
            });
    };

    const handleCityChange = (selectedOption) => {
        setCity(selectedOption);
        if (country === null || country.id !== selectedOption.countryId) {
            const parent = countries.find(country => country.id === selectedOption.countryId);
            setCountry({value: parent.id, label: parent.title});
        }
    };

    const handleCityInputChange = debounce(async (value) => {
        setIsLoading(true);
        if (country) {
            axios.get(`${DOMAIN_API_URL}/countries/${country.value}/cities?search=${value}`)
                .then(response => {
                    setCities(response.data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error(error);
                    setIsLoading(false);
                });
        } else {
            axios.get(`${DOMAIN_API_URL}/countries/cities?search=${value}`)
                .then(response => {
                    setCities(response.data);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error(error);
                    setIsLoading(false);
                });
        }
    }, 500);

    const handleSubmit = (event) => {
        event.preventDefault();
        const queryParams = new URLSearchParams(location.search);
        queryParams.delete('name');
        queryParams.delete('countryId');
        queryParams.delete('cityId');

        if (name)
            queryParams.set('name', name);
        if (country)
            queryParams.set('countryId', country.value);
        if (city)
            queryParams.set('cityId', city.value);

        navigate(`${location.pathname}?${queryParams.toString()}`);
    };

    const handleReset = (event) => {
        event.preventDefault();

        setName('');
        setCountry(null);
        setCity(null);

        navigate(location.pathname);
    }

    const showUserAge = (user) => {
        const today = moment();
        const birthday = moment(user.birthday);
        const age = today.diff(birthday, 'years')
        return `${age} y.o.`;
    };

    const showUserCountryCity = (user) => {
        if (user.cityDto) {
            return `${user.country.title}, ${user.cityDto.title}`
        }
        return `${user.country.title}`;
    };

    const handleSetAdminClick = async (user, newAdmin) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const queryParams = new URLSearchParams(location.search);

        await axios.put(`${DOMAIN_API_URL}/users/${user.id}/admin/${newAdmin}`, {}, config)
            .then(async () => fetchUsers(queryParams))
            .catch(error => console.error(error));
    };

    const handleSetBlockedClick = async (user, block) => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };
        const queryParams = new URLSearchParams(location.search);

        await axios.put(`${DOMAIN_API_URL}/users/${user.id}/block/${block}`, {}, config)
            .then(async () => fetchUsers(queryParams))
            .catch(error => console.error(error));
    };

    return (
        <>
            <Container className="mt-3 browse">
                <Row>
                    <div class="mb-3">
                        <h2 style={{fontWeight: "600"}}>Mates</h2>
                    </div>
                    <div className="search-bar">
                        <Form className="px-5 py-2" onSubmit={handleSubmit}>
                            <Row className="justify-content-lg-center">
                                <Col className="" lg={4}>
                                    <Form.Label>Name</Form.Label>
                                    <Form.Control
                                        value={name}
                                        type="text"
                                        name="name"
                                        onChange={handleNameChange}
                                        placeholder="Name"/>
                                </Col>
                                <Col className="" lg={4}>
                                    <Form.Label>Country</Form.Label>
                                    <Select
                                        value={country}
                                        onChange={handleCountryChange}
                                        options={countries.map((country) => ({
                                            value: country.id,
                                            label: country.title
                                        }))}
                                        placeholder="Country"
                                    />
                                </Col>
                                <Col className="" lg={4}>
                                    <Form.Label>City</Form.Label>
                                    <Select
                                        value={city}
                                        onChange={handleCityChange}
                                        onInputChange={handleCityInputChange}
                                        options={cities.map((city) => ({
                                            value: city.id,
                                            label: city.title,
                                            countryId: city.countryId
                                        }))}
                                        isLoading={isLoading}
                                        placeholder="City"
                                    />
                                </Col>
                            </Row>
                            <Row className="justify-content-lg-center">
                                <Col className="py-2" lg={6}>
                                    <Button className="w-100 btn-show" type="submit">Show</Button>
                                </Col>
                                <Col className="py-2" lg={6}>
                                    <Button className="w-100 btn-reset"
                                            onClick={handleReset}
                                    >Reset</Button>
                                </Col>
                            </Row>
                        </Form>
                    </div>
                    <div className="d-flex flex-column justify-content-center mt-3">
                        {users.map(user =>
                            <div className="d-flex justify-content-between align-items-center border rounded-3 mb-2 px-3 py-2">
                                <div className="travel-creator d-flex align-items-center">
                                    <Link
                                        to={`/mates/${user.id}`}>
                                        <div
                                            className="rounded-circle me-3 user-avatar"
                                            style={{
                                                width: "90px",
                                                height: "90px",
                                                backgroundImage: `url(${user.avatar})`
                                            }}
                                        />
                                    </Link>
                                    <div className="me-3">
                                        <Link className="text-decoration-none text-black"
                                            style={{fontWeight: 500, fontSize: '20px'}}
                                            to={`/mates/${user.id}`}> {/* TODO: to='/user/id123122' */}
                                            {user.name}
                                            {user.isBlocked ? ' (blocked)' : user.isAdmin && ' (A)'}
                                        </Link>
                                        <p className="mb-0">{showUserAge(user)}</p>
                                        <p className="mb-0">{showUserCountryCity(user)}</p>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center">
                                    <Button as={Link}
                                            to={`/mates/${user.id}`}
                                            className="btn-link-action d-flex align-items-center text-uppercase"
                                            variant="button">
                                        View
                                    </Button>
                                    {isAuthorize && user.id !== currentUser.id && currentUser.isAdmin &&
                                        <>
                                        {user.isBlocked ? (
                                            <>
                                                <Button onClick={() => handleSetBlockedClick(user, false)}
                                                        className="travel-btn-success text-white d-flex align-items-center text-uppercase"
                                                        variant="button">
                                                    Unblock
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                {user.isAdmin ? (
                                                    <>
                                                        <Button onClick={() => handleSetAdminClick(user, false)}
                                                                className="travel-btn-danger text-white d-flex align-items-center text-uppercase"
                                                                variant="button">
                                                            Back to User
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button onClick={() => handleSetAdminClick(user, true)}
                                                                className="travel-btn-success text-white d-flex align-items-center text-uppercase"
                                                                variant="button">
                                                            New Admin
                                                        </Button>
                                                    </>
                                                )}
                                                <Button onClick={() => handleSetBlockedClick(user, true)}
                                                        className="travel-btn-danger text-white d-flex align-items-center text-uppercase ms-2"
                                                        variant="button">
                                                    Block
                                                </Button>
                                            </>
                                        )}
                                        </>
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </Row>
            </Container>
        </>
    );
}
import {Button, Card, Col, Container, Form, Row} from "react-bootstrap";
import {useTranslation} from "react-i18next";
import "../css/travels.css";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import ReactDatePicker from "react-datepicker";
import Select from "react-select";
import axios from "axios";
import {DOMAIN_API_URL} from "../api";
import i18n from "../i18n";
import {enUS as en, uk} from "date-fns/locale";
import {debounce} from "lodash";
import moment from "moment";
import PaginationButtons from "../components/pagination/PaginationButtons";

export default function Travels() {
    const [travels, setTravels] = useState([]);

    const [name, setName] = useState('');
    const [country, setCountry] = useState(null);
    const [city, setCity] = useState(null);
    const [type, setType] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [peopleFrom, setPeopleFrom] = useState(0);
    const [peopleTo, setPeopleTo] = useState(0);

    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [types, setTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [pageSize] = useState(9);
    const [pageNumber, setPageNumber] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();
    const {t} = useTranslation();
    const datePickerLang = i18n.language === "uk" ? uk : en;

    const fetchTravels = async (params) => {
        try {
            let response;

            if (params.toString().length === 0) {
                response = await axios.get(`${DOMAIN_API_URL}/travels`);
            } else {
                response = await axios.get(`${DOMAIN_API_URL}/travels?${params.toString()}`);
            }

            const updatedTravels = await Promise.all(response.data.items.map(async (travel) => {
                if (travel.creator.avatar) {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/${travel.creator.avatar}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    travel.creator.avatar = URL.createObjectURL(blob);
                } else {
                    travel.creator.avatar = "/img/default-user.png";
                }

                return travel;
            }));

            setTotalItems(response.data.totalItems);
            setTravels(updatedTravels);
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
            .error(error => console.error(error));
    };
    const fetchTypes = async () => {
        await axios.get(`${DOMAIN_API_URL}/types`)
            .then(response => setTypes(response.data))
            .catch(error => console.error(error));
    };
    const fetchType = async (typeId) => {
        await axios.get(`${DOMAIN_API_URL}/types/${typeId}`)
            .then(response => setType({value: response.data.id, label: response.data.name}))
            .catch(error => console.error(error));
    };
    const handleQueryParams = (params) => {
        if (params.toString().length !== 0) {
            const paramName = params.get('name');
            const paramCountryId = params.get('countryId');
            const paramCityId = params.get('cityId');
            const paramTypeId = params.get('typeId');
            const paramStartDate = params.get('startDate');
            const paramPeopleFrom = params.get('peopleFrom');
            const paramPeopleTo = params.get('peopleTo');
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
            if (paramTypeId) {
                fetchType(paramTypeId);
            }
            if (paramStartDate) {
                setStartDate(moment(paramStartDate).toDate());
            }
            if (paramPeopleFrom) {
                setPeopleFrom(paramPeopleFrom);
            }
            if (paramPeopleTo) {
                setPeopleTo(paramPeopleTo);
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

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        fetchCountries();
        fetchCities();
        fetchTypes();
        fetchTravels(searchParams);
        handleQueryParams(searchParams);
    }, [location.search]);

    const handleBrowseClick = (event) => {
        event.preventDefault();
        const section = document.querySelector('#browse');
        section.scrollIntoView({behavior: 'smooth'});
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

    const handleTypeChange = (selectedOption) => setType(selectedOption);
    const handleStartDateChange = (date) => setStartDate(date);
    const handlePeopleFromChange = (event) => {
        setPeopleFrom(event.target.value);
        if (event.target.value) {
            document.getElementById("peopleTo").setAttribute("min", event.target.value)
        } else {
            document.getElementById("peopleTo").setAttribute("min", 0);
        }
    };
    const handlePeopleToChange = (event) => setPeopleTo(event.target.value);

    const handleSubmit = (event) => {
        event.preventDefault();
        const queryParams = new URLSearchParams(location.search);
        queryParams.delete('name');
        queryParams.delete('countryId');
        queryParams.delete('cityId');
        queryParams.delete('typeId');
        queryParams.delete('startDate');
        queryParams.delete('peopleFrom');
        queryParams.delete('peopleTo');

        if (name)
            queryParams.set('name', name);
        if (country)
            queryParams.set('countryId', country.value);
        if (city)
            queryParams.set('cityId', city.value);
        if (type)
            queryParams.set('typeId', type.value);
        if (startDate)
            queryParams.set('startDate', moment(startDate).format('YYYY-MM-DD'));
        if (peopleFrom)
            queryParams.set('peopleFrom', peopleFrom);
        if (peopleTo)
            queryParams.set('peopleTo', peopleTo);

        navigate(`${location.pathname}?${queryParams.toString()}`);
    };

    const handleReset = (event) => {
        event.preventDefault();

        setName('');
        setCountry(null);
        setCity(null);
        setType(null);
        setStartDate(null);
        setPeopleFrom(0);
        setPeopleTo(0);

        navigate(location.pathname);
    }

    const showRoute = (travel) => {
        return travel.route
            .sort((r1, r2) => r1.position - r2.position)
            .map((route, index) => {
                if (index === 0) {
                    if (route.city) {
                        return <Link to={`/?cityId=${route.cityId}`}>{route.city}</Link>;
                    } else {
                        return (
                            <Link to={`/?countryId=${route.countryId}`}>{route.country}</Link>
                        );
                    }
                } else {
                    if (route.city) {
                        return (
                            <>
                                {' > '}
                                <Link to={`/?cityId=${route.cityId}`}>{route.city}</Link>
                            </>
                        );
                    } else {
                        return (
                            <>
                                {' > '}
                                <Link to={`/?countryId=${route.countryId}`}>{route.country}</Link>
                            </>
                        );
                    }
                }
            });
    };

    const getElapsedTime = (timestamp) => {
        const specifiedTime = new Date(timestamp);
        const now = new Date();
        const secondsElapsed = Math.floor((now - specifiedTime) / 1000);
        const minutesElapsed = Math.floor(secondsElapsed / 60);
        const hoursElapsed = Math.floor(minutesElapsed / 60);
        const daysElapsed = Math.floor(hoursElapsed / 24);
        const monthsElapsed = Math.floor(daysElapsed / 30);
        const yearsElapsed = Math.floor(monthsElapsed / 12);

        if (yearsElapsed > 0) {
            return t('elapsedTime.yearsAgo', {count: yearsElapsed});
        } else if (monthsElapsed > 0) {
            return t('elapsedTime.monthsAgo', {count: monthsElapsed});
        } else if (daysElapsed > 0) {
            return t('elapsedTime.daysAgo', {count: daysElapsed});
        } else if (hoursElapsed > 0) {
            return t('elapsedTime.hoursAgo', {count: hoursElapsed});
        } else if (minutesElapsed > 0) {
            return t('elapsedTime.minutesAgo', {count: minutesElapsed});
        } else {
            return t('elapsedTime.secondsAgo', {count: secondsElapsed});
        }
    };

    const handlePageChange = (page) => {
        const queryParams = new URLSearchParams(location.search);
        queryParams.set('page', page);
        navigate(`${location.pathname}?${queryParams.toString()}`);
    };

    return (
        <>
            <section className="hero">
                <Container className="h-100 d-flex align-items-center">
                    <Row>
                        <div className="ms-lg-5">
                            <h1>Organize travels</h1>
                            <h1>and find buddies to the travel</h1>
                            <div className="d-flex justify-content-center mt-4">
                                <Link to="#" className="btn btn-hero btn-hero-create mx-3">Create Travel</Link>
                                <Link to="#" onClick={handleBrowseClick}
                                      className="btn btn-hero btn-hero-browse text-white mx-3">Browse Travels</Link>
                            </div>
                        </div>
                        <div/>
                    </Row>
                </Container>
            </section>
            <section id="browse" className="browse">
                <Container className="py-4">
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
                                <Col className="" lg={3}>
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
                                <Col className="" lg={3}>
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
                                <Col className="" lg={2}>
                                    <Form.Label>Type</Form.Label>
                                    <Select
                                        value={type}
                                        onChange={handleTypeChange}
                                        options={types.map((type) => ({
                                            value: type.id,
                                            label: type.name,
                                        }))}
                                        placeholder="Type"
                                    />
                                </Col>
                            </Row>
                            <Row className="justify-content-lg-center">
                                <Col className="py-lg-2" lg={3}>
                                    <Form.Label>When</Form.Label>
                                    <ReactDatePicker
                                        className="form-control"
                                        selected={startDate}
                                        onChange={handleStartDateChange}
                                        dateFormat="dd.MM.yyyy"
                                        locale={datePickerLang}
                                        maxDate={new Date().setFullYear(
                                            new Date().getFullYear() + 100
                                        )}
                                        minDate={new Date().setFullYear(
                                            new Date().getFullYear() - 100
                                        )}
                                        showMonthDropdown
                                        showYearDropdown
                                        yearDropdownItemNumber={100}
                                        scrollableYearDropdown
                                        placeholderText="DD.MM.YYYY"
                                    />
                                </Col>
                                <Col className="py-lg-2" lg={2}>
                                    <Form.Label>People From</Form.Label>
                                    <Form.Control id="peopleFrom" type="number" onChange={handlePeopleFromChange}
                                                  step="1" min="0" placeholder="From" name="peopleFrom"/>
                                </Col>
                                <Col className="py-lg-2" lg={2}>
                                    <Form.Label>People To</Form.Label>
                                    <Form.Control id="peopleTo" type="number" onChange={handlePeopleToChange} step="1"
                                                  placeholder="To" name="peopleTo"/>
                                </Col>
                            </Row>
                            <Row className="justify-content-lg-center">
                                <Col className="py-2" lg={6}>
                                    <Button className="w-100 btn-show" type="submit">Show</Button>
                                </Col>
                                <Col className="py-2" lg={6}>
                                    <Button className="w-100 btn-reset" onClick={handleReset}>Reset</Button>
                                </Col>
                            </Row>
                        </Form>
                    </div>
                    <Row>
                        <div className="d-flex align-items-center mt-3">
                            <hr className="header-line"/>
                            <h2 className="header-title">Travels</h2>
                            <hr className="header-line"/>
                        </div>
                    </Row>
                    <div className="travels">
                        <Row>
                            {travels
                                .map(travel => (
                                    <Col className="mt-3" sm={12} md={6} lg={4}>
                                        <Card className="shadow-sm">
                                            <Card.Header>
                                                {showRoute(travel)}
                                            </Card.Header>
                                            <Link to="#asd">
                                                <div className="bd-placeholder-img card-img-top travel-img"
                                                     style={{backgroundImage: `url("/img/travel.jpg")`}}>
                                                    <Link to={`#${travel.creator.id}`}>
                                                        <div className="travel-creator">
                                                            <div
                                                                className="rounded-circle me-2 user-avatar"
                                                                style={{backgroundImage: `url(${travel.creator.avatar})`}}
                                                            />
                                                            {travel.creator.name}
                                                        </div>
                                                    </Link>
                                                </div>
                                            </Link>
                                            <Card.Body
                                                className="travel-dates-people d-flex justify-content-between align-items-center">
                                                <div>
                                                    <Card.Text>
                                                        {moment(travel.startDate).format('DD.MM.YYYY')}
                                                        {' - '}
                                                        {moment(travel.endDate).format('DD.MM.YYYY')}
                                                    </Card.Text>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                         fill="currentColor" class="bi bi-person-fill"
                                                         viewBox="0 0 16 16">
                                                        <path
                                                            d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                                                    </svg>
                                                    <Card.Text>{travel.limit}</Card.Text>
                                                </div>
                                            </Card.Body>
                                            <Card.Body>
                                                <Card.Title>{travel.name}</Card.Title>
                                                <Card.Text className="mb-2">
                                                    <Link className="travel-link"
                                                          to={`/?typeId=${travel.type.id}`}>{travel.type.name}</Link>
                                                </Card.Text>
                                                <Card.Text>
                                                    {travel.description.slice(0, 160) + '... '}
                                                    <Link className="travel-link" to="#">More</Link>
                                                </Card.Text>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <Link to="#" className="btn btn-view">View</Link>
                                                    <small
                                                        className="text-muted">{getElapsedTime(travel.createdTime)}</small>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            <Col className="d-flex justify-content-center" sm={12}>
                                <PaginationButtons
                                    pageSize={pageSize}
                                    pageNumber={pageNumber}
                                    totalItems={totalItems}
                                    onPageChange={handlePageChange}/>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </section>
        </>
    );
}

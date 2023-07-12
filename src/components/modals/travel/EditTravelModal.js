import {Alert, Button, Form, Modal} from "react-bootstrap";
import {useEffect, useRef, useState} from "react";
import {DOMAIN_API_URL} from "../../../api";
import axios from "axios";
import moment from "moment/moment";
import Select from "react-select";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import ReactDatePicker from "react-datepicker";
import {debounce} from "lodash";
import i18n from "../../../i18n";
import {enUS as en, uk} from "date-fns/locale";
import Cookies from "js-cookie";

export default function EditTravelModal({show, travel, onHide}) {
    const [editTravel, setEditTravel] = useState(null);

    const [route, setRoute] = useState([]);

    const [selectedType, setSelectedType] = useState(null); //
    const [selectedStartDate, setSelectedStartDate] = useState(null); //
    const [selectedEndDate, setSelectedEndDate] = useState(null); //
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [types, setTypes] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const errorMessageRef = useRef(null);

    const datePickerLang = i18n.language === "uk" ? uk : en;

    const mapTravel = async () => {
        try {
            let selectedTravel = {
                name: travel.name,
                description: travel.description,
                typeId: travel.type.id,
                startDate: travel.startDate,
                endDate: travel.endDate,
                budget: travel.budget,
                limit: travel.limit,
                ageFrom: travel.ageFrom,
                ageTo: travel.ageTo,
                withChildren: travel.withChildren,
                route: []
            };

            setSelectedType({
                value: travel.type.id,
                label: travel.type.name
            });
            setSelectedStartDate(new Date(travel.startDate));
            setSelectedEndDate(new Date(travel.endDate));

            const routeItems = travel.route.map(item => {
                return {
                    country: {
                        value: item.countryId,
                        label: item.country
                    },
                    city: {
                        value: item?.cityId,
                        label: item?.city
                    },
                    position: item.position
                };
            });
            setRoute(routeItems);
            selectedTravel = {
                ...selectedTravel, route: routeItems.map(item => {
                    return {
                        countryId: item.country.value,
                        cityId: item.city?.value,
                        position: item.position
                    };
                })
            }

            console.log(selectedTravel);
            setEditTravel(selectedTravel);
        } catch (error) {
            console.error(error);
        }
    }

    const fetchTypes = async () => {
        await axios
            .get(`${DOMAIN_API_URL}/types`)
            .then(response => setTypes(response.data))
            .catch(error => console.error(error));
    };

    const fetchCountries = async () => {
        await axios
            .get(`${DOMAIN_API_URL}/countries`)
            .then(response => setCountries(response.data))
            .catch(error => console.error(error));
    };

    useEffect(() => {
        mapTravel();
        fetchTypes();
        fetchCountries();
    }, [])

    const handleInputChange = (event) => {
        const {name, value, type, checked} = event.target;

        if (type === "checkbox") {
            setEditTravel({...editTravel, [name]: checked});
        } else if (type === "number") {
            if (name === 'budget') {
                setEditTravel({...editTravel, [name]: parseFloat(value)});
            } else {
                setEditTravel({...editTravel, [name]: parseInt(value)});
            }
        } else {
            setEditTravel({...editTravel, [name]: value});
        }
    };

    const handleCountryChange = async (selectedOption) => {
        setIsLoading(true);
        setSelectedCountry(selectedOption);
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

    const handleRouteSubmit = () => {
        const item = {
            country: selectedCountry, city: selectedCity, position: route.length
        };
        const updatedRoute = [...route, item];
        setRoute(updatedRoute);
        setEditTravel({
            ...editTravel,
            route: [...editTravel.route, {
                countryId: item.country.value,
                cityId: item.city?.value,
                position: item.position
            }]
        });
        setSelectedCity(null);
        setSelectedCountry(null);
    };

    const handleRouteItemDelete = (position) => {
        const updatedRoute = route.filter(item => item.position !== position);
        for (let i = 0; i < updatedRoute.length; i++) {
            updatedRoute[i].position = i;
        }
        setRoute(updatedRoute);

        const updatedFormRoute = editTravel.route.filter(item => item.position !== position);
        for (let i = 0; i < updatedRoute.length; i++) {
            updatedFormRoute[i].position = i;
        }
        setEditTravel({...editTravel, route: updatedFormRoute});
    };

    const handleTypeChange = (selectedOption) => {
        setSelectedType(selectedOption);
        setEditTravel({...editTravel, typeId: selectedOption.value});
    };

    const handleStartDateChange = (date) => {
        setSelectedStartDate(date);
        setEditTravel({...editTravel, startDate: moment(date).format("YYYY-MM-DD")});
    };

    const handleEndDateChange = (date) => {
        setSelectedEndDate(date);
        setEditTravel({...editTravel, endDate: moment(date).format("YYYY-MM-DD")});
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        if (editTravel.name === '' ||
            editTravel.route.length <= 0 ||
            editTravel.description === '' ||
            editTravel.typeId <= 0 ||
            editTravel.startDate === '' ||
            editTravel.endDate === '' ||
            editTravel.budget <= 0 ||
            editTravel.limit <= 0 ||
            editTravel.ageFrom <= 0 ||
            editTravel.ageTo <= 0) {
            setErrorMessage("Please enter required fields.");
            setTimeout(() => {
                errorMessageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 200);
            return;
        }

        let formData = {
            ...editTravel,
            route: JSON.stringify(editTravel.route)
        }

        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        await axios.put(`${DOMAIN_API_URL}/travels/${travel.id}`, formData, config)
            .then(response => {
                window.location.reload();
            })
            .catch(error => console.error(error));
    };

    const handleEditTravelClose = () => {
        setErrorMessage("");
        setRoute([]);
        onHide();
    };

    return (
        <>
            <Modal show={show} size="lg" animation={false} onHide={handleEditTravelClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Travel Edit</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleFormSubmit}>
                        {errorMessage && <Alert variant="danger" ref={errorMessageRef}>{errorMessage}</Alert>}
                        <Form.Group className="mb-2">
                            <Form.Label>Name<span className="required"/></Form.Label>
                            <Form.Control value={editTravel ? editTravel.name : travel.name} type="text" name="name"
                                          placeholder="Name"
                                          onChange={handleInputChange}/>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Route<span className="required"/></Form.Label>
                            <div className="border rounded p-2">
                                <Form.Group className="row mb-2">
                                    <Form.Group className="col-sm-12 col-md-6 col-lg-5">
                                        <Form.Label>Country</Form.Label>
                                        <Select
                                            value={selectedCountry}
                                            onChange={handleCountryChange}
                                            options={countries.map((country) => ({
                                                value: country.id, label: country.title,
                                            }))}
                                            placeholder="Country"
                                        />
                                    </Form.Group>
                                    <Form.Group className="col-sm-12 col-md-6 col-lg-5">
                                        <Form.Label>City</Form.Label>
                                        <Select
                                            value={selectedCity}
                                            onChange={handleCityChange}
                                            onInputChange={handleCityInputChange}
                                            isLoading={isLoading}
                                            options={cities.map((city) => ({
                                                value: city.id, label: city.title,
                                            }))}
                                            noOptionsMessage={() => isLoading ? "Loading cities..." : "No cities"}
                                            placeholder="City"
                                            isDisabled={!selectedCountry}
                                        />
                                    </Form.Group>
                                    <Form.Group
                                        className="col-sm-12 col-lg-2 d-flex justify-content-center align-items-end">
                                        <Button onClick={() => handleRouteSubmit()} className="btn-form w-100 mt-2"
                                                variant="primary" type="button">
                                            Select
                                        </Button>
                                    </Form.Group>
                                </Form.Group>
                                {route.length !== 0 && (<div>
                                    {route.map(item => (
                                        <div className="d-inline-block border rounded p-2 me-1 mb-1">
                                                        <span className="me-2">
                                                            {item.country.label}
                                                            {item.city && `, ${item.city.label}`}
                                                        </span>
                                            <Button className="px-0 py-0" variant="button"
                                                    onClick={() => handleRouteItemDelete(item.position)}>
                                                <FontAwesomeIcon icon={faTimes}/>
                                            </Button>
                                        </div>))}
                                </div>)}
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Description<span className="required"/></Form.Label>
                            <Form.Control value={editTravel ? editTravel.description : travel.description} as="textarea"
                                          name="description"
                                          placeholder="Description..." rows={5}
                                          onChange={handleInputChange}/>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Type<span className="required"/></Form.Label>
                            <Select
                                value={selectedType}
                                onChange={handleTypeChange}
                                options={types.map((type) => ({
                                    value: type.id, label: type.name,
                                }))}
                                placeholder="Type"
                            />
                        </Form.Group>
                        <Form.Group className="row mb-2">
                            <Form.Group className="col-6">
                                <Form.Label>Start date<span className="required"/></Form.Label>
                                <ReactDatePicker
                                    className="form-control"
                                    selected={selectedStartDate}
                                    onChange={handleStartDateChange}
                                    dateFormat="dd.MM.yyyy"
                                    locale={datePickerLang}
                                    showMonthDropdown
                                    showYearDropdown
                                    yearDropdownItemNumber={100}
                                    scrollableYearDropdown
                                    placeholderText="DD.MM.YYYY"
                                />
                            </Form.Group>
                            <Form.Group className="col-6">
                                <Form.Label>End date<span className="required"/></Form.Label>
                                <ReactDatePicker
                                    className="form-control"
                                    selected={selectedEndDate}
                                    onChange={handleEndDateChange}
                                    dateFormat="dd.MM.yyyy"
                                    locale={datePickerLang}
                                    showMonthDropdown
                                    showYearDropdown
                                    yearDropdownItemNumber={100}
                                    scrollableYearDropdown
                                    placeholderText="DD.MM.YYYY"
                                />
                            </Form.Group>
                        </Form.Group>
                        <Form.Group className="row mb-2">
                            <Form.Group className="col-6">
                                <Form.Label>Budget ($)<span className="required"/></Form.Label>
                                <Form.Control value={editTravel ? editTravel.budget : travel.budget} type="number"
                                              name="budget" placeholder="Budget"
                                              onChange={handleInputChange}/>
                            </Form.Group>
                            <Form.Group className="col-6">
                                <Form.Label>People limit<span className="required"/></Form.Label>
                                <Form.Control value={editTravel ? editTravel.limit : travel.limit} type="number"
                                              name="limit" placeholder="People Limit"
                                              onChange={handleInputChange}/>
                            </Form.Group>
                        </Form.Group>
                        <Form.Group className="row mb-2">
                            <Form.Group className="col-6">
                                <Form.Label>Age from<span className="required"/></Form.Label>
                                <Form.Control value={editTravel ? editTravel.ageFrom : travel.ageFrom} type="number" name="ageFrom" placeholder="From"
                                              onChange={handleInputChange}/>
                            </Form.Group>
                            <Form.Group className="col-6">
                                <Form.Label>To<span className="required"/></Form.Label>
                                <Form.Control value={editTravel ? editTravel.ageTo : travel.ageTo} type="number" name="ageTo" placeholder="To" onChange={handleInputChange}/>
                            </Form.Group>
                        </Form.Group>
                        <Button className="btn-submit w-100 mb-2" variant="primary" type="submit">
                            Update
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

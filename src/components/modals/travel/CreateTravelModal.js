import {useEffect, useRef, useState} from "react";
import {Alert, Button, Form, Modal} from "react-bootstrap";
import Select from "react-select";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import ReactDatePicker from "react-datepicker";
import i18n from "../../../i18n";
import {debounce} from "lodash";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import "../../../css/create-travel-modal.css";
import moment from "moment";
import Cookies from "js-cookie";
import {enUS as en, uk} from "date-fns/locale";
import {useNavigate} from "react-router-dom";

export default function CreateTravelModal(props) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        typeId: 0,
        startDate: '',
        endDate: '',
        budget: 0,
        limit: 0,
        ageFrom: 0,
        ageTo: 0,
        withChildren: false,
        photo: null,
        route: [],
        events: []
    });

    const [selectedType, setSelectedType] = useState(null);
    const [selectedStartDate, setSelectedStartDate] = useState('');
    const [selectedEndDate, setSelectedEndDate] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedEndTime, setSelectedEndTime] = useState('');
    const [types, setTypes] = useState([]);
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [route, setRoute] = useState([]);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [eventName, setEventName] = useState("");
    const [events, setEvents] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const errorMessageRef = useRef(null);

    const navigate = useNavigate();

    const datePickerLang = i18n.language === "uk" ? uk : en;

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
        fetchTypes();
        fetchCountries();
    }, []);

    const handleInputChange = (event) => {
        const {name, value, type, checked, files} = event.target;

        if (type === "file") {
            setFormData({...formData, [name]: files[0]});

            const reader = new FileReader();
            reader.onload = () => {
                setPhotoUrl(reader.result);
            };
            reader.readAsDataURL(files[0]);
        } else if (type === "checkbox") {
            setFormData({...formData, [name]: checked});
        } else if (type === "number") {
            if (name === 'budget') {
                setFormData({...formData, [name]: parseFloat(value)});
            } else {
                setFormData({...formData, [name]: parseInt(value)});
            }
        } else {
            setFormData({...formData, [name]: value});
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
        setFormData({
            ...formData,
            route: [...formData.route, {
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

        const updatedFormRoute = formData.route.filter(item => item.position !== position);
        for (let i = 0; i < updatedRoute.length; i++) {
            updatedFormRoute[i].position = i;
        }
        setFormData({...formData, route: updatedFormRoute});
    };

    const handleTypeChange = (selectedOption) => {
        setSelectedType(selectedOption);
        setFormData({...formData, typeId: selectedOption.value});
    };

    const handleStartDateChange = (date) => {
        setSelectedStartDate(date);
        setFormData({...formData, startDate: moment(date).format("YYYY-MM-DD")});
    };

    const handleEndDateChange = (date) => {
        setSelectedEndDate(date);
        setFormData({...formData, endDate: moment(date).format("YYYY-MM-DD")});
    };

    const handleEventNameChange = (event) => {
        setEventName(event.target.value);
    };

    const handleStartTimeChange = (datetime) => {
        setSelectedStartTime(datetime);
    };

    const handleEndTimeChange = (datetime) => {
        setSelectedEndTime(datetime);
    };

    const handleEventSubmit = () => {
        const event = {
            name: eventName,
            startTime: moment(selectedStartTime).format("YYYY-MM-DDTHH:mm:ss"),
            endTime: moment(selectedEndTime).format("YYYY-MM-DDTHH:mm:ss"),
            position: events.length
        };
        const updatedEvents = [...events, event];
        setEvents(updatedEvents);
        setFormData({...formData, events: updatedEvents});
        setEventName("");
        setSelectedStartTime('');
        setSelectedEndTime('');
    };

    const handleEventDelete = (position) => {
        const updatedEvents = events.filter(event => event.position !== position);
        for (let i = 0; i < updatedEvents.length; i++) {
            updatedEvents[i].position = i;
        }
        setEvents(updatedEvents);
        setFormData({...formData, events: updatedEvents});
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();

        if (formData.name === '' ||
            formData.route.length <= 0 ||
            formData.description === '' ||
            formData.typeId <= 0 ||
            formData.startDate === '' ||
            formData.endDate === '' ||
            formData.budget <= 0 ||
            formData.limit <= 0 ||
            formData.ageFrom <= 0 ||
            formData.ageTo <= 0 ||
            formData.photo === null) {
            setErrorMessage("Please enter required fields.");
            setTimeout(() => {
                errorMessageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 200);
            return;
        }

        let multipartFormData = {
            ...formData,
            route: JSON.stringify(formData.route),
            events: JSON.stringify(formData.events)
        }

        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
            }
        }

        await axios.post(`${DOMAIN_API_URL}/travels`, multipartFormData, config)
            .then(response => {
                navigate(`/${response.data.id}`); // TODO: replace with Link to the 'My travels' page
            })
            .catch(error => console.error(error));
    };

    const handleClose = () => {
        setErrorMessage("");
        setRoute([]);
        setPhotoUrl(null);
        setEvents([]);
        props.onHide();
    };

    return (<>
        {props.isAuthorized && (<Modal {...props} size="lg" onHide={handleClose} animation={false}>
            <Modal.Header closeButton>
                <Modal.Title>Travel Creation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleFormSubmit}>
                    {errorMessage && <Alert variant="danger" ref={errorMessageRef}>{errorMessage}</Alert>}
                    <Form.Group className="mb-2">
                        <Form.Label>Name<span className="required"/></Form.Label>
                        <Form.Control type="text" name="name" placeholder="Name" onChange={handleInputChange}/>
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
                        <Form.Control as="textarea" name="description" placeholder="Description..." rows={5}
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
                            <Form.Control type="number" name="budget" placeholder="Budget"
                                          onChange={handleInputChange}/>
                        </Form.Group>
                        <Form.Group className="col-6">
                            <Form.Label>People limit<span className="required"/></Form.Label>
                            <Form.Control type="number" name="limit" placeholder="People Limit"
                                          onChange={handleInputChange}/>
                        </Form.Group>
                    </Form.Group>
                    <Form.Group className="row mb-2">
                        <Form.Group className="col-6">
                            <Form.Label>Age from<span className="required"/></Form.Label>
                            <Form.Control type="number" name="ageFrom" placeholder="From" onChange={handleInputChange}/>
                        </Form.Group>
                        <Form.Group className="col-6">
                            <Form.Label>To<span className="required"/></Form.Label>
                            <Form.Control type="number" name="ageTo" placeholder="To" onChange={handleInputChange}/>
                        </Form.Group>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Photo<span className="required"/></Form.Label>
                        <div className="border rounded p-2">
                            <Form.Group className="row align-items-center">
                                {photoUrl ? (<>
                                    <Form.Group className="col-7">
                                        <div
                                            className="rounded"
                                            style={{
                                                position: "relative",
                                                width: "400px",
                                                height: "225px",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <img className="carousel-image" src={photoUrl} alt="travel"
                                                 style={{
                                                     position: "absolute",
                                                     top: "0",
                                                     left: "0",
                                                     width: "100%",
                                                     height: "100%",
                                                     objectFit: "cover",
                                                     objectPosition: "center"
                                                 }}/>
                                        </div>
                                    </Form.Group>
                                    <Form.Group className="col-5">
                                        <div className="custom-file">
                                            <input
                                                type="file"
                                                name="photo"
                                                className="custom-file-input"
                                                id="customFile"
                                                onChange={handleInputChange}
                                                accept=".png, .jpg, .jpeg"
                                                maxSize={2 * 1024 * 1024}
                                                style={{display: "none"}}
                                            />
                                            <label className="btn btn-primary btn-form w-100"
                                                   htmlFor="customFile">
                                                Choose photo
                                            </label>
                                        </div>
                                    </Form.Group>
                                </>) : (<div className="custom-file">
                                    <input
                                        type="file"
                                        name="photo"
                                        className="custom-file-input"
                                        id="customFile"
                                        onChange={handleInputChange}
                                        accept=".png, .jpg, .jpeg"
                                        maxSize={2 * 1024 * 1024}
                                        style={{display: "none"}}
                                    />
                                    <label className="btn btn-primary btn-form w-100" htmlFor="customFile">
                                        Choose photo
                                    </label>
                                </div>)}
                            </Form.Group>
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Events</Form.Label>
                        <div className="border rounded p-2">
                            <Form.Group className="mb-2">
                                <Form.Label>Name</Form.Label>
                                <Form.Control value={eventName} type="text" onChange={handleEventNameChange}
                                              placeholder="Name"/>
                            </Form.Group>
                            <Form.Group className="row mb-2">
                                <Form.Group className="col-sm-12 col-md-6">
                                    <Form.Label>Starts at</Form.Label>
                                    <ReactDatePicker
                                        className="form-control"
                                        selected={selectedStartTime}
                                        onChange={handleStartTimeChange}
                                        dateFormat="dd.MM.yyyy HH:mm"
                                        locale={datePickerLang}
                                        showMonthDropdown
                                        showYearDropdown
                                        minDate={selectedStartDate}
                                        maxDate={selectedEndDate}
                                        yearDropdownItemNumber={100}
                                        scrollableYearDropdown
                                        placeholderText="DD.MM.YYYY HH:mm"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={5}
                                    />
                                </Form.Group>
                                <Form.Group className="col-sm-12 col-md-6">
                                    <Form.Label>Ends at</Form.Label>
                                    <ReactDatePicker
                                        className="form-control"
                                        selected={selectedEndTime}
                                        onChange={handleEndTimeChange}
                                        dateFormat="dd.MM.yyyy HH:mm"
                                        locale={datePickerLang}
                                        showMonthDropdown
                                        showYearDropdown
                                        minDate={selectedStartDate}
                                        maxDate={selectedEndDate}
                                        yearDropdownItemNumber={100}
                                        scrollableYearDropdown
                                        placeholderText="DD.MM.YYYY HH:mm"
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={5}
                                    />
                                </Form.Group>
                            </Form.Group>
                            <Form.Group
                                className="col-12 d-flex justify-content-center align-items-end">
                                <Button onClick={() => handleEventSubmit()} className="btn-form w-100 mt-2 mb-2"
                                        variant="primary" type="button">
                                    Select
                                </Button>
                            </Form.Group>
                            {events.length !== 0 && (<div>
                                {events.map(event => (
                                    <div className="d-inline-block border rounded p-2 me-1 mb-1">
                                                        <span className="me-2">
                                                            {event.name}{' '}
                                                            ({moment(event.startTime).format("DD.MM.YYYY, HH:mm")} - {moment(event.endTime).format("DD.MM.YYYY, HH:mm")})
                                                        </span>
                                        <Button className="px-0 py-0" variant="button"
                                                onClick={() => handleEventDelete(event.position)}>
                                            <FontAwesomeIcon icon={faTimes}/>
                                        </Button>
                                    </div>))}
                            </div>)}
                        </div>
                    </Form.Group>
                    <Button className="btn-submit w-100 mb-2" variant="primary" type="submit">
                        Create
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>)}
    </>);
}

import {Button, Form, Modal} from "react-bootstrap";
import ReactDatePicker from "react-datepicker";
import moment from "moment/moment";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useState} from "react";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import i18n from "../../../i18n";
import {enUS as en, uk} from "date-fns/locale";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import Cookies from "js-cookie";

export default function TravelEventsModal({show, travelId, startDate, endDate, onHide}) {
    const [events, setEvents] = useState([]);
    const [eventName, setEventName] = useState('');
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [selectedEndTime, setSelectedEndTime] = useState(null);
    const [originalEvents, setOriginalEvents] = useState([]);
    const [disableSelectBtn, setDisableSelectBtn] = useState(false);
    const [isChanged, setIsChanged] = useState(false);

    const datePickerLang = i18n.language === "uk" ? uk : en;

    const fetchEvents = async () => {
        await axios.get(`${DOMAIN_API_URL}/travels/${travelId}/events`)
            .then(response => {
                const updatedEvents = [];
                for (let i = 0; i < response.data.length; i++) {
                    updatedEvents.push({
                        name: response.data[i].name,
                        startTime: response.data[i].startTime,
                        endTime: response.data[i].endTime,
                        position: updatedEvents.length
                    });
                }
                setEvents(updatedEvents);
                setOriginalEvents(response.data);
            })
            .catch(error => console.error(error));
    };

    const isEventsChanged = () => {
        if (originalEvents.length !== events.length) {
            setIsChanged(true);
            return;
        }

        for (let i = 0; i < events.length; i++) {
            if (originalEvents[i].name !== events[i].name ||
                originalEvents[i].startTime !== events[i].startTime ||
                originalEvents[i].endTime !== events[i].endTime) {
                setIsChanged(true);
                return;
            }
        }

        setIsChanged(false);
    };

    useEffect(() => {
        fetchEvents();
    }, [travelId]);

    useEffect(() => {
        if (eventName === '' ||
            selectedStartTime === null ||
            selectedEndTime === null) {
            setDisableSelectBtn(true);
        } else {
            setDisableSelectBtn(false);
        }
    }, [eventName, selectedStartTime, selectedEndTime])

    useEffect(() => {
        isEventsChanged();
    }, [events]);

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
            endTime: moment(selectedEndTime).format("YYYY-MM-DDTHH:mm:ss")
        };
        const updatedEvents = [...events, event];
        console.log(updatedEvents.sort((e1, e2) => moment(e1.startTime).diff(moment(e2.startTime))));
        setEvents(updatedEvents);
        setEventName("");
        setSelectedStartTime(null);
        setSelectedEndTime(null);
    };

    const handleEventDelete = (position) => {
        const updatedEvents = events.filter(event => event.position !== position);
        for (let i = 0; i < updatedEvents.length; i++) {
            updatedEvents[i].position = i;
        }
        setEvents(updatedEvents);
    };

    const handleEventsConfirm = async () => {
        const formData = new FormData();
        formData.append('events', JSON.stringify(events));

        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        console.log(formData);
        await axios.post(`${DOMAIN_API_URL}/travels/${travelId}/events`, formData, config)
            .then(response => {
                const updatedEvents = [];
                for (let i = 0; i < response.data.length; i++) {
                    updatedEvents.push({
                        name: response.data[i].name,
                        startTime: response.data[i].startTime,
                        endTime: response.data[i].endTime,
                        position: updatedEvents.length
                    });
                }
                setEvents(updatedEvents);
                setOriginalEvents(response.data);
            })
            .catch(error => console.error(error));
    }

    const handleTravelEventsClose = () => {
        onHide();
    };

    return (
        <>
            <Modal show={show} size="lg" animation={false} onHide={handleTravelEventsClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Events</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-2">
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
                                    minDate={startDate}
                                    maxDate={endDate}
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
                                    minDate={startDate}
                                    maxDate={endDate}
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
                            <Button className="btn-form w-100 mt-2 mb-2"
                                    variant="primary" type="button" disabled={disableSelectBtn}
                                    onClick={handleEventSubmit}>
                                Select
                            </Button>
                        </Form.Group>
                        {events.length !== 0 && (
                            <>
                                <div>
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
                                        </div>
                                    ))}
                                </div>
                                {isChanged &&
                                    <Button className="travel-btn-primary w-100 mt-2"
                                            onClick={() => handleEventsConfirm()}>Confirm</Button>}
                            </>
                        )}
                        {events.length > 0 && (
                            <div className="travel-events mb-3 mt-3">
                                <FullCalendar
                                    plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                                    initialView="dayGridMonth"
                                    headerToolbar={{
                                        left: "prev,next today",
                                        center: "title",
                                        right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek"
                                    }}
                                    height="500px"
                                    events={events.map(event => {
                                        return {
                                            title: event.name,
                                            start: event.startTime,
                                            end: event.endTime
                                        }
                                    })}
                                    locale={i18n.language}
                                    initialDate={events[0].startTime}
                                />
                            </div>
                        )}
                    </Form.Group>
                </Modal.Body>
            </Modal>
        </>
    );
}

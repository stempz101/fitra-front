import {Button, Form, Modal} from "react-bootstrap";
import {useEffect, useState} from "react";
import moment from "moment/moment";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";

export default function TypeModal({show, onHide}) {
    const [type, setType] = useState('');
    const [types, setTypes] = useState([]);

    useEffect(() => {
        if (show) {
            setTypes([
                ...types,
                {name: 'Sea'},
                {name: 'Tours'},
                {name: 'Cruises'},
                {name: 'Hiking'},
                {name: 'Sport'},
                {name: 'Winter holidays'}
            ]);
        }
    }, [show])

    const handleInputChange = (event) => setType(event.target.value);

    return (
        <>
            <Modal show={show} animation={false} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Types</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="border rounded p-2 mb-2">
                        <Form.Group>
                            <Form.Label>
                                Name
                            </Form.Label>
                            <Form.Control type="text" name="name" placeholder="Name" onChange={handleInputChange}/>
                            <Button className="travel-btn-primary w-100 mt-2">Create</Button>
                        </Form.Group>
                    </div>
                    <Form.Group>
                        {types.map(type =>
                            <div className="d-inline-block border rounded p-2 me-1 mb-1">
                                <div className="d-flex align-items-center">
                                    <span className="me-2">
                                                            {type.name}{' '}
                                                        </span>
                                    <Button className="d-flex align-items-center px-0 py-0" variant="button"
                                        // onClick={() => handleEventDelete(event.position)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor"
                                             className="bi bi-pencil" viewBox="0 0 16 16">
                                            <path
                                                d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                        </svg>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form.Group>
                </Modal.Body>
            </Modal>
        </>
    );
}

import {useEffect, useState} from "react";
import axios from "axios";
import {DOMAIN_API_URL} from "../../../api";
import Cookies from "js-cookie";
import {Button, ButtonGroup, Form, Modal, Row} from "react-bootstrap";

export default function UserGalleryModal({show, userId, fetchPhotos, setMainPhoto, updateMainPhoto, onHide}) {
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploadedPhoto, setUploadedPhoto] = useState(null);
    const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');

    const fetchImages = async () => {
        try {
            let response = await axios.get(`${DOMAIN_API_URL}/images/user/${userId}`);

            const updatedImages = await Promise.all(response.data.map(async (image) => {
                const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${userId}/name/${image}`, {responseType: 'arraybuffer'});
                const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                return {
                    fileName: image,
                    url: URL.createObjectURL(blob)
                }
            }));

            setImages(updatedImages);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchImages();
    }, [userId]);

    const handleSetAvatar = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.put(`${DOMAIN_API_URL}/images/user/${userId}/name/${selectedImage.fileName}/avatar`,
            {}, config)
            .then(() => setMainPhoto(selectedImage.url))
            .catch(error => console.error(error));
    };

    const handleDeletePhoto = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        await axios.delete(`${DOMAIN_API_URL}/images/user/${userId}/name/${selectedImage.fileName}`, config)
            .then(() => {
                updateMainPhoto(userId);
                setSelectedImage(null);
            })
            .catch(error => console.error(error));
        await fetchImages();
    }

    const handleUploadedImageSelect = (event) => {
        setUploadedPhoto(event.target.files[0]);
        console.log(event.target.files[0]);

        const reader = new FileReader();
        reader.onload = () => {
            setUploadedPhotoUrl(reader.result);
        };
        reader.readAsDataURL(event.target.files[0]);
    };

    const handleUploadImageSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('photo', uploadedPhoto);

        const token = Cookies.get("AUTH_TOKEN");
        const config = {
            headers: {
                'content-type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
            }
        };

        console.log(uploadedPhoto);
        await axios.post(`${DOMAIN_API_URL}/images/user/${userId}`, formData, config)
            .then(async (response) => {
                await fetchPhotos();
                setUploadedPhoto(null);
                setUploadedPhotoUrl('');
            })
            .catch(error => console.error(error));
        await fetchImages();
    };

    const handleGalleryClose = () => {
        setImages([]);
        onHide();
    };

    return (
        <>
            <Modal show={show} size="lg" onHide={handleGalleryClose} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Gallery</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedImage &&
                        <div className="rounded-3 mb-3" style={{
                            position: 'relative',
                            width: '100%',
                            height: '300px',
                            overflow: "hidden"
                        }}>
                            <img className="carousel-image" src={selectedImage.url} alt="travel"
                                 style={{
                                     position: "absolute",
                                     top: "0",
                                     left: "0",
                                     width: "100%",
                                     height: "100%",
                                     objectFit: "contain",
                                     objectPosition: "center",
                                     backgroundColor: '#f5f5f5',
                                 }}/>
                        </div>
                    }
                    <Row className="mb-3">
                        {images.map(image => (
                            <div className="col-md-3 rounded-3 overflow-hidden" style={{height: '100px'}}>
                                <img src={image.url} alt="image" className="card-img-top travel-img rounded-3"
                                     style={{
                                         objectFit: 'contain',
                                         backgroundColor: '#f5f5f5',
                                         cursor: 'pointer'
                                     }}
                                     onClick={() => setSelectedImage(image)}
                                />
                            </div>
                        ))}
                    </Row>
                    {selectedImage &&
                        <ButtonGroup className="d-flex">
                            <Button className="col-6 travel-btn-primary" onClick={handleSetAvatar}>Set as avatar</Button>
                            <Button className="col-6 travel-btn-danger" onClick={handleDeletePhoto}>Delete</Button>
                        </ButtonGroup>
                    }
                    <hr/>
                    <Form onSubmit={handleUploadImageSubmit}>
                        <Form.Group className="mb-2">
                            <Form.Label>Upload new photo</Form.Label>
                            <div className="border rounded p-2">
                                <Form.Group className="row align-items-center">
                                    {uploadedPhotoUrl ? (<>
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
                                                <img className="carousel-image" src={uploadedPhotoUrl} alt="travel"
                                                     style={{
                                                         position: "absolute",
                                                         top: "0",
                                                         left: "0",
                                                         width: "100%",
                                                         height: "100%",
                                                         objectFit: "contain",
                                                         objectPosition: "center"
                                                     }}/>
                                            </div>
                                        </Form.Group>
                                        <Form.Group className="col-5">
                                            <div className="custom-file mb-2">
                                                <input
                                                    type="file"
                                                    name="photo"
                                                    className="custom-file-input"
                                                    id="customFile"
                                                    onChange={handleUploadedImageSelect}
                                                    accept=".png, .jpg, .jpeg"
                                                    maxSize={2 * 1024 * 1024}
                                                    style={{display: "none"}}
                                                />
                                                <label className="btn btn-primary btn-form w-100"
                                                       htmlFor="customFile">
                                                    Choose photo
                                                </label>
                                            </div>
                                            <Button className="travel-btn-primary w-100" type="submit">Upload</Button>
                                        </Form.Group>
                                    </>) : (<div className="custom-file">
                                        <input
                                            type="file"
                                            name="photo"
                                            className="custom-file-input"
                                            id="customFile"
                                            onChange={handleUploadedImageSelect}
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
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
}

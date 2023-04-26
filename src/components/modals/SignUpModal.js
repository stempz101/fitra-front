import { useEffect, useRef, useState } from "react";
import { Alert, Form, Modal, Button } from "react-bootstrap";
import ReactDatePicker from "react-datepicker";
import i18n from "../../i18n";
import { enUS as en, uk } from "date-fns/locale";
import "../../css/sign-up-modal.css";
import axios from "axios";
import { DOMAIN_API_URL } from "../../api";
import moment from "moment/moment";
import Select from "react-select";
import { debounce } from "lodash";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";

export default function SignUpModal(props) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    about: '',
    birthday: null,
    countryId: 0,
    cityId: 0,
    email: '',
    password: '',
    repeatPassword: '',
    avatar: null
  });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBirthday, setSelectedBirthday] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("/img/default-user.png");
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const errorMessageRef = useRef(null);

  const datePickerLang = i18n.language === "uk" ? uk : en;

  useEffect(() => {
    const fetchCountries = async () => {
      await axios
        .get(`${DOMAIN_API_URL}/countries`)
        .then((response) => {
          setCountries(response.data);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    fetchCountries();
  }, []);

  const handleCountryChange = async (selectedOption) => {
    setIsLoading(true);
    setSelectedCountry(selectedOption);
    setFormData({ ...formData, countryId: selectedOption.value });
    await axios
      .get(`${DOMAIN_API_URL}/countries/${selectedOption.value}/cities`)
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
    setSelectedCity(selectedOption);
    setFormData({ ...formData, cityId: selectedOption.value });
  };

  const handleCityInputChange = debounce((value) => {
    setIsLoading(true);
    axios
      .get(
        `${DOMAIN_API_URL}/countries/${selectedCountry.value}/cities?search=${value}`
      )
      .then((response) => {
        setCities(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, 500);

  const handleBirthdayChange = (date) => {
    setSelectedBirthday(date);
    setFormData({
      ...formData,
      birthday: moment(selectedBirthday).format("YYYY-MM-DD"),
    });
  };

  const handleInputChange = (event) => {
    const { name, value, type, files } = event.target;

    if (type === "file") {
      console.log(name);
      setFormData({
        ...formData,
        [name]: files[0],
      });

      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    console.log(formData);
  };

  const handleFormSubmit = async (event) => {
    console.log(formData);
    event.preventDefault();

    if (formData.firstName === "" ||
      formData.lastName === "" ||
      formData.birthday === null ||
      formData.countryId <= 0 ||
      formData.email === "" ||
      formData.password === "" ||
      formData.repeatPassword === "") {
      setErrorMessage("Please enter required fields.");
      setTimeout(() => {
        errorMessageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
      return;
    } else if (formData.password !== formData.repeatPassword) {
      setErrorMessage("Please confirm your password.");
      setTimeout(() => {
        errorMessageRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
      return;
    }

    const config = {
      headers: {
        'content-type': 'multipart/form-data'
      }
    }

    await axios.post(`${DOMAIN_API_URL}/users/register`, formData, config)
      .then((response) => {
        console.log(response.data);
        const options = { path: "/", sameSite: "lax" };
        Cookies.set("AUTH_TOKEN", response.data.token, options);
        setIsAuthorized(true);
        window.location.reload();
      })
      .catch((error) => { console.log(error); });
  };

  const handleClose = () => {
    setErrorMessage("");
    setSelectedBirthday(null);
    setAvatarUrl("/img/default-user.png");
    props.onHide();
  };

  const handleShowLogInModal = () => {
    handleClose();
    props.showLogInModal();
  }

  return (
    <>
      {!isAuthorized && (
        <Modal {...props} onHide={handleClose} animation={false}>
          <Modal.Header closeButton>
            <Modal.Title>Sign up</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleFormSubmit}>
              {errorMessage && <Alert variant="danger" ref={errorMessageRef}>{errorMessage}</Alert>}
              <Form.Group className="row mb-2">
                <Form.Group className="col-6">
                  <Form.Label>First name<span className="required" /></Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    onChange={handleInputChange}
                  />
                </Form.Group>
                <Form.Group className="col-6">
                  <Form.Label>Last name<span className="required" /></Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Birthday<span className="required" /></Form.Label>
                <ReactDatePicker
                  className="form-control"
                  selected={selectedBirthday}
                  onChange={handleBirthdayChange}
                  dateFormat="dd.MM.yyyy"
                  locale={datePickerLang}
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
                  <Form.Label>Country<span className="required" /></Form.Label>
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
              <Form.Group className="mb-2">
                <Form.Label>Email<span className="required" /></Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="Email"
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Password<span className="required" /></Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  placeholder="Password"
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Repeat password<span className="required" /></Form.Label>
                <Form.Control
                  type="password"
                  name="repeatPassword"
                  placeholder="Repeat password"
                  onChange={handleInputChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Photo</Form.Label>
                <div className="d-flex align-items-center border rounded p-2">
                  <div
                    className="rounded-circle me-3"
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "#ddd",
                      backgroundImage: `url(${avatarUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="custom-file">
                    <input
                      type="file"
                      name="avatar"
                      className="custom-file-input"
                      id="customFile"
                      onChange={handleInputChange}
                      accept=".png, .jpg, .jpeg"
                      maxSize={2 * 1024 * 1024}
                      style={{ display: "none" }}
                    />
                    <label className="btn btn-primary" htmlFor="customFile">
                      Choose photo
                    </label>
                  </div>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Write about yourself</Form.Label>
                <Form.Control as="textarea" name="about" placeholder="Write here..." onChange={handleInputChange} rows={5} />
              </Form.Group>
              <Button className="w-100 mb-2" variant="primary" type="submit">
                Sign up
              </Button>
              <Form.Label>
                Already have an account?{' '}
                <Link to="#" onClick={handleShowLogInModal}>Log in</Link>
              </Form.Label>
            </Form>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
}

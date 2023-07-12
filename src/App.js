import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import 'react-chat-elements/dist/main.css';
import i18n from "./i18n";
import Navigation from "./components/navigation/Navigation";
import React, {useEffect, useState} from "react";
import LocaleContext from "./LocaleContext";
import useUserAuthorization from './hooks/users/useUserAuthorization';
import {Navigate, Route, Routes} from 'react-router-dom';
import Travels from './pages/Travels';
import Mates from './pages/Mates';
import Travel from "./pages/Travel";
import MyTravels from "./pages/MyTravels";
import useWebsocket from "./hooks/websocket/useWebsocket";
import Messages from "./pages/Messages";
import Mate from "./pages/Mate";
import AboutUs from "./pages/AboutUs";

function App() {
    const [locale, setLocale] = useState(i18n.language);

    const [showLogIn, setShowLogIn] = useState(false);

    const {currentUser, isAuthorized, handleAuthorizeUser, handleLogOutUser} = useUserAuthorization();
    const {
        stompClient,
        unreadMessagesCount,
        unreadInvitesCount,
        unreadRequestsCount,
        notificationsSum
    } = useWebsocket({currentUser});

    useEffect(() => {
        handleAuthorizeUser();
    }, []);

    i18n.on('languageChanged', (lng) => setLocale(i18n.language));

    return (
        <>
            <LocaleContext.Provider value={{locale, setLocale}}>
                <Navigation
                    currentUser={currentUser}
                    isAuthorized={isAuthorized}
                    logOut={handleLogOutUser}
                    showLogIn={showLogIn}
                    setShowLogIn={setShowLogIn}
                    notificationsSum={notificationsSum}
                    unreadMessagesCount={unreadMessagesCount}
                />
                <Routes>
                    <Route exact path='/' element={<Travels isAuthorized={isAuthorized} setShowLogIn={setShowLogIn}/>}/>
                    <Route path='/:id' element={<Travel currentUser={currentUser} isAuthorized={isAuthorized}
                                                        setShowLogIn={setShowLogIn}/>}/>
                    <Route path='/my-travels' element={<Navigate to="/my-travels/participating"/>}/>
                    <Route path='/my-travels/participating'
                           element={<MyTravels isAuthorized={isAuthorized} currentUser={currentUser}
                                               participating={true}
                                               unreadInvitesCount={unreadInvitesCount}
                                               unreadRequestsCount={unreadRequestsCount}/>}/>
                    <Route path='/my-travels/invitations'
                           element={<MyTravels isAuthorized={isAuthorized} currentUser={currentUser}
                                               invitations={true}
                                               unreadInvitesCount={unreadInvitesCount}
                                               unreadRequestsCount={unreadRequestsCount}/>}/>
                    <Route path='/my-travels/created'
                           element={<MyTravels isAuthorized={isAuthorized} currentUser={currentUser} created={true}
                                               unreadInvitesCount={unreadInvitesCount}
                                               unreadRequestsCount={unreadRequestsCount}/>}/>
                    <Route path='/my-travels/requests'
                           element={<MyTravels isAuthorized={isAuthorized} currentUser={currentUser}
                                               requests={true}
                                               unreadInvitesCount={unreadInvitesCount}
                                               unreadRequestsCount={unreadRequestsCount}/>}/>
                    <Route path='/mates' element={<Mates isAuthorize={isAuthorized} currentUser={currentUser}/>}/>
                    <Route path='/mates/:id' element={<Mate currentUser={currentUser} isAuthorized={isAuthorized}
                                                            setShowLogIn={setShowLogIn}/>}/>
                    <Route path='/messages' element={<Messages isAuthorized={isAuthorized} currentUser={currentUser}/>}/>
                    <Route path='/messages/user/:userId' element={<Messages isAuthorized={isAuthorized} currentUser={currentUser}/>}/>
                    <Route path='/about' element={<AboutUs/>}/>
                </Routes>
            </LocaleContext.Provider>
        </>
    );
}

export default App;

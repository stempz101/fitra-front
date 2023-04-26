import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-datepicker/dist/react-datepicker.css';
import i18n from "./i18n";
import Navigation from "./components/navigation/Navigation";
import React, {useEffect, useState} from "react";
import LocaleContext from "./LocaleContext";
import useUserAuthorization from './hooks/users/useUserAuthorization';
import {Route, Routes} from 'react-router-dom';
import Travels from './pages/Travels';
import Reviews from './pages/Reviews';

function App() {
  const [locale, setLocale] = useState(i18n.language);

  const { currentUser, isAuthorized, handleAuthorizeUser, handleLogOutUser } = useUserAuthorization();

  useEffect(() => {handleAuthorizeUser();}, []);

  i18n.on('languageChanged', (lng) => setLocale(i18n.language));

  return (
    <>
      <LocaleContext.Provider value={{ locale, setLocale }}>
        <Navigation currentUser={currentUser} isAuthorized={isAuthorized} logOut={handleLogOutUser} />
        <Routes>
          <Route exact path='/' element={<Travels />} />
          <Route path='/reviews' element={<Reviews />} />
        </Routes>
      </LocaleContext.Provider>
    </>
  );
}

export default App;

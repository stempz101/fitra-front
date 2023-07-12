import axios from "axios";
import Cookies from "js-cookie";
import { DOMAIN_API_URL } from "../../api";
import { useEffect, useState } from "react";

export default function useUserAuthorization() {
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!isAuthorized) {
            setCurrentUser(null);
        }
    }, [isAuthorized]);

    const handleAuthorizeUser = async () => {
        const token = Cookies.get("AUTH_TOKEN");
        if (token) {
            try {
                const res = await axios.get(`${DOMAIN_API_URL}/users/authorized`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCurrentUser({
                    id: res.data.id,
                    name: res.data.firstName,
                    isEnabled: res.data.isEnabled,
                    isAdmin: res.data.isAdmin
                });
                setIsAuthorized(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleLogOutUser = () => {
        Cookies.remove("AUTH_TOKEN");
        setIsAuthorized(false);
        window.location.reload();
    };

    return { currentUser, isAuthorized, handleAuthorizeUser, handleLogOutUser };
}

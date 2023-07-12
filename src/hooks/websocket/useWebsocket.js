import {useEffect, useState} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import {DOMAIN_API_URL} from "../../api";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";

export default function useWebsocket({currentUser}) {
    const [stompClient, setStompClient] = useState(null);

    const [unreadInvitesCount, setUnreadInvitesCount] = useState(0);
    const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    const [notificationsSum, setNotificationsSum] = useState(0);

    const fetchCounts = () => {
        const token = Cookies.get("AUTH_TOKEN");
        const socket = new SockJS('http://localhost:8081/travel-socket');
        const stompClient = Stomp.over(socket);

        stompClient.connect({Authorization: `Bearer ${token}`}, () => {
            stompClient.subscribe(`/unread-topic/chats/user/${currentUser.id}`, response => {
                const body = JSON.parse(response.body);
                setUnreadMessagesCount(body.messagesCount);
            });

            stompClient.send(`/app/chats/user/${currentUser.id}`, {},
                JSON.stringify({messagesCount: 0}));

            stompClient.subscribe(`/unread-topic/invitations/user/${currentUser.id}`, response => {
                const body = JSON.parse(response.body);
                setUnreadInvitesCount(body.invitationsCount);
                setNotificationsSum(body.invitationsCount + unreadRequestsCount);
            });

            stompClient.send(`/app/invitations/user/${currentUser.id}`, {},
                JSON.stringify({invitationsCount: 0}));

            stompClient.subscribe(`/unread-topic/user/${currentUser.id}/travels/requests`, response => {
                const body = JSON.parse(response.body);
                setUnreadRequestsCount(body.requestsCount);
                setNotificationsSum(body.requestsCount + unreadInvitesCount);
            });

            stompClient.send(`/app/user/${currentUser.id}/travels/requests`, {},
                JSON.stringify({requestsCount: 0}));
            setStompClient(stompClient);
        });

        return () => {
            stompClient.disconnect();
        };
    };

    useEffect(() => {
        if (currentUser) {
            fetchCounts();
        }
    }, [currentUser]);

    return {stompClient, unreadInvitesCount, unreadRequestsCount, unreadMessagesCount, notificationsSum};
}

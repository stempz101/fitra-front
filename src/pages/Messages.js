import {Container, Row} from "react-bootstrap";
import {Button, ChatItem, Input, MessageList} from "react-chat-elements";
import '../css/messages.css';
import {useEffect, useRef, useState} from "react";
import {useLocation, useParams} from "react-router-dom";
import axios from "axios";
import {DOMAIN_API_URL} from "../api";
import Cookies from "js-cookie";
import {parseInt} from "lodash";
import SockJS from "sockjs-client";
import {Stomp} from "@stomp/stompjs";

export default function Messages({isAuthorized, currentUser}) {
    const {userId} = useParams();

    const [rooms, setRooms] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [lastMessages, setLastMessages] = useState({});

    const [selectedRoom, setSelectedRoom] = useState(null);
    const [stompClientMessages, setStompClientMessages] = useState(null);

    const messagesContainerRef = useRef(null);

    const location = useLocation();

    const fetchRooms = async () => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            let response = await axios.get(`${DOMAIN_API_URL}/chats/rooms`, config);

            let updatedRooms = await Promise.all(response.data.map(async (room) => {
                let updatedRoom = room;

                console.log(room);
                try {
                    const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${room.user.id}/avatar`, {responseType: 'arraybuffer'});
                    const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                    updatedRoom = {
                        ...updatedRoom,
                        user: {
                            ...updatedRoom.user,
                            avatar: URL.createObjectURL(blob)
                        }
                    };
                } catch (error) {
                    if (error && error.response.status === 404) {
                        updatedRoom = {
                            ...updatedRoom,
                            user: {
                                ...updatedRoom.user,
                                avatar: "/img/default-user.png"
                            }
                        };
                    }
                }

                if (updatedRoom.lastMessage.sender.id === currentUser.id) {
                    setLastMessages(prevState => ({
                        ...prevState,
                        [updatedRoom.id]: {
                            content: `You: ${updatedRoom.lastMessage.content}`,
                            timestamp: updatedRoom.lastMessage.timestamp,
                            unread: updatedRoom.unread
                        }
                    }));
                } else {
                    setLastMessages(prevState => ({
                        ...prevState,
                        [updatedRoom.id]: {
                            content: updatedRoom.lastMessage.content,
                            timestamp: updatedRoom.lastMessage.timestamp,
                            unread: updatedRoom.unread
                        }
                    }));
                }

                return updatedRoom;
            }));

            if (userId) {
                const existingRoom = updatedRooms.find(room => room.user.id === parseInt(userId));
                if (existingRoom) {
                    setSelectedRoom(existingRoom);
                } else {
                    let roomResponse = await axios.post(`${DOMAIN_API_URL}/chats/rooms/user/${userId}`, {}, config);

                    try {
                        const blobResponse = await axios.get(`${DOMAIN_API_URL}/images/user/${roomResponse.data.user.id}/avatar`, {responseType: 'arraybuffer'});
                        const blob = new Blob([blobResponse.data], {type: 'image/jpeg'});
                        roomResponse.data.user = {
                            ...roomResponse.data.user,
                            avatar: URL.createObjectURL(blob)
                        };
                    } catch (error) {
                        if (error && error.response.status === 404) {
                            roomResponse.data.user = {
                                ...roomResponse.data.user,
                                avatar: "/img/default-user.png"
                            };
                        }
                    }
                    setSelectedRoom(roomResponse.data);
                    // updatedRooms.push(roomResponse.data);
                    updatedRooms = [roomResponse.data, ...updatedRooms];
                }
            }

            setRooms(updatedRooms);
            console.log(rooms);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMessages = async () => {
        try {
            const token = Cookies.get("AUTH_TOKEN");
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            let response = await axios.get(`${DOMAIN_API_URL}/chats/rooms/${selectedRoom.id}/messages`, config);

            const updatedMessages = await Promise.all(response.data.map(async (message) => {
                let updatedMessage;

                if (message.sender.id === currentUser.id) {
                    updatedMessage = {
                        position: 'right',
                        type: 'text',
                        text: message.content,
                        date: new Date(message.timestamp)
                    };
                } else {
                    updatedMessage = {
                        position: 'left',
                        type: 'text',
                        text: message.content,
                        date: new Date(message.timestamp)
                    };
                }

                return updatedMessage;
            }));

            setMessages(updatedMessages);
            scrollToBottom();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isAuthorized) {
            fetchRooms();
        }
    }, [isAuthorized, userId]);

    useEffect(() => {
        const token = Cookies.get("AUTH_TOKEN");
        const socket = new SockJS('http://localhost:8081/chat-ws');
        const stompClient = Stomp.over(socket);
        stompClient.connect({Authorization: `Bearer ${token}`}, () => {
            rooms.forEach(room => {
                stompClient.subscribe(`/unread-topic/chat-rooms/${room.id}/user/${currentUser.id}`, response => {
                    const body = JSON.parse(response.body);
                    if (body.lastMessage) {
                        if (body.lastMessage.sender.id === currentUser.id) {
                            setLastMessages(prevState => ({
                                ...prevState,
                                [room.id]: {
                                    content: `You: ${body.lastMessage.content}`,
                                    timestamp: body.lastMessage.timestamp,
                                    unread: body.unread
                                }
                            }));
                        } else {
                            setLastMessages(prevState => ({
                                ...prevState,
                                [room.id]: {
                                    content: body.lastMessage.content,
                                    timestamp: body.lastMessage.timestamp,
                                    unread: body.unread
                                }
                            }));
                        }
                    } else {
                        setLastMessages(prevState => ({
                            ...prevState,
                            [room.id]: {
                                ...prevState[room.id],
                                unread: body.unread
                            }
                        }));
                    }
                });
            });
        });

        console.log(lastMessages);
        return () => {
            stompClient.disconnect();
        };
    }, [rooms])

    useEffect(() => {
        if (selectedRoom) {
            fetchMessages();
        }
    }, [selectedRoom]);

    useEffect(() => {
        if (selectedRoom) {
            let stompClient = subscribeMessages();
            setStompClientMessages(stompClient);
            return () => {
                stompClient.disconnect();
                setStompClientMessages(null);
            }
        }
    }, [selectedRoom])

    const subscribeMessages = () => {
        const token = Cookies.get("AUTH_TOKEN");
        const socket = new SockJS('http://localhost:8081/chat-ws');
        const stompClient = Stomp.over(socket);

        stompClient.connect({Authorization: `Bearer ${token}`}, () => {
            stompClient.subscribe(`/chat-room/${selectedRoom.id}`, response => {
                let message = JSON.parse(response.body);
                if (message.sender.id === currentUser.id) {
                    message = {
                        position: 'right',
                        type: 'text',
                        text: message.content,
                        date: new Date(message.timestamp)
                    };
                } else {
                    message = {
                        position: 'left',
                        type: 'text',
                        text: message.content,
                        date: new Date(message.timestamp)
                    };
                }
                setMessages(prevMessages => [...prevMessages, message]);
            });
        });

        return stompClient;
    };

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message = {
                senderId: currentUser.id,
                recipientId: selectedRoom.user.id,
                content: newMessage
            };
            stompClientMessages.send(`/app/chat/${selectedRoom.id}`, {}, JSON.stringify(message));
            setLastMessages(prevState => ({
                ...prevState,
                [selectedRoom.id]: {
                    content: `You: ${newMessage}`,
                    timestamp: new Date()
                }
            }));
            scrollToBottom();
            setNewMessage('');
            console.log(lastMessages);
        }
    };

    const scrollToBottom = () => {
        messagesContainerRef.current.scrollIntoView({behavior: 'smooth'});
    };

    return (
        <>
            <Container className="mt-3">
                <Row className="border-1 rounded-3 messages">
                    <div className="col-4 h-100 px-0 chat-rooms">
                        {rooms.length > 0 &&
                            <>
                                {rooms.map(room =>
                                    <>
                                        {selectedRoom && selectedRoom.id === room.id ? (
                                            <ChatItem
                                                className='chat-item chat-item-active'
                                                onClick={() => setSelectedRoom(room)}
                                                avatar={room.user.avatar}
                                                alt={'Reactjs'}
                                                title={room.user.name}
                                                subtitle={lastMessages[room.id]?.content}
                                                date={lastMessages[room.id]?.timestamp}
                                                unread={lastMessages[room.id]?.unread}
                                            />
                                        ) : (
                                            <ChatItem
                                                className='chat-item'
                                                onClick={() => setSelectedRoom(room)}
                                                avatar={room.user.avatar}
                                                alt={'Reactjs'}
                                                title={room.user.name}
                                                subtitle={lastMessages[room.id]?.content}
                                                date={lastMessages[room.id]?.timestamp}
                                                unread={lastMessages[room.id]?.unread}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        }
                    </div>
                    <div className="col-8 d-flex flex-column h-100" style={{backgroundColor: '#efefef'}}>
                        {selectedRoom &&
                            <>
                                <div className="flex-grow-1 overflow-auto">
                                    <MessageList
                                        referance={messagesContainerRef}
                                        className='message-list'
                                        lockable={true}
                                        toBottomHeight={'100%'}
                                        dataSource={messages}
                                    />
                                </div>
                                <div ref={messagesContainerRef} />
                                <div>
                                    <Input
                                        placeholder='Type here...'
                                        multiline={false}
                                        value={newMessage}
                                        onChange={(event) => setNewMessage(event.target.value)}
                                        rightButtons={<Button color='white' backgroundColor='black' text='Send'
                                                              onClick={handleSendMessage}/>}
                                    />
                                </div>
                            </>
                        }
                    </div>
                </Row>
            </Container>
        </>
    );
}

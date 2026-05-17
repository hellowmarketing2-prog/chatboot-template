import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";

const DUMMY_RESPONSES = {
  hello:
    "Hi there! 👋 I'm your RAG Chatbot. I'm here to help you find information from your uploaded documents. Feel free to ask me anything!",
  hi: "Hello! How can I assist you today? 😊",
  "who are you":
    "I'm a RAG (Retrieval-Augmented Generation) Chatbot. I can search through your documents and provide accurate answers based on the content.",
  "what is rag":
    "RAG stands for Retrieval-Augmented Generation. It combines document retrieval with AI to provide accurate, sourced answers from your documents.",
  "how do i upload":
    "You can drag and drop files into the upload box, or click to browse and select files from your computer.",
  upload:
    "To upload documents, click on the upload box or drag files directly into it. Supported formats include PDF, DOCX, TXT, and more!",
  "what format":
    "I can work with PDF, DOCX, TXT, XLSX, PPT, and other common document formats.",
  "tell me about":
    "I can provide summaries, extract information, answer questions, and help you find specific content in your documents.",
  summary:
    "I can create summaries of your documents! Just ask me to summarize any section or the entire document.",
  search:
    "I can search through your documents for specific information. Just tell me what you're looking for!",
  help: "I can help you with: 📚 Document search, 📋 Summarization, 🔍 Information extraction, 💡 Q&A, and more! What do you need?",
  thanks: "You're welcome! Is there anything else you'd like to know? 😊",
  ok: "Great! Feel free to ask me anything about your documents.",
  question:
    "Fire away with your questions! I'm here to help answer anything about your uploaded documents.",
  information:
    "I have access to all the information in your uploaded documents. What specific information are you looking for?",
  how: "I use advanced AI to search and retrieve information from your documents accurately and quickly.",
  default:
    "That's a great question! Based on the documents you've uploaded, I can help you find more specific information. Could you rephrase your question?",
};

function generateChatId() {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getDateKey(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDayLabel(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const chatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (chatDay.getTime() === today.getTime()) {
    return "today";
  }

  // const yesterday = new Date(today);
  // yesterday.setDate(yesterday.getDate() - 1);
  // if (chatDay.getTime() === yesterday.getTime()) {
  //   return "yesterday";
  }

  // return "other";
// }

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [uploadHidden, setUploadHidden] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [footerOpen, setFooterOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("chatHistory");
    if (saved) {
      setChatHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    window.localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  const saveChatMessage = (sender, text, overrideChatId) => {
    const chatId = overrideChatId || currentChatId;
    if (!chatId) return;

    setChatHistory((prev) => {
      const existingIndex = prev.findIndex((chat) => chat.id === chatId);
      const entry = {
        sender,
        text,
        timestamp: new Date().toISOString(),
      };

      if (existingIndex === -1) {
        return [
          {
            id: chatId,
            messages: [entry],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            preview: text.substring(0, 50),
          },
          ...prev,
        ];
      }

      const updated = [...prev];
      const chat = { ...updated[existingIndex] };
      chat.messages = [...chat.messages, entry];
      chat.lastUpdated = new Date().toISOString();
      chat.preview = text.substring(0, 50);
      updated[existingIndex] = chat;
      return updated;
    });
  };

  const createNewChat = () => {
    const id = generateChatId();
    const newChat = {
      id,
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      preview: "New Chat",
    };
    setChatHistory((prev) => [newChat, ...prev]);
    setCurrentChatId(id);
    return id;
  };

  const handleUpload = (fileName) => {
    const chatId = currentChatId || createNewChat();
    setSelectedFileName(fileName);
    setUploadHidden(true);
    setMessages([
      {
        sender: "System",
        text: `File "${fileName}" uploaded successfully! 📄 How can I help you?`,
        type: "bot",
      },
    ]);
    saveChatMessage(
      "System",
      `File "${fileName}" uploaded successfully! 📄 How can I help you?`,
      chatId,
    );
  };

  const handleSend = () => {
    const message = inputValue.trim();
    if (message === "") return;

    const chatId = currentChatId || createNewChat();
    if (!uploadHidden) {
      setUploadHidden(true);
    }

    const userMessage = {
      sender: "You",
      text: message,
      type: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    saveChatMessage("You", message, chatId);
    setInputValue("");
    setFooterOpen(false);

    setTimeout(() => {
      const lowerMessage = message.toLowerCase();
      let response = DUMMY_RESPONSES.default;
      for (const key in DUMMY_RESPONSES) {
        if (lowerMessage.includes(key)) {
          response = DUMMY_RESPONSES[key];
          break;
        }
      }
      const botMessage = {
        sender: "Bot",
        text: response,
        type: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
      saveChatMessage("Bot", response, chatId);
    }, 800);
  };

  const handleHistorySelect = (chatId) => {
    const chat = chatHistory.find((item) => item.id === chatId);
    if (!chat) return;
    setMessages(
      chat.messages.map((msg) => ({
        ...msg,
        type: msg.sender === "You" ? "user" : "bot",
      })),
    );
    setCurrentChatId(chat.id);
    setUploadHidden(true);
    setSelectedFileName("");
  };

  const todayChats = useMemo(
    () =>
      chatHistory.filter((chat) => getDayLabel(chat.lastUpdated) === "today"),
    [chatHistory],
  );
  // const yesterdayChats = useMemo(
  //   () =>
  //     chatHistory.filter(
  //       (chat) => getDayLabel(chat.lastUpdated) === "yesterday",
  //     ),
  //   [chatHistory],
  // );

  return (
    <>
      <Head>
        <title>Rag Chatbot UI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </Head>
      <div className="container">
        <aside className="sidebar">
          <div className="logo">
            <i className="fas fa-hexagon"></i> Rag chatbot
          </div>
          <button
            className="new-chat-btn"
            onClick={() => {
              setUploadHidden(false);
              setMessages([]);
              setCurrentChatId(null);
              setInputValue("");
              setFooterOpen(false);
            }}
          >
            <i className="fas fa-plus"></i> New Chat
          </button>

          <div className="chat-history">
            <p className="section-title">TODAY</p>
            {todayChats.map((chat) => (
              <div
                key={chat.id}
                className="history-item"
                onClick={() => handleHistorySelect(chat.id)}
              >
                <i className="far fa-comment-alt"></i>
                <span>
                  {chat.preview.substring(0, 40)}
                  {chat.preview.length > 40 ? "..." : ""}
                </span>
                <i className="fas fa-ellipsis-h"></i>
              </div>
            ))}
            {/* <p className="section-title">YESTERDAY</p>
            {yesterdayChats.map((chat) => (
              <div
                key={chat.id}
                className="history-item"
                onClick={() => handleHistorySelect(chat.id)}
              >
                <i className="far fa-comment-alt"></i>
                <span>
                  {chat.preview.substring(0, 40)}
                  {chat.preview.length > 40 ? "..." : ""}
                </span>
                <i className="fas fa-ellipsis-h"></i>
              </div>
            ))} */}
          </div>

          <div className="user-profile">
            <img className="icon" src="/icon.png" alt="User" />
            <div className="user-info">
              <span className="name">Aziz Ali</span>
              <span className="email">aziz@example.com</span>
            </div>
          </div>
        </aside>

        <main className="chat-area">
          <header className="chat-header">
            <button
              className="sidebar-toggle"
              onClick={() => {
                document.querySelector(".sidebar").classList.toggle("open");
                document
                  .querySelector(".sidebar-overlay")
                  .classList.toggle("active");
              }}
            >
              <i className="fas fa-bars"></i>
            </button>
            <div className="current-user">
              <img className="icon" src="/icon.png" alt="User" />
              <span>Aziz Ali</span>
            </div>
            <button className="feedback-btn">Give feedback</button>
          </header>

          <section
            id="upload-page"
            className={`content-section ${uploadHidden ? "hidden" : ""}`}
          >
            <h1>
              Please Upload the Documents <br /> Before you ask Rag
            </h1>
            <div
              className="upload-box"
              id="drop-zone"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="upload-icon">
                <i className="fas fa-plus"></i>
              </div>
              <p>
                Drag and Drop Or <br />{" "}
                <span className="browse">Browse File</span> To Upload Document
              </p>
              <div className="upload-options">
                <span>File Upload</span>
                <span>PDF Upload</span>
                <span>Document Upload</span>
              </div>
              <input
                type="file"
                id="file-input"
                hidden
                ref={fileInputRef}
                onChange={(event) => {
                  if (event.target.files?.length > 0) {
                    handleUpload(event.target.files[0].name);
                  }
                }}
              />
            </div>
          </section>

          <section
            id="chat-page"
            className={`content-section ${uploadHidden ? "" : "hidden"}`}
          >
            <div className="message-container" id="messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <strong>{message.sender}:</strong> {message.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </section>

          <footer className="input-area">
            <div className="input-wrapper">
              <div
                className="input-icon"
                onClick={() => setFooterOpen((prev) => !prev)}
              >
                <i className="fas fa-plus"></i>
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message to Rag..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
              />
              <button className="send-btn" onClick={handleSend}>
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
            <div className={`footer-categories ${footerOpen ? "open" : ""}`}>
              <span>File Upload</span>
              <span>PDF Upload</span>
              <span>Document Upload</span>
            </div>
          </footer>
        </main>
      </div>
      <div
        className="sidebar-overlay"
        onClick={() => {
          document.querySelector(".sidebar").classList.remove("open");
          document.querySelector(".sidebar-overlay").classList.remove("active");
        }}
      />
    </>
  );
}

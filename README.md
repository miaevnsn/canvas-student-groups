# Canvas Student Group Chats Prototype

A student project that shows how group chats for coursework could live inside a Canvas-style student app. It is **not** an official Instructure product and does **not** connect to real Canvas accounts.

## What is already in this folder

This started as an empty folder. The prototype is a small website you can open in a browser:

- `index.html` — page shell
- `css/styles.css` — Canvas-inspired layout (dark sidebar, course cards, chat bubbles)
- `js/seed.js` — fictional students, courses, and example conversations
- `js/store.js` — saves groups and messages in `localStorage`
- `js/app.js` — screens and interactions



## What you can try

- Dashboard and course cards
- Open a course and its group chats
- Create a group, add/remove members
- Send messages (your messages appear as Alex Rivera)
- Set a deadline, pin a message, add project links
- See group deadlines under Calendar

## Real-time / multi-user chat

This prototype is single-browser. Classmates do not receive messages live because there is no server. A shared backend (for example Node.js + WebSockets) would be needed for true multi-user chat. For a course demo, `localStorage` is enough.

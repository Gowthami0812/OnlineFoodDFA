# FoodFlow — Online Food Ordering and DFA Tracking System

A full-stack food ordering application built using React, Node.js, Express, and MongoDB.

## Features
- Food menu and order placement
- Order tracking using a Deterministic Finite Automaton (DFA)
- Validated delivery status transitions
- Admin login and order management
- MongoDB persistence for food and order records

## DFA States
PLACED -> PREPARING -> READY_FOR_PICKUP -> OUT_FOR_DELIVERY -> DELIVERED

Invalid state transitions are rejected by the backend.

## Project Structure
- `client/` — React frontend
- `server/` — Express backend and MongoDB integration

## Run Locally

### Backend
1. Open a terminal in `server/`.
2. Install dependencies: `npm install`
3. Configure environment variables in a local `.env` file.
4. Start the server using `npm start`.

### Frontend
1. Open another terminal in `client/`.
2. Install dependencies: `npm install`
3. Configure the API URL if needed.
4. Start the development server using `npm run dev`.

Never commit `.env` files, passwords, database credentials, or JWT secrets.

## Database
MongoDB Atlas or a local MongoDB instance.

## Academic Project
Subjects: Full Stack Web Development, Computer Networks, and Formal Languages and Automata Theory.

\# FoodFlow – Online Food Ordering and Delivery Tracking System Using DFA



\## 1. Project Overview



FoodFlow is a web-based food ordering and delivery tracking system developed using React, Node.js, Express.js, and MongoDB. Customers can browse food items, place orders, and track their delivery status. The system uses a Deterministic Finite Automaton (DFA) to validate the sequence of delivery status transitions.



\## 2. Objectives



\- Provide an easy-to-use food ordering interface.

\- Validate customer details before order submission.

\- Store order information in MongoDB.

\- Track delivery progress through defined states.

\- Reject invalid delivery status transitions using DFA logic.

\- Provide an administrative dashboard for order management.



\## 3. Technologies Used



\- \*\*Frontend:\*\* React, Vite, CSS

\- \*\*Backend:\*\* Node.js, Express.js

\- \*\*Database:\*\* MongoDB Atlas

\- \*\*ODM:\*\* Mongoose

\- \*\*Icons:\*\* Lucide React

\- \*\*API communication:\*\* HTTP/REST



\## 4. Features



\- Food menu with prices and categories

\- Shopping cart and quantity management

\- Customer checkout form validation

\- Order creation and unique order tracking ID

\- Order tracking interface

\- Admin dashboard for viewing and updating orders

\- DFA-based delivery status validation

\- Database persistence for orders



\## 5. DFA Model



The DFA is defined as:



\*\*M = (Q, Σ, δ, q₀, F)\*\*



Where:



\- \*\*Q:\*\* {PLACED, PREPARING, READY\_FOR\_PICKUP, OUT\_FOR\_DELIVERY, DELIVERED}

\- \*\*Σ:\*\* The set of delivery events that trigger status changes.

\- \*\*δ:\*\* The transition function that determines the next valid state.

\- \*\*q₀:\*\* PLACED, the initial state.

\- \*\*F:\*\* {DELIVERED}, the accepting state for a completed delivery.



\### State Transition Table



| Current State | Event | Next State |

|---|---|---|

| PLACED | Begin preparation | PREPARING |

| PREPARING | Food is ready | READY\_FOR\_PICKUP |

| READY\_FOR\_PICKUP | Delivery begins | OUT\_FOR\_DELIVERY |

| OUT\_FOR\_DELIVERY | Delivery completed | DELIVERED |

| DELIVERED | Any further transition | Rejected |



\### DFA Transition Diagram



```text

PLACED

&#x20;  |

&#x20;  v

PREPARING

&#x20;  |

&#x20;  v

READY\_FOR\_PICKUP

&#x20;  |

&#x20;  v

OUT\_FOR\_DELIVERY

&#x20;  |

&#x20;  v

\[DELIVERED]

```



Only the defined transitions are allowed. Invalid transitions, such as DELIVERED → PREPARING, must be rejected.



\## 6. Project Structure



```text

OnlineFoodDFA/

├── client/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   └── ...

│   ├── package.json

│   └── index.html

├── server/

│   ├── server.js

│   ├── models/

│   ├── routes/

│   ├── package.json

│   └── .env

└── README.md

```



Adjust the structure above if the actual folders in your project differ.



\## 7. Prerequisites



Install the following before running the project:



\- Node.js and npm

\- MongoDB Atlas account or a configured MongoDB instance

\- A code editor such as Visual Studio Code

\- A modern web browser



\## 8. Installation and Execution



\### Backend Setup



Open PowerShell and run:



```powershell

cd "C:\\Projects\\OnlineFoodDFA\\server"

npm install

```



Create or configure the server `.env` file with your own database connection string and port.



Example:



```env

PORT=5000

MONGODB\_URI=your\_mongodb\_connection\_string

CLIENT\_URL=http://localhost:5173

```



Use the actual environment variable names expected by your `server.js`. Never commit real database credentials.



Start the backend:



```powershell

node server.js

```



\### Frontend Setup



Open a second PowerShell terminal:



```powershell

cd "C:\\Projects\\OnlineFoodDFA\\client"

npm install

npm run dev

```



Open the local URL printed by Vite, usually:



http://localhost:5173/



\## 9. API Endpoints



The following endpoints are documented from the project's current API design. Confirm the methods and paths against `server.js` before submission.



| Method | Endpoint | Purpose |

|---|---|---|

| GET | `/api/health` | Check backend health |

| GET | `/api/foods` | Retrieve food menu |

| POST | `/api/orders` | Create an order |

| GET | `/api/orders` | Retrieve orders |

| GET | `/api/orders/:id` | Retrieve an order |

| GET | `/api/orders/:id/history` | Retrieve order history |

| PATCH | `/api/orders/:id/status` | Request a status transition |



The API base URL during local development is:



`http://localhost:5000`



\## 10. Testing



Execute and record the actual result of each test before marking it PASS.



| Test ID | Test Scenario | Expected Result |

|---|---|---|

| TC01 | Submit a valid order | Order is created |

| TC02 | Submit an empty customer name | Validation error |

| TC03 | Enter an invalid email | Validation error |

| TC04 | Enter an invalid phone number | Validation error |

| TC05 | Request a valid DFA transition | Transition succeeds |

| TC06 | Request DELIVERED → PREPARING | Transition is rejected |

| TC07 | Refresh after updating an order | Saved status remains |

| TC08 | Track an existing order | Correct order details appear |

| TC09 | Track an unknown order ID | Appropriate error appears |

| TC10 | Open the Admin Dashboard | Saved orders appear for an authorized administrator |



\## 11. Sample Output



A successful order should return a unique order identifier and the initial status PLACED.



The expected delivery sequence is:



PLACED → PREPARING → READY\_FOR\_PICKUP → OUT\_FOR\_DELIVERY → DELIVERED



An invalid transition should return an error and leave the stored status unchanged.



Add the actual response bodies and screenshots from your running application here.



\## 12. Security Considerations



\- Keep database connection strings and secrets in environment variables.

\- Exclude `.env` files from version control.

\- Protect administrative endpoints using server-side authentication and authorization.

\- Validate incoming requests on the backend, not only in the React frontend.

\- Do not expose database credentials in frontend code.



\## 13. Screenshots



Insert screenshots captured from the actual application:



1\. Food menu page

2\. Shopping cart and checkout

3\. Successful order confirmation

4\. Order tracking

5\. Admin dashboard

6\. DFA transition validation

7\. Validation error or rejected transition



\## 14. References



1\. React Documentation – https://react.dev/

2\. Vite Documentation – https://vite.dev/guide/

3\. Node.js Documentation – https://nodejs.org/docs/

4\. Express.js Documentation – https://expressjs.com/

5\. MongoDB Documentation – https://www.mongodb.com/docs/

6\. Mongoose Documentation – https://mongoosejs.com/docs/

7\. MDN Web Docs – https://developer.mozilla.org/



These references cover the technologies used in the project. Retain only sources relevant to the implementation and any additional sources you actually consulted.



\## 15. Conclusion



FoodFlow demonstrates how a full-stack web application can combine food ordering, database persistence, delivery tracking, and DFA-based state validation. The system is intended to ensure that delivery status changes follow the defined sequence and that order information remains available through the database.




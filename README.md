# Meal-Cage Server 🍔 (Modular Monolith)

The backend server for Meal-Cage, built using a **Modular Monolith** architecture. This design ensures that core business logic is encapsulated within discrete modules, making the system maintainable, scalable, and easy to transition to microservices if needed.

## 🏗️ Architecture View

Meal-Cage Server follows a modular monolith pattern where each business domain is isolated into its own module within the `src/modules` directory.

```mermaid
graph TD
    subgraph Client Layer
        WebClient[React Client]
    end

    subgraph API Gateway / Express
        Router[Express Router]
        Middleware[Auth & Validation Middleware]
    end

    subgraph Business Modules (Modular Monolith)
        AuthMod[Auth Module]
        UserMod[Users Module]
        MenuMod[Menu Module]
        CartMod[Carts Module]
        PayMod[Payments Module]
        ResMod[Reservations Module]
        RevMod[Reviews Module]
        GiftMod[GiftCards Module]
        LoyalMod[Loyalty Module]
        NewsMod[Newsletter Module]
        ContMod[Contact Module]
    end

    subgraph Data Layer
        MongoDB[(MongoDB Atlas)]
    end

    WebClient --> Router
    Router --> Middleware
    Middleware --> AuthMod
    Middleware --> UserMod
    
    %% Typical Module Interactions
    CartMod -.-> MenuMod
    PayMod -.-> CartMod
    ResMod -.-> UserMod
    
    AuthMod & UserMod & MenuMod & CartMod & PayMod & ResMod & RevMod & GiftMod & LoyalMod & NewsMod & ContMod --> MongoDB
```

## 📂 Core Business Modules

The server is organized into 11 distinct modules, each responsible for a specific domain:

1.  **Auth**: Security and session management (JWT).
2.  **Users**: User profiles and Role-Based Access Control (RBAC).
3.  **Menu**: Comprehensive restaurant catalog management.
4.  **Carts**: Persistent shopping cart functionality.
5.  **Payments**: Secure checkout integrated with Stripe.
6.  **Reservations**: Table booking and scheduling.
7.  **Reviews**: Customer feedback and rating system.
8.  **GiftCards**: Digital gift card issuance and redemption.
9.  **Loyalty**: Reward points and customer loyalty programs.
10. **Newsletter**: Marketing and subscription management.
11. **Contact**: Inquiry handling and customer support.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v24.x)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: [JSON Web Token (JWT)](https://jwt.io/)
- **Payments**: [Stripe](https://stripe.com/)

## ⚙️ Getting Started

### Prerequisites

- Node.js (v24.x recommended)
- MongoDB Connection String

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Rafiuzzamanrion/Meal-Cage-Server.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root and add your configuration (see `.env.example` for details).
4. Start the server:
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## 🚀 Deployment

This server is optimized for deployment on **Vercel**. The Node.js engine is pinned to `24.x` for build stability.

## 📄 License

This project is licensed under the ISC License.

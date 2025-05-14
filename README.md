Search Engine Project

A full-stack search engine application with an inverted index, TF-IDF, and cosine similarity for efficient text search. The backend is built with TypeScript and Express, using Prisma and PostgreSQL for data storage. The frontend is a React application for user interaction.

## Tech Stack

- **Backend**: TypeScript, Express.js, Node.js, Prisma, PostgreSQL
- **Frontend**: React.js
- **Development Tools**: nodemon, ts-node, npm, Visual Studio Code
- **Containerization**: Docker, Docker Compose

## Project Structure

```
Search/
├── Server/                 # Backend (Express, TypeScript)
│   ├── app.ts              # Main server file
│   ├── prisma/             # Prisma schema and migrations
│   │   └── schema.prisma
│   ├── package.json
│   ├── nodemon.json
│   ├── tsconfig.json
│   └── .env
├── client/                 # Frontend (React)
│   ├── src/
│   │   └── App.js
│   └── package.json
├── docker-compose.yml      # Docker Compose configuration
└── README.md
```

## Prerequisites

- Node.js (v20+)
- Docker Desktop
- PostgreSQL (optional for local dev without Docker)
- Git

## Setup Instructions

### Clone the Repository

```bash
git clone https://github.com/your-username/search-engine.git
cd search-engine
```

### Option 1: Run with Docker (Recommended)

1. **Ensure Docker Desktop is running**.

2. **Start services**:

   ```bash
   docker-compose up --build
   ```

3. **Run Prisma migrations** (in a new terminal):

   ```bash
   docker-compose exec backend bash
   npx prisma migrate dev --name init
   ```

4. **Access the application**:

   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - PostgreSQL: `localhost:5432`

5. **Stop services**:

   ```bash
   docker-compose down
   ```

### Option 2: Run Locally

1. **Backend Setup**:

   ```bash
   cd Server
   npm install
   ```

2. **Configure Environment**:

   - Create `Server/.env`:

     ```
     DATABASE_URL=postgresql://postgres:your_password@localhost:5432/search_engine_db?schema=public
     ```
   - Replace `your_password` with your PostgreSQL password.

3. **Set Up PostgreSQL**:

   - Create database:

     ```bash
     psql -U postgres -c "CREATE DATABASE search_engine_db;"
     ```

4. **Run Prisma Migrations**:

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start Backend**:

   ```bash
   npm run dev
   ```

6. **Frontend Setup**:

   ```bash
   cd ../client
   npm install
   npm start
   ```

7. **Access the application**:

   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## Usage

1. **Add a Document**:

   - Send a POST request to `http://localhost:5000/api/documents`:

     ```json
     {
       "content": "Python is a versatile, high-level programming language..."
     }
     ```

2. **Search Documents**:

   - Use the frontend at `http://localhost:3000` or send a GET request to `http://localhost:5000/api/search?query=python`.

3. **Sample Database Dump**:

   - To simulate data, apply the SQL dump (`search_engine_db_dump.sql`):

     ```bash
     docker-compose exec db psql -U postgres -d search_engine_db -f /app/search_engine_db_dump.sql
     ```

     Or locally:

     ```bash
     psql -U postgres -d search_engine_db -f Server/search_engine_db_dump.sql
     ```

## API Endpoints

- **POST /api/documents**: Add a document (body: `{ "content": "text" }`)
- **GET /api/search?query=**: Search documents by query term

## Troubleshooting

- **Empty search results**: Ensure `computeTfIdf` in `app.ts` handles `df=0` cases (see `Server/app.ts`).
- **Prisma errors**: Run `npx prisma generate` and `npx prisma migrate dev`.
- **Docker issues**: Verify Docker Desktop is running and ports `3000`, `5000`, `5432` are free.

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit changes (`git commit -m "Add YourFeature"`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a Pull Request.

## License

MIT License

# Code Weaver

Repository: https://github.com/TimWoodburn/code-weaver

A containerised Vite/React application packaged and deployed using Docker and Docker Compose.

---

## Deployment

The application can be deployed using Docker without requiring Node.js or any local build tools.  
All setup, dependency installation, and building is handled inside the container.

---

### 1. Clone the Repository

```bash
git clone https://github.com/TimWoodburn/code-weaver.git
cd code-weaver
```

---

### 2. Set Environment Variables

Create a `.env` file in the project root. You can copy the provided example:

```bash
cp .env.example .env
```

Edit `.env` if needed:

```
CODE_WEAVER_PORT=5173
```

This defines the host port used for accessing the application.

---

### 3. Build and Run the Application

Use Docker Compose to build and start the container:

```bash
docker compose up --build
```

This process will:

- Install all Node.js dependencies inside the build container  
- Run the Vite production build  
- Copy the built assets into an Nginx runtime image  
- Expose the application on the port defined in `.env`  

---

### 4. Access the Application

Once running, open:

```
http://localhost:${CODE_WEAVER_PORT}
```

Replace with the port value from your `.env`.

---

### 5. Updating After Code Changes

To rebuild the app after modifying the source:

```bash
docker compose up --build
```

---

### 6. Stop and Remove the Container

```bash
docker compose down
```

---

### 7. Optional: Run Detached (Background Mode)

```bash
docker compose up --build -d
```

---

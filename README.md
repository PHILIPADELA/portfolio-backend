# Portfolio Backend

This is the backend for Adela's portfolio website, built with Node.js, Express, and MongoDB.

---

## Features
- RESTful API for portfolio, blog, testimonials, and contact
- Admin dashboard endpoints
- Authentication and authorization
- File uploads (for images, etc.)
- Email integration for contact form

---

## 🚀 Quick Start

### 1. Clone the Repository

If you haven't already, clone this repository to your local machine:

```bash
git clone https://github.com/GOALLINNOOUT/portfolio-backend.git
cd portfolio-backend
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) installed. You can check your version with:

```bash
node -v
```

Then install the required packages:

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of `portfolio-backend/` with the following:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
CLOUDINARY_URL=your_cloudinary_url
```

### 4. Start the Server

To run the server in production mode:

```bash
npm start
```

To run in development mode (with auto-reload using nodemon):

```bash
npm run dev
```

The API will be available at [http://localhost:5000](http://localhost:5000) by default (check your config).

---

## 📁 Folder Structure

- `src/` — Main source code (routes, controllers, models, etc.)
- `uploads/` — Uploaded files (images, etc.)
- `README.md` — Project documentation

---

## 🛠️ Customization & Configuration

- **API Endpoints:** Update or add endpoints in `src/routes/` and `src/controllers/`.
- **Models:** Edit or add Mongoose models in `src/models/`.
- **Email/Cloudinary:** Update integration in `src/utils/` as needed.
- **Environment:** Adjust variables in your `.env` file for your setup.

---

## 💡 Troubleshooting & Tips

- If you see errors about missing packages, run `npm install` again.
- Make sure MongoDB is running and your connection string is correct.
- For Windows users, use PowerShell or Command Prompt for commands.
- Use tools like [Postman](https://www.postman.com/) to test your API endpoints.

---

## 📚 Useful Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Docs](https://www.mongodb.com/docs/)
- [Mongoose Docs](https://mongoosejs.com/docs/)

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

MIT

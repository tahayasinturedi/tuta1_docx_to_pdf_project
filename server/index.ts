import express from "express";

const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
    res.json({message: "DOCX to PDF Converter API funktionert!"});
});

app.listen(PORT, () => {
    console.log(`Server funktionert: http://localhost:${PORT}`);
});
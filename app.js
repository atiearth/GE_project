import express from "express"
import path from "path"
import router from "./routes/routers.js"
import { fileURLToPath } from "url"

const app = express()
const port = 8080
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
    
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(express.static(path.join(__dirname, "public")))

app.use(router)

app.listen(port, () => {
    console.log(`Start server on port: ${port}`)
})

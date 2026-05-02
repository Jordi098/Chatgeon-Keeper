import express from 'express'
import {callAssistant} from "./chat.js";
import cors from "cors"

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static('public'))

app.get('/api/test', (req, res) => {
    res.json({response: 'Hello world'})
})
app.post('/api/chat', async (req, res) => {
    const {message} = req.body
    const response = await callAssistant(message)
    res.json({response})
})

app.listen(process.env.EXPRESS_PORT, () => {
    console.log(`Server on http://localhost:${process.env.EXPRESS_PORT}`)
})
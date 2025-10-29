import axios from "axios"
//crea una instancia central para llamar fácilmente a mis rutas del backend
export const api = axios.create({
    baseURL: "http://localhost:3000/api", //mi backend local
})
import app from "./app";
import 'dotenv/config'
import { env } from "./config/env.config"; //Carga las variables de entorno, importamos el objeto centralizado

const PORT = env.port || process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`)
});

import app from "./app";
import 'dotenv/config';

// Render asigna automáticamente el puerto en process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

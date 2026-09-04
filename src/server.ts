import { createTankServer } from "./app.js";

const port = Number(process.env.PORT ?? 8080);

const { httpServer } = createTankServer();

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});

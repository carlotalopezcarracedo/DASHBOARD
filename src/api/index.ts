import { Router } from "express";
import { authRouter } from "./routes/auth";
import { clientsRouter } from "./routes/clients";
import { projectsRouter } from "./routes/projects";
import { tasksRouter } from "./routes/tasks";
import { invoicesRouter } from "./routes/invoices";
import { dashboardRouter } from "./routes/dashboard";
import { calendarRouter } from "./routes/calendar";
import { googleAuthRouter } from "./routes/googleAuth";
import { ticketsRouter } from "./routes/tickets";
import { servicesRouter } from "./routes/services";
import { activityRouter } from "./routes/activity";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/auth/google", googleAuthRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/tasks", tasksRouter);
apiRouter.use("/invoices", invoicesRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/calendar", calendarRouter);
apiRouter.use("/tickets", ticketsRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/activity", activityRouter);

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

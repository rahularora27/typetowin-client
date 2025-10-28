import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import SinglePlayer from "./pages/SinglePlayer.tsx";
import MultiPlayer from "./pages/MultiPlayer.tsx";

const router = createBrowserRouter([
  { path: "/", element: <SinglePlayer /> },
  { path: "/multiplayer", element: <MultiPlayer /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router}></RouterProvider>
  </React.StrictMode>
);

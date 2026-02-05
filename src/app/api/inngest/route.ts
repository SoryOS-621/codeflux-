import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  //  helloWorld, 
  writer} from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // helloWorld,
    writer
    // <-- This is where you'll always add all your functions
  ],
});
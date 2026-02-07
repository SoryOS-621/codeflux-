import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import {
  //  helloWorld, 
  developer} from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // helloWorld,
    developer
    // <-- This is where you'll always add all your functions
  ],
});
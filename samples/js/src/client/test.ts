import {
  A2AClient,
//   TaskArtifactUpdateEvent,
//   MessageSendParams, // Use params type directly
} from "./client.js"; // Adjust path if necessary
import { TaskStatusUpdateEvent, TaskArtifactUpdateEvent, MessageSendParams } from "../schema.js";
import { v4 as uuidv4 } from "uuid";

const client = new A2AClient("http://localhost:41241");

async function streamTask() {
  const streamingTaskId = uuidv4();
  try {
    console.log(`\n--- Starting streaming task ${streamingTaskId} ---`);
    // Construct just the params
    const streamParams: MessageSendParams = {
      id: streamingTaskId,
      message: { role: "user", parts: [{ text: "Stream me some updates!", type: "text" }] },
    };
    // Pass only params to the client method
    const stream = client.sendTaskSubscribe(streamParams);

    // Stream now yields the event payloads directly
    for await (const event of stream) {
      // Type guard to differentiate events based on structure
      if ("status" in event) {
        // It's a TaskStatusUpdateEvent
        const statusEvent = event as TaskStatusUpdateEvent; // Cast for clarity
        console.log(
          `[${streamingTaskId}] Status Update: ${statusEvent.status.state} - ${
            statusEvent.status.message?.parts[0]?.text ?? "No message"
          }`
        );
        if (statusEvent.final) {
          console.log(`[${streamingTaskId}] Stream marked as final.`);
          break; // Exit loop when server signals completion
        }
      } else if ("artifact" in event) {
        // It's a TaskArtifactUpdateEvent
        const artifactEvent = event as TaskArtifactUpdateEvent; // Cast for clarity
        console.log(
          `[${streamingTaskId}] Artifact Update: ${
            artifactEvent.artifact.name ??
            `Index ${artifactEvent.artifact.index}`
          } - Part Count: ${artifactEvent.artifact.parts.length}`
        );
        // Process artifact content (e.g., artifactEvent.artifact.parts[0].text)
      } else {
        console.warn("Received unknown event structure:", event);
      }
    }
    console.log(`--- Streaming task ${streamingTaskId} finished ---`);
  } catch (error) {
    console.error(`Error during streaming task ${streamingTaskId}:`, error);
  }
}

streamTask();
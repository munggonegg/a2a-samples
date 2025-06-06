import {
  A2AClient,
} from "./client.js";
import {
  MessageSendParams,
  TaskStatusUpdateEvent,
  TaskArtifactUpdateEvent,
  Message,
  Task,
} from "../schema.js";
import { v4 as uuidv4 } from "uuid";

const client = new A2AClient("http://212.80.215.76:9999/");

async function testStreaming() {
  const taskId = uuidv4();
  try {
    console.log(`\n--- Starting streaming test with task ID ${taskId} ---`);

    // Create message parameters - adjusted to match your schema
    const streamParams: MessageSendParams = {
      message: {
        messageId: uuidv4(),
        kind: "message",
        role: "user",
        parts: [{
          kind: "text",
          text: "Stream me some updates!"
        }]
      },
    };

    // Use sendMessageStream to initiate the streaming
    const stream = client.sendMessageStream(streamParams);

    // Process the stream events
    for await (const event of stream) {
      // Handle different event types
      if ("status" in event) {
        // TaskStatusUpdateEvent
        const statusEvent = event as TaskStatusUpdateEvent;
        console.log(
          `[${taskId}] Status Update: ${statusEvent.status.state}` +
          (statusEvent.status.message
            ? (() => {
                const firstTextPart = statusEvent.status.message.parts.find(
                  (part) => part.kind === "text" && "text" in part
                );
                return firstTextPart ? ` - ${(firstTextPart as { text: string }).text}` : '';
              })()
            : '')
        );
        if (statusEvent.final) {
          console.log(`[${taskId}] Stream marked as final.`);
          break;
        }
      }
      else if ("artifact" in event) {
        // TaskArtifactUpdateEvent
        const artifactEvent = event as TaskArtifactUpdateEvent;
        console.log(
          `[${taskId}] Artifact Update: ${artifactEvent.artifact.name ?? "Unnamed Artifact"
          } - Part Count: ${artifactEvent.artifact.parts.length}`
        );
      }
      else if ("role" in event) {
        // Message
        const message = event as Message;
        const firstTextPart = message.parts.find(
          (part) => part.kind === "text" && "text" in part
        );
        console.log(
          `[${taskId}] New Message (${message.role}): ${firstTextPart ? (firstTextPart as { text: string }).text : "No text content"
          }`
        );
      }
      else if ("statusHistory" in event) {
        // Task
        const task = event as Task;
        console.log(
          `[${taskId}] Task Update: Current status is ${task.status.state}`
        );
      }
      else {
        console.warn(`[${taskId}] Received unknown event structure:`, event);
      }
    }

    console.log(`--- Streaming test ${taskId} completed ---`);
  } catch (error) {
    console.error(`Error during streaming test ${taskId}:`, error);
  }
}

// Run the test
testStreaming();
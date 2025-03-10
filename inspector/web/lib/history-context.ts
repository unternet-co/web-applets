// Extended the input type to allow actions from the user
export interface CommandInput {
  type: 'command' | 'action';
  text: string;
}

export type InteractionInput = CommandInput;

export interface DataOutput {
  type: 'data';
  resourceUrl?: string;
  content: object;
}

export interface TextOutput {
  type: 'text';
  content: string;
}

export interface WebOutput {
  type: 'web';
  processId: number;
}

export interface AppletOutput {
  type: string;
  arguments?: any;
}

export type InteractionOutput =
  | TextOutput
  | DataOutput
  | WebOutput
  | AppletOutput;

// The Interaction type now contains an input (from the user), outputs (from the model),
// and a timestamp for when the interaction occurred.
export interface Interaction {
  input: InteractionInput;
  outputs: InteractionOutput[];
  timestamp: number;
}

type Subscriber = (interactions: Interaction[]) => void;

class HistoryContext {
  private interactions: Interaction[] = [];
  private subscribers = new Set<Subscriber>();

  // Add an interaction and notify subscribers
  addInteraction(interaction: Interaction): void {
    this.interactions.push(interaction);
    this.notify();
  }

  // Return all interactions as a new array (to maintain immutability)
  getAllInteractions(): Interaction[] {
    return [...this.interactions];
  }

  // Return the last `limit` interactions for context
  getRecentInteractions(limit: number = 10): Interaction[] {
    return this.interactions.slice(-limit);
  }

  // Clear the history and notify subscribers
  clearHistory(): void {
    this.interactions = [];
    this.notify();
  }

  // Subscribe to changes in the history.
  // Returns an unsubscribe function.
  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    // Immediately call the callback with a copy of the current interactions.
    callback([...this.interactions]);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Notify all subscribers with a new array reference so that lit detects changes.
  private notify(): void {
    for (const cb of this.subscribers) {
      cb([...this.interactions]);
    }
  }
}

export const historyContext = new HistoryContext();

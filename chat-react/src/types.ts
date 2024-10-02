interface Query {
  input: string;
  responses: QueryResponse[];
}

type QueryResponse = AppletResponse;

interface TextResponse {
  type: 'text';
  content: string;
}

interface AppletResponse {
  type: 'applet';
  url: string;
  name: string;
  state: any;
}

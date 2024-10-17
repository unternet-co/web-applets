## State

```ts
interface AppletStateMessage {
  id: string;
  timestamp: number;
  type: 'state';
  state: any;
  shouldRender?: boolean;
}
```

## Init

```ts
interface AppletInitMessage {
  id: string;
  timestamp: number;
  type: 'init';
  headless: boolean;
}
```

## Action

```ts
interface AppletActionMessage {
  id: string;
  timestamp: number;
  type: 'action';
  actionId: string;
  params: any;
}
```

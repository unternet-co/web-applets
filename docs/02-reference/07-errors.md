# Errors

The Web Applets API defines specific error types to help identify and handle different failure scenarios that may occur during applet operations.

## AppletExecutionError

Thrown when an error occurs during the execution of an applet action.

### Constructor

```js
new AppletExecutionError(message);
```

#### Parameters

`message`

An optional `string` providing a description of the error. If not provided, a default message may be used.

### Properties

Inherits all properties from `Error`.

`name`

Always set to `"AppletExecutionError"`.

`message`

The error message provided during initialization.

### Example

```js
try {
  await applet.sendAction('bad_action');
} catch (error) {
  if (error instanceof AppletExecutionError) {
    console.error('Applet execution failed:', error.message);
  }
}
```

## AppletConnectionError

Thrown when a connection operation involving an applet fails, such as connecting to an iframe or establishing communication between applets.

### Constructor

```js
new AppletConnectionError(message);
```

#### Parameters

`message`

An optional `string` providing a description of the error. If not provided, a default message may be used.

### Properties

Inherits all properties from `Error`.

`name`

Always set to `"AppletConnectionError"`.

`message`

The error message provided during initialization.

#### Example

```js
try {
  await applets.connect('https://example.com/non-existant-applet');
} catch (error) {
  if (error instanceof AppletConnectionError) {
    console.error('Failed to connect to applet:', error.message);
    // Handle connection failure, possibly retry or show user feedback
  }
}
```

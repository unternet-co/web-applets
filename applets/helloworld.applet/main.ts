import appletContext, { type AppletContext } from '../../sdk/context';

// Set up the types we'll use
type HelloWorldState = { name: string }; // Applet state
type SetNameParams = { name: string }; // set_name params

// Get view element we want to manipulate
const nameElem = document.getElementById('name') as HTMLSpanElement;

// Connect to the applet context
const applet = appletContext.connect() as AppletContext<HelloWorldState>;

// When the set_name action is called, change the state
applet.setActionHandler<SetNameParams>('set_name', ({ name }) => {
  applet.setState({ name });
});

// Whenever we get a request to render the view, update the name
applet.onrender = () => {
  nameElem.innerText = applet.state.name;
};

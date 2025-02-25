import { applets } from '@web-applets/sdk';

const applet = applets.register();

// Define a 'set_name' action, and make it update the shared data object with the new name
applet.setActionHandler('set_name', ({ name }) => {
  applet.data = { name };
});

// Whenever the data is updated, update the view
applet.ondata = () => {
  const nameElement = document.getElementById('name');
  if (nameElement) {
    nameElement.innerText = applet.data.name;
  }
};

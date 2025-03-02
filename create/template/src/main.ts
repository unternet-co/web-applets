import { applets } from '@web-applets/sdk';

const context = applets.register();

// Define a 'set_name' action, and make it update the shared data object with the new name
context.setActionHandler('set_name', ({ name }) => {
  context.data = { name };
});

// Whenever the data is updated, update the view
context.ondata = () => {
  const nameElement = document.getElementById('name');
  if (nameElement) {
    nameElement.innerText = context.data.name;
  }
};

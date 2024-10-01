import './maps';
import { appletContext, type AppletContext } from '../../../sdk/src';
import { mapService, SerializedPlace } from './maps';

const applet = appletContext.connect() as AppletContext;
console.log('HELLOO');

applet.onload = async () => {
  console.log('LOADING');
  await mapService.waitForReady();
  console.log('LOADED');
};

// When the set_name action is called, change the state
applet.setActionHandler('search_nearby', async ({ query, origin }) => {
  const places = await mapService.searchLocation(
    origin as string,
    query as string
  );
  await applet.setState({ places });
});

// Whenever we get a request to render the view, update the name
applet.onrender = () => {
  console.log('RENDERING');
  console.log(applet.state);
  if (applet.state.places) mapService.renderMap(applet.state.places);
};

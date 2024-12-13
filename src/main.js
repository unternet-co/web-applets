import { applets } from '@web-applets/sdk';

// 1. Set up your own applet's context
const context = applets.getContext();

context.defineAction('set_name', {
    params: {
        name: {
            type: 'string',
            description: 'The name of the person to be greeted.',
        },
    },
    handler: ({ name }) => context.data = { name }
});

context.ondata = () => {
    document.getElementById('name').innerText = context.data.name || 'whoever you are';
};

// // 2. Load other applets as needed
// async function loadExternalApplet() {
//     // Create a container for the external applet
//     const container = document.createElement('iframe');
//     document.body.appendChild(container);
    
//     // Load the external applet into the container
//     const externalApplet = await applets.load('/path/to/other.applet', container);
    
//     // Now you can interact with the external applet
//     externalApplet.ondata = (e) => console.log('External applet data:', e.data);
//     externalApplet.dispatchAction('some-action', { someParam: 'value' });
// }

// // Call this when you need to load external applets
// loadExternalApplet();
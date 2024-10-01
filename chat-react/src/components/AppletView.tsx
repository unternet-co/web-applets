import React, { useEffect, useRef } from 'react';
import { applets, AppletState, Applet } from '../../../sdk/src';

interface AppletProps {
  src: string;
  state: AppletState;
}

export default function AppletView({ src, state }: AppletProps) {
  const appletRef = useRef<Applet>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function loadApplets() {
      appletRef.current = await applets.load(src, iframeRef.current!);
    }
    loadApplets();
  }, [src]);

  useEffect(() => {
    if (appletRef.current) appletRef.current.state = state;
  }, [state]);

  return <iframe ref={iframeRef}></iframe>;
}

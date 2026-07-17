import React from 'react';
import { useCall } from '../../context/CallContext';
import IncomingCall from './IncomingCall';
import OutgoingCall from './OutgoingCall';
import InCall from './InCall';

const CallOverlay: React.FC = () => {
  const { callState } = useCall();

  if (callState === 'IDLE') return null;

  return (
    <>
      {callState === 'RINGING' && <IncomingCall />}
      {callState === 'CALLING' && <OutgoingCall />}
      {callState === 'CONNECTED' && <InCall />}
    </>
  );
};

export default CallOverlay;
